import json
import logging
from unittest import mock

import requests_mock
import requests
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from mock import patch, MagicMock
from requests import Session

from eventkit_cloud.utils.geocoding.geocode_auth import get_auth_headers, authenticate, CACHE_TOKEN_KEY, \
    CACHE_TOKEN_TIMEOUT, get_session_cookies

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):

    def setup(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/", GEOCODING_AUTH_CERT="-----BEGIN "
                                                                                  "CERTIFICATE----------END "
                                                                                  "CERTIFICATE----------BEGIN RSA "
                                                                                  "PRIVATE KEY----------END RSA "
                                                                                  "PRIVATE KEY-----")
    def test_get_headers(self):
        testJwt = {'token': 'hello_world'}
        self.mock_requests.get(settings.GEOCODING_AUTH_URL, text=json.dumps(testJwt), status_code=200)
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + testJwt['token']})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/")
    def test_get_headers(self):
        cacheValue = 'this_was_in_cache'
        cache.set('pelias_token', cacheValue, None)
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + cacheValue})

    # this test can only be run locally due to an actual call to the server
    def test_get_session_cookies(self):
        cookies = {'cookie_key': 'cookie value'}
        # cannot get cookie from session instance according to docs
        # session_instance = session_mock.return_value
        # session_instance.cookies.return_value = cookies
        s = requests.session()
        adapter = requests_mock.Adapter()
        s.mount('mock', adapter)

        # registered_uri = adapter.register_uri('GET', url=settings.GEOCODING_AUTH_URL)
        resp_1 = requests.get(url=settings.GEOCODING_AUTH_URL)
        cookies = resp_1.cookies
        logger.info(f'COOKIES {cookies}')
        # resp_2 = adapter.register_uri('GET', url=settings.GEOCODING_AUTH_URL)
        resp_2 = requests.get(url=settings.GEOCODING_AUTH_URL)
        cookies_2 = resp_2.cookies
        s.get(settings.GEOCODING_AUTH_URL)

        self.assertEqual(len(cookies), len(cookies_2))
        # self.assertEqual(get_session_cookies(), cookies)

    # def test_get_session_cookies_2(self):
    #     cookies = {'cookie_key': 'cookie value'}
    #     mock_session = MagicMock(wraps=Session)
    #
    #     with patch('requests.Session', new=mock_session):
    #         session_instance = mock_session.return_value
    #         session_instance.cookies.return_value = cookies
    #         logger.info(f'SESSION COOKIES: {get_session_cookies()}')
    #         self.assertEqual(get_session_cookies(), cookies)

    @patch('eventkit_cloud.utils.geocoding.geocode_auth.cache')
    @override_settings(
        GEOCODING_AUTH_URL="http://fake.url/",
        GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
                            "PRIVATE KEY----------END RSA PRIVATE KEY-----"
    )
    def test_authenticate(self, cache_mock):
        expected_token = "some token"
        cache_mock.get.return_value = expected_token
        expected_headers = {"Authorization": "Bearer " + expected_token}

        self.mock_requests = requests_mock.Mocker()
        response = self.mock_requests.get(
            settings.GEOCODING_AUTH_URL,
            headers=json.dumps(expected_headers),
            status_code=200
        )

        logger.info(f'RESPONSE: {response}')
        logger.info(f'TOKEN: {expected_token}')
        self.assertEqual(authenticate(), expected_token)
        # cache_mock.set.assert_called_with(CACHE_TOKEN_KEY, expected_token, CACHE_TOKEN_TIMEOUT)
