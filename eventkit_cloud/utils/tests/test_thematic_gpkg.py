# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch, MagicMock

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
import uuid

import eventkit_cloud.jobs.presets as presets
from eventkit_cloud.jobs.models import Job, Tag

from ..thematic_gpkg import ThematicGPKG

logger = logging.getLogger(__name__)


class TestThematicGPKG(TestCase):

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        parser = presets.PresetParser(self.path + '/files/hdm_presets.xml')
        self.tags = parser.parse()
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom)
        tags_dict = parser.parse()
        for entry in self.tags:
            tag = Tag.objects.create(name=entry['name'], key=entry['key'], value=entry['value'],
                                     geom_types=entry['geom_types'], data_model='PRESET', job=self.job)

    @patch('os.remove')
    @patch('__builtin__.open')
    @patch('eventkit_cloud.utils.thematic_gpkg.shutil.copy')
    @patch('eventkit_cloud.utils.thematic_gpkg.os.path.exists')
    @patch('eventkit_cloud.utils.thematic_gpkg.subprocess.PIPE')
    @patch('eventkit_cloud.utils.thematic_gpkg.TaskProcess')
    @patch('eventkit_cloud.utils.thematic_gpkg.sqlite3.connect')
    def test_convert(self, connect, task_process, pipe, exists, copy, mock_open, remove):
        gpkg = self.path + '/files/test.gpkg'
        stage_dir = '/test/path'
        sql_file_name = 'thematic_spatial_index.sql'
        exists.return_value = True
        conn = Mock()
        conn.enable_load_extention = Mock()
        connect.return_value = conn
        cur = MagicMock()
        conn.cursor = cur
        cur.execute = MagicMock()
        tags = self.job.categorised_tags
        generated_task_uid = uuid.uuid4()
        t2s = ThematicGPKG(
            gpkg=gpkg,
            tags=tags,
            job_name='test_thematic_gpkg',
            stage_dir=stage_dir,
            debug=False,
            task_uid=generated_task_uid
        )
        task_process.return_value = MagicMock(exitcode=0)
        exists.assert_called_once()
        copy.assert_called_once()
        t2s.convert()
        task_process.start_process.assert_called_once()
        task_process.assert_called_with(task_uid=generated_task_uid)
        connect.assert_called_once()
        conn.load_extention.assert_called_once()
        conn.cursor.assert_called_once()
        mock_open.assert_called_once_with(os.path.join(stage_dir, sql_file_name), 'w+')
        remove.assert_called_once_with(os.path.join(stage_dir, sql_file_name))

