# -*- coding: utf-8 -*-
import json
import logging
import datetime

import requests_mock
from django.test import TestCase

from eventkit_cloud.utils.client import EventKitClient, parse_duration, parse_byte_size, parse_size_unit

logger = logging.getLogger(__name__)


class TestClient(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.url = 'http://example.test'
        self.username = "user"
        self.pcode = "pcode"
        cookies = {'csrftoken': 'token'}

        self.mock_requests.get("{0}/api/login/".format(self.url), status_code=200)
        self.mock_requests.post("{0}/api/login/".format(self.url), status_code=200, cookies=cookies)
        self.mock_requests.get(self.url, status_code=200, cookies=cookies)
        self.mock_requests.get("{0}/create".format(self.url), status_code=200, cookies=cookies)
        self.mock_requests.get("{0}/api/runs".format(self.url), status_code=200, cookies=cookies)
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
        request_response = {"runs": "runs"}
        expected_response = ["runs"]
        self.mock_requests.register_uri('GET', "{0}/filter".format(self.client.runs_url),
                                        [{'text': json.dumps(request_response), 'status_code': 200},
                                         {'text': '', 'status_code': 404}])
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

    def test_parse_duration(self):
        def with_timedelta(td):
            self.assertEqual(td.seconds, parse_duration(str(td)))

        # All possible inputs to timedelta - "9 days, 3:04:05.006007"
        with_timedelta(datetime.timedelta(weeks=1, days=2, hours=3, minutes=4, seconds=5, milliseconds=6,
                                          microseconds=7))
        with_timedelta(datetime.timedelta(days=1, hours=2, minutes=3))      # No plural - "1 day, 2:03:00"
        with_timedelta(datetime.timedelta(hours=2, minutes=3, seconds=4))   # Just hms "2:03:04"

    def test_parse_size_unit(self):
        self.assertEqual(parse_size_unit('B'), 1)
        self.assertEqual(parse_size_unit('KB'), 1e3)
        self.assertEqual(parse_size_unit('MB'), 1e6)
        self.assertEqual(parse_size_unit('GB'), 1e9)
        self.assertEqual(parse_size_unit('TB'), 1e12)

    def test_parse_byte_size(self):
        self.assertAlmostEqual(256000, parse_byte_size('256 MB', 'KB'))
        self.assertAlmostEqual(256, parse_byte_size('256 MB', 'MB'))
        self.assertAlmostEqual(.256, parse_byte_size('256000 KB', 'GB'))
        self.assertAlmostEqual(.000256, parse_byte_size('256000 KB', 'TB'), places=10)
