# -*- coding: utf-8 -*-
from __future__ import absolute_import
import json
import os
import uuid
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.reverse import reverse
from rest_framework.test import APITestCase

# from django.test import TestCase as APITestCase

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, Polygon, Point, LineString
from ...jobs.models import ExportFormat, Job, DataProvider, \
    DataProviderType, DataProviderTask, bbox_to_geojson, DatamodelPreset, License
from ...tasks.models import ExportRun, ExportTaskRecord, DataProviderTaskRecord
from ...tasks.export_tasks import TaskStates
from ...core.models import GroupPermission


class TestJobPermissions(APITestCase):
    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json',)

    def __init__(self, *args, **kwargs):
        super(TestJobPermissions, self).__init__(*args, **kwargs)
        self.path = None
        self.group = None
        self.user = None
        self.job = None
        self.client = None
        self.config = None
        self.tags = None

    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        self.user1 = User.objects.create_user(username='user_1', email='demo@demo.com', password='demo')
        self.user2 = User.objects.create_user(username='user_2', email='demo@demo.com', password='demo')

        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        original_selection = GeometryCollection(Point(1, 1), LineString((5.625, 48.458), (0.878, 44.339)))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', event='Test Activation', description='Test description',
                                      user=self.user1, the_geom=the_geom, original_selection=original_selection)

        formats = ExportFormat.objects.all()
        provider = DataProvider.objects.first()
        provider_task = DataProviderTask.objects.create(provider=provider)
        provider_task.formats.add(*formats)

        self.job.provider_tasks.add(provider_task)

        token = Token.objects.create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        # create a test config
        hdm_presets = DatamodelPreset.objects.get(name='hdm')
        self.job.preset = hdm_presets
        self.job.save()

        group1, created = Group.objects.get_or_create(name="group_one")
        self.group1id = group1.id
        gp = GroupPermission.objects.create(group=group1, user=self.user1,
                                            permission=GroupPermission.Permissions.ADMIN.value)
        gp = GroupPermission.objects.create(group=group1, user=self.user2,
                                            permission=GroupPermission.Permissions.MEMBER.value)
        group2, created = Group.objects.get_or_create(name="group_two")
        self.group2id = group2.id
        gp = GroupPermission.objects.create(group=group2, user=self.user1,
                                            permission=GroupPermission.Permissions.ADMIN.value)
        gp = GroupPermission.objects.create(group=group2, user=self.user2,
                                            permission=GroupPermission.Permissions.MEMBER.value)

    def test_list(self, ):
        expected = '/api/jobs'
        url = reverse('api:jobs-list')
        self.assertEquals(expected, url)

    def test_get_job_defaults(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)

        self.assertEquals(response.data["visibility"], 'PRIVATE')
        self.assertEquals(len(response.data["permissions"]["users"]), 1)
        self.assertEquals(len(response.data["permissions"]["groups"]), 0)
        self.assertEquals(self.user1.username in response.data["permissions"]["users"], True)
        self.assertEquals(response.data["permissions"]["users"][self.user1.username], "ADMIN")
        self.assertEquals(response.data["visibility"], 'PRIVATE')

    def test_permissions_syntax(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_2": "ADMIN"},
                                        "groups": {"group_one": "ADMIN"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        request_data = {"permissions": {"users": {"user_1": "READ", "user_2": "READ"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'This job has no administrators.')

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_2": "ADMEN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'invalid permission value : ADMEN')

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_3": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'unidentified user or group : user_3')

        request_data = {"permissions": {"users": {"user_1": "ADMIN"}, "groups": {"group_three": "ADMIN"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'unidentified user or group : group_three')

        request_data = {"permissions": {"users": {"user_1": "ADMIN"}, "groups": {"group_two": "ADMEN"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'invalid permission value : ADMEN')

    def test_shared_user_permissions(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # change user_1 permissions to READ and visiblity SHARED

        request_data = {"visibility": "SHARED",
                        "permissions": {"users": {"user_1": "READ", "user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # Update should no longer be permitted

        request_data = {"visibility": "PRIVATE"}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'ADMIN permission is required to update this job.')

        # however, should be able to read this job.

        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.get(url)

        self.assertEquals(response.data["visibility"], 'SHARED')
        self.assertEquals(response.data["permissions"]["users"][self.user1.username], "READ")

    def test_private_user_permissions(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        #  remove user_1 and set visibility PRIVATE.

        request_data = {"visibility": "PRIVATE", "permissions": {"users": {"user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # Update should no longer be permitted

        request_data = {"published": True}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'ADMIN permission is required to update this job.')

        #  should not be able to read this job

        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.get(url)
        self.assertEquals(status.HTTP_404_NOT_FOUND, response.status_code)

    def test_public_user_permissions(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        request_data = {"permissions": {"users": {"user_1": "ADMIN", "user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        #  remove user_1 and set visibility PUBLIC.

        request_data = {"visibility": "PUBLIC", "permissions": {"users": {"user_2": "ADMIN"}, "groups": {}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # Update should no longer be permitted

        request_data = {"published": True}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'ADMIN permission is required to update this job.')

        #  should be able to read this job

        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.get(url)

        self.assertEquals(response.data["visibility"], 'PUBLIC')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

    def test_shared_group_permissions(self, ):
        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        self.assertEquals(expected, url)

        # remove logged in user as an administrator, allow his group to be ADMIN

        request_data = {"permissions": {"users": {"user_2": "ADMIN"}, "groups": {"group_one": "ADMIN"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # Update should be OK

        request_data = {"visibility": "SHARED"}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        #  should be able to read this job.

        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.get(url)

        self.assertEquals(response.data["permissions"]["groups"]["group_one"], "ADMIN")

        #  Now change the group's permissions to READ effectively removing user_1 from any admin rights

        request_data = {"permissions": {"users": {"user_2": "ADMIN"}, "groups": {"group_one": "READ"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        # update should now fail. Here we try to regain our lost ADMIN rights

        request_data = {"permissions": {"users": {"user_2": "ADMIN"}, "groups": {"group_one": "ADMIN"}}}

        response = self.client.patch(url, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_400_BAD_REQUEST, response.status_code)
        self.assertEquals(response.data[0]['detail'], 'ADMIN permission is required to update this job.')

        #  should still be able to read this job.

        expected = '/api/jobs/{0}'.format(self.job.uid)
        url = reverse('api:jobs-detail', args=[self.job.uid])
        response = self.client.get(url)

        self.assertEquals(response.data["permissions"]["groups"]["group_one"], "READ")

class TestExportRunViewSet(APITestCase):
    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json',)

    def __init__(self, *args, **kwargs):
        super(TestExportRunViewSet, self).__init__(*args, **kwargs)
        self.user = None
        self.client = None
        self.job = None
        self.job_uid = None
        self.export_run = None
        self.run_uid = None

    def setUp(self, ):
        self.group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        self.user1 = User.objects.create_user(username='user_1', email='demo@demo.com', password='demo')
        self.user2= User.objects.create_user(username='user_2', email='demo@demo.com', password='demo')
        token = Token.objects.create(user=self.user1)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user1,
                                      the_geom=the_geom)
        formats = ExportFormat.objects.all()
        provider = DataProvider.objects.first()
        provider_task = DataProviderTask.objects.create(provider=provider)
        provider_task.formats.add(*formats)

        self.job.provider_tasks.add(provider_task)
        self.job.save()
        self.job_uid = str(self.job.uid)
        self.export_run = ExportRun.objects.create(job=self.job, user=self.user1)
        self.run_uid = str(self.export_run.uid)

        group1, created = Group.objects.get_or_create(name="group_one")
        self.group1id = group1.id
        gp = GroupPermission.objects.create(group=group1, user=self.user1,
                                            permission=GroupPermission.Permissions.ADMIN.value)
        gp = GroupPermission.objects.create(group=group1, user=self.user2,
                                            permission=GroupPermission.Permissions.MEMBER.value)
        group2, created = Group.objects.get_or_create(name="group_two")
        self.group2id = group2.id
        gp = GroupPermission.objects.create(group=group2, user=self.user1,
                                            permission=GroupPermission.Permissions.ADMIN.value)


    def test_retrieve_run(self,):
        expected = '/api/runs/{0}'.format(self.run_uid)

        url = reverse('api:runs-detail', args=[self.run_uid])
        self.assertEquals(expected, url)
        response = self.client.get(url)
        self.assertIsNotNone(response)
        result = response.data
        # make sure we get the correct uid back out
        self.assertEquals(self.run_uid, result[0].get('uid'))


    def test_private_run(self, ):
        token = Token.objects.create(user=self.user2)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

        url = reverse('api:runs-detail', args=[self.run_uid])
        response = self.client.get(url)
        result = response.data
        self.assertEquals(result, [])

    def test_user_sharing(self, ):

        joburl = reverse('api:jobs-detail', args=[self.job.uid])

        request_data = {"permissions": {"users": {"user_1": "ADMIN","user_2": "ADMIN"}, }}

        response = self.client.patch(joburl, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        token = Token.objects.create(user=self.user2)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

        url = reverse('api:runs-detail', args=[self.run_uid])
        response = self.client.get(url)
        result = response.data
        self.assertEquals(self.run_uid, result[0].get('uid'))

        request_data = {"permissions": {"users": {"user_1": "ADMIN"}  }}

        response = self.client.patch(joburl, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        response = self.client.get(url)
        result = response.data
        self.assertEquals(result, [])

    def test_group_sharing(self, ):

        joburl = reverse('api:jobs-detail', args=[self.job.uid])

        request_data = {"permissions": {"groups": {"group_one": "ADMIN"} }}

        response = self.client.patch(joburl, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        token = Token.objects.create(user=self.user2)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key,
                                HTTP_ACCEPT='application/json; version=1.0',
                                HTTP_ACCEPT_LANGUAGE='en',
                                HTTP_HOST='testserver')

        url = reverse('api:runs-detail', args=[self.run_uid])
        response = self.client.get(url)
        result = response.data
        self.assertEquals(self.run_uid, result[0].get('uid'))

        request_data = {"permissions": {"groups": {"group_two": "ADMIN"} }}

        response = self.client.patch(joburl, data=json.dumps(request_data), content_type='application/json; version=1.0')
        self.assertEquals(status.HTTP_200_OK, response.status_code)

        response = self.client.get(url)
        result = response.data
        self.assertEquals(result, [])