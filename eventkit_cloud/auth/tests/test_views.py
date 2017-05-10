# -*- coding: utf-8 -*-
from __future__ import absolute_import

import logging

from django.test import TestCase
from mock import patch, Mock
from django.contrib.auth.models import User
from ..views import callback
from ..models import OAuth
from django.test import Client, override_settings
from django.core.urlresolvers import reverse
import json
import urllib

logger = logging.getLogger(__name__)


@override_settings(OAUTH_AUTHORIZATION_URL="http://remote.dev/authorize")
class TestAuthViews(TestCase):

    def setUp(self):
        self.client = Client()

    @patch('eventkit_cloud.auth.views.login')
    @patch('eventkit_cloud.auth.views.fetch_user_from_token')
    @patch('eventkit_cloud.auth.views.request_access_token')
    def test_callback(self, mock_get_token, mock_get_user, mock_login):
        oauth_name = "provider"
        with self.settings(OAUTH_NAME=oauth_name):
            example_token = "token"
            request = Mock(GET={'code': "1234"})
            user = User.objects.create(username="test",
                                       email="test@email.com")
            OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
            mock_get_token.return_value = example_token
            mock_get_user.return_value = None
            response = callback(request)
            self.assertEqual(response.status_code, 401)

            mock_get_token.return_value = example_token
            mock_get_user.return_value = user
            response = callback(request)
            self.assertEqual(response.status_code, 200)
            mock_login.assert_called_once_with(request, user)

    def test_oauth(self):
        # Test GET to ensure a provider name is returned for dynamically naming oauth login.
        oauth_name = "provider"
        client_id = "name"
        redirect_uri = "http://test.dev/callback"
        response_type = "code"
        scope = "profile"
        authorization_url = "http://remote.dev/authorize"

        with self.settings(OAUTH_NAME=oauth_name):
            response = self.client.get(reverse('oauth'),{'query':'name'})
            return_name = json.loads(response.content).get('name')
            self.assertEqual(return_name, oauth_name)
            self.assertEqual(response.status_code, 200)

        # Test post to ensure that a valid redirect is returned.
        with self.settings(OAUTH_CLIENT_ID=client_id,
                           OAUTH_REDIRECT_URI=redirect_uri,
                           OAUTH_RESPONSE_TYPE=response_type,
                           OAUTH_SCOPE=scope):
            response = self.client.post(reverse('oauth'))
            params = urllib.urlencode((
                ('client_id', client_id),
                ('redirect_uri', redirect_uri),
                ('response_type', response_type),
                ('scope', scope),
            ))
            self.assertRedirects(response, '{url}?{params}'.format(url=authorization_url.rstrip('/'),
                                                                  params=params),
                                 fetch_redirect_response=False)


    def test_logout(self):
        # Test logout ensure logout of django, and redirect to login if OAUTH URL not provided
        logout_url = "http://remote.dev/logout"
        user = User.objects.create(username="test", password="password", email="test@email.com")
        OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")

        self.client.login(username='test', password='password')
        response = self.client.get(reverse('logout'), follow=True)
        self.assertRedirects(response, reverse('login'), fetch_redirect_response=False)

        # Test logout ensure logout of django and oauth if url is provided
        with self.settings(OAUTH_LOGOUT_URL=logout_url):
            self.client.login(username='test', password='password')
            response = self.client.get(reverse('logout'))
            self.assertRedirects(response, logout_url, fetch_redirect_response=False)


