# -*- coding: utf-8 -*-
import copy
import logging
import uuid
from collections import OrderedDict
from unittest.mock import Mock, call, patch

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.template.loader import get_template
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone
from notifications.models import Notification

from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus, Job
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.helpers import list_to_dict
from eventkit_cloud.tasks.models import DataProviderTaskRecord, ExportRun, ExportTaskRecord
from eventkit_cloud.tasks.scheduled_tasks import (
    check_provider_availability_task,
    clean_up_queues_task,
    clean_up_stuck_tasks,
    expire_runs_task,
    get_celery_task_details,
    get_celery_tasks_scale_by_run,
    get_celery_tasks_scale_by_task,
    order_celery_tasks,
    scale_by_runs,
    scale_by_tasks,
    scale_celery_task,
    scale_default_tasks,
    send_warning_email,
)
from eventkit_cloud.utils.services.check_result import CheckResult

logger = logging.getLogger(__name__)


class TestExpireRunsTask(TestCase):
    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username="test", email="test@test.com", password="test")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        created_at = timezone.now() - timezone.timedelta(days=7)
        Job.objects.create(
            name="TestJob",
            created_at=created_at,
            published=False,
            description="Test description",
            user=self.user,
            the_geom=the_geom,
        )

    @patch("eventkit_cloud.tasks.scheduled_tasks.send_warning_email")
    def test_expire_runs(self, send_email):
        job = Job.objects.all()[0]
        now_time = timezone.now()
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=8))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=6))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=1))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time - timezone.timedelta(hours=5))
        with patch("eventkit_cloud.tasks.scheduled_tasks.timezone.now") as mock_time:
            mock_time.return_value = now_time

            self.assertEqual("Expire Runs", expire_runs_task.name)
            expire_runs_task.run()
            site_url = getattr(settings, "SITE_URL", "host.docker.internal")
            expected_url = "{0}/status/{1}".format(site_url.rstrip("/"), job.uid)
            send_email.assert_any_call(
                date=now_time + timezone.timedelta(days=1), url=expected_url, addr=job.user.email, job_name=job.name
            )
            send_email.assert_any_call(
                date=now_time + timezone.timedelta(days=6), url=expected_url, addr=job.user.email, job_name=job.name
            )
            self.assertEqual(3, ExportRun.objects.filter(deleted=False).count())
            self.assertEqual(1, ExportRun.objects.filter(deleted=True).count())
            self.assertEqual(2, Notification.objects.all().count())


class TestCleanUpStuckTasks(TestCase):
    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username="test", email="test@test.com", password="test")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        created_at = timezone.now() - timezone.timedelta(days=7)
        Job.objects.create(
            name="TestJob",
            created_at=created_at,
            published=False,
            description="Test description",
            user=self.user,
            the_geom=the_geom,
        )

    @patch("eventkit_cloud.tasks.scheduled_tasks.ExportTaskRecord")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_scale_client")
    @patch("eventkit_cloud.tasks.scheduled_tasks.kill_workers")
    @override_settings(TASK_TIMEOUT=30)
    def test_clean_up_stuck_tasks(self, kill_workers_mock, get_scale_client_mock, mock_etr):
        mock_scale_client = Mock()
        get_scale_client_mock.return_value = mock_scale_client, "app_name"
        job = Job.objects.all()[0]

        run_uid = str(uuid.uuid4())
        run2_uid = str(uuid.uuid4())
        run = ExportRun.objects.create(job=job, user=job.user, uid=run_uid)
        run2 = ExportRun.objects.create(job=job, user=job.user, uid=run2_uid)
        export_provider_task = DataProviderTaskRecord.objects.create(run=run)
        export_provider_task2 = DataProviderTaskRecord.objects.create(run=run2)

        [uid1, uid2, uid3] = [str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())]
        etr1 = ExportTaskRecord.objects.create(export_provider_task=export_provider_task, name="etr1", uid=uid1)
        etr2 = ExportTaskRecord.objects.create(export_provider_task=export_provider_task, name="etr2", uid=uid2)
        etr3 = ExportTaskRecord.objects.create(export_provider_task=export_provider_task2, name="etr3", uid=uid3)
        mock_etr.objects.prefetch_related().select_related().filter.return_value = [etr1, etr2, etr3]

        clean_up_stuck_tasks.run()
        self.assertEqual(etr1.status, TaskState.CANCELED.value)
        self.assertEqual(etr2.status, TaskState.CANCELED.value)
        self.assertEqual(etr3.status, TaskState.CANCELED.value)
        self.assertEqual(export_provider_task.status, TaskState.PENDING.value)
        self.assertEqual(run.status, TaskState.SUBMITTED.value)
        # kill the run(s) that the stuck tasks were part of
        kill_workers_mock.assert_called_once_with([run_uid, run_uid, run2_uid], mock_scale_client)


