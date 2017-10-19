# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch, MagicMock
import requests
from django.conf import settings
from django.test import TransactionTestCase
from string import Template
from ..wfs import WFSToGPKG, ping_wfs
from uuid import uuid4

logger = logging.getLogger(__name__)


class TestWFSToGPKG(TransactionTestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.wfs.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.wcs.requests.get')
    def test_ping_wfs(self, get):
        url = "http://example.com/wfs?"
        coverage = "exampleLayer"

        valid_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata>
                                   <wcs:CoverageOfferingBrief>
                                       <wcs:label>exampleLayer</wcs:label>
                                   </wcs:CoverageOfferingBrief>
                               </wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>"""
        invalid_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs"></wcs:WCS_Capabilities>"""
        empty_content = """<wcs:WCS_Capabilities xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata></wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>"""

        # Test: cannot connect to server
        get.side_effect = requests.exceptions.ConnectionError()
        success, error = ping_wfs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not return status 200
        get.side_effect = None
        response = MagicMock()
        response.content = ""
        response.status_code = 403
        response.ok = False
        get.return_value = response
        success, _ = ping_wfs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not return recognizable xml
        response.content = invalid_content
        response.status_code = 200
        response.ok = True
        get.return_value = response
        success, _ = ping_wfs(url, coverage)
        self.assertEquals(False, success)

        # Test: server does not offer the requested coverage
        response.content = empty_content
        get.return_value = response
        success, _ = ping_wfs(url, coverage)
        self.assertEquals(False, success)

        # Test: success
        response.content = valid_content
        get.return_value = response
        success, _ = ping_wfs(url, coverage)
        self.assertEquals(True, success)

    @patch('eventkit_cloud.utils.wfs.check_content_exists')
    @patch('eventkit_cloud.utils.wfs.os.path.exists')
    def test_create_convert(self, exists, check_content_exists):
        gpkg = '/path/to/sqlite.gpkg'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wfs?'
        expected_url = '{}{}'.format(service_url.rstrip('?'), '?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={}&SRSNAME=EPSG:4326'.format(layer))
        cmd = Template("ogr2ogr -skipfailures -spat $minX $minY $maxX $maxY -f GPKG $gpkg WFS:'$url'")
        cmd = cmd.safe_substitute({'gpkg': gpkg, 'url': expected_url, 'minX': bbox[0], 'minY': bbox[1], 'maxX': bbox[2], 'maxY': bbox[3]})
        exists.return_value = True
        check_content_exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        # set zipped to False for testing
        w2g = WFSToGPKG(gpkg=gpkg,
                        bbox=bbox,
                        service_url=service_url,
                        layer=layer,
                        debug=False,
                        name=name,
                        service_type=None,
                        task_uid=self.task_uid)
        out = w2g.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(gpkg))
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, gpkg)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            w2g.convert()


