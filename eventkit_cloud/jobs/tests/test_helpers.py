import datetime
import json
import uuid
from unittest.mock import patch

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone

from eventkit_cloud.jobs.admin import get_example_from_file
from eventkit_cloud.jobs.helpers import get_valid_regional_justification
from eventkit_cloud.jobs.models import DataProvider, Job, Region, RegionalJustification, RegionalPolicy
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
)


class TestRegionalJustificationHelpers(TestCase):

    fixtures = ("osm_provider.json",)

    @classmethod
    def setUpTestData(cls):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo", is_active=True)
        # bbox that intersects with both Africa and Burma so that both regions are covered in tests.
        bbox = Polygon.from_bbox((23.378906, -3.074695, 110.830078, 44.087585))
        the_geom = GEOSGeometry(bbox, srid=4326)
        Job.objects.create(
            name="TestRegionalJustificationHelpers", description="Test description", user=user, the_geom=the_geom
        )

    def setUp(self):
        self.job = Job.objects.get(name="TestRegionalJustificationHelpers")
        self.provider = DataProvider.objects.first()
        self.run = ExportRun.objects.create(job=self.job, user=self.job.user)

        self.data_provider_task_record = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider, status=TaskState.PENDING.value
        )

        self.task_uid = uuid.uuid4()
        self.task = ExportTaskRecord.objects.create(
            export_provider_task=self.data_provider_task_record, uid=self.task_uid
        )

    def test_get_valid_regional_justification(self):
        with self.settings(REGIONAL_JUSTIFICATION_TIMEOUT_DAYS=None):
            self.job.user.last_login = timezone.now()
            downloadable = FileProducingTaskResult(file=f"{self.run.uid}/file.txt")
            downloadable.save(write_file=False)
            self.task.result = downloadable
            self.task.save()

            self.run_zip_file = RunZipFile.objects.create(run=self.run, downloadable_file=downloadable)
            self.data_provider_task_records = [self.data_provider_task_record]
            self.run_zip_file.data_provider_task_records.set(self.data_provider_task_records)

            self.region = Region.objects.get(name="Africa")
            policies_example = json.loads(get_example_from_file("examples/policies_example.json"))
            justification_options_example = json.loads(
                get_example_from_file("examples/justification_options_example.json")
            )

            self.regional_policy = RegionalPolicy.objects.create(
                name="Test Policy",
                region=self.region,
                policies=policies_example,
                justification_options=justification_options_example,
                policy_title_text="Policy Title",
                policy_cancel_button_text="Cancel Button",
            )

            self.regional_policy.providers.set([self.provider])

            active_regional_justification = get_valid_regional_justification(self.regional_policy, self.job.user)
            self.assertEqual(active_regional_justification, None)

            regional_justification = RegionalJustification.objects.create(
                justification_id=1,
                justification_name="Test Option",
                regional_policy=self.regional_policy,
                user=self.job.user,
            )

            active_regional_justification = get_valid_regional_justification(self.regional_policy, self.job.user)
            self.assertEqual(active_regional_justification, regional_justification)

            # Update the users last login, the previous regional justification should no longer be active.
            self.job.user.last_login = timezone.now()
            active_regional_justification = get_valid_regional_justification(self.regional_policy, self.job.user)
            self.assertEqual(active_regional_justification, None)

        with self.settings(REGIONAL_JUSTIFICATION_TIMEOUT_DAYS=1):
            # Justification was created within the last day.
            active_regional_justification = get_valid_regional_justification(self.regional_policy, self.job.user)
            self.assertEqual(active_regional_justification, regional_justification)

            # Subtract a day from the created_at date.
            regional_justification.created_at = regional_justification.created_at - datetime.timedelta(days=1)
            regional_justification.save()
            active_regional_justification = get_valid_regional_justification(self.regional_policy, self.job.user)
            self.assertEqual(active_regional_justification, None)