@override_settings(PCF_SCALING=False)
class TestScaleCeleryTask(TestCase):
    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username="test", email="test@test.com", password="test")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        created_at = timezone.now() - timezone.timedelta(days=7)
        Job.objects.create(
            name="TestJob",
            created_at=created_at,
            published=False,
            description="Test description",
            user=self.user,
            the_geom=the_geom,
        )

    @patch("eventkit_cloud.tasks.scheduled_tasks.scale_by_tasks")
    @patch("eventkit_cloud.tasks.scheduled_tasks.scale_by_runs")
    def test_scale_celery_task(self, mock_scale_by_runs, mock_scale_by_tasks):
        with self.settings(CELERY_SCALE_BY_RUN=True):
            scale_celery_task(16000)
            mock_scale_by_runs.assert_called_once_with(16000)

        with self.settings(CELERY_SCALE_BY_RUN=False):
            scale_celery_task(16000)
            celery_tasks = get_celery_tasks_scale_by_task()
            mock_scale_by_tasks.assert_called_once_with(celery_tasks, 16000)

    @patch("eventkit_cloud.tasks.scheduled_tasks.scale_default_tasks")
    @patch("eventkit_cloud.tasks.scheduled_tasks.pick_up_run_task")
    @patch("eventkit_cloud.tasks.scheduled_tasks.run_task_command")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_celery_task_details")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_scale_client")
    def test_scale_by_runs(
        self,
        mock_get_scale_client,
        mock_get_celery_task_details,
        mock_run_task_command,
        mock_pickup,
        mock_scale_default_tasks,
    ):
        mock_scale_client = Mock()
        mock_get_scale_client.return_value = mock_scale_client, "app_name"
        example_memory_used = 2048
        mock_scale_client.get_running_tasks_memory.return_value = example_memory_used
        mock_scale_client.get_running_tasks.return_value = {"resources": [], "pagination": {"total_results": 0}}
        example_memory_used = 2048
        example_disk_used = 3072
        celery_task_details = {"task_counts": {"celery": 1}, "memory": example_memory_used, "disk": example_disk_used}
        mock_get_celery_task_details.return_value = celery_task_details

        # Test zero runs.
        scale_by_runs(12000)
        mock_get_scale_client.assert_called_once()
        mock_run_task_command.assert_not_called()

        job = Job.objects.all()[0]
        run = ExportRun.objects.create(
            job=job, user=job.user, expiration=timezone.now() + timezone.timedelta(days=8), status="SUBMITTED"
        )

        # If running_tasks_memory > max_tasks_memory do not scale.
        scale_by_runs(8000)
        mock_run_task_command.assert_not_called()

        # Assert that a task was run.
        scale_by_runs(12000)

        expected_user_details = {
            "user_id": self.user.id,
            "username": self.user.username,
            "superuser": self.user.is_superuser,
            "staff": self.user.is_staff,
            "email": self.user.email,
            "fullname": self.user.get_full_name(),
            "ip": None,
        }

        mock_pickup.s.assert_called_once_with(
            run_uid=str(run.uid), session_token=None, user_details=expected_user_details
        )
        mock_pickup.s().apply_async.assert_called_once_with(queue=str(run.uid), routing_key=str(run.uid))
        mock_run_task_command.assert_called_once()

    @patch("eventkit_cloud.tasks.scheduled_tasks.kill_workers")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_all_rabbitmq_objects")
    @patch("eventkit_cloud.tasks.scheduled_tasks.run_task_command")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_scale_client")
    def test_scale_default_tasks(
        self, mock_get_scale_client, mock_run_task_command, mock_get_all_rabbitmq_objects, mock_kill_workers
    ):
        mock_scale_client = Mock()
        mock_get_scale_client.return_value = mock_scale_client, "test_app"
        celery_tasks = get_celery_tasks_scale_by_run()
        celery_run_task = copy.deepcopy(celery_tasks["celery"])

        # Test too many tasks already running.
        mock_scale_client.get_running_tasks_memory.return_value = 2048
        mock_scale_client.get_running_tasks.return_value = {"pagination": {"total_results": 3}}
        mock_get_all_rabbitmq_objects.return_value = {"celery": {"messages": 1}}
        scale_default_tasks(mock_scale_client, "test_app", celery_tasks)
        mock_run_task_command.assert_not_called()

        # Test no messages in queue.
        mock_get_all_rabbitmq_objects.return_value = {"celery": {"messages": 0}}
        mock_scale_client.get_running_tasks.return_value = {"pagination": {"total_results": 1}}
        scale_default_tasks(mock_scale_client, "test_app", celery_tasks)
        mock_run_task_command.assert_not_called()
        mock_kill_workers.assert_called_once()

        # Test scaling up with a message, assuming we're under the running task limit.
        mock_get_all_rabbitmq_objects.return_value = {"celery": {"messages": 1}}
        mock_scale_client.get_running_tasks.return_value = {"pagination": {"total_results": 1}}
        scale_default_tasks(mock_scale_client, "test_app", celery_tasks)
        mock_run_task_command.assert_called_with(mock_scale_client, "test_app", "celery", celery_run_task)

    @patch("eventkit_cloud.tasks.scheduled_tasks.get_all_rabbitmq_objects")
    @patch("eventkit_cloud.tasks.scheduled_tasks.order_celery_tasks")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_celery_task_details")
    @patch("eventkit_cloud.tasks.scheduled_tasks.get_scale_client")
    def test_scale_by_tasks(
        self,
        mock_get_scale_client,
        mock_get_celery_task_details,
        mock_order_celery_tasks,
        mock_get_all_rabbitmq_objects,
    ):
        mock_scale_client = Mock()
        mock_get_scale_client.return_value = mock_scale_client, "app_name"

        # Run until queues are empty.
        example_memory_used = 2048
        example_disk_used = 3072
        mock_scale_client.get_running_tasks_memory.return_value = example_memory_used
        mock_scale_client.get_running_tasks.return_value = {"pagination": {"total_results": 1}}
        example_queues = [{"name": "celery", "messages": 2}]
        empty_queues = [{"name": "celery", "messages": 0}]
        mock_get_all_rabbitmq_objects.side_effect = [example_queues, empty_queues]
        celery_task_details = {"task_counts": {"celery": 1}, "memory": example_memory_used, "disk": example_disk_used}
        mock_get_celery_task_details.return_value = celery_task_details
        ordered_celery_tasks = OrderedDict(
            {
                "queue1": {
                    "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n worker@%h -Q queue1 ",
                    "disk": 2048,
                    "memory": 2048,
                },
                "celery": {
                    "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n celery@%h -Q celery ",
                    "disk": 2048,
                    "memory": 3072,
                    "limit": 2,
                },
            }
        )
        mock_get_scale_client.return_value = mock_scale_client, "app_name"

        mock_order_celery_tasks.return_value = ordered_celery_tasks
        celery_tasks = get_celery_tasks_scale_by_task()
        scale_by_tasks(celery_tasks, 8000)
        mock_scale_client.run_task.assert_called_once()
        mock_scale_client.reset_mock()
        mock_get_all_rabbitmq_objects.side_effect = None

        # Run until memory is exhausted.
        mock_get_all_rabbitmq_objects.return_value = example_queues
        over_memory = 9000
        mock_scale_client.get_running_tasks_memory.return_value = over_memory
        scale_by_tasks(celery_tasks, 8000)
        mock_scale_client.run_task.assert_called_once()
        mock_scale_client.reset_mock()

        # Don't run if not enough memory.
        mock_get_all_rabbitmq_objects.return_value = example_queues
        mock_get_celery_task_details.return_value = celery_task_details
        scale_by_tasks(celery_tasks, 1000)
        mock_scale_client.run_task.assert_not_called()
        mock_scale_client.reset_mock()

        # # Don't run if task limit is reached.
        mock_scale_client.get_running_tasks.return_value = {"pagination": {"total_results": 3}}
        scale_by_tasks(celery_tasks, 8000)
        mock_scale_client.run_task.assert_not_called()
        mock_scale_client.reset_mock()

    @patch("eventkit_cloud.tasks.scheduled_tasks.ScaleClient")
    def test_get_celery_task_details(self, mock_scale_client):
        # Figure out how to test the two differnt environment variable options
        example_app_name = "example_app_name"
        celery_tasks = ["celery", "group.priority"]
        pcf_task_resources = [{"name": "celery", "memory_in_mb": 2048, "disk_in_mb": 3072}]
        mock_scale_client.get_running_tasks.return_value = {
            "pagination": {"total_results": 1},
            "resources": pcf_task_resources,
        }
        expected_value = {"task_counts": {"celery": 1, "group.priority": 0}, "memory": 2048, "disk": 3072}

        returned_value = get_celery_task_details(mock_scale_client, example_app_name, celery_tasks)
        self.assertEquals(expected_value, returned_value)

    def test_order_celery_tasks(self):
        celery_tasks = {"celery": {}, "group.priority": {}}
        task_counts = {"celery": 1, "group.priority": 0}
        expected_ordered_tasks = OrderedDict({"group.priority": {}, "celery": {}})
        returned_ordered_tasks = order_celery_tasks(celery_tasks, task_counts)
        self.assertEquals(expected_ordered_tasks, returned_ordered_tasks)

    def test_list_to_dict(self):
        example_list = [{"name": "a", "prop": 1}, {"name": "b", "prop": 2}]
        expected_value = {"a": {"name": "a", "prop": 1}, "b": {"name": "b", "prop": 2}}
        returned_value = list_to_dict(example_list, "name")
        self.assertEquals(expected_value, returned_value)


