# -*- coding: utf-8 -*-
import logging
import requests
from django.test import TransactionTestCase
from mock import Mock, patch, MagicMock

from ..auth_request import AuthRequest

logger = logging.getLogger(__name__)


class TestAuthResult(TransactionTestCase):

    def setUp(self):
        self.requester = AuthRequest("test_slug")
        self.url = "http://example.test/"

    def do_tests(self, req, req_patch, getenv):
        # Test: exception propagation
        getenv.return_value = None
        req_patch.side_effect = requests.exceptions.ConnectionError()
        with self.assertRaises(requests.exceptions.ConnectionError):
            req(self.url)

        # Test: normal response without cert
        response = MagicMock()
        response.content = "test"
        req_patch.side_effect = None
        req_patch.return_value = response

        result = req(self.url, data=42)

        getenv.assert_has_calls(["test_slug_CERT", "TEST_SLUG_CERT"], any_order=True)
        req_patch.assert_called_once_with(self.url, data=42)
        self.assertEqual("test", result.content)

        # Test: normal response with cert
        cert_tempfile = MagicMock()
        cert_tempfile.name = "temp filename"
        getenv.return_value = "test cert content"
        cert_tempfile.write = MagicMock()
        cert_tempfile.flush = MagicMock()

        with patch('eventkit_cloud.utils.auth_request.NamedTemporaryFile', return_value=cert_tempfile, create=True):
            result = req(self.url, data=42)

        cert_tempfile.write.assert_called_once_with("test cert content")
        cert_tempfile.flush.assert_called()
        req_patch.assert_called_once_with(self.url, data=42, cert="temp filename")
        self.assertEqual("test", result.content)

    @patch('eventkit_cloud.utils.auth_request.os.getenv')
    @patch('eventkit_cloud.utils.auth_request.requests.get')
    def test_get(self, get, getenv):
        self.do_tests(self.requester.get, get, getenv)

    @patch('eventkit_cloud.utils.auth_request.os.getenv')
    @patch('eventkit_cloud.utils.auth_request.requests.post')
    def test_post(self, post, getenv):
        self.do_tests(self.requester.post, post, getenv)
