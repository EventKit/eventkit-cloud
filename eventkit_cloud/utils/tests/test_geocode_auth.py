import logging
import requests_mock
from django.core.cache import cache
from django.test import TestCase, override_settings
from mock import patch
from eventkit_cloud.utils.geocoding.geocode_auth import get_auth_headers

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):

    def setup(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def test_get_headers_with_no_URL(self):
        self.assertEqual(get_auth_headers(), {})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url")
    def test_get_headers_with_cache(self):
        cacheValue = 'this_was_in_cache'
        cache.set('pelias_token', cacheValue, None)
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + cacheValue})

    @override_settings(GEOCODING_AUTH_URL="http://fake.url")
    @patch('eventkit_cloud.utils.geocoding.geocode_auth.authenticate')
    def test_get_headers_with_authenticate(self, authenticate_mock):
        token = "some token"
        authenticate_mock.return_value = token
        self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + token})

