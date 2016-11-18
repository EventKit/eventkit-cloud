# -*- coding: utf-8 -*-
import logging
import os

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase

from eventkit_cloud.jobs.models import Job, Region, ProviderTask, ExportProvider

from celery.result import AsyncResult
from ..task_factory import TaskFactory, create_run
from ..models import ExportRun

logger = logging.getLogger(__name__)


class TestExportTaskFactory(TestCase):
    """
    Test cases for the TaskFactory.
    """

    fixtures = ('insert_provider_types.json', 'osm_provider.json',)

    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom)
        provider = ExportProvider.objects.first()
        provider_task = ProviderTask.objects.create(provider=provider)
        self.job.provider_tasks.add(provider_task)
        self.region = Region.objects.get(name='Africa')
        self.job.region = self.region
        self.uid = str(provider_task.uid)
        self.job.save()

    def test_create_run(self):
        run_uid = create_run(job_uid=self.job.uid)
        self.assertIsNotNone(run_uid)
        self.assertIsNotNone(ExportRun.objects.get(uid=run_uid))

    def test_task_factory(self):
        run_uid = create_run(job_uid=self.job.uid)
        self.assertIsNotNone(run_uid)
        self.assertIsNotNone(ExportRun.objects.get(uid=run_uid))
        tasks_results = TaskFactory().parse_tasks(run_uid=run_uid, worker="some_worker")
        self.assertIsInstance(tasks_results[0], AsyncResult)
