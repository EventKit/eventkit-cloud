# -*- coding: utf-8 -*-
import datetime
import json
import logging
import os
import uuid
from unittest.mock import MagicMock, Mock, mock_open, patch

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone

from eventkit_cloud.jobs.admin import get_example_from_file
from eventkit_cloud.jobs.models import (
    DatamodelPreset,
    DataProvider,
    DataProviderTask,
    ExportFormat,
    Job,
    MapImageSnapshot,
    Region,
    RegionalJustification,
    RegionalPolicy,
)
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportRunFile,
    ExportTaskException,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
    UserDownload,
)

logger = logging.getLogger(__name__)


def get_file_producing_export_task(run_uid):
    file_name = os.path.join(str(run_uid), "file.txt")
    fptr = FileProducingTaskResult(file=file_name)
    fptr.save(write_file=False)
    return fptr


class TestExportRun(TestCase):
    """
    Test cases for ExportRun model
    """

    fixtures = ("osm_provider.json",)

    @classmethod
    def setUpTestData(cls):
        formats = ExportFormat.objects.all()
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo", is_active=True)
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        provider_task = DataProviderTask.objects.create(provider=DataProvider.objects.get(slug="osm-generic"))
        # add the formats to the provider task
        provider_task.formats.add(*formats)
        job = Job.objects.create(name="TestExportRun", description="Test description", user=user, the_geom=the_geom)
        job.data_provider_tasks.add(provider_task)

    def test_export_run(self):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, status="SUBMITTED", user=job.user)
        saved_run = ExportRun.objects.get(uid=str(run.uid))
        self.assertIsNotNone(saved_run)
        self.assertEqual(run, saved_run)
        self.assertIsNone(run.notified)
        self.assertIsNotNone(run.expiration)

    def test_get_tasks_for_run(self):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        saved_run = ExportRun.objects.get(uid=str(run.uid))
        self.assertEqual(run, saved_run)
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = DataProviderTaskRecord.objects.create(run=run)
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        saved_task = ExportTaskRecord.objects.get(uid=task_uid)
        self.assertIsNotNone(saved_task)
        tasks = run.data_provider_task_records.all()[0].tasks.all()
        self.assertEqual(tasks[0], saved_task)

    def test_get_runs_for_job(self):
        job = Job.objects.first()
        for x in range(5):
            run = ExportRun.objects.create(job=job, user=job.user)
            task_uid = str(uuid.uuid4())  # from celery
            export_provider_task = DataProviderTaskRecord.objects.create(run=run)
            ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        runs = job.runs.all()
        tasks = runs[0].data_provider_task_records.all()[0].tasks.all()
        self.assertEqual(5, len(runs))
        self.assertEqual(1, len(tasks))

    def test_delete_export_run(self):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = DataProviderTaskRecord.objects.create(run=run)
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        runs = job.runs.all()
        self.assertEqual(1, runs.count())
        run.delete()
        job.refresh_from_db()
        runs = job.runs.all()
        self.assertEqual(0, runs.count())

    @patch("eventkit_cloud.tasks.signals.exportrun_delete_exports")
    def test_soft_delete_export_run(self, mock_run_delete_exports):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = DataProviderTaskRecord.objects.create(run=run, status=TaskState.PENDING.value)
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, uid=task_uid, status=TaskState.PENDING.value
        )
        runs = job.runs.all()
        self.assertEqual(1, runs.count())
        run.soft_delete()
        job.refresh_from_db()
        runs = job.runs.all()
        self.assertEqual(1, runs.count())
        run.refresh_from_db()
        self.assertTrue(run.deleted)
        mock_run_delete_exports.assert_called_once()

    @patch("eventkit_cloud.tasks.models.ExportRun.download_data")
    @patch("eventkit_cloud.tasks.models.ExportRun.data_provider_task_records")
    def test_clone(self, data_provider_task_records_mock, mock_download_data):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        data_provider_task_record_mock = Mock(provider=True)
        data_provider_task_records_mock.exclude.return_value = [data_provider_task_record_mock]
        old_run = ExportRun.objects.get(uid=run.uid)
        old_run.started_at = datetime.datetime.now()
        new_run = run.clone()

        self.assertNotEqual(old_run, new_run)
        self.assertNotEqual(old_run.id, new_run.id)
        self.assertNotEqual(old_run.uid, new_run.uid)
        self.assertNotEqual(old_run.expiration, new_run.expiration)
        self.assertNotEqual(old_run.started_at, new_run.started_at)

        self.assertEqual(old_run.job, new_run.job)
        data_provider_task_record_mock.clone.assert_called_once()
        mock_download_data.assert_called_once()

    @patch("eventkit_cloud.tasks.helpers.download_run_directory")
    def test_download_data(self, mock_download_run_directory):
        job = Job.objects.first()
        parent_run = ExportRun.objects.create(job=job, user=job.user)
        run = ExportRun.objects.create(job=job, user=job.user, parent_run=parent_run)

        filename = f"{parent_run.uid}/test.pdf"
        file_model = MapImageSnapshot(file=filename)
        file_model.save(write_file=False)
        data_provider_task_record = DataProviderTaskRecord.objects.create(
            run=run, provider=DataProvider.objects.first(), preview=file_model
        )

        ExportTaskRecord.objects.create(export_provider_task=data_provider_task_record, uid=str(uuid.uuid4()))
        storage_mock = MagicMock(
            get_valid_name=Mock(return_value=filename),
            save=Mock(return_value=filename),
            url=Mock(return_value=filename),
            size=Mock(return_value=20),
        )
        with patch("builtins.open", mock_open(read_data="data")), patch(
            "django.core.files.storage.default_storage._wrapped", storage_mock
        ):
            run.download_data()
        mock_download_run_directory.assert_called_once_with(parent_run, run)

    def test_check_times(self):
        # Create run
        run = ExportRun.objects.create(job=Job.objects.first(), user=User.objects.first())

        # Check that create time is set; and that start and finish times are not
        created_time = run.created_at
        self.assertIsNotNone(created_time)
        self.assertIsNone(run.started_at)
        self.assertIsNone(run.finished_at)

        # Set run state to running and save it
        run.status = TaskState.RUNNING.value
        run.save()

        # Grab start time for comparison later
        started_time = run.started_at

        # Ensure that times match as expected
        self.assertEqual(created_time, run.created_at)
        self.assertIsNotNone(run.started_at)

        # Then set to complete and save
        run.status = TaskState.COMPLETED.value
        run.save()

        # Ensure finished time is set
        self.assertIsNotNone(run.finished_at)
        # Ensure that created times haven't changed
        self.assertEqual(created_time, run.created_at)
        # Verify that start time has not changed
        self.assertEqual(started_time, run.started_at)
        # Ensure that duration matches
        self.assertEqual(run.duration, str(run.finished_at - run.started_at))


