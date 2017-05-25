# -*- coding: utf-8 -*-
import logging
import os

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.db import DatabaseError
from mock import patch, Mock, call, MagicMock

from eventkit_cloud.jobs.models import Job, Region, ProviderTask, ExportProvider

from celery.result import AsyncResult
import uuid
from ..task_factory import TaskFactory, create_run
from ..models import ExportRun

logger = logging.getLogger(__name__)


class TestExportTaskFactory(TestCase):
    """
    Test cases for the TaskFactory.
    """

    fixtures = ('insert_provider_types.json', 'osm_provider.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom)
        provider = ExportProvider.objects.get(slug='osm')
        provider_task = ProviderTask.objects.create(provider=provider)
        self.job.provider_tasks.add(provider_task)
        self.region = Region.objects.get(name='Africa')
        self.job.region = self.region
        self.uid = str(provider_task.uid)
        self.job.save()

    def test_create_run_success(self):
        run_uid = create_run(job_uid=self.job.uid)
        self.assertIsNotNone(run_uid)
        self.assertIsNotNone(ExportRun.objects.get(uid=run_uid))

    @patch('eventkit_cloud.tasks.task_factory.ExportRun')
    def test_create_run_failure(self, ExportRun):
        ExportRun.objects.create.side_effect = DatabaseError('FAIL')
        with self.assertRaises(DatabaseError):
            run_uid = create_run(job_uid=self.job.uid)
            self.assertIsNone(run_uid)

    @patch('eventkit_cloud.tasks.task_factory.finalize_export_provider_task')
    @patch('eventkit_cloud.tasks.task_factory.create_task')
    @patch('eventkit_cloud.tasks.task_factory.group')
    @patch('eventkit_cloud.tasks.task_factory.chain')
    def test_task_factory(self, task_factory_chain, task_factory_group, create_task, finalize_task):
        run_uid = create_run(job_uid=self.job.uid)
        self.assertIsNotNone(run_uid)
        self.assertIsNotNone(ExportRun.objects.get(uid=run_uid))
        worker = "some_worker"
        provider_uuid = uuid.uuid4()
        task_runner = MagicMock()
        task = Mock()
        task_runner().run_task.return_value = (provider_uuid, task)
        create_task.return_value = task
        task_factory = TaskFactory()
        task_factory.type_task_map = {'osm-generic': task_runner, 'osm': task_runner}
        task_factory.parse_tasks(run_uid=run_uid, worker=worker)
        task_factory_chain.assert_called()
        task_factory_group.assert_called()
        create_task.assert_called()
        finalize_task.s.assert_called()
