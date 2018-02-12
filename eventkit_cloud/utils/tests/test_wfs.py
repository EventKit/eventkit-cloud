# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch, MagicMock
import requests
from django.conf import settings
from django.test import TransactionTestCase
from string import Template
from ..wfs import WFSToGPKG
from uuid import uuid4

logger = logging.getLogger(__name__)


class TestWFSToGPKG(TransactionTestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.wfs.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

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


