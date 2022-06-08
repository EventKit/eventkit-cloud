# -*- coding: utf-8 -*-

from unittest.mock import Mock, patch

from django.contrib.auth.models import User
from django.contrib.gis.geos import (
    GeometryCollection,
    GEOSGeometry,
    LineString,
    Point,
    Polygon,
)
from django.test import TestCase

from eventkit_cloud.jobs.models import DataProvider, Job
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.util_tasks import (
    kill_worker,
    kill_workers,
    rerun_data_provider_records,
)
from eventkit_cloud.utils.scaling.exceptions import (
    MultipleTaskTerminationErrors,
    TaskTerminationError,
)


class TestUtilTasks(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo")
        original_selection = GeometryCollection(Point(1, 1), LineString((5.625, 48.458), (0.878, 44.339)))
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name="TestJob",
            event="Test Activation",
            description="Test description",
            user=self.user,
            the_geom=the_geom,
            original_selection=original_selection,
        )
        self.provider = DataProvider.objects.first()
        self.parent_run = ExportRun.objects.create(job=self.job, user=self.user, is_cloning=False)
        self.run = ExportRun.objects.create(job=self.job, user=self.user, is_cloning=True, parent_run=self.parent_run)

    @patch("eventkit_cloud.tasks.task_factory.create_run")
    @patch("eventkit_cloud.tasks.export_tasks.pick_up_run_task")
    def test_rerun_data_provider_records(self, mock_pickup, create_run_mock):
        expected_slugs = ["osm"]
        create_run_mock.return_value = ExportRun.objects.create(job=self.job, user=self.user).uid

        rerun_data_provider_records(
            run_uid=self.run.uid,
            user_id=self.user.id,
            data_provider_slugs=expected_slugs,
        )

        create_run_mock.assert_called_with(job=self.job, user=self.user, clone=self.parent_run, download_data=False)

        with self.settings(CELERY_SCALE_BY_RUN=False):
            rerun_data_provider_records(run_uid=self.run.uid, user_id=self.user.id, data_provider_slugs=expected_slugs)

    @patch("eventkit_cloud.tasks.util_tasks.shutdown_celery_workers")
    def test_kill_worker_softkill(self, shutdown_celery_mock):
        example_task_name = "example_task"
        async_mock = Mock()
        shutdown_celery_mock.s.return_value = async_mock
        mock_scale_client = Mock()
        kill_worker(example_task_name, mock_scale_client, 2)
        expected_queue_name = f"{example_task_name}.priority"
        async_mock.apply_async.assert_called_once_with(queue=expected_queue_name, routing_key=expected_queue_name)
        mock_scale_client.terminate_task.assert_called_once_with(example_task_name)

    @patch("eventkit_cloud.tasks.util_tasks.shutdown_celery_workers")
    def test_kill_workers_raises_exception(self, shutdown_celery_mock):
        example_task1, example_task2, example_task3 = ["example_task1", "example_task2", "example_task3"]
        tasks = [example_task1, example_task2, example_task3]
        async_mock = Mock()
        shutdown_celery_mock.s.return_value = async_mock
        mock_scale_client = Mock()
        mock_scale_client.terminate_task.side_effect = [
            TaskTerminationError(task_name=example_task1),
            TaskTerminationError(task_name=example_task2),
            TaskTerminationError(task_name=example_task3),
        ]

        with self.assertRaises(MultipleTaskTerminationErrors):
            kill_workers(tasks, mock_scale_client, 2)
