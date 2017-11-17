# -*- coding: utf-8 -*-
import logging
import yaml as real_yaml
from mock import Mock, patch, MagicMock
from django.core.files.temp import NamedTemporaryFile
from django.conf import settings
from django.test import TransactionTestCase
from ..external_service import ( ExternalRasterServiceToGeopackage, create_conf_from_url,
                                 check_service, get_cache_template, CustomLogger, check_zoom_levels )
from mapproxy.config.config import load_default_config
from uuid import uuid4
from datetime import datetime

logger = logging.getLogger(__name__)


class TestGeopackage(TransactionTestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.tasks.task_process.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.external_service.yaml')
    @patch('eventkit_cloud.utils.external_service.NamedTemporaryFile')
    @patch('eventkit_cloud.utils.external_service.config_command')
    def test_create_conf_from_url(self, config_command, temp, yaml):
        test_file = NamedTemporaryFile()
        url = 'http://example.url/'
        test_yaml = "layers:\r\n - name: imagery\r\n   title: imagery\r\n   sources: [cache]\r\n\r\nsources:\r\n  imagery_wmts:\r\n    type: tile\r\n    grid: webmercator\r\n    url: http://a.tile.openstreetmap.fr/hot/%(z)s/%(x)s/%(y)s.png\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        temp.return_value = test_file
        config_command.return_value = test_yaml
        yaml.load.return_value = real_yaml.load(test_yaml)
        cmd = ['--capabilities', '{}'.format(url), '--output', '{}'.format(test_file.name), '--force']
        w2g = create_conf_from_url(url)
        config_command.assert_called_once_with(cmd)
        self.assertEqual(w2g, real_yaml.load(test_yaml))

    @patch('eventkit_cloud.utils.external_service.check_service')
    @patch('eventkit_cloud.utils.external_service.yaml')
    @patch('eventkit_cloud.utils.external_service.NamedTemporaryFile')
    @patch('eventkit_cloud.utils.external_service.config_command')
    def test_create_conf_from_arcgis(self, config_command, temp, yaml, check_service):
        test_file = NamedTemporaryFile()
        url = 'http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer'
        test_yaml = "layer:\r\n  - name: imagery\r\n    title: imagery\r\n    sources: [cache]\r\n\r\nsources:\r\n  imagery_arcgis:\r\n    type: arcgis\r\n    grid: webmercator\r\n    req:\r\n      url: http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer\r\n      layers: \r\n        show: 0\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        temp.return_value = test_file
        config_command.return_value = test_yaml
        yaml.load.return_value = real_yaml.load(test_yaml)
        cmd = ['--capabilities', '{}'.format(url), '--output', '{}'.format(test_file.name), '--force']
        w2g = create_conf_from_url(url)
        config_command.assert_called_once_with(cmd)
        self.assertEqual(w2g, real_yaml.load(test_yaml))

    @patch('eventkit_cloud.utils.external_service.validate_seed_conf')
    @patch('eventkit_cloud.utils.external_service.validate_options')
    @patch('eventkit_cloud.utils.external_service.set_gpkg_contents_bounds')
    @patch('eventkit_cloud.utils.external_service.check_zoom_levels')
    @patch('eventkit_cloud.utils.external_service.check_service')
    @patch('eventkit_cloud.utils.geopackage.remove_empty_zoom_levels')
    @patch('eventkit_cloud.utils.external_service.connections')
    @patch('eventkit_cloud.utils.external_service.SeedingConfiguration')
    @patch('eventkit_cloud.utils.external_service.seeder')
    @patch('eventkit_cloud.utils.external_service.load_config')
    @patch('eventkit_cloud.utils.external_service.get_cache_template')
    @patch('eventkit_cloud.utils.external_service.get_seed_template')
    def test_convert(self, seed_template, cache_template, load_config, seeder, seeding_config, connections, remove_zoom_levels, check_service, mock_check_zoom_levels, mock_set_gpkg_contents_bounds, validate_options, validate_seed_conf):
        gpkgfile = '/var/lib/eventkit/test.gpkg'
        config = "layers:\r\n - name: imagery\r\n   title: imagery\r\n   sources: [cache]\r\n\r\nsources:\r\n  imagery_wmts:\r\n    type: tile\r\n    grid: webmercator\r\n    url: http://a.tile.openstreetmap.fr/hot/%(z)s/%(x)s/%(y)s.png\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        json_config = real_yaml.load(config)
        mapproxy_config = load_default_config()
        bbox = [-2, -2, 2, 2]
        cache_template.return_value = {'sources': ['imagery_wmts'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}
        seed_template.return_value = {'coverages': {'geom': {'srs': 'EPSG:4326', 'bbox': [-2, -2, 2, 2]}}, 'seeds': {'seed': {'coverages': ['geom'], 'refresh_before': {'minutes': 0}, 'levels': {'to': 10, 'from': 0}, 'caches': ['cache']}}}
        validate_options.return_value = (False, True)
        validate_seed_conf.return_value = (False, True)
        self.task_process.return_value = Mock(exitcode=0)
        w2g = ExternalRasterServiceToGeopackage(config=config,
                               gpkgfile=gpkgfile,
                               bbox=bbox,
                               service_url='http://generic.server/WMTS?SERVICE=WMTS&REQUEST=GetTile&TILEMATRIXSET=default028mm&TILEMATRIX=%(z)s&TILEROW=%(y)s&TILECOL=%(x)s&FORMAT=image%%2Fpng',
                               layer='imagery',
                               debug=True,
                               name='imagery',
                               level_from=0,
                               level_to=10,
                               service_type='wmts',
                               task_uid=self.task_uid)
        result = w2g.convert()
        mock_check_zoom_levels.assert_called_once()
        connections.close_all.assert_called_once()
        self.assertEqual(result, gpkgfile)

        cache_template.assert_called_once_with(["imagery_wmts"], [grids for grids in json_config.get('grids')], gpkgfile, table_name='imagery')
        json_config['caches'] = {'cache': {'sources': ['imagery_wmts'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}}
        json_config['globals'] = {'http': {'ssl_no_cert_checks': True}}
        json_config['sources']['imagery_wmts']['transparent'] = True
        json_config['sources']['imagery_wmts']['on_error'] = {'other': {'cache': False,'response': 'transparent'}}
        json_config['services'] = ['demo']
        
        check_service.assert_called_once_with(json_config)
        load_config.assert_called_once_with(mapproxy_config, config_dict=json_config)
        remove_zoom_levels.assert_called_once_with(gpkgfile)
        mock_set_gpkg_contents_bounds.assert_called_once_with(gpkgfile, 'imagery', bbox)
        seed_template.assert_called_once_with(bbox=bbox, coverage_file=None, level_from=0, level_to=10)
        self.task_process.side_effect = Exception()
        with self.assertRaises(Exception):
            w2g.convert()


class TestHelpers(TransactionTestCase):

    @patch('requests.get')
    def test_check_service(self, requests_get):

        conf_dict = {'sources': {'source1': {'url': 'http://example.com/url'},
                                 'source2': {'url': 'http://example2.com/url'}}}

        response = Mock(status_code=None, text="Some Text")

        response.status_code = 200
        requests_get.return_value = response
        self.assertIsNone(check_service(conf_dict))

        response.status_code = 401
        requests_get.return_value = response
        with self.assertRaisesMessage(Exception, "The provider does not have valid credentials."):
            check_service(conf_dict)

        response.status_code = 500
        requests_get.return_value = response
        with self.assertRaisesMessage(Exception, "The provider reported a server error."):
            check_service(conf_dict)

    def get_cache_template(self):
        example_geopackage = '/test/example.gpkg'
        example_sources = ['raster_source']
        example_grids = ['raster_grid']

        cache_template = get_cache_template(example_sources, example_grids, example_geopackage)

        expected_template = {"cache": {
            "sources": example_sources,
            "meta_size": [1, 1],
            "cache": {
                "type": "geopackage",
                "filename": str(example_geopackage),
            },
            "grids": example_grids,
            "format": "mixed",
            "request_format": "image/png"}}

        self.assertEqual(cache_template, expected_template)

    @patch('eventkit_cloud.utils.external_service.sqlite3')
    @patch('eventkit_cloud.utils.external_service.get_table_tile_matrix_information')
    @patch('eventkit_cloud.utils.external_service.get_zoom_levels_table')
    @patch('eventkit_cloud.utils.external_service.get_tile_table_names')
    def test_check_zoom_levels(self, mock_get_tables, mock_get_zoom_levels, mock_tile_matrix, mock_sql):
        from mapproxy.grid import TileGrid
        from mapproxy.config.loader import ProxyConfiguration
        example_geopackage = '/test/example.gpkg'
        grid_name = 'geodetic'
        tile_size = (256, 256)
        table_name = 'tiles'
        zoom_levels_table = [0,1,2]
        # tile_matrix is abbreviated, for clarity.
        tile_matrix = [{"table_name": table_name, "zoom_level": 0},
                            {"table_name": table_name, "zoom_level": 1}]
        configuration = {'caches': {'cache': {'cache': {'type': 'geopackage', 'filename': example_geopackage},
                                              'grids': [grid_name]}},
                       'grids': {'geodetic': {'srs': 'EPSG:4326', 'tile_size': tile_size, 'origin': 'nw'}}}

        mapproxy_configuration = ProxyConfiguration(configuration)
        mock_get_tables.return_value = (table_name,)
        mock_get_zoom_levels.return_value = zoom_levels_table
        mock_tile_matrix.return_value = tile_matrix
        check_zoom_levels(example_geopackage, mapproxy_configuration)
        mock_get_tables.assert_called_once_with(example_geopackage)
        mock_get_zoom_levels.assert_called_once_with(example_geopackage, table_name)
        mock_tile_matrix.assert_called_once_with(example_geopackage, table_name)
        mock_sql.connect().__enter__().execute.assert_called_once_with(
            '\nINSERT OR REPLACE INTO gpkg_tile_matrix (table_name, zoom_level, matrix_width, matrix_height, tile_width, tile_height, pixel_x_size, pixel_y_size) \nVALUES(?, ?, ?, ?, ?, ?, ?, ?)',
            ('tiles', 2, 4, 2, 256, 256, 0.3515625, 0.3515625))


class TestLogger(TransactionTestCase):

    @patch('eventkit_cloud.tasks.export_tasks.update_progress')
    def test_log_step(self, mock_update_progress):

        test_task_uid = "1234"
        test_timestamp = 1490641718
        test_progress = 0.42
        custom_logger = CustomLogger(task_uid=test_task_uid)
        custom_logger.log_step_counter = 0
        self.assertIsNotNone(custom_logger)
        mock_progress = MagicMock()
        mock_progress.progress = test_progress
        mock_progress.eta.eta.return_value = test_timestamp
        custom_logger.log_step(mock_progress)
        mock_update_progress.assert_called_once_with(test_task_uid, progress=test_progress*100)
