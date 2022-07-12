# -*- coding: utf-8 -*-
import logging
from unittest.mock import Mock, patch

from django.test import TestCase

from eventkit_cloud.utils.scaling.docker import APIError, Docker
from eventkit_cloud.utils.scaling.exceptions import TaskTerminationError

logger = logging.getLogger(__name__)


class TestDocker(TestCase):
    def setUp(self):
        with patch("eventkit_cloud.utils.scaling.docker.docker"):
            self.docker = Docker()

    def test_run_task(self):
        with self.assertRaises(Exception):
            self.docker.run_task(None, None)
        with self.assertRaises(Exception), self.settings(BIND_MOUNT_LOCATION=None):
            self.docker.run_task(None, None, app_name="something")
        bind_mount_location = "/tmp/test"
        volumes = {
            bind_mount_location: {
                "bind": "/var/lib/eventkit/",
                "mode": "rw",
            },
            "/var/run/docker.sock": {"bind": "/var/run/docker.sock", "mode": "rw"},
        }
        name = "test_name"
        command = "test_command"
        app_name = "test_app_name"
        memory = 2
        with patch.dict(
            "eventkit_cloud.utils.scaling.docker.os.environ", {"BIND_MOUNT_LOCATION": bind_mount_location}, clear=True
        ) as mock_environ, patch("eventkit_cloud.utils.scaling.docker.uuid.uuid4") as mock_uuid4:
            container_number = "12345678"
            mock_uuid4.return_value = Mock(int=container_number)
            self.docker.run_task(name, command, memory_in_mb=memory, app_name=app_name)
            self.docker.client.containers.run.assert_called_once_with(
                image=app_name,
                command=command,
                environment=dict(mock_environ),
                detach=True,
                mem_limit=f"{memory}m",
                network="eventkit-cloud_default",
                auto_remove=True,
                entrypoint="/bin/bash -c ",
                volumes=volumes,
                user="eventkit",
                links={"celery": "celery"},
                name=f"/eventkit-cloud_celery_{container_number}",
                labels={
                    "task_type": "celery_task",
                    "task_name": name,
                    # Some items to make this work better for development
                    "com.docker.compose.container-number": container_number,
                    "com.docker.compose.project": "eventkit-cloud",
                    "com.docker.compose.service": "celery",
                    "com.docker.compose.oneoff": "False",
                },
            )

    def test_get_running_tasks_memory(self):
        expected_memory = 5
        self.docker.get_running_tasks = Mock(return_value={"resources": [{"memory_in_mb": expected_memory}]})
        self.assertEqual(expected_memory, self.docker.get_running_tasks_memory("test"))

    def test_terminate_task(self):
        mock_container = Mock()
        self.docker.client.containers.list.return_value = [mock_container]
        self.docker.terminate_task("test")
        mock_container.stop.assert_called_once()
        with self.assertRaises(TaskTerminationError):
            mock_container.stop.side_effect = APIError("Failed to stop.")
            self.docker.terminate_task("test")
