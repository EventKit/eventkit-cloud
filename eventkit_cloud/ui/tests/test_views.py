# -*- coding: utf-8 -*-
import logging
import json
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.test import Client
from mock import Mock, patch
from django.core.urlresolvers import reverse

logger = logging.getLogger(__name__)


@override_settings(DJANGO_MODEL_LOGIN=True)
class TestUIViews(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
                        username='user', email='user@email.com', password='pass')
        self.client = Client()
        self.client.login(username='user', password='pass')

    def test_get_login_disclaimer(self):
        with self.settings(LOGIN_DISCLAIMER='<div>This is a disclaimer</div>'):
            response = self.client.get('/disclaimer')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, '<div>This is a disclaimer</div>')

        with self.settings(LOGIN_DISCLAIMER=None):
            response = self.client.get('/disclaimer')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, '')

    @patch('eventkit_cloud.ui.views.get_size_estimate')
    def test_data_estimate_view(self, get_estimate):

        get_estimate.return_value = [1, 0.000123]

        response = self.client.post('/estimator',
                          data=json.dumps({'providers': ['ESRI-Imagery'],
                                           'bbox': [-43.238239, -22.933733, -43.174725, -22.892623]}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(float(response.content), 0.000123)

        response = self.client.post('/estimator', data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, 'Providers or BBOX were not supplied in the request')

    @patch('eventkit_cloud.ui.views.requests')
    def test_request_geonames_view(self, requests):
        expected_return = {"some": "json"}
        response = Mock()
        response.json.return_value = expected_return
        requests.get.return_value = response

        with self.settings(GEONAMES_API_URL='http://api.geonames.org/something'):
            response = self.client.get('/request_geonames',
                              data={'q': 'test'},
                              content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(json.loads(response.content), expected_return)

        with self.settings(GEONAMES_API_URL=None):
            expected_return = {'error': 'A url was not provided for geonames'}
            response = self.client.get('/request_geonames',
                             data={'q': 'test'},
                             content_type='application/json')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(json.loads(response.content), expected_return)
