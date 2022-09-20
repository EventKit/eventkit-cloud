# -*- coding: utf-8 -*-
import logging
import os
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.db.utils import DatabaseError
from django.test import TestCase

from eventkit_cloud.jobs.models import DataProvider, DataProviderTask, ExportFormat, Job, Region
from eventkit_cloud.tasks.task_builders import TaskChainBuilder, create_export_task_record
from eventkit_cloud.tasks.task_factory import TaskFactory, create_run

logger = logging.getLogger(__name__)


class TestTaskBuilder(TestCase):
    fixtures = ("osm_provider", "test_providers")

    def setUp(self):
        self.path = os.path.dirname(os.path.realpath(__file__))
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)

        self.job = Job.objects.create(name="TestJob", description="Test description", user=self.user, the_geom=the_geom)
        self.region, created = Region.objects.get_or_create(name="Africa", the_geom=the_geom)
        self.job.region = self.region
        self.job.save()

    @patch("eventkit_cloud.tasks.task_builders.get_estimates_task")
    def build_tasks(self, provider, formats, mock_get_estimates_task):
        provider_task = DataProviderTask.objects.create(provider=provider, job=self.job)
        provider_task.formats.set(formats)
        run = self.job.runs.get(uid=create_run(job=self.job))
        TaskChainBuilder().build_tasks(
            TaskFactory().type_task_map.get(provider.slug),
            provider_task_uid=provider_task.uid,
            run=run,
            worker="some_worker",
        )
        mock_get_estimates_task.apply_async.assert_called_once()
        return run

    def test_build_osm_task(self):
        export_format = ExportFormat.objects.get(slug="gpkg")
        run = self.build_tasks(DataProvider.objects.get(slug="osm"), [export_format])
        self.assertEqual(run.data_provider_task_records.first().tasks.first().name, f"{export_format.name}")

    def test_build_wms_task(self):
        export_format = ExportFormat.objects.get(slug="gpkg")
        run = self.build_tasks(DataProvider.objects.get(slug="wms"), [export_format])
        self.assertEqual(run.data_provider_task_records.first().tasks.first().name, f"{export_format.name}")

    def test_build_wcs_task(self):
        export_format = ExportFormat.objects.get(slug="gtiff")
        run = self.build_tasks(DataProvider.objects.get(slug="wcs"), [export_format])
        self.assertEqual(run.data_provider_task_records.first().tasks.first().name, f"{export_format.name}")

    @patch("eventkit_cloud.tasks.task_builders.ExportTaskRecord")
    def test_create_export_task_record(self, mock_export_task):

        task_name = "TaskName"
        export_provider_task_name = "ExportProviderTaskName"
        worker = "Worker"

        expected_result = MagicMock(display=False)
        mock_export_task.objects.get_or_create.return_value = (expected_result, True)
        task_result = create_export_task_record(
            task_name=task_name, export_provider_task=export_provider_task_name, worker=worker, display=False
        )

        self.assertEqual(task_result, expected_result)
        mock_export_task.objects.get_or_create.assert_called_with(
            export_provider_task="ExportProviderTaskName",
            name=task_name,
            defaults={"status": "PENDING", "name": task_name, "worker": "Worker", "display": False},
        )

        expected_result = MagicMock(display=True)
        mock_export_task.objects.get_or_create.return_value = (expected_result, True)

        task_result = create_export_task_record(
            task_name=task_name, export_provider_task=export_provider_task_name, worker=worker, display=True
        )
        self.assertEqual(task_result, expected_result)
        mock_export_task.objects.get_or_create.assert_called_with(
            export_provider_task="ExportProviderTaskName",
            name=task_name,
            defaults={"status": "PENDING", "name": task_name, "worker": "Worker", "display": True},
        )

        mock_export_task.objects.get_or_create.side_effect = DatabaseError("SomeError")
        with self.assertRaises(DatabaseError):
            create_export_task_record(
                task_name=task_name, export_provider_task=export_provider_task_name, worker=worker, display=True
            )
