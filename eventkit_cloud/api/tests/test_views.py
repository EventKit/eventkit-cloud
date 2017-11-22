# -*- coding: utf-8 -*-
from __future__ import absolute_import
import json
import logging
import os
from datetime import datetime,timedelta
import uuid

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

from django.conf import settings
from django.utils.translation import ugettext as _
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, Polygon, Point, LineString
from django.core import serializers
from ..pagination import LinkHeaderPagination
from ..views import get_models, get_provider_task, ExportRunViewSet
from ...tasks.task_factory import InvalidLicense
from ...tasks.export_tasks import TaskStates
from ...jobs.models import ExportFormat, Job, DataProvider, \
    DataProviderType, DataProviderTask, bbox_to_geojson, DatamodelPreset, License
from ...tasks.models import ExportRun, ExportTaskRecord, DataProviderTaskRecord
from mock import patch, Mock


logger = logging.getLogger(__name__)


class TestJobViewSet(APITestCase):
    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json',)

    def __init__(self, *args, **kwargs):
        super(TestJobViewSet, self).__init__(*args, **kwargs)
        self.path = None
        self.group = None
        self.user = None
        self.job = None
        self.client = None
        self.config = None
        self.tags = None

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group = Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create_user(
            username='demo', email='demo@demo.com', password='demo'
        )
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        original_selection = GeometryCollection(Point(1,1), LineString((5.625, 48.458),(0.878, 44.339)))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', event='Test Activation', description='Test description',
                                      user=self.user, the_geom=the_geom, original_selection=original_selection)

        formats = ExportFormat.objects.all()
        provider = DataProvider.objects.first()
        provider_task = DataProviderTask.objects.create(provider=provider)
        provider_task.formats.add(*formats)

        self.job.provider_tasks.add(provider_task)

        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        # create a test config
        hdm_presets = DatamodelPreset.objects.get(name='hdm')
        self.job.preset = hdm_presets
        self.job.save()

        self.tags = [
            {
                "name": "Telecommunication office",
                "key": "office", "value": "telecommunication",
                "geom": ["point", "polygon"],
            },
            {
                "name": "Radio or TV Studio",
                "key": "amenity", "value": "studio",
                "geom": ["point", "polygon"],
            },
            {
                "name": "Telecommunication antenna",
                "key": "man_made", "value": "tower",
                "geom": ["point", "polygon"],
            },
            {
                "name": "Telecommunication company retail office",
                "key": "office", "value": "telecommunication",
                "geom": ["point", "polygon"],
            }
        ]

    def test_list(self,):
        expected = '/api/jobs'
        url = reverse('api:jobs-list')
        self.assertEquals(expected, url)

    def test_make_job_with_export_providers(self,):
        """tests job creation with export providers"""
        export_providers = DataProvider.objects.all()
        export_providers_start_len = len(export_providers)
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]

        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection': bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'test', 'formats': formats}],
            'export_providers': [{'name': 'test', 'level_from': 0, 'level_to': 1,
                                  'url': 'http://coolproviderurl.to',
                                  'preview_url': 'http://coolproviderurl.to'}],
            'user': serializers.serialize('json', [self.user]),
            'preset': self.job.preset.id
        }
        url = reverse('api:jobs-list')
        response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        export_providers = DataProvider.objects.all()
        self.assertEqual(len(export_providers), export_providers_start_len + 1)
        response = json.loads(response.content)
        self.assertEqual(response['exports'][0]['provider'], 'test')

        request_data['export_providers'][0]['name'] = 'test 2'
        # should be idempotent
        response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')

        export_providers = DataProvider.objects.all()
        self.assertEqual(len(export_providers), export_providers_start_len + 1)

    def test_get_job_detail(self,):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)
        data = {"uid": str(self.job.uid),
                "name": "TestJob",
                "url": 'http://testserver{0}'.format(url),
                "description": "Test Description",
                "exports": [{'provider': 'OpenStreetMap Data (Generic)',
                             'formats': [
                                 {"uid": "8611792d-3d99-4c8f-a213-787bc7f3066",
                                  "url": "http://testserver/api/formats/gpkg",
                                  "name": "Geopackage",
                                  "description": "Geopackage"}]}],
                "created_at": "2015-05-21T19:46:37.163749Z",
                "updated_at": "2015-05-21T19:46:47.207111Z",
                "status": "SUCCESS"}
        response = self.client.get(url)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        self.assertEquals(response.data['uid'], data['uid'])
        self.assertEquals(response.data['url'], data['url'])
        self.assertEqual(response.data['exports'][0]['formats'][0]['url'], data['exports'][0]['formats'][0]['url'])

    def test_get_job_detail_no_permissions(self,):
        user = User.objects.create_user(
            username='other_user', email='other_user@demo.com', password='demo'
        )
        token = Token.objects.create(user=user)
        # reset the client credentials to the new user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        self.assertIsNotNone(response.data["errors"][0]["detail"])

    def test_delete_job(self,):
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.delete(url)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEquals(response['Content-Length'], '0')
        self.assertEquals(response['Content-Language'], 'en')

    def test_create_zipfile(self):
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}],
            'preset': self.job.preset.id,
            'published': True,
            'tags': self.tags,
            'include_zipfile': True
        }
        url = reverse('api:jobs-list')
        response = self.client.post(url, request_data, format='json')
        msg = 'status_code {} != {}: {}'.format(200, response.status_code, response.content)
        self.assertEqual(202, response.status_code, msg)
        job_uid = response.data['uid']

        job = Job.objects.get(uid=job_uid)
        self.assertEqual(job.include_zipfile, True)

    @patch('eventkit_cloud.api.views.pick_up_run_task')
    @patch('eventkit_cloud.api.views.create_run')
    def test_create_job_success(self, create_run_mock, pickup_mock):
        create_run_mock.return_value = "some_run_uid"
        url = reverse('api:jobs-list')
        logger.debug(url)
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}],
            'preset': self.job.preset.id,
            'published': True,
            'tags': self.tags,
            'original_selection': {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [1, 1]
                        }
                    },
                    {
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [5.625, 48.458],
                                [0.878, 44.339]
                            ]
                        }
                    }
                ]
            }
        }
        response = self.client.post(url, request_data, format='json')
        job_uid = response.data['uid']
        # test that the mock methods get called.
        create_run_mock.assert_called_once_with(job_uid=job_uid, user=self.user)
        expected_user_details = {'username': u'demo', 'is_superuser': False, 'is_staff': False}
        pickup_mock.delay.assert_called_once_with(run_uid="some_run_uid", user_details=expected_user_details)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant response content

        self.assertEqual(response.data['exports'][0]['formats'][0]['slug'],
                         request_data['provider_tasks'][0]['formats'][0])
        self.assertEqual(response.data['exports'][0]['formats'][1]['slug'],
                         request_data['provider_tasks'][0]['formats'][1])
        self.assertEqual(response.data['name'], request_data['name'])
        self.assertEqual(response.data['description'], request_data['description'])
        self.assertEqual(response.data['original_selection'], request_data['original_selection'])
        self.assertTrue(response.data['published'])

        # check we have the correct tags
        job = Job.objects.get(uid=job_uid)
        self.assertIsNotNone(job.preset.json_tags)
        self.assertEqual(259, len(job.preset.json_tags))

    @patch('eventkit_cloud.api.views.pick_up_run_task')
    @patch('eventkit_cloud.api.views.create_run')
    def test_create_job_with_config_success(self, create_run_mock, pickup_mock):
        create_run_mock.return_value = "some_run_uid"
        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}],
            'preset': self.job.preset.id,
            'transform': '',
            'translation': ''
        }
        response = self.client.post(url, request_data, format='json')
        job_uid = response.data['uid']
        # test that the mock methods get called.
        create_run_mock.assert_called_once_with(job_uid=job_uid, user=self.user)
        expected_user_details = {'username': u'demo', 'is_superuser': False, 'is_staff': False}
        pickup_mock.delay.assert_called_once_with(run_uid="some_run_uid", user_details=expected_user_details)

        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant response content
        self.assertEqual(response.data['exports'][0]['formats'][0]['slug'],
                         request_data['provider_tasks'][0]['formats'][0])
        self.assertEqual(response.data['exports'][0]['formats'][1]['slug'],
                         request_data['provider_tasks'][0]['formats'][1])
        self.assertEqual(response.data['name'], request_data['name'])
        self.assertEqual(response.data['description'], request_data['description'])
        self.assertFalse(response.data['published'])
        self.assertEqual(259, len(self.job.preset.json_tags))

    @patch('eventkit_cloud.api.views.pick_up_run_task')
    @patch('eventkit_cloud.api.views.create_run')
    def test_create_job_with_tags(self, create_run_mock, pickup_mock):
        create_run_mock.return_value = "some_run_uid"

        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection': bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}],
            'preset': self.job.preset.id,
            'transform': '',
            'translate': '',
            'tags': self.tags
        }
        response = self.client.post(url, request_data, format='json')
        job_uid = response.data['uid']
        # test that the mock methods get called.
        create_run_mock.assert_called_once_with(job_uid=job_uid, user=self.user)
        expected_user_details = {'username': u'demo', 'is_superuser': False, 'is_staff': False}
        pickup_mock.delay.assert_called_once_with(run_uid="some_run_uid", user_details=expected_user_details)

        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant response content
        self.assertEqual(response.data['exports'][0]['formats'][0]['slug'],
                         request_data['provider_tasks'][0]['formats'][0])
        self.assertEqual(response.data['exports'][0]['formats'][1]['slug'],
                         request_data['provider_tasks'][0]['formats'][1])
        self.assertEqual(response.data['name'], request_data['name'])
        self.assertEqual(response.data['description'], request_data['description'])

    def test_invalid_selection(self,):
        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  {},
            'preset': self.job.preset.id,
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}]
        }
        response = self.client.post(url, request_data, format='json')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals('no geometry', response.data['errors'][0]['title'])

    def test_empty_string_param(self,):
        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        request_data = {
            'name': 'TestJob',
            'description': '',  # empty
            'event': 'Test Activation',
            'selection': bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'formats': formats
        }
        response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertIsNotNone(response.data['errors'][0]['title'])

    def test_string_too_long_param(self,):
        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        name = 'x' * 300
        request_data = {
            'name': name,
            'description': 'Test description',
            'event': 'Test event',
            'selection': bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}]
        }
        response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals('ValidationError', response.data['errors'][0]['title'])
        self.assertEquals('name: Ensure this field has no more than 100 characters.', response.data['errors'][0]['detail'])


    def test_missing_format_param(self,):
        url = reverse('api:jobs-list')
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection': bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)'}]  # 'formats': formats}]# missing
        }
        response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertIsNotNone(response.data['errors'][0]['title'])

    def test_invalid_format_param(self,):
        url = reverse('api:jobs-list')
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': ''}]  # invalid
        }
        response = self.client.post(url, request_data, format='json')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertIsNotNone(response.data.get('errors')[0]['title'])

    def test_no_matching_format_slug(self,):
        url = reverse('api:jobs-list')
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-3.9, 16.1, 7.0, 27.6]),
            'provider_tasks': [
                {'provider': 'OpenStreetMap Data (Generic)', 'formats': ['broken-format-one', 'broken-format-two']}]
        }
        response = self.client.post(url, request_data, format='json')

        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertIsNotNone(response.data["errors"][0]["detail"])

    def test_extents_too_large(self,):
        url = reverse('api:jobs-list')
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        # job outside any region
        request_data = {
            'name': 'TestJob',
            'description': 'Test description',
            'event': 'Test Activation',
            'selection':  bbox_to_geojson([-180, -90, 180, 90]),
            'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}]
        }

        with self.settings(JOB_MAX_EXTENT=100000):
            response = self.client.post(url, data=json.dumps(request_data), content_type='application/json; version=1.0')

        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals('invalid_extents', response.data['errors'][0]['title'])


    def test_patch(self):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        request_data = {"published": False}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)
        self.assertIsNotNone(response.data['published'])
        self.assertTrue(response.data['success'])

        request_data = {"featured": True}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)
        self.assertIsNotNone(response.data['featured'])
        self.assertTrue(response.data['success'])

        request_data = {"featured": True, "published" : False}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)
        self.assertIsNotNone(response.data['featured'])
        self.assertIsNotNone(response.data['published'])
        self.assertTrue(response.data['success'])

