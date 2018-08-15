# -*- coding: utf-8 -*-
import logging
import os
from uuid import uuid4

from django.test import TransactionTestCase
from mock import Mock, patch

from eventkit_cloud.utils.kml import GPKGToKml

logger = logging.getLogger(__name__)


class TestGPKGToKml(TransactionTestCase):

    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.task_process_patcher = patch('eventkit_cloud.utils.kml.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('os.path.exists')
    def test_convert(self, exists):
        gpkg = '/path/to/query.gpkg'
        kmlfile = '/path/to/query.kml'
        cmd = "ogr2ogr -f 'KML' {0} {1}".format(kmlfile, gpkg)
        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        # set zipped to False for testing
        s2k = GPKGToKml(gpkg=gpkg, kmlfile=kmlfile,
                        zipped=False, debug=False, task_uid=self.task_uid)
        out = s2k.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(gpkg)
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/bash', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, kmlfile)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            s2k.convert()

    @patch('os.path.exists')
    @patch('os.remove')
    def test_zip_kml_file(self, remove, exists):
        gpkg = '/path/to/query.gpkg'
        kmlfile = '/path/to/query.kml'
        zipfile = '/path/to/query.kmz'
        zip_cmd = "zip -j {0} {1}".format(zipfile, kmlfile)
        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        s2k = GPKGToKml(gpkg=gpkg, kmlfile=kmlfile,
                        zipped=True, debug=False, task_uid=self.task_uid)
        out = s2k._zip_kml_file()
        self.task_process.assert_called_with(task_uid=self.task_uid)
        exists.assert_called_once_with(gpkg)
        remove.assert_called_once_with(kmlfile)
        self.task_process().start_process.assert_called_once_with(zip_cmd, executable='/bin/bash', shell=True,
                                                                  stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, zipfile)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            s2k.convert()
