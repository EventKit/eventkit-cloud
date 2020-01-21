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
        self.client.get(settings.GEOCODING_AUTH_URL)
        session = self.client.session
        session["data"] = settings.GEOCODING_AUTH_CERT
        session.save()
        self.assertEquals(session["??"], "??")
        # cert = {settings.GEOCODING_AUTH_CERT}
        # self.adapter.register_uri('GET', settings.GEOCODING_AUTH_URL)
        # self.session.get(settings.GEOCODING_AUTH_URL, data=cert)
        # self.assertEquals(self.session.post(settings.GEOCODING_AUTH_URL, data=cert, status_code=200))

    # @override_settings(GEOCODING_AUTH_URL="http://fake.url/", GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA PRIVATE KEY----------END RSA PRIVATE KEY-----")
    # def testGetHeaders(self):
    #     testJwt = {'token': 'hello_world'}
    #     self.mock_requests.get(settings.GEOCODING_AUTH_URL, text=json.dumps(testJwt), status_code=200)
    #     self.assertEqual(get_auth_headers(), {'Authorization': 'Bearer ' + testJwt['token']})
