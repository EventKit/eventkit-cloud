# -*- coding: utf-8 -*-
import json
import logging
import os
from unittest.mock import patch

import requests_mock
from django.test import TestCase

from eventkit_cloud.utils.scaling.pcf import Pcf

logger = logging.getLogger(__name__)


class TestPcfClient(TestCase):
    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.api_url = "http://api.example.test"
        self.auth_url = "http://auth.example.test"
        self.token_url = "http://token.example.test"
        self.routing_url = f"{self.api_url}/routing"
        self.org = "org"
        self.space = "space"
        self.app = "app"
        self.org_guid = "org_guid"
        self.space_guid = "space_guid"
        self.app_guid = "app_guid"
        self.task_guid = "task_guid"
        self.info = {
            "name": "Application Service",
            "support": self.api_url,
            "version": 0,
            "description": "https://docs.pivotal.io/pivotalcf/2-3/pcf-release-notes/runtime-rn.html",
            "authorization_endpoint": self.auth_url,
            "token_endpoint": self.token_url,
            "routing_endpoint": self.routing_url,
        }
        self.client = Pcf(api_url=self.api_url, org_name=self.org, space_name=self.space)

    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_space_guid")
    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_org_guid")
    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_token")
    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_info")
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
        self.mock_requests.get(
            "{0}/v2/info".format(self.api_url.rstrip("/")), text=json.dumps(self.info), status_code=200
        )
        response = self.client.get_info()
        self.assertEqual(self.info, response)

    def test_get_token(self):
        self.client.info = self.info
        example_token = "token"
        example_response = {"access_token": example_token}
        login_url = "{0}/login".format(self.info.get("authorization_endpoint").rstrip("/"))
        self.mock_requests.get(login_url, status_code=200)

        token_url = "{0}/oauth/token".format(self.info.get("authorization_endpoint").rstrip("/"))
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

    def test_get_org_guid(self):
        example_org = ("example_guid", self.org)
        example_response = {"resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": self.org}}]}
        organizations_url = "{0}/v2/organizations".format(self.api_url.rstrip("/"))
        self.mock_requests.get(organizations_url, text=json.dumps(example_response))
        org_guid = self.client.get_org_guid(self.org)
        self.assertEqual(org_guid, example_org)

        # Test if the organization does not exist
        with self.assertRaises(Exception):
            org_not_found = {"resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": "incorrect_org"}}]}
            self.mock_requests.get(organizations_url, text=json.dumps(org_not_found))
            self.client.get_org_guid(self.org)

    def test_get_space_guid(self):
        example_space = ("example_guid", self.space)
        example_response = {"resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": self.space}}]}
        spaces_url = "{0}/v2/organizations/{1}/spaces".format(self.api_url.rstrip("/"), self.org_guid)
        self.mock_requests.get(spaces_url, text=json.dumps(example_response))
        self.client.org_guid = self.org_guid
        space_guid = self.client.get_space_guid(self.space)
        self.assertEqual(space_guid, example_space)

        # Test if the space does not exist
        with self.assertRaises(Exception):
            space_not_found = {
                "resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": "incorrect_space"}}]
            }
            self.mock_requests.get(spaces_url, text=json.dumps(space_not_found))
            self.client.get_space_guid(self.space)

    def test_get_app_guid(self):
        example_app = "example_guid"
        example_response = {"resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": self.app}}]}
        app_url = "{0}/v2/spaces/{1}/apps".format(self.api_url.rstrip("/"), self.space_guid)
        self.mock_requests.get(app_url, text=json.dumps(example_response))
        self.client.space_guid = self.space_guid
        app_guid = self.client.get_app_guid(self.app)
        self.assertEqual(app_guid, example_app)

        # Test if the app does not exist
        with self.assertRaises(Exception):
            app_not_found = {"resources": [{"metadata": {"guid": "example_guid"}, "entity": {"name": "incorrect_app"}}]}
            self.mock_requests.get(app_url, text=json.dumps(app_not_found))
            self.client.get_app_guid(self.app)

    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_app_guid")
    def test_run_task(self, mock_get_app_guid):
        mock_get_app_guid.return_value = self.app_guid

        example_command = "example_command"
        example_task_name = "example_name"
        example_payload = {
            "command": example_command,
            "disk_in_mb": os.getenv("CELERY_TASK_DISK", "2048"),
            "memory_in_mb": os.getenv("CELERY_TASK_MEMORY", "2048"),
        }

        task_url = "{0}/v3/apps/{1}/tasks".format(self.api_url.rstrip("/"), self.app_guid)
        self.mock_requests.post(task_url, text=json.dumps(example_payload))
        task = self.client.run_task(example_task_name, example_command, app_name=self.app)
        self.assertEqual(task, example_payload)

        with self.assertRaises(Exception):
            task = self.client.run_task(example_task_name, example_command)

        with self.assertRaises(Exception):
            mock_get_app_guid.return_value = None
            task = self.client.run_task(example_task_name, example_command, app_name=self.app)

    @patch("eventkit_cloud.utils.scaling.pcf.Pcf.get_app_guid")
    def test_get_running_tasks(self, mock_get_app_guid):
        mock_get_app_guid.return_value = self.app_guid

        example_response = {"resources": [{"guid": "task_one_guid"}, {"guid": "task_two_guid"}]}

        get_tasks_url = "{0}/v3/apps/{1}/tasks".format(self.api_url.rstrip("/"), self.app_guid)
        self.mock_requests.get(get_tasks_url, text=json.dumps(example_response))
        running_tasks = self.client.get_running_tasks(self.app)
        self.assertEqual(running_tasks, example_response)

        # Test without an app name
        with self.assertRaises(Exception):
            running_tasks = self.client.get_running_tasks()

        with self.assertRaises(Exception):
            mock_get_app_guid.return_value = None
            running_tasks = self.client.get_running_tasks(self.app)
