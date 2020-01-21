import json
import logging

import requests
import requests_mock
from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings

logger = logging.getLogger(__name__)


class TestGeoCodeAuth(TestCase):

    def setUp(self):
        self.adapter = requests_mock.Adapter()
        self.session = requests.Session()
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    @override_settings(GEOCODING_AUTH_URL="http://fake.url/",
                       GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
                                           "PRIVATE KEY----------END RSA PRIVATE KEY-----")
    def test_authenticate(self):
        cert = settings.GEOCODING_AUTH_CERT
        session = requests.Session()
        with requests_mock.mock() as m:
            m.get(settings.GEOCODING_AUTH_URL)
            response = session.request('POST', settings.GEOCODING_AUTH_URL, data=cert)
        self.assertEqual(response.body, 'data')

    # @override_settings(GEOCODING_AUTH_URL="http://fake.url/", GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA PRIVATE KEY----------END RSA PRIVATE KEY-----")
    # def testGetHeaders(self):
    #     testJwt = {'token': 'hello_world'}
    #     self.mock_requests.get(settings.GEOCODING_AUTH_URL, text=json.dumps(testJwt), status_code=200)
    #     self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + testJwt['token']})
