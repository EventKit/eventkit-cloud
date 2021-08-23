# -*- coding: utf-8 -*-


import json
import logging

import requests
import requests_mock
from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from unittest.mock import patch

from eventkit_cloud.auth.auth import (
    get_user,
    Unauthorized,
    InvalidOauthResponse,
    request_access_tokens,
    get_user_data_from_schema,
    fetch_user_from_token,
    OAuthServerUnreachable,
    OAuthError,
    Error,
)

logger = logging.getLogger(__name__)


@override_settings(OAUTH_AUTHORIZATION_URL="http://example.url/authorize")
class TestAuth(TestCase):
    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def test_get_user(self):
        # create new user
        user_data = {
            "username": "test1",
            "email": "test1@email.com",
            "identification": "test_ident",
            "commonname": "test_common",
        }
        orig_user_data = {
            "username": "test1",
            "email": "test1@email.com",
            "identification": "test_ident",
            "commonname": "test_common",
            "additional_field_1": "sample_value",
            "additional_field_2": 5,
        }
        user = get_user(user_data, orig_user_data)
        self.assertIsInstance(user, User)

        # get existing user
        user_data = {
            "username": "test1",
            "email": "test1@email.com",
            "identification": "test_ident",
            "commonname": "test_common",
        }
        user = get_user(user_data)
        self.assertIsInstance(user, User)

        # get existing user but identification changed
        changed_identification = "test_ident2"
        with patch("eventkit_cloud.auth.auth.authenticate") as mock_authenticate:
            with self.assertRaises(Exception):
                user_data = {
                    "username": "test1",
                    "email": "test1@email.com",
                    "identification": changed_identification,
                    "commonname": "test_common",
                }
                user = get_user(user_data)
                self.assertIsInstance(user, User)
            mock_authenticate.called_once_with(username=changed_identification)

    @override_settings(
        OAUTH_TOKEN_URL="http://example.url/token",
        OAUTH_CLIENT_ID="ID_CODE",
        OAUTH_CLIENT_SECRET="SECRET_CODE",
        OAUTH_REDIRECT_URI="http://example.url/callback",
        OAUTH_TOKEN_KEY="access_token",
        OAUTH_REFRESH_KEY="refresh_token",
    )
    def test_request_access_token(self):
        example_auth_code = "1234"
        example_access_token = "5678"
        example_refresh_token = "2345"

        # Test unauthorized users
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, status_code=401)
        with self.assertRaises(Unauthorized):
            request_access_tokens(example_auth_code)

        # Test bad/unexpected responses
        self.mock_requests.post(
            settings.OAUTH_TOKEN_URL, text=json.dumps({settings.OAUTH_TOKEN_KEY: None}), status_code=200
        )
        with self.assertRaises(InvalidOauthResponse):
            request_access_tokens(example_auth_code)

        # Test valid responses
        self.mock_requests.post(
            settings.OAUTH_TOKEN_URL,
            text=json.dumps(
                {settings.OAUTH_TOKEN_KEY: example_access_token, settings.OAUTH_REFRESH_KEY: example_refresh_token}
            ),
            status_code=200,
        )
        returned_token, returned_refresh_token = request_access_tokens(example_auth_code)
        self.assertEqual(example_access_token, returned_token)
        self.assertEqual(example_refresh_token, returned_refresh_token)

        # Test connection issues
        with patch("requests.Session.post") as mock_post:
            mock_post.side_effect = requests.ConnectionError()
            with self.assertRaises(OAuthServerUnreachable):
                request_access_tokens(OAuthServerUnreachable)

        # Test remote server error
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, status_code=404)
        with self.assertRaises(OAuthError):
            request_access_tokens(OAuthError)

    def test_get_user_data_from_schema(self):

        example_schema = {
            "identification": ["DN"],
            "commonname": "username",
            "username": "username",
            "email": ["email", "mail", "email_address"],
            "first_name": ["firstname", "first_name"],
            "last_name": ["lastname", "surname", "last_name"],
        }

        example_data = {
            "DN": "long_dn",
            "username": "test",
            "mail": "test@email.dev",
            "email_address": "othertest@email.dev",
            "first_name": "test",
            "lastname": "user",
        }

        expected_response = {
            "identification": "long_dn",
            "commonname": "test",
            "username": "test",
            "email": "test@email.dev",
            "first_name": "test",
            "last_name": "user",
        }

        with self.settings(OAUTH_PROFILE_SCHEMA=json.dumps(example_schema)):
            response = get_user_data_from_schema(example_data)
            self.assertEqual(response, expected_response)

        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA=None):
                get_user_data_from_schema(example_data)

        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA="{}"):
                get_user_data_from_schema(example_data)

        with self.assertRaises(AttributeError):
            with self.settings(OAUTH_PROFILE_SCHEMA="{}"):
                del settings.OAUTH_PROFILE_SCHEMA
                get_user_data_from_schema(example_data)

        bad_json = '{"test":"test}'
        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA=bad_json):
                get_user_data_from_schema(example_data)

    @patch("eventkit_cloud.auth.auth.get_user")
    @patch("eventkit_cloud.auth.auth.get_user_data_from_schema")
    @override_settings(OAUTH_PROFILE_URL="http://example.url/token")
    def test_fetch_user_from_token(self, mock_get_user_data, mock_get_user):
        user_data = {"user": "DATA"}
        example_user_data = {
            "identification": "long_dn",
            "commonname": "test",
            "username": "test",
            "email": "test@email.dev",
            "first_name": "test",
            "last_name": "user",
        }
        example_token = "1234"

        # Test valid token
        self.mock_requests.get(settings.OAUTH_PROFILE_URL, text=json.dumps(user_data), status_code=200)
        mock_get_user_data.return_value = example_user_data
        fetch_user_from_token(example_token)
        mock_get_user_data.assert_called_with(user_data)
        mock_get_user.assert_called_with(example_user_data, user_data)

        # Test invalid token
        self.mock_requests.get(settings.OAUTH_PROFILE_URL, status_code=401)
        with self.assertRaises(Unauthorized):
            fetch_user_from_token(example_token)

        # Test connection issues
        self.mock_requests.get(settings.OAUTH_PROFILE_URL, text=json.dumps(user_data), status_code=200)
        with patch("requests.Session.get") as mock_get:
            mock_get.side_effect = requests.ConnectionError()
            with self.assertRaises(OAuthServerUnreachable):
                fetch_user_from_token(OAuthServerUnreachable)
