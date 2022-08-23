import logging
import os
import shlex
import uuid

import requests
from django.conf import settings

from eventkit_cloud.utils.scaling import types as scale_types
from eventkit_cloud.utils.scaling.exceptions import TaskTerminationError

try:
    import docker
except ModuleNotFoundError:
    pass

from eventkit_cloud.utils.scaling.scale_client import ScaleClient

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)


class Docker(ScaleClient):
    def __init__(self):
        self.client = docker.from_env()
        self.session = requests.Session()

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name=None):

        if not app_name:
            raise Exception("An app_name (docker image) was not provided to run_task.")
        if not memory_in_mb:
            memory_in_mb = os.getenv("CELERY_TASK_MEMORY", "2G")
        # Docker client assumes the value is in bytes if you don't append an identifier.
        if isinstance(memory_in_mb, int):
            memory_in_mb = f"{memory_in_mb}m"

        if not os.getenv("BIND_MOUNT_LOCATION"):
            raise Exception("You must set BIND_MOUNT_LOCATION in order to use the Docker Scaling Client.")

        volumes = {
            os.getenv("BIND_MOUNT_LOCATION"): {
                "bind": "/var/lib/eventkit/",
                "mode": "rw",
            },
            "/var/run/docker.sock": {"bind": "/var/run/docker.sock", "mode": "rw"},
        }

        # Don't pass in the HOSTNAME of the main celery node.
        environment = dict(os.environ)
        environment.pop("HOSTNAME", None)
        container_number = str(uuid.uuid4().int)[:8]
        logger.info(f"Scaling up using docker image {app_name}")
        self.client.containers.run(
            image=app_name,
            command=shlex.quote(command),
            environment=environment,
            detach=True,
            mem_limit=memory_in_mb,
            network="eventkit-cloud_default",
            auto_remove=True,
            entrypoint="/bin/bash -c ",
            volumes=volumes,
            extra_hosts={settings.SITE_NAME: "host-gateway"},
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

    def get_running_tasks(self, app_name: str = None, names: str = None) -> scale_types.ListTaskResponse:
        """
        Get running celery tasks, mimic the return values of the PCF client.
        :return: A list of the running task names.
        """
        containers = []
        if names:
            for name in str(names).split(","):
                containers += self.client.containers.list(filters={"label": f"task_name={name}"})
        else:
            containers = self.client.containers.list(filters={"label": "task_type=celery_task"})
        result: scale_types.ListTaskResponse = {"resources": [], "pagination": {"total_results": len(containers)}}
        for container in containers:
            stats = container.stats(stream=False)
            result["resources"].append(
                {
                    "name": container.labels.get("task_name"),
                    "memory_in_mb": stats["memory_stats"].get("limit", 0) / 1000000,
                    "disk_in_mb": 0,  # Docker doesn't provider disk stats.
                    "state": "RUNNING",
                }
            )
        return result

    def get_running_tasks_memory(self, app_name: str) -> int:
        """
        Get running tasks memory for a single app.
        :param app_name: Name of app running tasks
        :return: Running task memory in mb.
        """

        running_tasks = self.get_running_tasks(app_name)
        running_tasks_memory = 0
        for task in running_tasks["resources"]:
            running_tasks_memory += task["memory_in_mb"]
        return running_tasks_memory

    def terminate_task(self, task_name: str):
        containers = self.client.containers.list(filters={"label": f"task_name={task_name}"})
        for container in containers:
            try:
                container.stop()
            except docker.errors.APIError as api_err:
                raise TaskTerminationError(f"Failed to stop docker container for task: {task_name}") from api_err
