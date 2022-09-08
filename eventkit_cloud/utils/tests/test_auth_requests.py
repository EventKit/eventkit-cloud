# -*- coding: utf-8 -*-
import http.client
import logging
import os
import urllib
from unittest.mock import ANY, MagicMock, mock_open, patch

import requests
from django.test import TransactionTestCase

from eventkit_cloud.utils import auth_requests
from mapproxy.client.http import VerifiedHTTPSConnection, _URLOpenerCache

logger = logging.getLogger(__name__)


class TestAuthResult(TransactionTestCase):
    def setUp(self):
        self.url = "http://example.test/"

    def do_tests(self, req, req_patch):
        # Test: exception propagation
        req_patch.side_effect = requests.exceptions.ConnectionError()
        with self.assertRaises(Exception):
            req(self.url)

        # Test: normal response without cert
        response = MagicMock()
        response.content = "test"
        req_patch.side_effect = None
        req_patch.return_value = response

        cert_info = dict(cert_path="fake/path/to", cert_pass_var="fakepassvar")
        result = req(self.url, cert_info=cert_info, data=42)

        req_patch.assert_called_with(self.url, data=42, pkcs12_filename="fake/path/to", pkcs12_password="FAKEPASS")
        self.assertEqual("test", result.content)

        result = req(self.url, cert_info=None, data=42)

        req_patch.assert_called_with(self.url, data=42)
        self.assertEqual("test", result.content)

    @patch.dict(os.environ, {"fakepassvar": "FAKEPASS"})
    @patch("eventkit_cloud.utils.auth_requests.create_pyopenssl_sslcontext")
    @patch("eventkit_cloud.utils.auth_requests.os.getenv")
    def test_patch_https(self, getenv, create_ssl_sslcontext):
        # NB: HTTPSConnection is never mocked here; the monkey-patch applies to the actual httplib library.
        # If other tests in the future have any issues with httplib (they shouldn't, the patch is transparent,
        # and the original initializer is restored in the finally block), this may be why.

        orig_init = auth_requests._ORIG_HTTPSCONNECTION_INIT
        try:
            new_orig_init = MagicMock()
            auth_requests._ORIG_HTTPSCONNECTION_INIT = new_orig_init
            # Confirm that the patch is applied
            getenv.return_value = "key and cert contents"
            auth_requests.patch_https(dict(cert_path="fake/path/to", cert_pass_var="fakepassvar"))
            self.assertNotEqual(auth_requests._ORIG_HTTPSCONNECTION_INIT, http.client.HTTPSConnection.__init__)
            self.assertEqual(
                "_new_init", http.client.HTTPSConnection.__init__.__name__
            )  # complicated because decorator

            with patch("builtins.open", mock_open(read_data="data")):
                # Confirm that a base HTTPSConnection picks up the passed ssl context object
                create_ssl_sslcontext.return_value = "sslcontext"
                http.client.HTTPSConnection()
                new_orig_init.assert_called_with(ANY, context="sslcontext")

                VerifiedHTTPSConnection()
                new_orig_init.assert_called_with(ANY, context="sslcontext")

                # Test removing the patch
                auth_requests.unpatch_https()
                self.assertEqual(http.client.HTTPSConnection.__init__, new_orig_init)

        finally:
            auth_requests._ORIG_HTTPSCONNECTION_INIT = orig_init
            auth_requests.unpatch_https()

    def test_mapproxy_opener_patch(self):
        orig_call = auth_requests._ORIG_URLOPENERCACHE_CALL
        try:
            new_orig_call = MagicMock()
            auth_requests._ORIG_URLOPENERCACHE_CALL = new_orig_call
            # Confirm that the patch is applied
            auth_requests.patch_mapproxy_opener_cache()
            self.assertEqual("_new_call", _URLOpenerCache.__call__.__name__)
            create_url_opener = _URLOpenerCache()
            opener = create_url_opener(None, "example.com", "test_user", "test_password")
            self.assertTrue(any([isinstance(h, urllib.request.HTTPCookieProcessor) for h in opener.handlers]))

            # Test removing the patch
            auth_requests.unpatch_mapproxy_opener_cache()
            self.assertEqual(new_orig_call, _URLOpenerCache.__call__)

        finally:
            auth_requests._ORIG_URLOPENERCACHE_CALL = orig_call
            auth_requests.unpatch_mapproxy_opener_cache()
