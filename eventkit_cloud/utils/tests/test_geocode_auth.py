import json
import logging

import requests
import requests_mock
from django.conf import settings
from django.test import TestCase, override_settings


logger = logging.getLogger(__name__)


# class TestGeoCodeAuth(TestCase):
#
#     def setUp(self):
#         self.session = requests.Session()
#         self.mock_requests = requests_mock.Mocker()
#         self.mock_requests.start()
#         self.addCleanup(self.mock_requests.stop)
#
#     @override_settings(GEOCODING_AUTH_URL="http://fake.url/",
#                        GEOCODING_AUTH_CERT="-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
#                                            "PRIVATE KEY----------END RSA PRIVATE KEY-----")
#     def test_authenticate(self):
#         session = requests.session()
#         with requests_mock.mock() as m:
#             m.get(url=settings.GEOCODING_AUTH_URL, text=settings.GEOCODING_AUTH_CERT)
#             response = session.request('POST', url=settings.GEOCODING_AUTH_URL)
#         self.assertEqual(response.body, "-----BEGIN CERTIFICATE----------END CERTIFICATE----------BEGIN RSA "
#                                         "PRIVATE KEY----------END RSA PRIVATE KEY-----")
#
#
#         # session.request('POST', url=settings.GEOCODING_AUTH_URL, data=json.dumps(settings.GEOCODING_AUTH_CERT))
#
#         # self.assertEqual(authenticate(), {'data': settings.GEOCODING_AUTH_CERT})
#         # self.assertEqual(authenticate(), {'Authorization': session['data']})
