# -*- coding: utf-8 -*-
from __future__ import absolute_import

import logging

from django.test import TestCase
from mock import patch, Mock
from django.contrib.auth.models import User, Group
from ..views import callback
from ..models import OAuth
from django.test import Client, override_settings
from django.core.urlresolvers import reverse
from django.conf import settings
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
            group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
            with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
                mock_group.objects.get.return_value = group
            user = User.objects.create(username="test",
                                       email="test@email.com")
            OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
            mock_get_token.return_value = example_token
            mock_get_user.return_value = None
            response = callback(request)
            self.assertEqual(response.status_code, 401)

            mock_get_token.return_value = example_token
            mock_get_user.return_value = user
            callback(request)
            mock_login.assert_called_once_with(request, user, backend='django.contrib.auth.backends.ModelBackend')

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

    @patch('eventkit_cloud.auth.views.fetch_user_from_token')
    @patch('eventkit_cloud.auth.views.request_access_token')
    def test_logout(self, mock_access_token, mock_fetch_user):
        # Test logout ensure logout of django, and redirect to login if OAUTH URL not provided
        example_auth_code = 'code'
        example_token = 'token'

        logout_url = "http://remote.dev/logout"
        group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = group
            user = User.objects.create(username="test", password="password", email="test@email.com")
        OAuth.objects.create(user=user, identification="test_ident", commonname="test_common")
        mock_access_token.return_value = example_token
        mock_fetch_user.return_value = user

        #test without logout url
        with self.settings(OAUTH_LOGOUT_URL=None):
            self.client.get(reverse('callback'), params={'code': example_auth_code}, follow=True)
            response = self.client.get(reverse('logout'), follow=True)
            self.assertRedirects(response, reverse('login'), fetch_redirect_response=False)

        #test with logout url
        with self.settings(OAUTH_LOGOUT_URL=logout_url):
            self.client.login(username='test', password='password')
            self.client.get(reverse('callback'), params={'code': example_auth_code}, follow=True)
            response = self.client.get(reverse('logout'))
            self.assertEquals(response.json().get('OAUTH_LOGOUT_URL'), settings.OAUTH_LOGOUT_URL)