class TestBBoxSearch(APITestCase):
    """
    Test cases for testing bounding box searches.
    """

    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json')

    def __init__(self, *args, **kwargs):
        super(TestBBoxSearch, self).__init__(*args, **kwargs)
        self.user = None
        self.client = None

    def setUp(self,):
        url = reverse('api:jobs-list')
        # create dummy user
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create_user(
            username='demo', email='demo@demo.com', password='demo'
        )
        # setup token authentication
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        # pull out the formats
        formats = [export_format.slug for export_format in ExportFormat.objects.all()]
        # create test jobs
        extents = [(-3.9, 16.1, 7.0, 27.6), (36.90, 13.54, 48.52, 20.24),
                   (-71.79, -49.57, -67.14, -46.16), (-61.27, -6.49, -56.20, -2.25),
                   (-11.61, 32.07, -6.42, 36.31), (-10.66, 5.81, -2.45, 11.83),
                   (47.26, 34.58, 52.92, 39.15), (90.00, 11.28, 95.74, 17.02)]
        for extent in extents:
            request_data = {
                'name': 'TestJob',
                'description': 'Test description',
                'event': 'Test Activation',
                'selection': bbox_to_geojson(extent),
                'provider_tasks': [{'provider': 'OpenStreetMap Data (Generic)', 'formats': formats}]
            }
            response = self.client.post(url, request_data, format='json')
            self.assertEquals(status.HTTP_202_ACCEPTED, response.status_code, response.content)
        self.assertEquals(8, len(Job.objects.all()))
        LinkHeaderPagination.page_size = 2

    def test_bbox_search_success(self,):
        url = reverse('api:jobs-list')
        extent = (-79.5, -16.16, 7.40, 52.44)
        param = 'bbox={0},{1},{2},{3}'.format(extent[0], extent[1], extent[2], extent[3])
        response = self.client.get('{0}?{1}'.format(url, param))
        self.assertEquals(status.HTTP_206_PARTIAL_CONTENT, response.status_code)
        self.assertEquals(2, len(response.data))  # 8 jobs in total but response is paginated

    def test_list_jobs_no_bbox(self,):
        url = reverse('api:jobs-list')
        response = self.client.get(url)
        self.assertEquals(status.HTTP_206_PARTIAL_CONTENT, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals(response['Link'], '<http://testserver/api/jobs?page=2>; rel="next"')
        self.assertEquals(2, len(response.data))  # 8 jobs in total but response is paginated

    def test_bbox_search_missing_params(self,):
        url = reverse('api:jobs-list')
        param = 'bbox='  # missing params
        response = self.client.get('{0}?{1}'.format(url, param))
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals('missing_bbox_parameter', response.data['errors']['id'])

    def test_bbox_missing_coord(self,):
        url = reverse('api:jobs-list')
        extent = (-79.5, -16.16, 7.40)  # one missing
        param = 'bbox={0},{1},{2}'.format(extent[0], extent[1], extent[2])
        response = self.client.get('{0}?{1}'.format(url, param))
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')
        self.assertEquals('missing_bbox_parameter', response.data['errors']['id'])


class TestPagination(APITestCase):
    pass


class TestExportRunViewSet(APITestCase):
    """
    Test cases for ExportRunViewSet
    """
    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json',)

    def __init__(self, *args, **kwargs):
        super(TestExportRunViewSet, self).__init__(*args, **kwargs)
        self.user = None
        self.client = None
        self.job = None
        self.job_uid = None
        self.export_run = None
        self.run_uid = None

    def setUp(self,):
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom)
        formats = ExportFormat.objects.all()
        provider = DataProvider.objects.first()
        provider_task = DataProviderTask.objects.create(provider=provider)
        provider_task.formats.add(*formats)

        self.job.provider_tasks.add(provider_task)
        self.job.save()
        self.job_uid = str(self.job.uid)
        self.export_run = ExportRun.objects.create(job=self.job, user=self.user)
        self.run_uid = str(self.export_run.uid)

    def test_patch(self):
        url = reverse('api:runs-detail', args=[self.export_run.uid])

        today  = datetime.today()
        max_days = int(getattr(settings, 'MAX_EXPORTRUN_EXPIRATION_DAYS', 30))
        ok_expiration = today + timedelta(max_days-1)
        request_data = {"expiration": ok_expiration.isoformat()}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)
        self.assertIsNotNone(response.data['expiration'])
        self.assertTrue(response.data['success'])

        not_ok_expiration = ok_expiration  - timedelta(1)
        request_data = {"expiration": not_ok_expiration.isoformat()}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertFalse(response.data['success'])

        not_ok_expiration = today + timedelta(max_days+1)
        request_data = {"expiration": not_ok_expiration.isoformat()}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertFalse(response.data['success'])

        request_data = {"exploration": ok_expiration.isoformat()}
        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)

        run = ExportRun.objects.get(uid=self.export_run.uid)
        self.assertEquals(ok_expiration,run.expiration.replace(tzinfo=None))


    def test_delete_run(self,):
        url = reverse('api:runs-detail', args=[self.export_run.uid])
        response = self.client.delete(url)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEquals(response['Content-Length'], '0')
        self.assertEquals(response['Content-Language'], 'en')

    @patch('eventkit_cloud.api.serializers.get_presigned_url')
    def test_zipfile_url_s3(self, get_url):
        self.export_run.zipfile_url = 'http://cool.s3.url.com/foo.zip'
        self.export_run.save()
        get_url.return_value = self.export_run.zipfile_url
        url = reverse('api:runs-detail', args=[self.run_uid])

        with self.settings(USE_S3=False):
            response = self.client.get(url)
            result = response.data

            self.assertEquals(
                self.export_run.zipfile_url,
                result[0]['zipfile_url']
            )
            get_url.assert_not_called()

        with self.settings(USE_S3=True):
            response = self.client.get(url)
            result = response.data

            self.assertEquals(
                self.export_run.zipfile_url,
                result[0]['zipfile_url']
            )
            get_url.assert_called_with(download_url=self.export_run.zipfile_url)

    def test_retrieve_run(self,):
        expected = '/api/runs/{0}'.format(self.run_uid)

        url = reverse('api:runs-detail', args=[self.run_uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        result = response.data
        # make sure we get the correct uid back out
        self.assertEquals(self.run_uid, result[0].get('uid'))

    @patch('eventkit_cloud.api.views.ExportRunViewSet.validate_licenses')
    def test_retrieve_run_invalid_license(self, mock_validate_licenses):
        expected = '/api/runs/{0}'.format(self.run_uid)
        mock_validate_licenses.side_effect = (InvalidLicense('no license'),)
        url = reverse('api:runs-detail', args=[self.run_uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        result = response.data
        self.assertTrue("InvalidLicense" in result[0].get('detail'))
        self.assertEquals(response.status_code, 400)

    @patch('eventkit_cloud.api.views.get_invalid_licenses')
    def test_validate_licenses(self, mock_invalid_licenses):
        queryset = Mock()
        run = Mock(job=Mock(user=Mock(username='username')))
        queryset.all.return_value = [run]
        mock_invalid_licenses.return_value = ['license']
        with self.assertRaises(InvalidLicense):
            ExportRunViewSet.validate_licenses(queryset)

        mock_invalid_licenses.return_value = []
        self.assertTrue(ExportRunViewSet.validate_licenses(queryset))



    def test_retrieve_run_no_permissions(self,):
        user = User.objects.create_user(
            username='other_user', email='other_user@demo.com', password='demo'
        )
        token = Token.objects.create(user=user)
        # reset the client credentials to the new user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        expected = '/api/runs/{0}'.format(self.run_uid)
        url = reverse('api:runs-detail', args=[self.run_uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        # self.assertEquals(response.data, {'detail': 'Not found.'})
        self.assertEquals(response.data, [])

    def test_list_runs(self,):
        expected = '/api/runs'
        url = reverse('api:runs-list')
        self.assertEquals(expected, url)
        query = '{0}?job_uid={1}'.format(url, self.job.uid)
        response = self.client.get(query)
        self.assertIsNotNone(response)
        result = response.data
        # make sure we get the correct uid back out
        self.assertEquals(1, len(result))
        self.assertEquals(self.run_uid, result[0].get('uid'))

    @patch('eventkit_cloud.api.views.ExportRunViewSet.validate_licenses')
    def test_list_runs_invalid_license(self, mock_validate_licenses):
        from ...tasks.task_factory import InvalidLicense
        expected = '/api/runs'
        url = reverse('api:runs-list')
        mock_validate_licenses.side_effect = (InvalidLicense('no license'),)
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        result = response.data
        self.assertTrue("InvalidLicense" in result[0].get('detail'))
        self.assertEquals(response.status_code, 400)

    def test_list_runs_no_permissions(self,):
        user = User.objects.create_user(
            username='other_user', email='other_user@demo.com', password='demo'
        )
        token = Token.objects.create(user=user)
        # reset the client credentials to the new user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        expected = '/api/runs'
        url = reverse('api:runs-list')
        self.assertEquals(expected, url)
        query = '{0}?job_uid={1}'.format(url, self.job.uid)
        response = self.client.get(query)
        self.assertIsNotNone(response)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        self.assertEquals(response.data, [])

    def test_filter_runs(self,):
        expected = '/api/runs/filter'
        url = reverse('api:runs-filter')
        self.assertEquals(expected, url)
        query = '{0}'.format(url)
        extents = (-4, 15, 8.0, 28)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        geojson = the_geom.geojson
        response = self.client.post(query, {"geojson": "{}".format(geojson)})
        self.assertIsNotNone(response)
        result = response.data
        # make sure we get a single run back
        self.assertEquals(1, len(result))
        self.assertEquals(self.run_uid, result[0].get('uid'))

        extents = (-3, 16, 7.0, 27)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        geojson = the_geom.geojson
        response = self.client.post(query, {"geojson": "{}".format(geojson)})
        self.assertIsNotNone(response)
        result = response.data
        # make sure 1 run is returned as it should be completely contained
        self.assertEquals(1, len(result))

        extents = (4, 17, 9.0, 28)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        geojson = the_geom.geojson
        response = self.client.post(query, {"geojson": "{}".format(geojson)})
        self.assertIsNotNone(response)
        result = response.data
        # make sure 1 run is returned as it should intersect
        self.assertEquals(1, len(result))

        extents = (-40, -5, -30, 5)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        geojson = the_geom.geojson
        response = self.client.post(query, {"geojson": "{}".format(geojson)})
        self.assertIsNotNone(response)
        result = response.data
        #make sure no runs are returned since it should not intersect
        self.assertEquals(0, len(result))

        name='TestJob'
        query = '{0}?search_term={1}'.format(url, name)
        response = self.client.get(query)
        self.assertIsNotNone(response)
        result = response.data
        # make sure we get a single run back
        self.assertEqual(1, len(result))
        self.assertEqual(name, result[0].get('job').get('name'))

        name='NotFound'
        query = '{0}?search_term={1}'.format(url, name)
        response = self.client.get(query)
        self.assertIsNotNone(response)
        result = response.data
        # make sure no runs are returned as they should have been filtered out
        self.assertEquals(0, len(result))



    @patch('eventkit_cloud.api.views.ExportRunViewSet.validate_licenses')
    def test_filter_runs_invalid_license(self, mock_validate_licenses):
        from ...tasks.task_factory import InvalidLicense
        expected = '/api/runs/filter'
        url = reverse('api:runs-filter')
        mock_validate_licenses.side_effect = (InvalidLicense('no license'),)
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        result = response.data
        self.assertTrue("InvalidLicense" in result[0].get('detail'))
        self.assertEquals(response.status_code, 400)

    def test_filter_runs_no_permissions(self,):
        user = User.objects.create_user(
            username='other_user', email='other_user@demo.com', password='demo'
        )
        token = Token.objects.create(user=user)
        # reset the client credentials to the new user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        expected = '/api/runs/filter'
        url = reverse('api:runs-filter')
        self.assertEquals(expected, url)
        query = '{0}?job_uid={1}'.format(url, self.job.uid)
        response = self.client.get(query)
        self.assertIsNotNone(response)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        self.assertEquals(response.data, [])


class TestExportTaskViewSet(APITestCase):
    """
    Test cases for ExportTaskViewSet
    """

    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json',)

    def __init__(self, *args, **kwargs):
        super(TestExportTaskViewSet, self).__init__(*args, **kwargs)
        self.user = None
        self.path = None
        self.job = None
        self.celery_uid = None
        self.client = None
        self.export_run = None
        self.export_provider_task = None
        self.task = None
        self.task_uid = None

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo', is_active=True)
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom)

        formats = ExportFormat.objects.all()
        provider = DataProvider.objects.first()
        provider_task = DataProviderTask.objects.create(provider=provider)
        provider_task.formats.add(*formats)

        self.job.provider_tasks.add(provider_task)
        self.job.save()

        # setup token authentication
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        self.export_run = ExportRun.objects.create(job=self.job, user=self.user)
        self.celery_uid = str(uuid.uuid4())
        self.export_provider_task = DataProviderTaskRecord.objects.create(run=self.export_run,
                                                                          name='Shapefile Export',
                                                                          status=TaskStates.PENDING.value)
        self.task = ExportTaskRecord.objects.create(export_provider_task=self.export_provider_task, name='Shapefile Export',
                                                    celery_uid=self.celery_uid, status='SUCCESS')
        self.task_uid = str(self.task.uid)

    def test_retrieve(self,):
        expected = '/api/tasks/{0}'.format(self.task_uid)
        url = reverse('api:tasks-detail', args=[self.task_uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        result = json.dumps(response.data)
        data = json.loads(result)
        # make sure we get the correct uid back out
        self.assertEquals(self.task_uid, data[0].get('uid'))

    def test_list(self,):
        expected = '/api/tasks'.format(self.task_uid)
        url = reverse('api:tasks-list')
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        result = json.dumps(response.data)
        data = json.loads(result)
        # should only be one task in the list
        self.assertEquals(1, len(data))
        # make sure we get the correct uid back out
        self.assertEquals(self.task_uid, data[0].get('uid'))

    def test_patch_cancel_task(self,):
        expected = '/api/provider_tasks/{0}'.format(self.export_provider_task.uid)
        url = reverse('api:provider_tasks-list') + '/%s' % (self.export_provider_task.uid,)
        self.assertEquals(expected, url)
        response = self.client.patch(url)
        # test significant content
        self.assertEquals(response.data, {'success': True})
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        pt = DataProviderTaskRecord.objects.get(uid=self.export_provider_task.uid)
        et = pt.tasks.last()

        self.assertEqual(pt.status, TaskStates.CANCELED.value)
        self.assertEqual(et.status, TaskStates.SUCCESS.value)

    def test_patch_cancel_task_no_permissions(self,):
        user = User.objects.create_user(
            username='other_user', email='other_user@demo.com', password='demo'
        )
        token = Token.objects.create(user=user)
        # reset the client credentials to the new user
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        expected = '/api/provider_tasks/{0}'.format(self.export_provider_task.uid)
        url = reverse('api:provider_tasks-list') + '/%s' % (self.export_provider_task.uid,)
        self.assertEquals(expected, url)
        response = self.client.patch(url)
        # test the response headers
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEquals(response['Content-Type'], 'application/json')
        self.assertEquals(response['Content-Language'], 'en')

        # test significant content
        self.assertEquals(response.data, {'success': False})

    def test_export_provider_task_get(self):
        url = reverse('api:provider_tasks-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

class TestStaticFunctions(APITestCase):
    def test_get_models(self):
        ExportFormat.objects.create(name="Test1", slug="Test1")
        ExportFormat.objects.create(name="Test2", slug="Test2")
        sample_models = ["Test1", "Test2"]
        models = get_models(sample_models, ExportFormat, 'name')
        assert len(models) == 2

    def test_get_provider_tasks(self):
        # Arbitrary "Formats"
        format_test1 = ExportFormat.objects.create(name="Test1", slug="Test1")
        format_test2 = ExportFormat.objects.create(name="Test2", slug="Test2")
        format_test3 = ExportFormat.objects.create(name="Test3", slug="Test3")

        # Formats we want to process
        requested_types = (format_test1, format_test2)

        # An arbitrary provider type...
        provider_type = DataProviderType.objects.create(type_name="test")
        # ... and the formats it actually supports.
        supported_formats = [format_test2, format_test3]
        provider_type.supported_formats.add(*supported_formats)
        provider_type.save()

        # Assign the type to an arbitrary provider.
        export_provider = DataProvider.objects.create(name="provider1", export_provider_type=provider_type)
        # Get a DataProviderTask object to ensure that it is only trying to process
        # what it actually supports (1).
        provider_task = get_provider_task(export_provider, requested_types)
        assert len(provider_task.formats.all()) == 1


class TestLicenseViewSet(APITestCase):

    def setUp(self,):
        self.user = User.objects.create_user(
            username='demo', email='demo@demo.com', password='demo'
        )
        self.licenses = [License.objects.create(slug='test1', name='name1', text='text1')]
        self.licenses += [License.objects.create(slug='test0', name='name0', text='text0')]
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json, text/plain; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

    def test_get_licenses_list(self):
        expected_url = '/api/licenses'
        expected_data = [
            {'slug': 'test0', 'name': 'name0', 'text': 'text0'},
            {'slug': 'test1', 'name': 'name1', 'text': 'text1'}
        ]
        url = reverse('api:licenses-list')
        self.assertEquals(expected_url, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEqual(200, response.status_code)
        data = json.loads(response.content)
        self.assertEqual(expected_data, data)

    def test_get_licenses_detail(self):
        expected_url = '/api/licenses/test1'
        expected_data = {"slug": "test1", "name": "name1", "text": "text1"}
        url = reverse('api:licenses-detail', args=['test1'])
        self.assertEquals(expected_url, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        data = json.loads(response.content)
        self.assertEquals(expected_data, data)

    def test_get_licenses_download(self):
        expected_url = '/api/licenses/test1/download'
        url = reverse('api:licenses-download', args=['test1'])
        self.assertEquals(expected_url, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        self.assertEquals(self.licenses[0].text, response.content)

        expected_bad_url = '/api/licenses/test22/download'
        bad_url = reverse('api:licenses-download', args=['test22'])
        self.assertEqual(expected_bad_url, bad_url)
        bad_response = self.client.get(bad_url);
        self.assertIsNotNone(bad_response)
        self.assertEquals(400, bad_response.status_code)
        self.assertEquals(str({'detail': _('Not found')}), bad_response.content)


class TestUserDataViewSet(APITestCase):

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group = Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create_user(
            username='demo', email='demo@demo.com', password='demo'
        )
        self.licenses = [License.objects.create(slug='test1', name='Test1', text='text')]
        self.licenses += [License.objects.create(slug='test2', name='Test2', text='text')]
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

    def test_get_userdata_list(self):
        expected = '/api/user'
        url = reverse('api:user-list')
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        data = json.loads(response.content)
        self.assertEquals(self.user.username, data[0].get('user').get('username'))
        self.assertIsNotNone(data[0].get('accepted_licenses').get(self.licenses[0].slug))

    def test_get_userdata(self):
        expected = '/api/user/{0}'.format(self.user)
        url = reverse('api:user-detail', args=[self.user])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        self.assertEquals(200, response.status_code)
        data = json.loads(response.content)
        self.assertEquals(self.user.username, data.get('user').get('username'))
        self.assertIsNotNone(data.get('accepted_licenses').get(self.licenses[0].slug))

    def test_set_licenses(self):
        url = reverse('api:user-detail', args=[self.user])
        response = self.client.get(url)
        data = json.loads(response.content)
        # check both licenses are NOT accepted.
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[0].slug), False)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[1].slug), False)
        # update single license.
        request_data = data
        request_data['accepted_licenses'][self.licenses[0].slug] = True
        patch_response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        response = self.client.get(url)
        data = json.loads(response.content)
        # check that the response body matches a new request
        self.assertEqual(patch_response.data, response.data)
        # check single licenses is accepted.
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[0].slug), True)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[1].slug), False)
        request_data = data
        request_data['accepted_licenses'][self.licenses[1].slug] = True
        patch_response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        data = json.loads(patch_response.content)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[0].slug), True)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[1].slug), True)
        request_data = data
        request_data['accepted_licenses'][self.licenses[0].slug] = False
        patch_response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        data = json.loads(patch_response.content)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[0].slug), False)
        self.assertEqual(data.get('accepted_licenses').get(self.licenses[1].slug), True)


def date_handler(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    else:
        raise TypeError
