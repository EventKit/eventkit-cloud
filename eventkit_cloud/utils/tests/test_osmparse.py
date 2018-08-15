# -*- coding: utf-8 -*-

import os
from uuid import uuid4

from django.test import TestCase
from mock import MagicMock, Mock, patch, call

from eventkit_cloud.utils.osmparse import OSMParser


class TestOSMParser(TestCase):

    def setUp(self,):
        self.path = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir))
        self.task_process_patcher = patch('eventkit_cloud.utils.osmparse.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.osmparse.exists')
    def test_create_spatialite(self, exists):
        ogr_cmd = """
            ogr2ogr -f GPKG /path/to/query.gpkg /path/to/query.pbf \
            --config OSM_CONFIG_FILE {0} \
            --config OGR_INTERLEAVED_READING YES \
            --config OSM_MAX_TMPFILE_SIZE 100 -gt 65536
        """.format(self.path + '/conf/hotosm.ini')
        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        parser = OSMParser(osm='/path/to/query.pbf', gpkg='/path/to/query.gpkg', task_uid=self.task_uid)
        exists.assert_called_with('/path/to/query.pbf')
        parser.create_geopackage()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        self.task_process().start_process.assert_called_once_with(ogr_cmd, shell=True, executable='/bin/bash',
                                stdout=-1, stderr=-1)
        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            parser.create_geopackage()

    @patch('eventkit_cloud.utils.osmparse.execute_spatialite_script')
    @patch('eventkit_cloud.utils.osmparse.exists')
    def test_create_default_schema(self, exists, mock_spatialite):
        example_gpkg = os.path.join("path", "to", "query.gpkg")
        path = os.path.join("path", "to")
        expected_paths = [os.path.join(path, 'sql', 'planet_osm_schema.sql'), os.path.join(path, 'sql', 'spatial_index.sql')]
        exists.return_value = True
        parser = OSMParser(osm='/path/to/query.pbf', gpkg=example_gpkg, task_uid=self.task_uid)
        parser.path = path
        user_details = {'username': 'test_create_default_schema'}
        parser.create_default_schema_gpkg(user_details=user_details)
        exists.assert_called_with(example_gpkg)
        mock_spatialite.assert_has_calls([
            call(example_gpkg, expected_paths[0], user_details=user_details),
            call(example_gpkg, expected_paths[1], user_details=user_details)
        ])


    @patch('eventkit_cloud.utils.osmparse.ogr.Open')
    @patch('eventkit_cloud.utils.osmparse.exists')
    def test_update_zindexes(self, exists, ogr_open):
        exists.return_value = True
        ogr_ds = MagicMock()
        ogr_ds.GetLayerCount.return_value = 3
        ogr_ds.ExecuteSQL = MagicMock()
        ogr_ds.Destroy = MagicMock()
        ogr_open.return_value = ogr_ds
        parser = OSMParser(osm='/path/to/query.pbf', gpkg='/path/to/query.gpkg')
        parser.update_zindexes()
        exists.assert_called_with('/path/to/query.gpkg')
        ogr_open.assert_called_once_with('/path/to/query.gpkg', update=True)
        self.assertEquals(30, ogr_ds.ExecuteSQL.call_count)
        ogr_ds.Destroy.assert_called_once()
