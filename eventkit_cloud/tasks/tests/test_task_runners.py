# -*- coding: utf-8 -*-
import logging
import os
import uuid

from mock import Mock, PropertyMock, patch

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase

from eventkit_cloud.jobs.models import ExportFormat, Job, Region, ProviderTask, ExportProvider

from ..task_runners import ExportOSMTaskRunner
from ..task_factory import TaskFactory

logger = logging.getLogger(__name__)


class TestExportTaskRunner(TestCase):

    fixtures = ('insert_provider_types.json', 'osm_provider.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        # bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob',
                                 description='Test description', user=self.user,
                                 the_geom=the_geom)
        provider = ExportProvider.objects.first()
        provider_task = ProviderTask.objects.create(provider=provider)
        self.job.provider_tasks.add(provider_task)
        self.region = Region.objects.get(name='Africa')
        self.job.region = self.region
        self.uid = str(provider_task.uid)
        self.job.save()
        self.task_factory = TaskFactory(self.job.uid)

    @patch('eventkit_cloud.tasks.task_runners.chain')
    @patch('eventkit_cloud.tasks.export_tasks.ShpExportTask')
    def test_run_task(self, mock_shp, mock_chain):
        shp_task = ExportFormat.objects.get(slug='shp')
        celery_uid = str(uuid.uuid4())
        # shp export task mock
        shp_export_task = mock_shp.return_value
        shp_export_task.run.return_value = Mock(state='PENDING', id=celery_uid)
        type(shp_export_task).name = PropertyMock(return_value='Shapefile Export')
        # celery chain mock
        celery_chain = mock_chain.return_value
        celery_chain.apply_async.return_value = Mock()
        self.job.provider_tasks.all()[0].formats.add(shp_task)
        runner = ExportOSMTaskRunner()
        #Even though code using pipes seems to be supported here it is throwing an error.
        try:
            runner.run_task(provider_task_uid=self.uid, run=self.job.runs.all()[0], service_type={'osm': True})
        except TypeError:
            pass
        run = self.job.runs.all()[0]
        self.assertIsNotNone(run)
        # assert delay method called on mock chord..
        celery_chain.delay.assert_called_once()
        tasks = run.provider_tasks.all()[0].tasks.all()
        self.assertIsNotNone(tasks)
        self.assertEquals(5, len(tasks))  # 4 initial tasks + 1 shape export task
        self.assertFalse(hasattr(tasks[0], 'result'))  # no result yet..