class TestRunZipFile(TestCase):
    fixtures = ("osm_provider.json",)

    @classmethod
    def setUpTestData(cls):
        formats = ExportFormat.objects.all()
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo", is_active=True)
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        provider_task = DataProviderTask.objects.create(provider=DataProvider.objects.get(slug="osm-generic"))
        # add the formats to the provider task
        provider_task.formats.add(*formats)
        job = Job.objects.create(name="TestExportRun", description="Test description", user=user, the_geom=the_geom)
        job.data_provider_tasks.add(provider_task)
        ExportRun.objects.create(job=job, status="SUBMITTED", user=job.user)

    def test_run_zip_file(self):
        run = ExportRun.objects.first()
        run_zip_file = RunZipFile.objects.create(run=run)
        saved_run_zip_file = RunZipFile.objects.get(uid=str(run_zip_file.uid))
        self.assertIsNotNone(saved_run_zip_file)
        self.assertEqual(run_zip_file, saved_run_zip_file)

    def test_get_data_provider_task_records(self):
        run = ExportRun.objects.first()
        run_zip_file = RunZipFile.objects.create(run=run)
        saved_run_zip_file = RunZipFile.objects.get(uid=str(run_zip_file.uid))
        self.assertEqual(run_zip_file, saved_run_zip_file)
        data_provider_task_record = DataProviderTaskRecord.objects.create(run=run)
        data_provider_task_records = [data_provider_task_record]
        run_zip_file.data_provider_task_records.set(data_provider_task_records)
        self.assertEqual(run_zip_file.data_provider_task_records, saved_run_zip_file.data_provider_task_records)


