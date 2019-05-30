# -*- coding: utf-8 -*-

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.template.loader import get_template
from django.test import TestCase
from django.utils import timezone

from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus
from eventkit_cloud.jobs.models import Job
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.scheduled_tasks import expire_runs, send_warning_email, check_provider_availability, \
    clean_up_queues, get_all_rabbitmq_objects
from eventkit_cloud.utils.provider_check import CheckResults

import json
import logging
from mock import patch, call
import requests_mock

from notifications.models import Notification

logger = logging.getLogger(__name__)


class TestExpireRunsTask(TestCase):
    def setUp(self,):
        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create(username='test', email='test@test.com', password='test')
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        created_at = timezone.now() - timezone.timedelta(days=7)
        Job.objects.create(name="TestJob", created_at=created_at, published=False,
                                 description='Test description', user=self.user, the_geom=the_geom)


    @patch('eventkit_cloud.tasks.scheduled_tasks.send_warning_email')
    def test_expire_runs(self, send_email):
        job = Job.objects.all()[0]
        now_time = timezone.now()
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=8))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=6))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time + timezone.timedelta(days=1))
        ExportRun.objects.create(job=job, user=job.user, expiration=now_time - timezone.timedelta(hours=5))

        with patch('eventkit_cloud.tasks.scheduled_tasks.timezone.now') as mock_time:

            mock_time.return_value = now_time

            self.assertEqual('Expire Runs', expire_runs.name)
            expire_runs.run()
            site_url = getattr(settings, "SITE_URL", "cloud.eventkit.test")
            expected_url = '{0}/status/{1}'.format(site_url.rstrip('/'), job.uid)
            send_email.assert_any_call(date=now_time + timezone.timedelta(days=1), url=expected_url,
                                       addr=job.user.email, job_name=job.name)
            send_email.assert_any_call(date=now_time + timezone.timedelta(days=6), url=expected_url,
                                       addr=job.user.email, job_name=job.name)
            self.assertEqual(3, ExportRun.objects.all().count())
            self.assertEqual(0, Notification.objects.all().count())


class TestCheckProviderAvailabilityTask(TestCase):

    @patch('eventkit_cloud.utils.provider_check.perform_provider_check')
    def test_check_provider_availability(self, perform_provider_check_mock):
        perform_provider_check_mock.return_value = json.dumps(CheckResults.SUCCESS.value[0])
        first_provider = DataProvider.objects.create(slug='first_provider', name='first_provider')
        second_provider = DataProvider.objects.create(slug='second_provider', name='second_provider')
        DataProviderStatus.objects.create(related_provider=first_provider)

        check_provider_availability()

        perform_provider_check_mock.assert_has_calls([call(first_provider, None), call(second_provider, None)])
        statuses = DataProviderStatus.objects.filter(related_provider=first_provider)
        self.assertEqual(len(statuses), 2)
        most_recent_first_provider_status = statuses.order_by('-id')[0]
        self.assertEqual(most_recent_first_provider_status.status, CheckResults.SUCCESS.value[0]['status'])
        self.assertEqual(most_recent_first_provider_status.status_type, CheckResults.SUCCESS.value[0]['type'])
        self.assertEqual(most_recent_first_provider_status.message, CheckResults.SUCCESS.value[0]['message'])


class TestEmailNotifications(TestCase):

    @patch('eventkit_cloud.tasks.scheduled_tasks.EmailMultiAlternatives')
    def test_send_warning_email(self, alternatives):
        now = timezone.now()
        site_url = getattr(settings, "SITE_URL", "http://cloud.eventkit.test")
        url = '{0}/status/1234'.format(site_url.rstrip('/'))
        addr = 'test@test.com'
        job_name = "job"

        ctx = {'url': url, 'date': str(now), 'job_name': job_name}

        text = get_template('email/expiration_warning.txt').render(ctx)
        html = get_template('email/expiration_warning.html').render(ctx)
        self.assertIsNotNone(html)
        self.assertIsNotNone(text)
        send_warning_email(date=now, url=url, addr=addr, job_name=job_name)
        alternatives.assert_called_once_with("Your EventKit DataPack is set to expire.",
                                                 text, to=[addr], from_email='Eventkit Team <eventkit.team@gmail.com>')
        alternatives().send.assert_called_once()


class TestCleanUpRabbit(TestCase):

    @patch('eventkit_cloud.tasks.scheduled_tasks.app')
    @patch('eventkit_cloud.tasks.scheduled_tasks.get_all_rabbitmq_objects')
    def test_clean_up_queues(self, mock_get_all_rabbitmq_objects, mock_celery_app):

        expected_queues = [{"name": "queue1"}, {"name": "queue2"}]
        expected_exchanges = [{"name": "exchange1"}, {"name": "exchange2"}]
        mock_get_all_rabbitmq_objects.side_effect = [expected_queues, expected_exchanges]
        clean_up_queues()
        mock_celery_app.connection.__enter__().channel().queue_delete('queue1', if_empty=True, if_unused=True),
        mock_celery_app.connection.__enter__().channel().queue_delete('queue2', if_empty=True, if_unused=True),
        mock_celery_app.connection.__enter__().channel().exchange_delete('exchange1', if_empty=True, if_unused=True),
        mock_celery_app.connection.__enter__().channel().exchange_delete('exchange2', if_empty=True, if_unused=True),

        with self.assertRaises(Exception):
            mock_celery_app.connection.__enter__().channel().queue_delete().return_value = Exception()
            clean_up_queues()

        with self.assertRaises(Exception):
            mock_celery_app.connection.__enter__().channel().exchange_delete().return_value = Exception()
            clean_up_queues()

    @requests_mock.Mocker()
    def test_get_all_rabbitmq_objects(self, requests_mocker):
        example_api = "http://example/api/"
        queues = "queues"
        expected_queues = [{"name": "queue1"}, {"name": "queue2"}]
        requests_mocker.get(example_api + queues, text=json.dumps(expected_queues))
        result = get_all_rabbitmq_objects(example_api, queues)
        self.assertEqual(result, expected_queues)

        with self.assertRaises(Exception):
            get_all_rabbitmq_objects(example_api, "WRONG")
