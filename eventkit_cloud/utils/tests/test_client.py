# -*- coding: utf-8 -*-
import json
import logging

import requests_mock
from django.test import TestCase

from eventkit_cloud.utils.client import EventKitClient

logger = logging.getLogger(__name__)


class TestClient(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)


        self.url = 'http://example.dev'
        self.username = "user"
        self.pcode = "pcode"
        cookies = {'csrftoken': 'token'}

        self.mock_requests.get("{0}/api/login".format(self.url), status_code=200)
        self.mock_requests.post("{0}/api/login".format(self.url), status_code=200, cookies=cookies)
        self.mock_requests.get(self.url, status_code=200, cookies=cookies)
        self.mock_requests.get("{0}/create".format(self.url), status_code=200, cookies=cookies)
        with self.settings(SESSION_COOKIE_DOMAIN=self.url):
            self.client = EventKitClient(self.url, self.username, self.pcode)

    def test_get_providers(self):
        expected_response = {"provider": "provider_name"}
        self.mock_requests.get(self.client.providers_url, text=json.dumps(expected_response), status_code=200)
        providers = self.client.get_providers()
        self.assertEqual(expected_response, providers)

        with self.assertRaises(Exception):
            self.mock_requests.get(self.client.providers_url, text=json.dumps(expected_response), status_code=400)
            self.client.get_providers()

    def test_get_runs(self):
        expected_response = {"runs": "runs"}
        self.mock_requests.get("{0}/filter".format(self.client.runs_url), text=json.dumps(expected_response), status_code=200)
        runs = self.client.get_runs()
        self.assertEqual(expected_response, runs)

        with self.assertRaises(Exception):
            self.mock_requests.get("{0}/filter".format(self.client.runs_url), text=json.dumps(expected_response), status_code=400)
            self.client.get_runs()

    def test_run_job(self):
        expected_response = {"runs": "runs"}
        self.mock_requests.post(self.client.jobs_url, text=json.dumps(expected_response), status_code=202)
        job_response = self.client.run_job(name='Name', description='Description', project='Project')
        self.assertEqual(expected_response, job_response)

        with self.assertRaises(Exception):
            self.mock_requests.post(self.client.jobs_url, text=json.dumps(expected_response), status_code=400)
            self.client.run_job(name='Name', description='Description', project='Project')

        with self.assertRaises(Exception):
            self.mock_requests.post(self.client.jobs_url, text=json.dumps(expected_response), status_code=202)
            self.client.run_job(name=None)
