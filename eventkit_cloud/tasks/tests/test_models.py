# -*- coding: utf-8 -*-
from __future__ import absolute_import
import logging
import uuid

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from mock import patch

from ...jobs.models import ExportFormat, Job, ProviderTask, ExportProvider
from ..models import ExportRun, ExportTask, ExportTaskResult, ExportProviderTask

logger = logging.getLogger(__name__)


class TestExportRun(TestCase):
    """
    Test cases for ExportRun model
    """

    fixtures = ('insert_provider_types.json', 'osm_provider.json',)

    def setUp(self, ):
        formats = ExportFormat.objects.all()
        Group.objects.create(name='TestDefaultExportExtentGroup')
        user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        provider_task = ProviderTask.objects.create(provider=ExportProvider.objects.get(slug='osm-generic'))
        # add the formats to the provider task
        provider_task.formats.add(*formats)
        job = Job.objects.create(name='TestJob', description='Test description', user=user, the_geom=the_geom)
        job.provider_tasks.add(provider_task)

    def test_export_run(self, ):
        job = Job.objects.all()[0]
        run = ExportRun.objects.create(job=job, status='SUBMITTED')
        saved_run = ExportRun.objects.get(uid=str(run.uid))
        self.assertIsNotNone(saved_run)
        self.assertEqual(run, saved_run)
        self.assertIsNone(run.notified)
        self.assertIsNotNone(run.expiration)
        self.assertEquals('', saved_run.zipfile_url)

    def test_get_tasks_for_run(self, ):
        job = Job.objects.all()[0]
        run = ExportRun.objects.create(job=job)
        saved_run = ExportRun.objects.get(uid=str(run.uid))
        self.assertEqual(run, saved_run)
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = ExportProviderTask.objects.create(run=run)
        ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        saved_task = ExportTask.objects.get(uid=task_uid)
        self.assertIsNotNone(saved_task)
        tasks = run.provider_tasks.all()[0].tasks.all()
        self.assertEqual(tasks[0], saved_task)

    def test_get_runs_for_job(self, ):
        job = Job.objects.all()[0]
        for x in range(5):
            run = ExportRun.objects.create(job=job)
            task_uid = str(uuid.uuid4())  # from celery
            export_provider_task = ExportProviderTask.objects.create(run=run)
            ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        runs = job.runs.all()
        tasks = runs[0].provider_tasks.all()[0].tasks.all()
        self.assertEquals(5, len(runs))
        self.assertEquals(1, len(tasks))

    def test_delete_export_run(self, ):
        job = Job.objects.all()[0]
        run = ExportRun.objects.create(job=job)
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = ExportProviderTask.objects.create(run=run)
        ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        runs = job.runs.all()
        self.assertEquals(1, runs.count())
        run.delete()

    @patch('eventkit_cloud.tasks.models.delete_from_s3')
    def test_delete_from_s3(self, del_fun):
        job = Job.objects.all()[0]
        run = ExportRun.objects.create(job=job)
        run_uid = run.uid
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = ExportProviderTask.objects.create(run=run)
        ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        with self.settings(USE_S3=True):
            run.delete()
        del_fun.assert_called_once_with(str(run_uid))


class TestExportTask(TestCase):
    """
    Test cases for ExportTask model
    """

    def setUp(self, ):
        formats = ExportFormat.objects.all()
        Group.objects.create(name='TestDefaultExportExtentGroup')
        user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        Job.objects.create(name='TestJob', description='Test description', user=user, the_geom=the_geom)
        self.job = Job.objects.all()[0]
        # add the formats to the job
        self.job.formats = formats
        self.job.save()
        self.run = ExportRun.objects.create(job=self.job)
        saved_run = ExportRun.objects.get(uid=str(self.run.uid))
        self.assertEqual(self.run, saved_run)
        self.uid = uuid.uuid4()
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        self.task = ExportTask.objects.create(export_provider_task=export_provider_task, uid=self.uid)
        self.assertEqual(self.uid, self.task.uid)
        saved_task = ExportTask.objects.get(uid=self.uid)
        self.assertEqual(saved_task, self.task)

    def test_export_task_result(self, ):
        """
        Test ExportTaskResult.
        """
        task = ExportTask.objects.get(uid=self.uid)
        self.assertEqual(task, self.task)
        self.assertFalse(hasattr(task, 'result'))
        user = self.job.user.id
        result = ExportTaskResult.objects.create(task=task,
                                                 download_url='http://testserver/media/{0}/file.txt'.format(user))
        self.assertIsNotNone(result)
        self.assertTrue(hasattr(task, 'result'))
        self.assertEquals('http://testserver/media/{0}/file.txt'.format(user), result.download_url)
        saved_result = task.result
        self.assertIsNotNone(saved_result)
        self.assertEqual(result, saved_result)
