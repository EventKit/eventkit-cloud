# -*- coding: utf-8 -*-
import logging
import os
import json
import yaml as real_yaml
from mock import Mock, patch
from django.core.files.temp import NamedTemporaryFile
from django.conf import settings
from django.test import SimpleTestCase
from ..arcgis import ArcGISToGeopackage, create_conf_from_arcgis
from mapproxy.config.config import base_config

logger = logging.getLogger(__name__)


class TestWMTSToGeopackage(SimpleTestCase):
    def setUp(self, ):
        self.path = settings.ABS_PATH()


    @patch('eventkit_cloud.utils.arcgis.yaml')
    @patch('eventkit_cloud.utils.arcgis.NamedTemporaryFile')
    @patch('eventkit_cloud.utils.arcgis.config_command')
    def test_create_conf_from_arcgis(self, config_command, temp, yaml):
        test_file = NamedTemporaryFile()
        url = 'http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer'
        test_yaml = "layer:\r\n  - name: imagery\r\n    title: imagery\r\n    sources: [cache]\r\n\r\nsources:\r\n  imagery_arcgis:\r\n    type: arcgis\r\n    grid: webmercator\r\n    req:\r\n      url: http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer\r\n      layers: \r\n        show: 0\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        temp.return_value = test_file
        config_command.return_value = test_yaml
        yaml.load.return_value = real_yaml.load(test_yaml)
        cmd = ['--capabilities', '{}'.format(url), '--output', '{}'.format(test_file.name), '--force']
        w2g = create_conf_from_arcgis(url)
        config_command.assert_called_once_with(cmd)
        self.assertEqual(w2g, real_yaml.load(test_yaml))

    @patch('eventkit_cloud.utils.arcgis.SeedingConfiguration')
    @patch('eventkit_cloud.utils.arcgis.seeder')
    @patch('eventkit_cloud.utils.arcgis.Process')
    @patch('eventkit_cloud.utils.arcgis.load_config')
    @patch('eventkit_cloud.utils.arcgis.get_cache_template')
    @patch('eventkit_cloud.utils.arcgis.get_seed_template')
    def test_convert(self, seed_template, cache_template, load_config, process, seeder, seeding_config):
        process.return_value = Mock()
        #process.start.return_value = True
        #process.join.return_value = True
        gpkgfile = '/var/lib/eventkit/test.gpkg'
        config = "layer:\r\n  - name: imagery\r\n    title: imagery\r\n    sources: [cache]\r\n\r\nsources:\r\n  imagery_arcgis:\r\n    type: arcgis\r\n    grid: webmercator\r\n    req:\r\n      url: http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer\r\n      layers: \r\n        show: 0\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        json_config = real_yaml.load(config)
        mapproxy_base = base_config()
        cache_template.return_value = {'cache': {'sources': ['imagery_arcgis'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}}
        seed_template.return_value = {'coverages': {'geom': {'srs': 'EPSG:4326', 'bbox': [-2, -2, 2, 2]}}, 'seeds': {'seed': {'coverages': ['geom'], 'refresh_before': {'minutes': 0}, 'levels': {'to': 10, 'from': 0}, 'caches': ['cache']}}}
        w2g = ArcGISToGeopackage(config=config,
                               gpkgfile=gpkgfile,
                               bbox=[-2, -2, 2, 2],
                               arcgis_url='http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer',
                               layer='imagery',
                               debug=True,
                               name='imagery',
                               level_from=0,
                               level_to=10)
        result = w2g.convert()
        self.assertEqual(result, gpkgfile)

        cache_template.assert_called_once_with(["imagery_arcgis"], [grids for grids in json_config.get('grids')], gpkgfile)
        json_config['caches'] = {'cache': {'sources': ['imagery_arcgis'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}}
        json_config['globals'] = {'http': {'ssl_no_cert_checks': True}}

        load_config.assert_called_once_with(mapproxy_base, config_dict=json_config)

        seed_dict = {'cache': {'sources': ['imagery_arcgis'], 'cache': {'type': 'geopackage', 'filename': '/var/lib/eventkit/test.gpkg'}, 'grids': ['webmercator']}}
        seed_template.assert_called_once_with(bbox=[-2, -2, 2, 2], level_from=0, level_to=10)
        process.assert_called_once()
