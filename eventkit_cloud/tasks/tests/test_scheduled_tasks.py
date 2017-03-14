# -*- coding: utf-8 -*-
import logging

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone
from django.conf import settings
from django.template.loader import get_template

from eventkit_cloud.jobs.models import Job
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.scheduled_tasks import expire_runs, send_warning_email
from mock import patch

logger = logging.getLogger(__name__)

# Marked for deletion
# class TestPurgeUnpublishedExportsTask(TestCase):
#     def setUp(self, ):
#         Group.objects.create(name='TestDefaultExportExtentGroup')
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
        Group.objects.create(name='TestExpireRunsTaskGroup')
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
            site_name = getattr(settings, "SITE_NAME", "cloud.eventkit.dev")
            expected_url = 'http://{0}/exports/{1}'.format(site_name, job.uid)
            send_email.assert_any_call(now_time + timezone.timedelta(days=1), expected_url, job.user.email)
            send_email.assert_any_call(now_time + timezone.timedelta(days=6), expected_url, job.user.email)
            self.assertEqual(3, ExportRun.objects.all().count())


class TestEmailNotifications(TestCase):

    @patch('eventkit_cloud.tasks.scheduled_tasks.EmailMultiAlternatives')
    def test_send_warning_email(self, alternatives):
        now = timezone.now()
        site_name = getattr(settings, "SITE_NAME", "cloud.eventkit.dev")
        url = 'http://{0}/exports/1234'.format(site_name)
        addr = 'test@test.com'

        ctx = {'url': url, 'date': str(now)}

        text = get_template('email/expiration_warning.txt').render(ctx)
        html = get_template('email/expiration_warning.html').render(ctx)
        self.assertIsNotNone(html)
        self.assertIsNotNone(text)
        send_warning_email(now, url, addr)
        alternatives.assert_called_once_with("Your Eventkit Data Pack is set to expire.",
                                                 text, to=[addr], from_email='Eventkit Team <eventkit.team@gmail.com>')
        alternatives().send.assert_called_once()



