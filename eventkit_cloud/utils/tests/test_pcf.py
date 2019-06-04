# -*- coding: utf-8 -*-
import logging
from django.test import TestCase
from eventkit_cloud.utils.pcf import PcfClient
import json
import requests_mock
from mock import patch

logger = logging.getLogger(__name__)


class TestPcfClient(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.api_url = 'http://api.example.dev'
        self.auth_url = 'http://auth.example.dev'
        self.token_url = 'http://token.example.dev'
        self.routing_url = f"{self.api_url}/routing"
        self.org = 'org'
        self.space = 'space'
        self.info = {
            "name": "Application Service",
            "support": self.api_url,
            "version": 0,
            "description": "https://docs.pivotal.io/pivotalcf/2-3/pcf-release-notes/runtime-rn.html",
            "authorization_endpoint": self.auth_url,
            "token_endpoint": self.token_url,
            "routing_endpoint": "https://api.system.dev.east.paas.geointservices.io/routing"
        }
        self.client = PcfClient(api_url=self.api_url, org_name=self.org, space_name=self.space)

    @patch("eventkit_cloud.utils.pcf.PcfClient.get_space_guid")
    @patch("eventkit_cloud.utils.pcf.PcfClient.get_org_guid")
    @patch("eventkit_cloud.utils.pcf.PcfClient.get_token")
    @patch("eventkit_cloud.utils.pcf.PcfClient.get_info")
    def test_login(self, mock_get_info, mock_get_token, mock_get_org_guid, mock_get_space_guid):
        mock_get_org_guid.return_value = "org_guid", self.org
        mock_get_space_guid.return_value = "space_guid", self.space
        self.client.login()
        mock_get_info.assert_called_once()
        mock_get_token.assert_called_once()
        mock_get_org_guid.assert_called_once_with(org_name=self.org)
        mock_get_space_guid.assert_called_once_with(space_name=self.space)

        with self.assertRaises(Exception):
            self.client.org_name = None
            self.client.login()

    def test_get_info(self):
        self.mock_requests.get("{0}/v2/info".format(self.api_url.rstrip('/')), text=json.dumps(self.info), status_code=200)
        response = self.client.get_info()
        self.assertEqual(self.info, response)

    def test_get_token(self):
        self.client.info = self.info
        example_token = "token"
        example_response = {"access_token": example_token}
        login_url = "{0}/login".format(self.info.get('authorization_endpoint').rstrip('/'))
        expected_response = {"provider": "provider_name"}
        self.mock_requests.get(login_url, status_code=200)

        token_url = "{0}/oauth/token".format(self.info.get('authorization_endpoint').rstrip('/'))
        self.mock_requests.post(token_url, text=json.dumps(example_response), status_code=200)
        token = self.client.get_token()
        self.assertEqual(token, example_token)

        # Test no token
        with self.assertRaises(Exception):
            self.mock_requests.post(token_url, text=json.dumps({}), status_code=200)
            self.client.get_token()

        # Test invalid credentials
        with self.assertRaises(Exception):
            self.mock_requests.post(token_url, text=json.dumps({}), status_code=401)
            self.client.get_token()

