# -*- coding: utf-8 -*-
import logging
import os
import requests
from mock import Mock, patch, MagicMock
from django.conf import settings
from django.test import TransactionTestCase
from string import Template
from ..wcs import WCSConverter, ping_wcs
from uuid import uuid4

logger = logging.getLogger(__name__)


class TestWCSConverter(TransactionTestCase):

    def setUp(self):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.wcs.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.wcs.requests.get')
    def test_ping_wcs(self, get):
        url = "http://example.com/wcs?"
        coverage = "examplecoverage"

        valid_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata>
                                   <wcs:CoverageOfferingBrief>
                                       <wcs:label>examplecoverage</wcs:label>
                                   </wcs:CoverageOfferingBrief>
                               </wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>"""
        invalid_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs"></wcs:WCS_Capabilities>"""
        empty_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata></wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>"""

        # Test: cannot connect to server
        get.side_effect = requests.exceptions.ConnectionError()
        success, error = ping_wcs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not return status 200
        get.side_effect = None
        response = MagicMock()
        response.content = ""
        response.status_code = 403
        response.ok = False
        get.return_value = response
        success, _ = ping_wcs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not return recognizable xml
        response.content = invalid_content
        response.status_code = 200
        response.ok = True
        get.return_value = response
        success, _ = ping_wcs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not offer the requested coverage
        response.content = empty_content
        get.return_value = response
        success, _ = ping_wcs(url, coverage)
        self.assertEquals(False, success)

        # Test: success
        response.content = valid_content
        get.return_value = response
        success, _ = ping_wcs(url, coverage)
        self.assertEquals(True, success)


    @patch('eventkit_cloud.utils.wcs.os.path.exists')
    def test_convert_geotiff(self, exists):
        geotiff = '/path/to/geotiff.tif'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wcs?'
        cmd = Template("gdal_translate -projwin $minX $maxY $maxX $minY -of gtiff $type $wcs $out")

        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        wcs_conv = WCSConverter(out=geotiff,
                                bbox=bbox,
                                service_url=service_url,
                                layer=layer,
                                debug=False,
                                name=name,
                                service_type=None,
                                task_uid=self.task_uid,
                                fmt="gtiff")
        out = wcs_conv.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(geotiff))

        cmd = cmd.safe_substitute({'out': geotiff, 'wcs': wcs_conv.wcs_xml_path, 'minX': bbox[0], 'minY': bbox[1],
                                   'maxX': bbox[2], 'maxY': bbox[3], 'type': ''})
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, geotiff)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            wcs_conv.convert()

    @patch('eventkit_cloud.utils.wcs.os.path.exists')
    def test_convert_geopackage(self, exists):
        geotiff = '/path/to/geopackage.gpkg'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wcs?'
        cmd = Template("gdal_translate -projwin $minX $maxY $maxX $minY -of gpkg $type $wcs $out")

        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        wcs_conv = WCSConverter(out=geotiff,
                                bbox=bbox,
                                service_url=service_url,
                                layer=layer,
                                debug=False,
                                name=name,
                                service_type=None,
                                task_uid=self.task_uid,
                                fmt="gpkg")
        out = wcs_conv.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(geotiff))

        cmd = cmd.safe_substitute({'out': geotiff, 'wcs': wcs_conv.wcs_xml_path, 'minX': bbox[0], 'minY': bbox[1],
                                   'maxX': bbox[2], 'maxY': bbox[3], 'type': '-ot byte'})
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, geotiff)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            wcs_conv.convert()
