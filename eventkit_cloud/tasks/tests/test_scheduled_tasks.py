# -*- coding: utf-8 -*-
import logging
import mock
import json

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone
from django.conf import settings
from django.template.loader import get_template

from eventkit_cloud.jobs.models import Job
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.scheduled_tasks import expire_runs, send_warning_email, check_provider_availability
from eventkit_cloud.utils.provider_check import CheckResults
from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus
from mock import patch, call

logger = logging.getLogger(__name__)

# Marked for deletion
# class TestPurgeUnpublishedExportsTask(TestCase):
#     def setUp(self, ):
#         Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
#         self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
#         # bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
#         bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
#         the_geom = GEOSGeometry(bbox, srid=4326)
#         created_at = timezone.now() - timezone.timedelta(hours=50)  # 50 hours ago
#         Job.objects.create(name='TestJob', created_at=created_at, published=False,
#                            description='Test description', user=self.user, the_geom=the_geom)
#         Job.objects.create(name='TestJob', created_at=created_at, published=True,
#                            description='Test description', user=self.user, the_geom=the_geom)
#
#     def test_purge_export_jobs(self, ):
#         jobs = Job.objects.all()
#         self.assertEquals(2, jobs.count())
#         task = PurgeUnpublishedExportsTask()
#         self.assertEquals('Purge Unpublished Exports', task.name)
#         task.run()
#         jobs = Job.objects.all()
#         self.assertEquals(1, jobs.count())
#         self.assertTrue(jobs[0].published)


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

            self.assertEquals('Expire Runs', expire_runs.name)
            expire_runs.run()
            site_url = getattr(settings, "SITE_URL", "cloud.eventkit.test")
            expected_url = '{0}/status/{1}'.format(site_url.rstrip('/'), job.uid)
            send_email.assert_any_call(date=now_time + timezone.timedelta(days=1), url=expected_url,
                                       addr=job.user.email, job_name=job.name)
            send_email.assert_any_call(date=now_time + timezone.timedelta(days=6), url=expected_url,
                                       addr=job.user.email, job_name=job.name)
            self.assertEqual(3, ExportRun.objects.all().count())


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



