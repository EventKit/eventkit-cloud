import json
import logging

import requests_mock
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings

from eventkit_cloud.utils.geocoding.geocode_auth import get_auth_headers

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def testGetHeadersWithNoURL(self):        
        self.assertEqual(get_auth_headers(), {})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/", GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA PRIVATE KEY----------END RSA PRIVATE KEY-----")
    def testGetHeaders(self):
        testJwt = {'token': 'hello_world'}
        self.mock_requests.get(settings.GEOCODING_AUTH_URL, text=json.dumps(testJwt), status_code=200)
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + testJwt['token']})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/")
    def testGetHeaders(self):        
        cacheValue = 'this_was_in_cache'
        cache.set('pelias_token', cacheValue, None)
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + cacheValue})