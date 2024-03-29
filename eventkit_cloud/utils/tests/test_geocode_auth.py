import logging
import os
from unittest.mock import patch

import requests
from django.conf import settings
from django.test import TestCase, override_settings

from eventkit_cloud.utils.geocoding.geocode_auth import (
    CACHE_COOKIE_KEY,
    CACHE_TOKEN_KEY,
    CACHE_TOKEN_TIMEOUT,
    authenticate,
    get_auth_headers,
    get_session_cookies,
    update_auth_headers,
    update_session_cookies,
)

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):
    @override_settings(GEOCODING_AUTH_URL="http://fake.url")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth.update_auth_headers")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth.cache")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth.authenticate")
    def test_get_auth_headers(self, mock_authenticate, mock_cache, mock_update_auth_headers):
        mock_cache.get.return_value = settings.GEOCODING_AUTH_URL
        self.assertIsNone(get_auth_headers())
        mock_cache.reset_mock()

        mock_cache.get.return_value = {}
        example_token = "test_token"
        mock_authenticate.return_value = example_token
        expected_header = {"Authorization": "Bearer " + str(example_token)}
        self.assertEquals(expected_header, get_auth_headers())
        mock_update_auth_headers.assert_called_once_with(expected_header)
        mock_cache.get.assert_called_once_with(CACHE_TOKEN_KEY, {})

    @patch("eventkit_cloud.utils.geocoding.geocode_auth.cache")
    def test_update_auth_headers(self, mock_cache):
        example_headers = "test_headers"
        update_auth_headers(example_headers)
        mock_cache.set.assert_called_once_with(CACHE_TOKEN_KEY, example_headers, CACHE_TOKEN_TIMEOUT)

    @patch("eventkit_cloud.utils.geocoding.geocode_auth.cache")
    def test_update_session_cookies(self, mock_cache):
        example_cookies = "test_cookies"
        update_session_cookies(example_cookies)
        mock_cache.set.assert_called_once_with(CACHE_COOKIE_KEY, example_cookies, CACHE_TOKEN_TIMEOUT)

    @patch("eventkit_cloud.utils.geocoding.geocode_auth.cache")
    def test_get_session_cookies(self, mock_cache):
        example_cookies = "test_cookies"
        mock_cache.get.return_value = example_cookies
        self.assertEquals(example_cookies, get_session_cookies())
        mock_cache.get.assert_called_once_with(CACHE_COOKIE_KEY)

    @patch.dict(
        os.environ, {"GEOCODING_AUTH_CERT_PATH": "/path/to/fake/file", "GEOCODING_AUTH_CERT_PASS_VAR": "123456"}
    )
    @patch("eventkit_cloud.utils.geocoding.geocode_auth.cache")
    @patch("requests.Session.get")
    @patch("requests.Response")
    def test_authenticate(self, mock_response, mock_session_get, mock_cache):
        with self.settings(GEOCODING_AUTH_URL="http://test.test"):
            example_token = "test_token"
            example_response = {"token": example_token}
            mock_response.json.return_value = example_response
            mock_session_get.return_value = mock_response
            self.assertEquals(example_token, authenticate())
            mock_cache.set.assert_called_once_with(CACHE_TOKEN_KEY, example_token, CACHE_TOKEN_TIMEOUT)
            mock_cache.reset_mock()

        with self.settings(GEOCODING_AUTH_URL="http://test.test"):
            example_response = {}
            mock_response.json.return_value = example_response
            mock_session_get.return_value = mock_response
            self.assertIsNone(authenticate())
            mock_cache.set.assert_called_once_with(CACHE_TOKEN_KEY, settings.GEOCODING_AUTH_URL, CACHE_TOKEN_TIMEOUT)
            mock_cache.reset_mock()

        with self.settings(GEOCODING_AUTH_URL=None):
            self.assertIsNone(authenticate())

        with self.settings(GEOCODING_AUTH_URL="http://test.test"):
            mock_response.json.side_effect = requests.exceptions.RequestException()
            mock_session_get.return_value = mock_response
            self.assertIsNone(authenticate())
            mock_cache.delete.assert_called_once_with(CACHE_TOKEN_KEY)
