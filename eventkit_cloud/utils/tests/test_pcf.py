# -*- coding: utf-8 -*-
import logging
from django.test import TestCase
from ..pcf import PcfClient
import json
import requests_mock

logger = logging.getLogger(__name__)


class TestPcfClient(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.url = 'http://example.dev'
        self.org = 'org'
        self.space = 'space'


    def test_get_providers(self):
        expected_response = {"provider": "provider_name"}
        self.mock_requests.get(self.client.providers_url, text=json.dumps(expected_response), status_code=200)
        providers = self.client.get_providers()
        self.assertEqual(expected_response, providers)

        with self.assertRaises(Exception):
            self.mock_requests.get(self.client.providers_url, text=json.dumps(expected_response), status_code=400)
            self.client.get_providers()

