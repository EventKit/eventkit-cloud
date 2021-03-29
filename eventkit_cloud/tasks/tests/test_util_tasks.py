# -*- coding: utf-8 -*-

from django.test import TestCase
from unittest.mock import patch

from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, Polygon, Point, LineString
from django.contrib.auth.models import User
from eventkit_cloud.jobs.models import Job, DataProvider
from eventkit_cloud.tasks.models import ExportRun

from eventkit_cloud.tasks.util_tasks import rerun_data_provider_records


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
        self.run = ExportRun.objects.create(job=self.job, user=self.user)

    @patch("eventkit_cloud.tasks.task_factory.create_run")
    @patch("eventkit_cloud.tasks.util_tasks.shutil")
    @patch("eventkit_cloud.tasks.util_tasks.os")
    @patch("eventkit_cloud.tasks.util_tasks.pick_up_run_task")
    def test_rerun_data_provider_records(self, pickup_mock, os_mock, shutil_mock, create_run_mock):
        expected_slugs = ["osm"]
        new_run_uid, run_zip_file_slug_sets = create_run_mock.return_value = (
            ExportRun.objects.create(job=self.job, user=self.user).uid,
            expected_slugs,
        )
        expected_user_details = {"username": "demo", "is_superuser": False, "is_staff": False}
        rerun_data_provider_records.run(
            run_uid=self.run.uid,
            user_id=self.user.id,
            user_details=expected_user_details,
            data_provider_slugs=expected_slugs,
        )

        create_run_mock.assert_called_with(job_uid=self.job.uid, user=self.user, clone=True)

        os_mock.path.exists.return_value = True
        shutil_mock.rmtree.assert_called_once()

        pickup_mock.apply_async.assert_called_with(
            kwargs={
                "run_uid": new_run_uid,
                "user_details": expected_user_details,
                "data_provider_slugs": expected_slugs,
                "run_zip_file_slug_sets": expected_slugs,
            },
            queue="runs",
            routing_key="runs",
        )