class TestExportRunFile(TestCase):
    """
    Test cases for ExportRunFile model
    """

    fixtures = ("osm_provider.json",)

    def test_create_export_run_file(self):
        directory = "test"
        file_name = "test.zip"
        provider = DataProvider.objects.first()
        file_model = ExportRunFile(file=file_name, directory=directory, provider=provider)
        file_model.save(write_file=False)
        self.assertEqual(file_name, file_model.file.name)
        self.assertEqual(directory, file_model.directory)
        self.assertEqual(provider, file_model.provider)


class TestExportTask(TestCase):
    """
    Test cases for ExportTaskRecord model
    """

    @classmethod
    def setUpTestData(cls):
        formats = ExportFormat.objects.all()
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create_user(username="demo", email="demo@demo.com", password="demo", is_active=True)
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        Job.objects.create(name="TestExportTask", description="Test description", user=user, the_geom=the_geom)
        job = Job.objects.first()
        # add the formats to the job
        job.formats = formats
        job.save()

    def setUp(self):
        job = Job.objects.get(name="TestExportTask")
        self.run = ExportRun.objects.create(job=job, user=job.user)
        self.task_uid = uuid.uuid4()
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run)
        self.task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=self.task_uid)
        self.assertEqual(self.task_uid, self.task.uid)
        saved_task = ExportTaskRecord.objects.get(uid=self.task_uid)
        self.assertEqual(saved_task, self.task)

    @patch("eventkit_cloud.tasks.signals.delete_from_s3")
    def test_exportrun_delete_exports(self, delete_from_s3):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        run_uid = run.uid
        task_uid = str(uuid.uuid4())  # from celery
        export_provider_task = DataProviderTaskRecord.objects.create(run=run)
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=task_uid)
        run.delete()
        delete_from_s3.assert_called_once_with(run_uid=str(run_uid))


class TestExportTaskException(TestCase):
    """
    Test cases for ExportTaskException model
    """

    fixtures = ("osm_provider.json", "datamodel_presets.json")

    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(
                username="demo", email="demo@demo.com", password="demo", is_active=True
            )
        self.export_provider = DataProvider.objects.get(slug="osm-generic")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        tags = DatamodelPreset.objects.get(name="hdm").json_tags
        self.assertEqual(259, len(tags))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name="TestJob", description="Test description", user=self.user, the_geom=the_geom, json_tags=tags
        )
        self.run = ExportRun.objects.create(job=self.job, user=self.user)

    def test_clone(self):
        run = ExportRun.objects.first()
        task_uid = str(uuid.uuid4())  # from celery
        data_provider_task_record = DataProviderTaskRecord.objects.create(run=run)
        export_task_record = ExportTaskRecord.objects.create(
            export_provider_task=data_provider_task_record, uid=task_uid
        )
        export_task_exception = ExportTaskException.objects.create(task=export_task_record, exception="TestException")

        old_export_task_exception = ExportTaskException.objects.get(id=export_task_exception.id)
        new_export_task_exception = export_task_exception.clone()

        self.assertNotEqual(old_export_task_exception, new_export_task_exception)
        self.assertNotEqual(old_export_task_exception.id, new_export_task_exception.id)

        self.assertEqual(old_export_task_exception.exception, new_export_task_exception.exception)


class TestDataProviderTaskRecord(TestCase):
    """
    Test cases for DataProviderTaskRecord model
    """

    fixtures = ("osm_provider.json", "datamodel_presets.json")

    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(
                username="demo", email="demo@demo.com", password="demo", is_active=True
            )
        self.export_provider = DataProvider.objects.get(slug="osm-generic")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        tags = DatamodelPreset.objects.get(name="hdm").json_tags
        self.assertEqual(259, len(tags))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name="TestJob", description="Test description", user=self.user, the_geom=the_geom, json_tags=tags
        )
        self.job.feature_save = True
        self.job.feature_pub = True
        self.job.save()
        self.run = ExportRun.objects.create(job=self.job, user=self.user)

    def test_data_provider_task_record(self):
        export_provider_task = DataProviderTaskRecord.objects.create(
            name=self.export_provider.name,
            slug=self.export_provider.slug,
            provider=self.export_provider,
            run=self.run,
            status=TaskState.PENDING.value,
            display=False,
            estimated_size=100.95,
            estimated_duration=5.5,
        )

        self.assertEqual(self.export_provider.name, export_provider_task.name)
        self.assertEqual(self.export_provider.slug, export_provider_task.slug)
        self.assertEqual(self.export_provider, export_provider_task.provider)
        self.assertEqual(self.run, export_provider_task.run)
        self.assertEqual(TaskState.PENDING.value, export_provider_task.status)
        self.assertEqual(False, export_provider_task.display)
        self.assertEqual(100.95, export_provider_task.estimated_size)
        self.assertEqual(5.5, export_provider_task.estimated_duration)

    def test_data_provider_task_record_run_slug(self):
        export_provider_task = DataProviderTaskRecord.objects.create(
            name=self.export_provider.name,
            slug="run",
            provider=self.export_provider,
            run=self.run,
            status=TaskState.PENDING.value,
        )
        self.assertEqual("run", export_provider_task.slug)

    def test_data_provider_task_record_no_slug(self):
        export_provider_task = DataProviderTaskRecord.objects.create(
            name=self.export_provider.name, provider=self.export_provider, run=self.run, status=TaskState.PENDING.value
        )
        self.assertEqual("", export_provider_task.slug)


