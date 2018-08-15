# -*- coding: utf-8 -*-
import logging
import os
import uuid

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from mock import patch, MagicMock, call

from eventkit_cloud.jobs.models import Job, DatamodelPreset
from eventkit_cloud.utils.thematic_gpkg import ThematicGPKG

logger = logging.getLogger(__name__)


class TestThematicGPKG(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))

        preset = DatamodelPreset.objects.get(name='hdm')
        self.tags = preset.json_tags

        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)

        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom,
                                      json_tags=preset.json_tags)

    @patch('eventkit_cloud.utils.thematic_gpkg.create_table_from_existing')
    @patch('eventkit_cloud.utils.thematic_gpkg.execute_spatialite_script')
    @patch('eventkit_cloud.utils.thematic_gpkg.enable_spatialite')
    @patch('os.remove')
    @patch('__builtin__.open')
    @patch('eventkit_cloud.utils.thematic_gpkg.shutil.copy')
    @patch('eventkit_cloud.utils.thematic_gpkg.os.path.exists')
    @patch('eventkit_cloud.utils.thematic_gpkg.sqlite3')
    def test_convert(self, mock_sqlite, exists, copy, mock_open, remove, mock_enable_spatialite,
                     mock_execute_spatialite_script, mock_create_table):
        gpkg = self.path + '/files/test.gpkg'
        stage_dir = '/test/path'
        job_name = 'test_thematic_gpkg'
        sql_file_name = 'thematic_spatial_index.sql'
        expected_out = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        expected_sql_file_name = os.path.join(stage_dir, sql_file_name)
        exists.return_value = True
        conn = MagicMock()
        mock_sqlite.connect.return_value = conn
        tags = self.job.categorised_tags
        generated_task_uid = uuid.uuid4()

        t2s = ThematicGPKG(
            gpkg=gpkg,
            tags=tags,
            job_name=job_name,
            stage_dir=stage_dir,
            debug=False,
            task_uid=generated_task_uid
        )
        # Just to make it clear where audit logging entries came from
        user_details = {'username': 'TestThematicGPKG.test_convert'}
        out = t2s.convert(user_details=user_details)
        mock_enable_spatialite.assert_called_once_with(conn)
        mock_execute_spatialite_script.assert_called_once_with(expected_out, expected_sql_file_name)
        copy.assert_called_once_with(gpkg, expected_out)
        exists.assert_has_calls([call(gpkg), call(os.path.join(stage_dir, '{0}.gpkg'.format(job_name)))])
        mock_open.assert_called_once_with(os.path.join(stage_dir, sql_file_name), 'w+')
        remove.assert_called_once_with(os.path.join(stage_dir, sql_file_name))
        self.assertEqual(out, expected_out)
