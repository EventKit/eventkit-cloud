# -*- coding: utf-8 -*-
import logging
import requests
from django.test import TransactionTestCase
from mock import Mock, patch, MagicMock

from ..auth_requests import get, post

logger = logging.getLogger(__name__)


class TestAuthResult(TransactionTestCase):

    def setUp(self):
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

        getenv.assert_called_once_with("test_slug_CERT")
        req_patch.assert_called_once_with(self.url, data=42)
        self.assertEqual("test", result.content)

        # Test: normal response with cert
        cert_tempfile = MagicMock()
        cert_tempfile.name = "temp filename"
        getenv.return_value = "test cert content"
        cert_tempfile.write = MagicMock()
        cert_tempfile.flush = MagicMock()

        with patch('eventkit_cloud.utils.auth_requests.NamedTemporaryFile', return_value=cert_tempfile, create=True):
            result = req(self.url, data=42)

        cert_tempfile.write.assert_called_once_with("test cert content")
        cert_tempfile.flush.assert_called()
        req_patch.assert_called_once_with(self.url, data=42, cert="temp filename")
        self.assertEqual("test", result.content)

    @patch('eventkit_cloud.utils.auth_requests.os.getenv')
    @patch('eventkit_cloud.utils.auth_requests.requests.get')
    def test_get(self, get_patch, getenv):
        self.do_tests(get, get_patch, getenv)

    @patch('eventkit_cloud.utils.auth_requests.os.getenv')
    @patch('eventkit_cloud.utils.auth_requests.requests.post')
    def test_post(self, post_patch, getenv):
        self.do_tests(post, post_patch, getenv)
