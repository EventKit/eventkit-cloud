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

    def test_get_config(self):
        with self.settings(UI_CONFIG={}):
            response = self.client.get('/configuration')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(int(json.loads(response.content).get('MAX_EXPORTRUN_EXPIRATION_DAYS')), 30)

        with self.settings(
            UI_CONFIG={
                'LOGIN_DISCLAIMER': '<div>This is a disclaimer</div>',
                'BANNER_BACKGROUND_COLOR': 'red',
                'BANNER_TEXT_COLOR': 'green',
                'BANNER_TEXT': 'This is banner text',
            },
            MAX_EXPORTRUN_EXPIRATION_DAYS=45
        ):
            response = self.client.get('/configuration')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(json.loads(response.content), {
                'LOGIN_DISCLAIMER': '<div>This is a disclaimer</div>',
                'BANNER_BACKGROUND_COLOR': 'red',
                'BANNER_TEXT_COLOR': 'green',
                'BANNER_TEXT': 'This is banner text',
                'MAX_EXPORTRUN_EXPIRATION_DAYS': 45,
            })


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

    @patch('eventkit_cloud.ui.views.Geocode')
    def test_geocode_view(self, mock_geocode):
        expected_result = {"something": "value"}
        # test result
        geocode = Mock()
        geocode.search.return_value = expected_result
        mock_geocode.return_value = geocode
        response = self.client.get('/geocode',{'search': 'some_search'})
        self.assertEquals(response.status_code, 200)
        self.assertEquals(json.loads(response.content), expected_result)

        expected_result = None
        # test result
        geocode.search.return_value = expected_result
        mock_geocode.return_value = geocode
        response = self.client.get('/geocode', {'search': 'some_search'})
        self.assertEquals(response.status_code, 204)
