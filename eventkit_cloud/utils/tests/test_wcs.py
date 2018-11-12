# -*- coding: utf-8 -*-
import logging
import os
from string import Template
from uuid import uuid4

from django.conf import settings
from django.test import TransactionTestCase
from mock import Mock, patch, ANY

from eventkit_cloud.utils.wcs import WCSConverter

logger = logging.getLogger(__name__)


class TestWCSConverter(TransactionTestCase):

    def setUp(self):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.wcs.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.wcs.retry')
    @patch('eventkit_cloud.utils.wcs.auth_requests.get_cred')
    @patch('eventkit_cloud.utils.wcs.os.write')
    @patch('eventkit_cloud.utils.wcs.os.path.exists')
    def test_convert_geotiff(self, exists, write, get_cred, mock_retry):
        geotiff = '/path/to/geotiff.tif'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wcs?map=testMap.map'
        cmd = Template("gdal_translate -projwin $minX $maxY $maxX $minY -of gtiff $type $wcs $out")
        expected_wcs_xml = Template("""<WCS_GDAL>
              <ServiceURL>$url</ServiceURL>
              <CoverageName>$coverage</CoverageName>
              <PreferredFormat>GeoTIFF</PreferredFormat>
              <GetCoverageExtra>&amp;crs=EPSG:4326$params</GetCoverageExtra>
              <DescribeCoverageExtra>$params</DescribeCoverageExtra>
              <UserPwd>$userpwd</UserPwd>
              <HttpAuth>ANY</HttpAuth>
            </WCS_GDAL>""").safe_substitute({
            'url': service_url.split('?')[0] + '?',
            'coverage': layer,
            'params': '&amp;map=testMap.map',
            'userpwd': 'testUser:testPass',
        }).encode()

        exists.return_value = True
        get_cred.return_value = ("testUser", "testPass")
        self.task_process.return_value = Mock(exitcode=0)

        wcs_conv = WCSConverter(out=geotiff, bbox=bbox, service_url=service_url, layer=layer, debug=False, name=name,
                                task_uid=self.task_uid, fmt="gtiff")
        out = wcs_conv.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(geotiff))
        write.assert_called_once_with(ANY, expected_wcs_xml)

        cmd = cmd.safe_substitute({'out': geotiff, 'wcs': wcs_conv.wcs_xml_path, 'minX': bbox[0], 'minY': bbox[1],
                                   'maxX': bbox[2], 'maxY': bbox[3], 'type': ''})
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEqual(out, geotiff)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            wcs_conv.convert()

    @patch('eventkit_cloud.utils.wcs.retry')
    @patch('eventkit_cloud.utils.wcs.os.path.exists')
    def test_convert_geopackage(self, exists, mock_retry):
        geotiff = '/path/to/geopackage.gpkg'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wcs?'
        cmd = Template("gdal_translate -projwin $minX $maxY $maxX $minY -of gpkg $type $wcs $out")

        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        wcs_conv = WCSConverter(out=geotiff, bbox=bbox, service_url=service_url, layer=layer, debug=False, name=name,
                                task_uid=self.task_uid, fmt="gpkg")
        out = wcs_conv.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(geotiff))

        cmd = cmd.safe_substitute({'out': geotiff, 'wcs': wcs_conv.wcs_xml_path, 'minX': bbox[0], 'minY': bbox[1],
                                   'maxX': bbox[2], 'maxY': bbox[3], 'type': '-ot byte'})
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEqual(out, geotiff)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            wcs_conv.convert()
