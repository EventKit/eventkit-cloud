import logging
from unittest.mock import patch, Mock, MagicMock

from django.test import TestCase

from eventkit_cloud.utils.geocoding.geocode_auth_response import (
    GeocodeAuthResponse,
    check_data,
    get_cached_response,
    get_auth_response,
)

logger = logging.getLogger(__name__)


class TestGeoCodeAuthResponse(TestCase):
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.auth_requests")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.get_auth_response")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.get_cached_response")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.os.getenv")
    def test_get_response(self, mock_getenv, mock_get_cached_response, mock_get_auth_response, mock_auth_requests):

        example_url = "http://test.test"
        example_payload = "test_payload"
        geocode_auth_response = GeocodeAuthResponse()
        geocode_auth_response.url = example_url

        # Test no auth.
        mock_getenv.return_value = None
        expected_response = Mock(ok=True)
        mock_auth_requests.get.return_value = expected_response
        self.assertEquals(expected_response, geocode_auth_response.get_response(example_payload))
        mock_auth_requests.get.assert_called_once_with(example_url, params=example_payload)

        # Test cached auth.
        mock_getenv.return_value = True
        expected_response = Mock(ok=True)
        mock_get_cached_response.return_value = expected_response
        self.assertEquals(expected_response, geocode_auth_response.get_response(example_payload))
        mock_get_cached_response.assert_called_once_with(example_url, example_payload)
        mock_get_auth_response.assert_not_called()
        mock_get_cached_response.reset_mock()
        mock_get_auth_response.reset_mock()

        # Test no cache.
        mock_getenv.return_value = True
        expected_response = Mock(ok=True)
        mock_get_cached_response.return_value = None
        mock_get_auth_response.return_value = expected_response
        self.assertEquals(expected_response, geocode_auth_response.get_response(example_payload))
        mock_get_cached_response.assert_called_once_with(example_url, example_payload)
        mock_get_auth_response.assert_called_once_with(example_url, example_payload)
        mock_get_cached_response.reset_mock()
        mock_get_auth_response.reset_mock()

    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.check_data")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.auth_requests")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.get_auth_headers")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.get_session_cookies")
    def test_get_cached_response(
        self, mock_get_session_cookies, mock_get_auth_headers, mock_auth_requests, mock_check_data
    ):
        example_url = "test_headers"
        example_payload = {"test": "payload"}
        example_cookies = "test_cookies"
        example_headers = "test_headers"

        mock_get_session_cookies.return_value = example_cookies
        mock_get_auth_headers.return_value = example_headers
        expected_response = Mock(ok=True)
        mock_auth_requests.get.return_value = expected_response
        mock_check_data.return_value = True
        self.assertEquals(expected_response, get_cached_response(example_url, example_payload))
        mock_auth_requests.get.assert_called_once_with(
            example_url, params=example_payload, cookies=example_cookies, headers=example_headers
        )

        expected_response = Mock(ok=False)
        mock_auth_requests.get.return_value = expected_response
        self.assertIsNone(get_cached_response(example_url, example_payload))

    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.check_data")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.auth_requests")
    @patch("eventkit_cloud.utils.geocoding.geocode_auth_response.update_session_cookies")
    def test_get_auth_response(self, mock_update_session_cookies, mock_auth_requests, mock_check_data):
        example_url = "test_headers"
        example_payload = {"test": "payload"}
        example_cookies = "test_cookies"
        example_headers = "test_headers"
        expected_response = Mock(ok=True, headers=example_headers)
        mock_auth_requests.AuthSession().get.return_value = expected_response
        mock_auth_requests.AuthSession().session.cookies = example_cookies
        self.assertEquals(expected_response, get_auth_response(example_url, example_payload))
        mock_update_session_cookies.assert_called_once_with(example_cookies)
        mock_auth_requests.AuthSession().get.assert_called_once_with(
            example_url, params=example_payload, cert_var="GEOCODING_AUTH_CERT"
        )

        expected_response = Mock(ok=False)
        mock_auth_requests.AuthSession().get.return_value = expected_response
        self.assertIsNone(get_auth_response(example_url, example_payload))

    def test_check_data(self):
        example_response = MagicMock()
        example_response.json.return_value = {"features": []}
        self.assertTrue(check_data(example_response))
        example_response.json.return_value = {"something": []}
        self.assertFalse(check_data(example_response))
