# -*- coding: utf-8 -*-
import logging
import os

from mock import Mock, patch, call

from django.test import TransactionTestCase

from ..geopackage import (SQliteToGeopackage, get_table_count, get_tile_table_names, get_table_names,
                          get_zoom_levels_table, remove_zoom_level, get_tile_matrix_table_zoom_levels,
                          remove_empty_zoom_levels)

logger = logging.getLogger(__name__)


class TestSQliteToGeopackage(TransactionTestCase):
    def setUp(self, ):
        import eventkit_cloud.utils
        self.path = os.path.dirname(eventkit_cloud.utils.__file__)

    @patch('eventkit_cloud.tasks.models.ExportTask')
    @patch('os.path.isfile')
    @patch('subprocess.PIPE')
    @patch('subprocess.Popen')
    def test_convert(self, popen, pipe, isfile, export_task):
        sqlite = '/path/to/query.sqlite'
        gpkgfile = '/path/to/query.gpkg'
        cmd = "ogr2ogr -f 'GPKG' {0} {1}".format(gpkgfile, sqlite)
        isfile.return_value = True
        proc = Mock()
        popen.return_value = proc
        proc.communicate.return_value = (Mock(), Mock())
        proc.wait.return_value = 0
        # set zipped to False for testing
        s2g = SQliteToGeopackage(sqlite=sqlite, gpkgfile=gpkgfile, debug=False)
        isfile.assert_called_once_with(sqlite)
        out = s2g.convert()
        export_task.assert_called_once()
        popen.assert_called_once_with(cmd, shell=True, executable='/bin/bash',
                                      stdout=pipe, stderr=pipe)
        proc.communicate.assert_called_once()
        proc.wait.assert_called_once()
        self.assertEquals(out, gpkgfile)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_get_table_count(self, sqlite3):
        expected_count = 4
        gpkg = "/test/file.gpkg"
        sqlite3.connect().cursor().fetchone.return_value = [expected_count]

        bad_table_name = "test;this"
        returned_count = get_table_count(gpkg, bad_table_name)
        sqlite3.connect().cursor().execute.assert_not_called()
        self.assertFalse(returned_count)

        table_name = "test"
        returned_count = get_table_count(gpkg, table_name)
        sqlite3.connect().cursor().execute.assert_called_once_with("SELECT COUNT(*) FROM '{0}';".format(table_name))
        self.assertEqual(expected_count, returned_count)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_get_table_names(self, sqlite3):
        expected_table_names = ["test1", "test2"]
        mock_table_names = [(expected_table_names[0],), (expected_table_names[1],)]
        gpkg = "/test/file.gpkg"
        sqlite3.connect().cursor().execute.return_value = mock_table_names

        return_table_names = get_table_names(gpkg)
        sqlite3.connect().cursor().execute.assert_called_once_with("SELECT table_name FROM gpkg_contents;")
        self.assertEqual(expected_table_names, return_table_names)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_get_tile_table_names(self, sqlite3):
        expected_table_names = ["test1", "test2"]
        mock_table_names = [(expected_table_names[0],), (expected_table_names[1],)]
        gpkg = "/test/file.gpkg"
        sqlite3.connect().cursor().execute.return_value = mock_table_names

        return_table_names = get_tile_table_names(gpkg)
        sqlite3.connect().cursor().execute.assert_called_once_with(
            "SELECT table_name FROM gpkg_contents WHERE data_type = 'tiles';")
        self.assertEqual(expected_table_names, return_table_names)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_get_zoom_levels_table(self, sqlite3):
        expected_zoom_levels = [0, 1, 2]
        mock_zoom_levels = [(expected_zoom_levels[0],), (expected_zoom_levels[1],), (expected_zoom_levels[2],)]
        gpkg = "/test/file.gpkg"
        sqlite3.connect().cursor().execute.return_value = mock_zoom_levels

        bad_table_name = "test;this"
        returned_zoom_levels = get_zoom_levels_table(gpkg, bad_table_name)
        sqlite3.connect().cursor().execute.assert_not_called()
        self.assertFalse(returned_zoom_levels)

        table_name = "test"
        returned_zoom_levels = get_zoom_levels_table(gpkg, table_name)
        sqlite3.connect().cursor().execute.assert_called_once_with(
            "SELECT DISTINCT zoom_level FROM '{0}';".format(table_name))
        self.assertEqual(expected_zoom_levels, returned_zoom_levels)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_remove_zoom_level(self, sqlite3):
        zoom_level = 1
        gpkg = "/test/file.gpkg"

        bad_table_name = "test;this"
        returned_value = remove_zoom_level(gpkg, bad_table_name, zoom_level)
        sqlite3.connect().cursor().execute.assert_not_called()
        self.assertFalse(returned_value)

        table_name = "test"
        returned_value = remove_zoom_level(gpkg, table_name, zoom_level)
        sqlite3.connect().cursor().execute.assert_called_once_with(
            "DELETE FROM '{0}' WHERE zoom_level = '{1}';".format(table_name, zoom_level))
        self.assertTrue(returned_value)

    @patch('eventkit_cloud.utils.geopackage.sqlite3')
    def test_get_tile_matrix_table_zoom_levels(self, sqlite3):
        expected_zoom_levels = [0, 1, 2]
        mock_zoom_levels = [(expected_zoom_levels[0],), (expected_zoom_levels[1],), (expected_zoom_levels[2],)]
        gpkg = "/test/file.gpkg"
        sqlite3.connect().cursor().execute.return_value = mock_zoom_levels

        bad_table_name = "test;this"
        returned_zoom_levels = get_tile_matrix_table_zoom_levels(gpkg, bad_table_name)
        sqlite3.connect().cursor().execute.assert_not_called()
        self.assertFalse(returned_zoom_levels)

        table_name = "test"
        returned_zoom_levels = get_tile_matrix_table_zoom_levels(gpkg, table_name)
        sqlite3.connect().cursor().execute.assert_called_once_with(
            "SELECT zoom_level FROM gpkg_tile_matrix WHERE table_name = '{0}';".format(table_name))
        self.assertEqual(expected_zoom_levels, returned_zoom_levels)

    @patch('eventkit_cloud.utils.geopackage.remove_zoom_level')
    @patch('eventkit_cloud.utils.geopackage.get_tile_matrix_table_zoom_levels')
    @patch('eventkit_cloud.utils.geopackage.get_zoom_levels_table')
    @patch('eventkit_cloud.utils.geopackage.get_tile_table_names')
    def test_remove_empty_zoom_levels(self, get_tile_table_names, get_zoom_levels_table, get_tile_matrix_table_zoom_levels, remove_zoom_level):
        gpkg = "/test/file.gpkg"
        table_names = ['test_1', 'test_2']
        populated_zoom_levels = [1,2,3]
        tile_matrix_zoom_levels = [1,2,3,4]
        get_tile_table_names.return_value = table_names
        get_zoom_levels_table.return_value = populated_zoom_levels
        get_tile_matrix_table_zoom_levels.return_value = tile_matrix_zoom_levels

        remove_empty_zoom_levels(gpkg)
        get_tile_table_names.assert_called_once_with(gpkg)
        self.assertEqual([call(gpkg, table_names[0]),call(gpkg, table_names[1])], get_zoom_levels_table.mock_calls)
        self.assertEqual([call(gpkg, table_names[0]), call(gpkg, table_names[1])], get_tile_matrix_table_zoom_levels.mock_calls)
        self.assertEqual([call(gpkg, table_names[0], 4), call(gpkg, table_names[1], 4)], remove_zoom_level.mock_calls)
