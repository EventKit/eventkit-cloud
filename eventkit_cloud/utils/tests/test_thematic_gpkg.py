# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch, MagicMock, call

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
import uuid

import eventkit_cloud.jobs.presets as presets
from eventkit_cloud.jobs.models import Job, DatamodelPreset

from ..thematic_gpkg import ThematicGPKG

logger = logging.getLogger(__name__)


class TestThematicGPKG(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))

        preset = DatamodelPreset.objects.get(name='hdm')
        self.tags = preset.json_tags

        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)

        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom,
                                      json_tags=preset.json_tags)

    @patch('os.remove')
    @patch('__builtin__.open')
    @patch('eventkit_cloud.utils.thematic_gpkg.shutil.copy')
    @patch('eventkit_cloud.utils.thematic_gpkg.os.path.exists')
    @patch('eventkit_cloud.utils.thematic_gpkg.TaskProcess')
    @patch('eventkit_cloud.utils.thematic_gpkg.sqlite3.connect')
    def test_convert(self, connect, task_process, exists, copy, mock_open, remove):
        gpkg = self.path + '/files/test.gpkg'
        stage_dir = '/test/path'
        job_name = 'test_thematic_gpkg'
        sql_file_name = 'thematic_spatial_index.sql'
        expected_out = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        expected_call = 'spatialite {0} < {1}'.format(expected_out, os.path.join(stage_dir, sql_file_name))
        exists.return_value = True
        conn = Mock()
        connect.return_value = conn
        cur = MagicMock()
        conn.cursor = cur
        cur.execute = MagicMock()
        tags = self.job.categorised_tags
        generated_task_uid = uuid.uuid4()

        task_process.return_value = Mock(exitcode=0)
        t2s = ThematicGPKG(
            gpkg=gpkg,
            tags=tags,
            job_name=job_name,
            stage_dir=stage_dir,
            debug=False,
            task_uid=generated_task_uid
        )
        out = t2s.convert()
        copy.assert_called_once_with(gpkg, expected_out)
        exists.assert_has_calls([call(gpkg), call(os.path.join(stage_dir, '{0}.gpkg'.format(job_name)))])
        task_process.assert_called_with(task_uid=generated_task_uid)
        task_process().start_process.assert_called_once_with(expected_call, executable='/bin/bash', shell=True, stderr=-1, stdout=-1)
        connect.assert_called_once()
        conn.enable_load_extension.assert_called_once_with(True)
        mock_open.assert_called_once_with(os.path.join(stage_dir, sql_file_name), 'w+')
        remove.assert_called_once_with(os.path.join(stage_dir, sql_file_name))
        self.assertEqual(out, expected_out)

