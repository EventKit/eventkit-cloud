# -*- coding: utf-8 -*-


import logging
import os
from unittest.mock import MagicMock, Mock, patch

from django.test import TestCase, override_settings

from eventkit_cloud.core.helpers import (
    get_cached_model,
    get_id,
    get_model_by_params,
    get_or_update_session,
    verify_login_callback,
)

logger = logging.getLogger(__name__)


class TestCoreHelpers(TestCase):
    def test_get_id(self):
        username = "test"

        # test regular user (no oauth)
        mock_user = Mock(username=username)
        del mock_user.oauth
        user_identification = get_id(mock_user)
        self.assertEqual(user_identification, username)

        # test oauth user
        mock_user_oauth = Mock(oauth=Mock(identification=username))
        user_identification = str(get_id(mock_user_oauth))
        self.assertEqual(user_identification, username)

    @patch("eventkit_cloud.core.helpers.cache")
    def test_get_cached_model(self, mocked_cache: MagicMock):
        export_provider = MagicMock()
        expected_name = "SomeProvider"
        expected_prop = "slug"
        expected_val = "osm"
        export_provider.__name__ = expected_name

        mocked_cache.get_or_set.return_value = export_provider
        get_model = get_model_by_params(export_provider)

        return_value = get_cached_model(export_provider, expected_prop, expected_val)

        self.assertEquals(export_provider, return_value)
        expected_call_value = f"{expected_name}-{expected_prop}-{expected_val}"

        mocked_cache.get_or_set.assert_called_once_with(expected_call_value, get_model, 360)

    @override_settings(SSL_VERIFICATION=10)
    @patch.dict(os.environ, {"CERT_PATH": "mytemp"})
    @patch("eventkit_cloud.utils.auth_requests.get_cred")
    def test_get_or_update_session(self, mock_get_cred):
        expected_headers = {"test": "value"}
        cert_info = {"cert_path": "path/to/file", "cert_pass_var": "CERT_PATH"}
        expected_user = "cred_user"
        expected_pass = "cred_pass"
        mock_get_cred.return_value = [expected_user, expected_pass]
        session = get_or_update_session(headers=expected_headers, cert_info=cert_info, slug="abc")
        self.assertEqual(session.auth, (expected_user, expected_pass))
        self.assertEqual(len(session.adapters), 2)
        self.assertTrue(expected_headers.items() <= dict(session.headers).items())
        self.assertEqual(session.verify, 10)

    def test_verify_login(self):
        expected_response = Mock()
        mock_session = Mock(get=Mock(return_value=expected_response))
        login_url = "http://auth.test/url"
        response_url = "http://auth.test/resource"
        original_url = "http://data.test/"
        mock_response = Mock(url=response_url)
        mock_response.request.url = original_url
        verify_login = verify_login_callback(login_url, mock_session)
        self.assertEqual(expected_response, verify_login(mock_response))
