# -*- coding: utf-8 -*-
import logging
from uuid import uuid4

import yaml as real_yaml
from django.conf import settings
from django.test import TransactionTestCase
from mapproxy.config.config import load_default_config
from mock import Mock, patch, MagicMock

from eventkit_cloud.utils.mapproxy import (MapproxyGeopackage,
                                           get_cache_template, CustomLogger, check_zoom_levels)

logger = logging.getLogger(__name__)


class TestGeopackage(TransactionTestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.tasks.task_process.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.mapproxy.retry')
    @patch('eventkit_cloud.utils.mapproxy.auth_requests.patch_https')
    @patch('eventkit_cloud.utils.mapproxy.set_gpkg_contents_bounds')
    @patch('eventkit_cloud.utils.mapproxy.check_zoom_levels')
    @patch('eventkit_cloud.utils.mapproxy.remove_empty_zoom_levels')
    @patch('eventkit_cloud.utils.mapproxy.connections')
    @patch('eventkit_cloud.utils.mapproxy.SeedingConfiguration')
    @patch('eventkit_cloud.utils.mapproxy.seeder')
    @patch('eventkit_cloud.utils.mapproxy.load_config')
    @patch('eventkit_cloud.utils.mapproxy.get_cache_template')
    @patch('eventkit_cloud.utils.mapproxy.get_seed_template')
    def test_convert(self, seed_template, cache_template, load_config, seeder, seeding_config, connections,
                     remove_zoom_levels, mock_check_zoom_levels, mock_set_gpkg_contents_bounds,
                     patch_https, mock_retry):
        gpkgfile = '/var/lib/eventkit/test.gpkg'
        config = "layers:\r\n - name: imagery\r\n   title: imagery\r\n   sources: [cache]\r\n\r\nsources:\r\n  imagery:\r\n    type: tile\r\n    grid: webmercator\r\n    url: http://a.tile.openstreetmap.fr/hot/%(z)s/%(x)s/%(y)s.png\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        json_config = real_yaml.load(config)
        mapproxy_config = load_default_config()
        bbox = [-2, -2, 2, 2]
        cache_template.return_value = {'sources': ['imagery'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}
        seed_template.return_value = {'coverages': {'geom': {'srs': 'EPSG:4326', 'bbox': [-2, -2, 2, 2]}}, 'seeds': {'seed': {'coverages': ['geom'], 'refresh_before': {'minutes': 0}, 'levels': {'to': 10, 'from': 0}, 'caches': ['cache']}}}
        self.task_process.return_value = Mock(exitcode=0)
        w2g = MapproxyGeopackage(config=config,
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

        cache_template.assert_called_once_with(["imagery"], [grids for grids in json_config.get('grids')], gpkgfile, table_name='imagery')
        json_config['caches'] = {'cache': {'sources': ['imagery'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}}
        json_config['services'] = ['demo']

        patch_https.assert_called_once_with('imagery')
        load_config.assert_called_once_with(mapproxy_config, config_dict=json_config)
        remove_zoom_levels.assert_called_once_with(gpkgfile)
        mock_set_gpkg_contents_bounds.assert_called_once_with(gpkgfile, 'imagery', bbox)
        seed_template.assert_called_once_with(bbox=bbox, coverage_file=None, level_from=0, level_to=10)
        self.task_process.side_effect = Exception()
        with self.assertRaises(Exception):
            w2g.convert()


class TestHelpers(TransactionTestCase):

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

    @patch('eventkit_cloud.utils.mapproxy.sqlite3')
    @patch('eventkit_cloud.utils.mapproxy.get_table_tile_matrix_information')
    @patch('eventkit_cloud.utils.mapproxy.get_zoom_levels_table')
    @patch('eventkit_cloud.utils.mapproxy.get_tile_table_names')
    def test_check_zoom_levels(self, mock_get_tables, mock_get_zoom_levels, mock_tile_matrix, mock_sql):
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
        test_progress = 0.42
        custom_logger = CustomLogger(task_uid=test_task_uid)
        custom_logger.log_step_counter = 0
        self.assertIsNotNone(custom_logger)
        mock_progress = MagicMock()
        mock_progress.progress = test_progress
        custom_logger.log_step(mock_progress)
        mock_update_progress.assert_called_with(test_task_uid, progress=test_progress*100, eta=custom_logger.eta)
