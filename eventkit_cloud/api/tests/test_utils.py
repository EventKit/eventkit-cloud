# -*- coding: utf-8 -*-

from unittest.mock import patch

from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, Polygon, Point, LineString
from django.test import TestCase
import datetime

from eventkit_cloud.api.utils import get_date_list
from eventkit_cloud.jobs.models import Job, DataProvider
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.util_tasks import rerun_data_provider_records


class TestUtilTasks(TestCase):
    # def setUp(self):
    #     self.user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo")
    #     original_selection = GeometryCollection(Point(1, 1), LineString((5.625, 48.458), (0.878, 44.339)))
    #     extents = (-3.9, 16.1, 7.0, 27.6)
    #     bbox = Polygon.from_bbox(extents)
    #     the_geom = GEOSGeometry(bbox, srid=4326)
    #     self.job = Job.objects.create(
    #         name="TestJob",
    #         event="Test Activation",
    #         description="Test description",
    #         user=self.user,
    #         the_geom=the_geom,
    #         original_selection=original_selection,
    #     )
    #     self.provider = DataProvider.objects.first()
    #     self.run = ExportRun.objects.create(job=self.job, user=self.user)

    def test_get_date_list(self):
        start_date = datetime.date(2021, 9, 10)
        end_date = datetime.date(2021, 9, 15)

        date_list = get_date_list(start_date, end_date)
        self.assertEqual(date_list, len(5))