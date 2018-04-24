from mock import Mock, patch, call, MagicMock
from uuid import uuid4
from django.test import TestCase, override_settings
import logging
import requests_mock
from django.conf import settings
import json
from django.core.cache import cache
from ..geocode_auth import getAuthHeaders


logger = logging.getLogger(__name__)

class TestGeoCodeAuth(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def testGetHeadersWithNoURL(self):        
        self.assertEquals(getAuthHeaders(), {})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/", GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE-----", GEOCODING_AUTH_KEY="-----BEGIN RSA PRIVATE KEY----------END RSA PRIVATE KEY-----")
    def testGetHeaders(self):
        testJwt = {'token': 'hello_world'}
        self.mock_requests.get(settings.GEOCODING_AUTH_URL, text=json.dumps(testJwt), status_code=200)
        self.assertEquals(getAuthHeaders(), {'Authorization': 'Bearer ' + testJwt['token']})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/")
    def testGetHeaders(self):        
        cacheValue = 'this_was_in_cache'
        cache.set('pelias_token', cacheValue, None)
        self.assertEquals(getAuthHeaders(), {'Authorization': 'Bearer ' + cacheValue})