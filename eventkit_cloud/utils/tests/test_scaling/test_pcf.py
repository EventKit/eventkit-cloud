# -*- coding: utf-8 -*-
import logging
from unittest.mock import MagicMock, Mock, patch

from django.test import TestCase

from eventkit_cloud.utils.scaling.exceptions import TaskTerminationError
from eventkit_cloud.utils.scaling.pcf import Pcf

logger = logging.getLogger(__name__)


class TestPcf(TestCase):
    def setUp(self):
        with patch("eventkit_cloud.utils.scaling.pcf.Pcf.login"), patch("eventkit_cloud.utils.scaling.pcf.os.getenv"):
            self.client: Pcf = Pcf(api_url="http://test/api")
        self.client.org_guid = "12"
        self.client.space_guid = "34"

    def test_login(self):
        org_guid = Mock()
        space_guid = Mock()
        org_name = Mock()
        space_name = Mock()

        self.client.get_links = Mock()
        self.client.get_token = Mock()
        self.client.get_org_guid = Mock(return_value=(org_guid, org_name))
        self.client.get_space_guid = Mock(return_value=(space_guid, space_name))
        self.client.org_guid = self.client.space_guid = None
        self.client.login(org_name=org_name, space_name=space_name)
        self.assertEqual(org_guid, self.client.org_guid)
        self.assertEqual(space_guid, self.client.space_guid)

        with self.assertRaises(Exception):
            self.client.org_name = None
            self.client.login()

    def test_get_links(self):
        self.client.session = MagicMock()
        self.client.get_links()
        self.client.session.get.assert_called_once_with(self.client.api_url, headers={"Accept": "application/json"})

    def test_get_token(self):
        expected_token = "123456"
        self.client.links = {"login": {"href": "http://test/api"}}
        self.client.session = MagicMock()
        self.client.session.post().json.return_value = {"access_token": expected_token}
        self.assertEqual(expected_token, self.client.get_token())
        with self.assertRaises(Exception):
            self.client.session.post().json.return_value = {"access_token": None}
            self.client.get_token()
        with self.assertRaises(Exception):
            self.client.session.post.return_value = Mock(status_code="401")
            self.client.get_token()

    def test_get_entity(self):
        name = "org_name"
        guid = "1234"
        info = {"resources": [{"guid": guid, "name": name}]}
        url = "http://test/api/entity"
        data = {"name": "some_name"}
        self.client.session = MagicMock()
        self.client.session.get().json.return_value = info
        self.assertEqual((guid, name), self.client.get_entity_guid(name, url, data))

    def test_get_org_guid(self):
        name = "org"
        guid = self.client.org_guid
        data = {"order_by": "name"}
        url = f"{self.client.api_url}/v3/organizations"
        mock_get_entity_guid = MagicMock(return_value=(guid, name))
        self.client.get_entity_guid = mock_get_entity_guid
        self.assertEqual((guid, name), self.client.get_org_guid(name))
        mock_get_entity_guid.assert_called_once_with(name, url, data)

    def test_get_space_guid(self):
        name = "space"
        guid = self.client.space_guid
        data = {"order_by": "name", "organization_guids": [self.client.org_guid]}
        url = f"{self.client.api_url}/v3/spaces"
        mock_get_entity_guid = MagicMock(return_value=(guid, name))
        self.client.get_entity_guid = mock_get_entity_guid
        self.assertEqual((guid, name), self.client.get_space_guid(name))
        mock_get_entity_guid.assert_called_once_with(name, url, data)

    def test_get_app_guid(self):
        name = "app"
        guid = "56"
        data = {"names": [name], "organization_guids": [self.client.org_guid], "space_guids": [self.client.space_guid]}
        url = f"{self.client.api_url}/v3/apps"
        mock_get_entity_guid = MagicMock(return_value=(guid, name))
        self.client.get_entity_guid = mock_get_entity_guid
        self.assertEqual((guid, name), self.client.get_app_guid(name))
        mock_get_entity_guid.assert_called_once_with(name, url, data)

    def test_run_task(self):
        with self.assertRaises(Exception):
            self.client.run_task("", "")

        name = "test_name"
        command = "test_command"
        app_name = "test_app_name"
        memory = 2
        disk = 3
        response = Mock()
        self.client.session = MagicMock()
        self.client.session.post().json.return_value = response
        with self.assertRaises(Exception):
            self.client.get_app_guid = None
            self.client.run_task(name, command, memory_in_mb=memory, disk_in_mb=disk, app_name=app_name)
        self.client.get_app_guid = Mock(return_value=(Mock(), app_name))
        self.assertEqual(
            response, self.client.run_task(name, command, memory_in_mb=memory, disk_in_mb=disk, app_name=app_name)
        )

    def test_get_running_tasks(self):
        app_name = "test_name"
        names = "test1,test2"
        self.client.session = MagicMock()
        with self.assertRaises(Exception):
            self.client.get_running_tasks(app_name=None)
        self.client.get_app_guid = MagicMock(return_value=None)
        with self.assertRaises(Exception):
            self.client.get_app_guid = None
            self.client.get_running_tasks(app_name=app_name)
        self.client.get_app_guid = Mock(return_value=(Mock(), app_name))
        expected_result = Mock()
        self.client.session.get().json.return_value = expected_result
        self.assertEqual(expected_result, self.client.get_running_tasks(app_name, names=names))
        self.assertEqual(expected_result, self.client.get_running_tasks(app_name))

    def test_get_running_tasks_memory(self):
        expected_memory = 5
        self.client.get_running_tasks = Mock(return_value={"resources": [{"memory_in_mb": expected_memory}]})
        self.assertEqual(expected_memory, self.client.get_running_tasks_memory("test"))

    def test_terminate_task(self):
        self.client.session = MagicMock()
        self.client.session.post.return_value = Mock(status_code=200)
        self.client.get_running_tasks = Mock(return_value={"resources": [{"guid": "guid"}]})
        self.client.terminate_task("test")
        self.client.session.post.assert_called_once()
        with self.assertRaises(TaskTerminationError):
            self.client.session.post.return_value = Mock(status_code=500)
            self.client.terminate_task("test")
        self.client.session.reset_mock()
        self.client.get_running_tasks = Mock(return_value={"resources": [{}]})
        self.client.terminate_task("test")
        self.client.session.assert_not_called()
