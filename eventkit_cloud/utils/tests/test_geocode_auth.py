import json
import logging
from unittest import mock

import requests_mock
import requests
from django.conf import settings
from django.test import TestCase, override_settings
from mock import patch

from eventkit_cloud.utils.geocoding.geocode_auth import get_auth_headers, authenticate, CACHE_TOKEN_KEY, \
    CACHE_TOKEN_TIMEOUT

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    @patch('eventkit_cloud.utils.geocoding.geocode_auth.cache')
    @override_settings(GEOCODING_AUTH_URL="http://fake.url/",
                       GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
                                           "PRIVATE KEY----------END RSA PRIVATE KEY-----"
                       )
    def test_get_headers(self, cache_mock):
        test_jwt = {"token": "hello_world"}
        cache_mock.get.return_value = test_jwt

        self.mock_requests.get(settings.GEOCODING_AUTH_URL, headers=test_jwt, status_code=200)
        self.assertEqual(get_auth_headers(), test_jwt)

    @patch('eventkit_cloud.utils.geocoding.geocode_auth.cache')
    @override_settings(GEOCODING_AUTH_URL="http://fake_search.url/",
                       GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
                                           "PRIVATE KEY----------END RSA PRIVATE KEY-----"
                       )
    def test_authenticate(self, cache_mock):
        expected_headers = {"jsessionid": "session id"}

        self.mock_requests.register_uri(
            'GET',
            settings.GEOCODING_AUTH_URL,
            headers=expected_headers,
            status_code=200
        )
        self.assertEqual(authenticate(), expected_headers)
        cache_mock.set.assert_called_with(CACHE_TOKEN_KEY, expected_headers, CACHE_TOKEN_TIMEOUT)
