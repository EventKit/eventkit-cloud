from __future__ import absolute_import

from django.test import TestCase
from mock import MagicMock, patch
from pysqlite2 import dbapi2 as sqlite3

from eventkit_cloud.utils.sqlite import execute_spatialite_script, enable_spatialite


class TestSQLite(TestCase):

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