class TestFileProducingTaskResult(TestCase):
    """
    Test cases for ExportTaskRecord model
    """

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
            name="TestFileProducingTaskResult", description="Test description", user=user, the_geom=the_geom
        )

    def setUp(self):
        self.job = Job.objects.get(name="TestFileProducingTaskResult")
        self.provider = DataProvider.objects.first()
        self.run = ExportRun.objects.create(job=self.job, user=self.job.user)

        self.data_provider_task_record = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider, status=TaskState.PENDING.value
        )

        self.task_uid = uuid.uuid4()
        self.task = ExportTaskRecord.objects.create(
            export_provider_task=self.data_provider_task_record, uid=self.task_uid
        )

    @patch("eventkit_cloud.tasks.signals.exporttaskresult_delete_exports")
    def test_export_task_result(self, mock_etr_delete_exports):
        """
        Test FileProducingTaskResult.
        """
        task = ExportTaskRecord.objects.get(uid=self.task_uid)
        self.assertEqual(task, self.task)

        self.assertIsNone(task.result)
        task.result = get_file_producing_export_task(self.run.uid)
        self.assertIn(task.result.file.name, task.result.download_url)
        task.result.soft_delete()
        task.result.refresh_from_db()
        self.assertTrue(task.result.deleted)
        mock_etr_delete_exports.assert_called_once()

    def test_user_can_download(self):
        """
        Test user_can_download method of FileProducingTaskResult
        """
        self.job.user.last_login = timezone.now()
        self.downloadable = get_file_producing_export_task(self.run.uid)
        self.task.result = self.downloadable
        self.task.save()

        self.run_zip_file = RunZipFile.objects.create(run=self.run, downloadable_file=self.downloadable)
        self.data_provider_task_records = [self.data_provider_task_record]
        self.run_zip_file.data_provider_task_records.set(self.data_provider_task_records)

        self.region = Region.objects.get(name="Africa")
        self.region_two = Region.objects.get(name="Burma")
        policies_example = json.loads(get_example_from_file("examples/policies_example.json"))
        justification_options_example = json.loads(get_example_from_file("examples/justification_options_example.json"))

        self.regional_policy = RegionalPolicy.objects.create(
            name="Test Policy",
            region=self.region,
            policies=policies_example,
            justification_options=justification_options_example,
            policy_title_text="Policy Title",
            policy_cancel_button_text="Cancel Button",
        )

        self.regional_policy.providers.set([self.provider])

        self.regional_policy_two = RegionalPolicy.objects.create(
            name="Test Policy Two",
            region=self.region,
            policies=policies_example,
            justification_options=justification_options_example,
            policy_title_text="Policy Title",
            policy_cancel_button_text="Cancel Button",
        )

        self.regional_policy_two.providers.set([self.provider])

        # Test to make sure the user cannot download without a regional justification.
        user_can_download = self.downloadable.user_can_download(self.job.user)
        self.assertFalse(user_can_download)

        # Create a regional justification for the first policy.
        regional_justification = RegionalJustification.objects.create(
            justification_id=1,
            justification_name="Test Option",
            regional_policy=self.regional_policy,
            user=self.job.user,
        )

        # Test to make sure the user can't download by only agreeing to one policy.
        user_can_download = self.downloadable.user_can_download(self.job.user)
        self.assertFalse(user_can_download)

        RegionalJustification.objects.create(
            justification_id=1,
            justification_name="Test Option",
            regional_policy=self.regional_policy_two,
            user=self.job.user,
        )

        # Test to make sure the user can download after submitting both regional justifications.
        user_can_download = self.downloadable.user_can_download(self.job.user)
        self.assertTrue(user_can_download)

        self.regional_policy_three = RegionalPolicy.objects.create(
            name="Region Two Test Policy",
            region=self.region_two,
            policies=policies_example,
            justification_options=justification_options_example,
            policy_title_text="Policy Title",
            policy_cancel_button_text="Cancel Button",
        )

        self.regional_policy_three.providers.set([self.provider])

        # Test to make sure the user can't download now that a new regional policy was added.
        user_can_download = self.downloadable.user_can_download(self.job.user)
        self.assertFalse(user_can_download)

        RegionalJustification.objects.create(
            justification_id=1,
            justification_name="Test Option",
            regional_policy=self.regional_policy_three,
            user=self.job.user,
        )

        # User has agreed to the new regional policy and should be able to download.
        user_can_download = self.downloadable.user_can_download(self.job.user)
        self.assertTrue(user_can_download)

        # Update the users last login, they should no longer be able to download since they have not agreed again.
        with self.settings(REGIONAL_JUSTIFICATION_TIMEOUT_DAYS=None):
            self.job.user.last_login = timezone.now()
            user_can_download = self.downloadable.user_can_download(self.job.user)
            self.assertFalse(user_can_download)

        with self.settings(REGIONAL_JUSTIFICATION_TIMEOUT_DAYS=1):
            # Justification was created within the last day.
            user_can_download = self.downloadable.user_can_download(self.job.user)
            self.assertTrue(user_can_download)

            # Subtract a day from the created_at date.
            regional_justification.created_at = regional_justification.created_at - datetime.timedelta(days=1)
            regional_justification.save()
            user_can_download = self.downloadable.user_can_download(self.job.user)
            self.assertFalse(user_can_download)

    @patch("eventkit_cloud.tasks.models.DataProviderTaskRecord.tasks")
    def test_clone(self, export_task_records_mock):
        job = Job.objects.first()
        run = ExportRun.objects.create(job=job, user=job.user)
        data_provider_task_record = DataProviderTaskRecord.objects.create(
            run=run, status=TaskState.PENDING.value, provider=DataProvider.objects.get(slug="osm-generic")
        )
        run.data_provider_task_records.add(data_provider_task_record)
        # new_run would be a cloned run.
        new_run = ExportRun.objects.create(job=job, user=job.user)
        export_task_record_mock = Mock()
        export_task_records_mock.all().__iter__.return_value = [export_task_record_mock]

        old_dptr = DataProviderTaskRecord.objects.get(uid=data_provider_task_record.uid)
        new_dptr = data_provider_task_record.clone(new_run)

        self.assertNotEqual(old_dptr, new_dptr)
        self.assertNotEqual(old_dptr.id, new_dptr.id)
        self.assertNotEqual(old_dptr.uid, new_dptr.uid)
        self.assertNotEqual(old_dptr.run, new_dptr.run)

        self.assertEqual(old_dptr.provider, new_dptr.provider)

        export_task_record_mock.clone.assert_called_once()


class TestUserDownload(TestCase):
    """
    Test cases for UserDownload model
    """

    fixtures = ("osm_provider.json", "datamodel_presets.json")

    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(
                username="demo", email="demo@demo.com", password="demo", is_active=True
            )

    def test_clone(self):
        uid = "1234"
        downloadable = get_file_producing_export_task(uid)
        user_download = UserDownload.objects.create(user=self.user, downloadable=downloadable)

        old_user_download = UserDownload.objects.get(uid=user_download.uid)
        new_user_download = user_download.clone()

        self.assertNotEqual(old_user_download, new_user_download)
        self.assertNotEqual(old_user_download.id, new_user_download.id)
        self.assertNotEqual(old_user_download.uid, new_user_download.uid)

        self.assertEqual(old_user_download.user, new_user_download.user)
        self.assertEqual(old_user_download.downloadable, new_user_download.downloadable)
