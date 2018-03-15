# -*- coding: utf-8 -*-
from __future__ import absolute_import

import logging

from django.test import TestCase, override_settings
from mock import patch, Mock
from django.contrib.auth.models import User
from django.conf import settings
from ..auth import (get_user, Unauthorized, InvalidOauthResponse, request_access_token, get_user_data_from_schema,
                    fetch_user_from_token, OAuthServerUnreachable, OAuthError, Error)
import requests
import requests_mock
import json

logger = logging.getLogger(__name__)

@override_settings(OAUTH_AUTHORIZATION_URL="http://example.url/authorize")
class TestAuth(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def test_get_user(self):
        # create new user
        user_data = {"username": "test1", "email": "test1@email.com",
                     "identification": "test_ident", "commonname": "test_common"}
        orig_user_data = {"username": "test1", "email": "test1@email.com",
                          "identification": "test_ident", "commonname": "test_common",
                          "additional_field_1": "sample_value", "additional_field_2": 5}
        user = get_user(user_data, orig_user_data)
        self.assertIsInstance(user, User)

        # get existing user
        user_data = {"username": "test1", "email": "test1@email.com",
                     "identification": "test_ident", "commonname": "test_common"}
        user = get_user(user_data)
        self.assertIsInstance(user, User)

    @override_settings(OAUTH_TOKEN_URL="http://example.url/token",
                       OAUTH_CLIENT_ID="ID_CODE",
                       OAUTH_CLIENT_SECRET="SECRET_CODE",
                       OAUTH_REDIRECT_URI="http://example.url/callback",
                       OAUTH_TOKEN_KEY="access_token")
    def test_request_access_token(self):
        example_auth_code = "1234"
        example_access_token = "5678"

        # Test unauthorized users
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, status_code=401)
        with self.assertRaises(Unauthorized):
            request_access_token(example_auth_code)

        # Test bad/unexpected responses
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, text=json.dumps({settings.OAUTH_TOKEN_KEY: None}), status_code=200)
        with self.assertRaises(InvalidOauthResponse):
            request_access_token(example_auth_code)

        # Test valid responses
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, text=json.dumps({settings.OAUTH_TOKEN_KEY: example_access_token}), status_code=200)
        returned_token = request_access_token(example_auth_code)
        self.assertEqual(example_access_token, returned_token)

        # Test connection issues
        with patch('eventkit_cloud.auth.auth.requests.post') as mock_post:
            mock_post.side_effect = requests.ConnectionError()
            with self.assertRaises(OAuthServerUnreachable):
                request_access_token(OAuthServerUnreachable)

        # Test remote server error
        self.mock_requests.post(settings.OAUTH_TOKEN_URL, status_code=404)
        with self.assertRaises(OAuthError):
            request_access_token(OAuthError)

    def test_get_user_data_from_schema(self):

        example_schema = {"identification": ["DN"], "commonname": "username", "username": "username",
                          "email": ["email", "mail", "email_address"], "first_name": ["firstname", "first_name"],
                          "last_name": ["lastname", "surname", "last_name"]}

        example_data = {"DN": "long_dn", "username": "test", "mail": "test@email.dev",
                        "email_address": "othertest@email.dev", "first_name": "test", "lastname": "user"}

        expected_response = {"identification": "long_dn", "commonname": "test", "username": "test",
                             "email": "test@email.dev", "first_name": "test", "last_name": "user"}

        with self.settings(OAUTH_PROFILE_SCHEMA=json.dumps(example_schema)):
            response = get_user_data_from_schema(example_data)
            self.assertEqual(response, expected_response)

        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA=None):
                get_user_data_from_schema(example_data)

        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA='{}'):
                get_user_data_from_schema(example_data)

        with self.assertRaises(AttributeError):
            with self.settings(OAUTH_PROFILE_SCHEMA='{}'):
                del settings.OAUTH_PROFILE_SCHEMA
                get_user_data_from_schema(example_data)

        bad_json = '{"test":"test}'
        with self.assertRaises(Error):
            with self.settings(OAUTH_PROFILE_SCHEMA=bad_json):
                get_user_data_from_schema(example_data)



    @patch('eventkit_cloud.auth.auth.get_user')
    @patch('eventkit_cloud.auth.auth.get_user_data_from_schema')
    @override_settings(OAUTH_PROFILE_URL="http://example.url/token")
    def test_fetch_user_from_token(self, mock_get_user_data, mock_get_user):
        user_data = {"user": "DATA"}
        example_user_data = {"identification": "long_dn", "commonname": "test", "username": "test",
                             "email": "test@email.dev", "first_name": "test", "last_name": "user"}
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
        with patch('eventkit_cloud.auth.auth.requests.get') as mock_post:
            mock_post.side_effect = requests.ConnectionError()
            with self.assertRaises(OAuthServerUnreachable):
                fetch_user_from_token(OAuthServerUnreachable)
