# -*- coding: utf-8 -*-
import logging
import os

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.db import DatabaseError
from mock import patch, Mock, MagicMock


import uuid
from ..task_factory import TaskFactory, create_run, get_invalid_licenses
from ..models import ExportRun
from ...jobs.models import Job, Region, ProviderTask, ExportProvider, License, UserLicense

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
        provider = ExportProvider.objects.get(slug='osm')
        self.license = License.objects.create(slug='odbl-test', name='test_osm_license')
        provider.license = self.license
        provider.save()
        UserLicense.objects.create(license=self.license, user=self.user)
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

    @patch('eventkit_cloud.tasks.task_factory.get_invalid_licenses')
    @patch('eventkit_cloud.tasks.task_factory.finalize_export_provider_task')
    @patch('eventkit_cloud.tasks.task_factory.create_task')
    @patch('eventkit_cloud.tasks.task_factory.chain')
    def test_task_factory(self, task_factory_chain, create_task, finalize_task, mock_invalid_licenses):
        mock_invalid_licenses.return_value = []
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
        create_task.assert_called()
        finalize_task.s.assert_called()

        # Test that run is prevented and deleted if the user has not agreed to the licenses.
        mock_invalid_licenses.return_value = ['invalid-licenses']
        with self.assertRaises(Exception):
            task_factory.parse_tasks(run_uid=run_uid, worker=worker)
            run = ExportRun.objects.filter(uid=run_uid).first()
            self.assertIsNone(run)

    def test_get_invalid_licenses(self):
        # The license should not be returned if the user has agreed to it.
        expected_invalid_licenses = []
        invalid_licenses = get_invalid_licenses(self.job)
        self.assertEquals(invalid_licenses, expected_invalid_licenses)

        # A license should be returned if the user has not agreed to it.
        UserLicense.objects.get(license=self.license, user=self.user).delete()
        expected_invalid_licenses = [self.license.name]
        invalid_licenses = get_invalid_licenses(self.job)
        self.assertEquals(invalid_licenses, expected_invalid_licenses)

        UserLicense.objects.create(license=self.license, user=self.user)

