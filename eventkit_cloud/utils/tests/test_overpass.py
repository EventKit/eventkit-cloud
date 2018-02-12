# -*- coding: utf-8 -*-
import logging
import os

import mock
from mock import patch, Mock

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase

from eventkit_cloud.jobs.models import ExportFormat, Job, DatamodelPreset

from ..overpass import Overpass

logger = logging.getLogger(__name__)


class TestOverpass(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.url = settings.OVERPASS_API_URL
        self.bbox = [-10.85, 6.25, -10.62, 6.4]  # [<long0>, <lat0>, <long1>, <lat1>]
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)

        preset = DatamodelPreset.objects.get(name='hdm')
        tags = preset.json_tags
        self.assertEquals(259, len(tags))

        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom,
                                      json_tags=tags)
        self.uid = self.job.uid
        # add the formats to the job
        self.job.formats = self.formats
        self.job.save()
        self.osm = self.path + '/files/query.osm'
        self.query = '[maxsize:2147483648][timeout:1600];(node(6.25,-10.85,6.4,-10.62);<;);out body;'

#         parser = presets.PresetParser(self.path + '/files/hdm_presets.xml')
#         self.assertIsNotNone(tags)
#         self.job.tags.all().delete()
#         tags = parser.parse()

        # save all the tags from the preset
#         for tag_dict in tags:
#             tag = Tag.objects.create(name=tag_dict['key'], value=tag_dict['value'], job=self.job,
#                                      data_model='osm', geom_types=tag_dict['geom_types'])
#         self.assertEquals(259, self.job.tags.all().count())

    def test_get_query(self,):
        overpass = Overpass(
            stage_dir=self.path + '/files/',
            bbox=self.bbox, job_name='testjob',
        )
        q = overpass.get_query()
        self.assertEquals(q, self.query)

    @patch('django.db.connection.close')
    @patch('eventkit_cloud.tasks.models.ExportTaskRecord')
    @patch('eventkit_cloud.utils.overpass.requests.post')
    def test_run_query(self, mock_post, export_task, mock_close):
        verify_ssl = not getattr(settings, "DISABLE_SSL_VERIFICATION", False)
        export_task_instance = Mock(progress=0, estimated_finish=None)
        export_task.objects.get.return_value = export_task_instance
        # Only important that it's not None
        mock_export_task_instance_id = 1
        op = Overpass(
            stage_dir=self.path + '/files/', task_uid=mock_export_task_instance_id,
            bbox=self.bbox, job_name='testjob',
        )
        q = op.get_query()
        out = self.path + '/files/query.osm'
        mock_response = mock.Mock()
        expected = ['<osm>some data</osm>']
        mock_response.headers = {'content-length': 20}
        mock_response.iter_content.return_value = expected
        mock_post.return_value = mock_response
        op.run_query()
        mock_post.assert_called_once_with(self.url,
                                          data=q,
                                          stream=True,
                                          verify=verify_ssl)
        self.assertEqual(export_task_instance.progress, 50)
        mock_close.assert_called()
        f = open(out)
        data = f.read()
        self.assertEqual(data, expected[0])
        f.close()
        os.remove(out)
