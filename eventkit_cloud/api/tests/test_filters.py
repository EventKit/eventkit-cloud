# -*- coding: utf-8 -*-
import logging

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon

from rest_framework.authtoken.models import Token
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from eventkit_cloud.jobs.models import ExportFormat, Job, DataProvider, DataProviderTask

logger = logging.getLogger(__name__)


class TestJobFilter(APITestCase):
    fixtures = ('insert_provider_types.json', 'osm_provider.json',)

    def __init__(self, *args, **kwargs):
        self.user1 = None
        self.user2 = None
        self.job1 = None
        self.job2 = None
        super(TestJobFilter, self).__init__(*args, **kwargs)

    def setUp(self, ):
        Group.objects.create(name='TestDefaultExportExtentGroup')
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.user1 = User.objects.create_user(
            username='demo1', email='demo@demo.com', password='demo'
        )
        self.user2 = User.objects.create_user(
            username='demo2', email='demo@demo.com', password='demo'
        )
        self.job1 = Job.objects.create(name='TestJob1', description='Test description', user=self.user1,
                                       the_geom=the_geom)
        self.job2 = Job.objects.create(name='TestJob2', description='Test description', user=self.user2,
                                       the_geom=the_geom)
        export_format = ExportFormat.objects.get(slug='shp')
        export_provider = DataProvider.objects.get(slug='osm-generic')
        provider_task = DataProviderTask.objects.create(provider=export_provider)
        provider_task.formats.add(export_format)
        self.job1.provider_tasks.add(provider_task)
        self.job2.provider_tasks.add(provider_task)
        token = Token.objects.create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

    def test_filterset_no_user(self, ):
        url = reverse('api:jobs-list')
        url += '?start=2015-01-01&end=2030-08-01'
        response = self.client.get(url)
        self.assertEquals(1, len(response.data))

    def test_filterset_with_user(self, ):
        url = reverse('api:jobs-list')
        url += '?start=2015-01-01&end=2030-08-01&user=demo1'
        response = self.client.get(url)
        self.assertEquals(1, len(response.data))
