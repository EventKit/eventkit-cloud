# -*- coding: utf-8 -*-
import logging
import json
import tempfile
from django.contrib.auth.models import User, Group
from django.test import TestCase, override_settings
from django.test import Client
from mock import Mock, patch
from django.core.urlresolvers import reverse

logger = logging.getLogger(__name__)


@override_settings(DJANGO_MODEL_LOGIN=True)
class TestUIViews(TestCase):

    def setUp(self):
        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(
                        username='user', email='user@email.com', password='pass')
        self.client = Client()
        self.client.login(username='user', password='pass')

    def test_get_config(self):
        with self.settings(UI_CONFIG={}):
            response = self.client.get('/configuration')
            self.assertEqual(response.status_code, 200)

        with self.settings(
            UI_CONFIG={
                'LOGIN_DISCLAIMER': '<div>This is a disclaimer</div>',
                'BANNER_BACKGROUND_COLOR': 'red',
                'BANNER_TEXT_COLOR': 'green',
                'BANNER_TEXT': 'This is banner text',
                'MAX_DATAPACK_EXPIRATION_DAYS': '30',
            },
        ):
            response = self.client.get('/configuration')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(json.loads(response.content), {
                'LOGIN_DISCLAIMER': '<div>This is a disclaimer</div>',
                'BANNER_BACKGROUND_COLOR': 'red',
                'BANNER_TEXT_COLOR': 'green',
                'BANNER_TEXT': 'This is banner text',
                'MAX_DATAPACK_EXPIRATION_DAYS': '30',
            })


    @patch('eventkit_cloud.ui.views.file_to_geojson')
    def test_covert_to_geojson(self, file_to_geojson):
        geojson = {
          "type": "FeatureCollection",
          "features": [
            {
              "type": "Feature",
              "properties": {},
              "geometry": {
                "type": "Polygon",
                "coordinates": [
                  [
                    [7.2, 46.2],
                    [7.6, 46.2],
                    [7.6, 46.6],
                    [7.2, 46.6],
                    [7.2, 46.2]
                  ]
                ]
              }
            }
          ]
        }
        file_to_geojson.return_value = geojson
        response = self.client.post('/file_upload')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content, 'No file supplied in the POST request')

        with tempfile.TemporaryFile() as fp:
            response = self.client.post('/file_upload',
                                        {'file': fp})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, json.dumps(geojson))

        file_to_geojson.side_effect = Exception('This is the message')
        with tempfile.TemporaryFile() as fp:
            response = self.client.post('/file_upload',
                                        {'file': fp})
            self.assertEqual(response.status_code, 400)
            self.assertEqual(response.content, 'This is the message')


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

    @patch('eventkit_cloud.ui.views.is_lat_lon')
    @patch('eventkit_cloud.ui.views.is_mgrs')
    @patch('eventkit_cloud.ui.views.Convert')
    @patch('eventkit_cloud.ui.views.ReverseGeocode')
    @patch('eventkit_cloud.ui.views.Geocode')
    def test_search(self, mock_geocode, mock_reverse, mock_convert, mock_is_mgrs, mock_is_lat_lon):
        empty_request = self.client.get('/search')
        self.assertEqual(empty_request.status_code, 204)

        mock_is_mgrs.return_value = True
        with self.settings(CONVERT_API_URL=None):
            response = self.client.get('/search', {'query': 'some query'})
            self.assertEquals(response.status_code, 501)
            self.assertEquals(response.content, 'No Convert API specified')

        with self.settings(CONVERT_API_URL="url", REVERSE_GEOCODING_API_URL=None):
            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 501)
            self.assertEqual(response.content, 'No Reverse Geocode API specified')

        with self.settings(CONVERT_API_URL="url", REVERSE_GEOCODING_API_URL="url"):
            convert = Mock()
            convert.get.return_value = {}
            mock_convert.return_value = convert

            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 204)

            convert.get.return_value = {
                'geometry': {
                    'coordinates': [1, 1]
                }
            }
            feature = {
                'geometry': {
                    'coordinates': [1, 1]
                },
                'properties': {
                    'bbox': [
                        1 - .05,
                        1 - .05,
                        1 + .05,
                        1 + .05
                    ]
                },
                'source': 'MGRS'
            }
            expected = json.dumps({'features': [feature]})

            reverse = Mock()
            reverse.search.return_value = {}
            mock_reverse.return_value = reverse

            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, expected)

            reverse.search.return_value = {'features': [feature]}
            expected = json.dumps({'features': [feature, feature]})

            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, expected)

        mock_is_mgrs.return_value = False
        mock_is_lat_lon.return_value = [1, 1]

        with self.settings(REVERSE_GEOCODING_API_URL=None):
            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 501)
            self.assertEqual(response.content, 'No Reverse Geocode API specified')

        with self.settings(REVERSE_GEOCODING_API_URL="url"):
            reverse = Mock()
            reverse.search.return_value = {}
            mock_reverse.return_value = reverse

            point_feature = {
                "geometry": {
                    "type": "Point",
                    "coordinates": [1, 1]
                },
                "source": "Coordinate",
                "type": "Feature",
                "properties": {
                    "name": "1 N, 1 E",
                    "bbox": [
                        1 - 0.05,
                        1 - 0.05,
                        1 + 0.05,
                        1 + 0.05
                    ]
                }
            }
            expected = json.dumps({'features': [point_feature]})

            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, expected)

            reverse.search.return_value = {'features': [point_feature]}
            expected = json.dumps({'features': [point_feature, point_feature]})

            response = self.client.get('/search', {'query': 'some query'})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, expected)

        mock_is_lat_lon.return_value = False
        geocode = Mock()
        geocode.search.return_value = {'features': ['features go here']}
        mock_geocode.return_value = geocode

        response = self.client.get('/search', {'query': 'some query'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, json.dumps({'features': ['features go here']}))

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

        expected_result = {"something-else": "value", "bbox": [1, 1, 1, 1]}
        # test result
        geocode.add_bbox.return_value = expected_result
        mock_geocode.return_value = geocode
        response = self.client.get('/geocode', {"result": '{"something-else": "value"}'})
        self.assertEquals(response.status_code, 200)
        self.assertEquals(json.loads(response.content), expected_result)

        expected_result = None
        # test result
        geocode.search.return_value = expected_result
        mock_geocode.return_value = geocode
        response = self.client.get('/geocode', {'wrong-key': 'value'})
        self.assertEquals(response.status_code, 204)

