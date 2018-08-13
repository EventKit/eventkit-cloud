# -*- coding: utf-8 -*-
import os

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from mock import patch

from eventkit_cloud.jobs.models import ExportFormat, Job, DatamodelPreset
from eventkit_cloud.utils.osmconf import OSMConfig


class TestOSMConf(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
#         parser = presets.PresetParser(self.path + '/files/hdm_presets.xml')
        preset = DatamodelPreset.objects.get(name='hdm')
        self.tags = preset.json_tags

        self.assertIsNotNone(self.tags)
        self.assertEquals(259, len(self.tags))
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom,
                                      json_tags=self.tags)
        self.uid = self.job.uid
        # add the formats to the job
        self.job.formats = self.formats
        self.job.save()

        self.categories = self.job.categorised_tags

    def test_create_osm_conf(self,):
        conf = OSMConfig(self.categories, job_name=self.job.name)
        path = conf.create_osm_conf(stage_dir=self.path + '/files/')
        self.assertTrue(os.path.exists(path))
        os.remove(path)
