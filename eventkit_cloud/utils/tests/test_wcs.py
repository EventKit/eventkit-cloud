# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch
from django.conf import settings
from django.test import TransactionTestCase
from string import Template
from ..wcs import WCSConverter
from uuid import uuid4

logger = logging.getLogger(__name__)


class TestWCSToGPKG(TransactionTestCase):

    def setUp(self):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.wcs.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.wcs.os.path.exists')
    def test_create_convert(self, exists):
        gpkg = '/path/to/sqlite.gpkg'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/some-server/wcs?'
        cmd = Template("gdal_translate -projwin $minX $maxY $maxX $minY -of GPKG -ot byte $wcs $out")

        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        wcs_conv = WCSConverter(out=gpkg,
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
        exists.assert_called_once_with(os.path.dirname(gpkg))

        cmd = cmd.safe_substitute({'out': gpkg, 'wcs': wcs_conv.wcs_xml_path, 'minX': bbox[0], 'minY': bbox[1],
                                   'maxX': bbox[2], 'maxY': bbox[3]})
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, gpkg)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            wcs_conv.convert()
