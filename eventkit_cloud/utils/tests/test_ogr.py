# -*- coding: utf-8 -*-
import logging
import os
from uuid import uuid4

from django.test import TestCase
from mock import Mock, patch, MagicMock

from eventkit_cloud.utils.ogr import OGR, create_zip_file, get_zip_name, enable_spatialite, execute_spatialite_script

logger = logging.getLogger(__name__)


class TestOGR(TestCase):

    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.task_process_patcher = patch('eventkit_cloud.utils.ogr.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.ogr.create_zip_file')
    def test_convert(self, mock_create_zip_file):
        gpkg = '/path/to/query.gpkg'
        kmlfile = '/path/to/query.kml'
        expected_file = '/path/to/query.kmz'
        mock_create_zip_file.return_value = expected_file
        expected_cmd = "ogr2ogr -f 'KML' {0} {1}".format(kmlfile, gpkg)
        self.task_process.return_value = Mock(exitcode=0)
        # set zipped to False for testing
        ogr = OGR(task_uid=self.task_uid)
        out = ogr.convert(file_format='KML', in_file=gpkg, out_file=kmlfile)
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        self.task_process().start_process.assert_called_once_with(expected_cmd, executable='/bin/bash', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, expected_file)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            ogr.convert(file_format='KML', in_file=gpkg, out_file=kmlfile)

    def test_get_zip_name(self):
        example_value = "/path/name.txt"
        expected_value = "/path/name.zip"
        returned_value = get_zip_name(example_value)
        self.assertEquals(expected_value, returned_value)

        example_value = "/path/name.kml"
        expected_value = "/path/name.kmz"
        returned_value = get_zip_name(example_value)
        self.assertEquals(expected_value, returned_value)

    @patch("audit_logging.file_logging.logging_open")
    @patch("eventkit_cloud.utils.sqlite.enable_spatialite")
    @patch("eventkit_cloud.utils.sqlite.sqlite3")
    def test_execute_spatialite_script(self, mock_sqlite3, mock_enable, mock_logging_open):
        test_db = "test.gpkg"
        test_script = "test.sql"
        test_command = "select * from table;"

        mock_connection = MagicMock()
        mock_sqlite3.connect.return_value = mock_connection
        mock_logging_open().__enter__().read.return_value = test_command
        execute_spatialite_script(test_db, test_script)

        # test success
        mock_sqlite3.connect.assert_called_with(test_db)
        mock_connection.cursor().executescript.assert_called_once_with(test_command)
        mock_connection.cursor().close.assert_called_once()
        mock_connection.close.assert_called_once()

        mock_connection.reset_mock()

        # test failure, ensure connection is cleaned up
        mock_connection.commit.side_effect = Exception("Failed")
        with self.assertRaises(Exception):
            execute_spatialite_script(test_db, test_script)
            mock_connection.cursor().close.assert_called_once()
            mock_connection.close.assert_called_once()

    def test_enable_spatialite(self):
        mock_connection = MagicMock()
        mock_connection.execute.return_value = True
        connection = enable_spatialite(mock_connection)
        self.assertEquals(mock_connection, connection)
        mock_connection.execute.assert_called_with("SELECT load_extension('mod_spatialite')")

        mock_connection.execute.side_effect = [sqlite3.OperationalError, True]
        connection = enable_spatialite(mock_connection)
        self.assertEquals(mock_connection, connection)
        mock_connection.execute.assert_called_with("SELECT load_extension('libspatialite')")
