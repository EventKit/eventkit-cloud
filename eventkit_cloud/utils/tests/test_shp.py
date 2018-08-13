# -*- coding: utf-8 -*-
import logging
import os
from uuid import uuid4

from django.conf import settings
from django.test import TestCase
from mock import Mock, patch

from eventkit_cloud.utils.shp import GPKGToShp

logger = logging.getLogger(__name__)


class TestGPKGToShp(TestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.shp.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('os.path.exists')
    def test_convert(self, exists):
        gpkg = self.path + '/utils/tests/files/test.gpkg'
        shapefile = self.path + '/utils/tests/files/shp'
        layer_name = os.path.splitext(os.path.basename(gpkg))[0]
        cmd = "ogr2ogr -f 'ESRI Shapefile' {0} {1} -lco ENCODING=UTF-8 -nln {2} -overwrite".format(shapefile, gpkg, layer_name)
        exists.return_value = True

        self.task_process.return_value = Mock(exitcode=0)
        # set zipped to False for testing
        s2s = GPKGToShp(gpkg=gpkg, shapefile=shapefile,
                        zipped=False, debug=False, task_uid=self.task_uid)
        out = s2s.convert()
        # export_task.assert_called_once()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(gpkg)
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/bash', shell=True, stderr=-1, stdout=-1)
        self.task_process.return_value = Mock(exitcode=1)
        self.assertEquals(out, shapefile)
        with self.assertRaises(Exception):
            s2s.convert()

    @patch('os.path.exists')
    @patch('shutil.rmtree')
    def test_zip_img_file(self, rmtree, exists):
        gpkg = self.path + '/utils/tests/files/test.gpkg'
        shapefile = self.path + '/utils/tests/files/shp'
        zipfile = self.path + '/utils/tests/files/shp.zip'
        zip_cmd = "zip -j -r {0} {1}".format(zipfile, shapefile)
        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        s2s = GPKGToShp(gpkg=gpkg, shapefile=shapefile,
                          zipped=False, debug=False, task_uid=self.task_uid)
        result = s2s._zip_shape_dir()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(gpkg)
        self.task_process().start_process.assert_called_once_with(zip_cmd, executable='/bin/bash', shell=True, stderr=-1, stdout=-1)
        self.task_process.return_value = Mock(exitcode=1)
        self.assertEquals(result, zipfile)
        rmtree.assert_called_once_with(shapefile)
        with self.assertRaises(Exception):
            s2s.convert()
