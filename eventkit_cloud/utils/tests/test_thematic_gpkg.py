# -*- coding: utf-8 -*-
import logging
import os

from mock import Mock, patch, MagicMock

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase

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
        self.job = Job.objects.create(name='TestJob',
                                 description='Test description', event='Nepal activation',
                                 user=self.user, the_geom=the_geom)
        tags_dict = parser.parse()
        for entry in self.tags:
            tag = Tag.objects.create(
                name=entry['name'],
                key=entry['key'],
                value=entry['value'],
                geom_types=entry['geom_types'],
                data_model='PRESET',
                job=self.job
            )


    @patch('shutil.copy')
    @patch('os.path.exists')
    @patch('subprocess.PIPE')
    @patch('subprocess.Popen')
    @patch('sqlite3.connect')
    def test_convert(self, connect, popen, pipe, exists, copy):
        gpkg = self.path + '/files/test.gpkg'
        thematic_gpkg = self.path + '/files/test_thematic_shp_thematic.gpkg'
        exists.return_value = True
        conn = Mock()
        conn.enable_load_extention = Mock()
        connect.return_value = conn
        cur = MagicMock()
        conn.cursor = cur
        cur.execute = MagicMock()
        tags = self.job.categorised_tags
        t2s = ThematicGPKG(
            gpkg=gpkg,
            tags=tags, job_name='test_thematic_sqlite',
            zipped=False, debug=False
        )
        exists.assert_called_once()
        copy.assert_called_once()
        t2s.convert()
        connect.assert_called_once()
        conn.load_extention.assert_called_once()
        conn.cursor.assert_called_once()

