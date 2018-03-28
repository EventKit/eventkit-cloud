# -*- coding: utf-8 -*-
import logging
import requests
import httplib
from django.test import TransactionTestCase
from mock import Mock, patch, MagicMock, ANY
from mapproxy.client.http import VerifiedHTTPSConnection

from .. import auth_requests

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

        result = req(self.url, slug="test_slug", data=42)

        getenv.assert_called_with("TEST_SLUG_CERT")
        req_patch.assert_called_with(self.url, data=42)
        self.assertEqual("test", result.content)

        # Test: normal response with cert
        getenv.return_value = "test cert content"

        named_tempfile = MagicMock()
        cert_tempfile = MagicMock()
        cert_tempfile.name = "temp filename"
        named_tempfile.__enter__ = MagicMock(return_value=cert_tempfile)
        cert_tempfile.write = MagicMock()
        cert_tempfile.flush = MagicMock()

        with patch('eventkit_cloud.utils.auth_requests.NamedTemporaryFile', return_value=named_tempfile, create=True):
            result = req(self.url, slug="test_slug", data=42)

        getenv.assert_called_with("test_slug_CERT")
        cert_tempfile.write.assert_called_once_with("test cert content")
        cert_tempfile.flush.assert_called()
        req_patch.assert_called_with(self.url, data=42, cert="temp filename")
        self.assertEqual("test", result.content)

    @patch('eventkit_cloud.utils.auth_requests.os.getenv')
    @patch('eventkit_cloud.utils.auth_requests.requests.get')
    def test_get(self, get_patch, getenv):
        self.do_tests(auth_requests.get, get_patch, getenv)

    @patch('eventkit_cloud.utils.auth_requests.os.getenv')
    @patch('eventkit_cloud.utils.auth_requests.requests.post')
    def test_post(self, post_patch, getenv):
        self.do_tests(auth_requests.post, post_patch, getenv)

    @patch('eventkit_cloud.utils.auth_requests.os.getenv')
    def test_patch_https(self, getenv):
        # NB: HTTPSConnection is never mocked here; the monkey-patch applies to the actual httplib library.
        # If other tests in the future have any issues with httplib (they shouldn't, the patch is transparent,
        # and the original initializer is restored in the finally block), this may be why.

        orig_init = auth_requests._ORIG_HTTPSCONNECTION_INIT
        try:
            new_orig_init = MagicMock()
            auth_requests._ORIG_HTTPSCONNECTION_INIT = new_orig_init
            # Confirm that the patch is applied
            getenv.return_value = "key and cert contents"
            auth_requests.patch_https("test-provider-slug")
            self.assertNotEqual(auth_requests._ORIG_HTTPSCONNECTION_INIT, httplib.HTTPSConnection.__init__)
            self.assertEqual("_new_init", httplib.HTTPSConnection.__init__
                             .__func__.func_closure[1].cell_contents.__name__)  # complicated because decorator

            named_tempfile = MagicMock()
            cert_tempfile = MagicMock()
            cert_tempfile.name = "temp filename"
            named_tempfile.__enter__ = MagicMock(return_value=cert_tempfile)
            cert_tempfile.write = MagicMock()
            cert_tempfile.flush = MagicMock()

            with patch('eventkit_cloud.utils.auth_requests.NamedTemporaryFile', return_value=named_tempfile,
                       create=True):
                # Confirm that a base HTTPSConnection picks up key and cert files
                conn = httplib.HTTPSConnection()
                getenv.assert_called_with("test-provider-slug_CERT")
                new_orig_init.assert_called_with(ANY, key_file="temp filename", cert_file="temp filename")
                cert_tempfile.write.assert_called_once_with("key and cert contents")

                # Confirm that a MapProxy VerifiedHTTPSConnection picks up key and cert files
                cert_tempfile.write.reset_mock()
                conn = VerifiedHTTPSConnection()
                new_orig_init.assert_called_with(ANY, key_file="temp filename", cert_file="temp filename")
                cert_tempfile.write.assert_called_once_with("key and cert contents")

                # Test removing the patch
                auth_requests.unpatch_https()
                self.assertEqual(httplib.HTTPSConnection.__init__, new_orig_init)

        finally:
            auth_requests._ORIG_HTTPSCONNECTION_INIT = orig_init