class TestCheckProviderAvailabilityTask(TestCase):
    def test_check_provider_availability(self):
        perform_provider_check_mock = Mock()

        perform_provider_check_mock.return_value = CheckResult.SUCCESS.value
        DataProvider.check_status = perform_provider_check_mock
        first_provider = DataProvider.objects.create(slug="first_provider", name="first_provider")
        DataProvider.objects.create(slug="second_provider", name="second_provider")
        DataProviderStatus.objects.create(related_provider=first_provider)

        check_provider_availability_task()

        perform_provider_check_mock.assert_has_calls([call(), call()])
        statuses = DataProviderStatus.objects.filter(related_provider=first_provider)
        self.assertEqual(len(statuses), 2)
        most_recent_first_provider_status = statuses.last()
        self.assertEqual(most_recent_first_provider_status.status, CheckResult.SUCCESS.value["status"])
        self.assertEqual(most_recent_first_provider_status.status_type, CheckResult.SUCCESS.value["type"])
        self.assertEqual(most_recent_first_provider_status.message, CheckResult.SUCCESS.value["message"])


class TestEmailNotifications(TestCase):
    @patch("eventkit_cloud.tasks.scheduled_tasks.EmailMultiAlternatives")
    def test_send_warning_email(self, alternatives):
        now = timezone.now()
        site_url = getattr(settings, "SITE_URL", "http://host.docker.internal")
        url = "{0}/status/1234".format(site_url.rstrip("/"))
        addr = "test@test.com"
        job_name = "job"

        ctx = {"url": url, "date": str(now), "job_name": job_name}

        with self.settings(DEFAULT_FROM_EMAIL="example@eventkit.test"):
            text = get_template("email/expiration_warning.txt").render(ctx)
            html = get_template("email/expiration_warning.html").render(ctx)
            self.assertIsNotNone(html)
            self.assertIsNotNone(text)
            send_warning_email(date=now, url=url, addr=addr, job_name=job_name)
            alternatives.assert_called_once_with(
                "Your EventKit DataPack is set to expire.", text, to=[addr], from_email="example@eventkit.test"
            )
            alternatives().send.assert_called_once()


class TestCleanUpRabbit(TestCase):
    @patch("eventkit_cloud.tasks.scheduled_tasks.delete_rabbit_objects")
    def test_clean_up_queues_task(self, mock_delete_rabbit_objects):
        example_api_url = "https://test/api"
        with self.settings(CELERY_BROKER_API_URL=example_api_url):
            clean_up_queues_task()
            mock_delete_rabbit_objects.assert_called_once_with(example_api_url, rabbit_classes=["queues", "exchanges"])
