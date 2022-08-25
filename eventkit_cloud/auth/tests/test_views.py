# -*- coding: utf-8 -*-
import base64
import logging
import urllib
from unittest.mock import MagicMock, patch

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.sessions.middleware import SessionMiddleware
from django.test import Client, RequestFactory, TestCase, override_settings
from django.urls import reverse

from eventkit_cloud.auth.auth import OAuthError
from eventkit_cloud.auth.models import OAuth
from eventkit_cloud.auth.views import callback, has_valid_access_token, oauth

logger = logging.getLogger(__name__)


@override_settings(OAUTH_AUTHORIZATION_URL="http://remote.dev/authorize")
class TestAuthViews(TestCase):
    def setUp(self):
        self.client = Client()

    @patch("eventkit_cloud.auth.views.login")
    @patch("eventkit_cloud.auth.views.fetch_user_from_token")
    @patch("eventkit_cloud.auth.views.request_access_tokens")
    def test_callback(self, mock_get_tokens, mock_get_user, mock_login):
        oauth_name = "provider"
        with self.settings(OAUTH_NAME=oauth_name):
            example_access_token = "token"
            example_refresh_token = "refresh"

            request = MagicMock(GET={"code": "1234"})


            group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
            with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
                mock_group.objects.get.return_value = group
            user = User.objects.create(username="test", email="test@email.com")
            OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
            request.user = user
            mock_get_tokens.return_value = example_access_token, example_refresh_token
            mock_get_user.return_value = None
            response = callback(request)
            self.assertEqual(response.status_code, 401)

            mock_get_tokens.return_value = example_access_token, example_refresh_token
            mock_get_user.return_value = user
            response = callback(request)
            mock_login.assert_called_once_with(request, user, backend="django.contrib.auth.backends.ModelBackend")
            self.assertRedirects(response, "/dashboard", fetch_redirect_response=False)

            mock_login.reset_mock()
            example_state = base64.b64encode("/status/12345".encode())
            request = MagicMock(GET={"code": "1234", "state": example_state})
            request.user = user

            mock_get_tokens.return_value = example_access_token, example_refresh_token
            mock_get_user.return_value = user
            response = callback(request)
            mock_login.assert_called_once_with(request, user, backend="django.contrib.auth.backends.ModelBackend")
            self.assertRedirects(response, base64.b64decode(example_state).decode(), fetch_redirect_response=False)

    def test_oauth(self):
        # Test GET to ensure a provider name is returned for dynamically naming oauth login.
        oauth_name = "provider"
        client_id = "name"
        redirect_uri = "http://test.dev/callback"
        response_type = "code"
        scope = "profile"
        authorization_url = "http://remote.dev/authorize"
        referer = "/status/12345"

        with self.settings(OAUTH_NAME=oauth_name):
            response = self.client.get(reverse("oauth"), {"query": "name"})
            return_name = response.json().get("name")
            self.assertEqual(return_name, oauth_name)
            self.assertEqual(response.status_code, 200)

        # Test post to ensure that a valid redirect is returned.
        with self.settings(
            OAUTH_CLIENT_ID=client_id,
            OAUTH_REDIRECT_URI=redirect_uri,
            OAUTH_RESPONSE_TYPE=response_type,
            OAUTH_SCOPE=scope,
            OAUTH_NAME=oauth_name,
        ):
            response = self.client.post(reverse("oauth"))
            params = urllib.parse.urlencode(
                (
                    ("client_id", client_id),
                    ("redirect_uri", redirect_uri),
                    ("response_type", response_type),
                    ("scope", scope),
                )
            )
            self.assertRedirects(
                response,
                "{url}?{params}".format(url=authorization_url.rstrip("/"), params=params),
                fetch_redirect_response=False,
            )

            user = User.objects.create(username="test", password="password", email="test@email.com")
            OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
            mock_request = MagicMock()
            mock_request.META = {"HTTP_REFERER": referer}
            mock_request.GET = {"query": None}
            mock_request.user = user

            response = oauth(mock_request)
            params = urllib.parse.urlencode(
                (
                    ("client_id", client_id),
                    ("redirect_uri", redirect_uri),
                    ("response_type", response_type),
                    ("scope", scope),
                    ("state", base64.b64encode(referer.encode())),
                )
            )
            self.assertRedirects(
                response,
                "{url}?{params}".format(url=authorization_url.rstrip("/"), params=params),
                fetch_redirect_response=False,
            )

    @patch("eventkit_cloud.auth.views.fetch_user_from_token")
    @patch("eventkit_cloud.auth.views.request_access_tokens")
    def test_logout(self, mock_get_tokens, mock_fetch_user):
        # Test logout ensure logout of django, and redirect to login if OAUTH URL not provided
        example_auth_code = "code"
        example_access_token = "token"
        example_refresh_token = "refresh"

        logout_url = "http://remote.dev/logout"
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create(username="test", password="password", email="test@email.com")
        OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
        mock_get_tokens.return_value = example_access_token, example_refresh_token
        mock_fetch_user.return_value = user

        # test without logout url
        with self.settings(OAUTH_LOGOUT_URL=None):
            self.client.get(reverse("callback"), params={"code": example_auth_code}, follow=True)
            response = self.client.get(reverse("logout"), follow=True)
            self.assertRedirects(response, reverse("login"), fetch_redirect_response=False)

        # test with logout url
        with self.settings(OAUTH_LOGOUT_URL=logout_url):
            self.client.login(username="test", password="password")
            self.client.get(reverse("callback"), params={"code": example_auth_code}, follow=True)
            response = self.client.get(reverse("logout"))
            self.assertEqual(response.json().get("OAUTH_LOGOUT_URL"), settings.OAUTH_LOGOUT_URL)

    @override_settings(
        OAUTH_TOKEN_URL="http://example.url/token",
        OAUTH_CLIENT_ID="ID_CODE",
        OAUTH_CLIENT_SECRET="SECRET_CODE",
        OAUTH_REDIRECT_URI="http://example.url/callback",
        OAUTH_TOKEN_KEY="access_token",
        OAUTH_REFRESH_KEY="refresh_token",
    )
    @patch("eventkit_cloud.auth.views.fetch_user_from_token")
    @patch("eventkit_cloud.auth.views.refresh_access_tokens")
    def test_check_oauth_authentication(self, mock_refresh_tokens, mock_fetch_user):
        invalid_token = "invalid_token"
        example_token = "token"
        example_refresh_token = "refresh"
        user = User.objects.create(username="test", password="password", email="test@email.com")
        OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")

        request = RequestFactory().get("/")
        request.user = user
        middleware = SessionMiddleware(lambda x: x)
        middleware.process_request(request)
        request.session.save()

        # Test with no token.
        valid_access_token = has_valid_access_token(request)
        self.assertEqual(valid_access_token, False)

        # Test with the return value from fetch_user_from_token being OAuthError aka an invalid token.
        with self.assertRaises(OAuthError):
            request.session["access_token"] = invalid_token
            mock_fetch_user.side_effect = OAuthError(401)
            mock_refresh_tokens.side_effect = OAuthError(401)
            valid_access_token = has_valid_access_token(request)
            mock_fetch_user.assert_called_with(invalid_token)
            self.assertEqual(valid_access_token, False)

        # Test with the refresh token returning a new valid access token.
        with self.assertRaises(OAuthError):
            request.session["access_token"] = invalid_token
            mock_fetch_user.side_effect = OAuthError(401)
            mock_refresh_tokens.return_value = (example_token, example_refresh_token)
            valid_access_token = has_valid_access_token(request)
            mock_fetch_user.assert_called_with(example_token)
            self.assertEqual(valid_access_token, True)

        # Test with a mocked return value of a valid user from fetch_user_from_token
        mock_fetch_user.reset_mock(side_effect=True)
        request.session["access_token"] = example_token
        valid_access_token = has_valid_access_token(request)
        mock_fetch_user.assert_called_with(example_token)
        self.assertEqual(valid_access_token, True)
