# -*- coding: utf-8 -*-
import logging
import json
from django.test import TestCase
from django.test import Client
from mock import Mock, patch

logger = logging.getLogger(__name__)


class TestUIViews(TestCase):

    @patch('eventkit_cloud.ui.views.get_size_estimate')
    def test_data_estimate_view(self, get_estimate):

        get_estimate.return_value = [1, 0.000123]
        c = Client()
        response = c.post('/en/exports/estimator',
                          data=json.dumps({'providers': ['ESRI-Imagery'],
                                           'bbox': [-43.238239, -22.933733, -43.174725, -22.892623]}),
                          content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(float(response.content), 0.000123)

        response = c.post('/en/exports/estimator', data=json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, 'Providers or BBOX were not supplied in the request')


    @patch('eventkit_cloud.ui.views.requests')
    def test_data_estimate_view(self, requests):
        expected_return = {"some": "json"}
        response = Mock()
        response.json.return_value = expected_return
        requests.get.return_value = response

        c = Client()

        with self.settings(GEONAMES_API_URL='http://api.geonames.org/something'):
            response = c.get('/en/exports/request_geonames',
                              data={'q': 'test'},
                              content_type='application/json')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(json.loads(response.content), expected_return)

        with self.settings(GEONAMES_API_URL=None):
            expected_return = {'error': 'A url was not provided for geonames'}
            response = c.get('/en/exports/request_geonames',
                             data={'q': 'test'},
                             content_type='application/json')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(json.loads(response.content), expected_return)
