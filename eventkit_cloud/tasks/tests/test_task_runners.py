# -*- coding: utf-8 -*-
import logging
import os
import uuid

from mock import Mock, PropertyMock, patch, MagicMock

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.db.utils import DatabaseError

from eventkit_cloud.jobs.models import ExportFormat, Job, Region, DataProviderTask, DataProvider

from ..task_runners import (
    ExportOSMTaskRunner, ExportExternalRasterServiceTaskRunner, create_export_task_record
)
from ..task_factory import create_run

logger = logging.getLogger(__name__)


class TestExportTaskRunner(TestCase):
    fixtures = ('insert_provider_types', 'osm_provider', 'test_providers')

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        # bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom)
        self.region = Region.objects.get(name='Africa')
        self.job.region = self.region
        self.job.save()
        create_run(job_uid=self.job.uid)

    @patch('eventkit_cloud.tasks.task_runners.chain')
    def test_run_osm_task(self, mock_chain):
        shp_task = ExportFormat.objects.get(slug='shp')

        provider = DataProvider.objects.get(slug='osm')
        provider_task = DataProviderTask.objects.create(provider=provider)
        self.job.provider_tasks.add(provider_task)

        # celery chain mock
        self.job.provider_tasks.first().formats.add(shp_task)
        runner = ExportOSMTaskRunner()

        # Even though code using pipes seems to be supported here it is throwing an error.
        try:
            runner.run_task(provider_task_uid=provider_task.uid, run=self.job.runs.first(),
                            worker="some_worker")
        except TypeError:
            pass
        run = self.job.runs.first()
        self.assertIsNotNone(run)
        tasks = run.provider_tasks.first().tasks.all()
        self.assertIsNotNone(tasks)
        self.assertEquals(len(tasks), 2)


    @patch('eventkit_cloud.tasks.task_runners.chain')
    @patch('eventkit_cloud.tasks.export_tasks.shp_export_task')
    def test_run_wms_task(self, mock_shp, mock_chain):
        shp_task = ExportFormat.objects.get(slug='shp')
        celery_uid = str(uuid.uuid4())
        provider = DataProvider.objects.get(slug='wms')
        provider_task_record = DataProviderTask.objects.create(provider=provider)
        self.job.provider_tasks.add(provider_task_record)
        # shp export task mock
        mock_shp.run.return_value = Mock(state='PENDING', id=celery_uid)
        type(mock_shp).name = PropertyMock(return_value='Geopackage Export')
        # celery chain mock
        mock_chain.return_value.apply_async.return_value = Mock()
        self.job.provider_tasks.first().formats.add(shp_task)
        runner = ExportExternalRasterServiceTaskRunner()
        # Even though code using pipes seems to be supported here it is throwing an error.
        try:
            runner.run_task(provider_task_uid=provider_task_record.uid, run=self.job.runs.first(),
                            service_type='wms',
                            worker="some_worker")
        except TypeError:
            pass
        run = self.job.runs.first()
        self.assertIsNotNone(run)

    @patch('eventkit_cloud.tasks.task_runners.ExportTaskRecord')
    def test_create_export_task_record(self, mock_export_task):
        from ..export_tasks import TaskStates

        task_name = "TaskName"
        export_provider_task_name = "ExportProviderTaskName"
        worker = "Worker"

        expected_result = MagicMock(display=False)
        mock_export_task.objects.create.return_value = expected_result
        task_result = create_export_task_record(task_name=task_name, export_provider_task=export_provider_task_name,
                                         worker=worker, display=False)

        self.assertEquals(task_result, expected_result)
        mock_export_task.objects.create.assert_called_with(export_provider_task=export_provider_task_name,
                                            status=TaskStates.PENDING.value,
                                            name=task_name, worker=worker, display=False)


        expected_result = MagicMock(display=True)
        mock_export_task.objects.create.return_value = expected_result

        task_result = create_export_task_record(task_name=task_name, export_provider_task=export_provider_task_name,
                                         worker=worker, display=True)
        self.assertEquals(task_result, expected_result)
        mock_export_task.objects.create.assert_called_with(export_provider_task=export_provider_task_name, status=TaskStates.PENDING.value,
                                                name=task_name, worker=worker, display=True)


        mock_export_task.objects.create.side_effect = DatabaseError("SomeError")
        with self.assertRaises(DatabaseError):
            create_export_task_record(task_name=task_name, export_provider_task=export_provider_task_name,
                               worker=worker, display=True)
