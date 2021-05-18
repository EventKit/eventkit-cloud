import uuid

import requests
import os
import logging
import docker

from eventkit_cloud.utils.scale_client import ScaleClient

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)


class DockerClient(ScaleClient):
    def __init__(self):
        self.client = docker.from_env()
        self.session = requests.Session()

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name="eventkit/eventkit-base:1.9.0"):

        if not app_name:
            raise Exception("An app_name (docker image) was not provided to run_task.")
        if not memory_in_mb:
            memory_in_mb = os.getenv("CELERY_TASK_MEMORY", "2G")
        # TODO: Do we need to clean any host specific environment variables.
        name = f"celery_task_{uuid.uuid4()}"
        print(f"MEMORY IS {memory_in_mb}")
        print(f"COMMAND IS {command}")
        # Docker client assumes the value is in bytes if you don't append an identifier.
        if isinstance(memory_in_mb, int):
            memory_in_mb = f"{memory_in_mb}m"

        if not os.getenv("BIND_MOUNT_LOCATION"):
            raise Exception("You must set BIND_MOUNT_LOCATION in order to use the Docker Scaling Client.")

        volumes = {
            os.getenv("BIND_MOUNT_LOCATION"): {"bind": "/var/lib/eventkit/", "mode": "rw"},
            "/var/run/docker.sock": {"bind": "/var/run/docker.sock", "mode": "rw"},
        }
        # TODO: How do we avoid hard coding network?
        self.client.containers.run(
            image=app_name,
            command=f'"{command}"',
            name=name,
            environment=dict(os.environ),
            detach=True,
            mem_limit=memory_in_mb,
            network="eventkit-cloud_default",
            auto_remove=False,  # TODO: Change this after testing.
            # stdout=True,
            # stderr=True,
            entrypoint="/bin/bash -c ",
            volumes=volumes,
        )

    def get_running_tasks(self, app_name: str = None, names: str = None) -> dict:
        """
        Get running celery tasks, mimic the return values of the PCF client.
        :return: A list of the running task names.
        """
        containers = self.client.containers.list(filters={"name": "celery_task"})
        result = {"resources": [], "pagination": {}}
        result["pagination"]["total_results"] = len(containers)
        for container in containers:
            stats = container.stats(stream=False)
            print(f"PRINTING STATS: {stats}")
            result["resources"].append(
                {
                    "name": container.name,
                    "memory_in_mb": stats["memory_stats"]["limit"] / 1000000,
                    "disk_in_mb": 0,  # Docker doesn't provider disk stats.
                }
            )
        print(f"PRINTING RESULT: {result} of type {type(result)}")
        return result

    def get_running_tasks_memory(self, app_name: str) -> int:
        """
        Get running tasks memory for a single app.
        :param app_name: Name of app running tasks
        :return: Running task memory in mb.
        """

        running_tasks = self.get_running_tasks(app_name)
        running_tasks_memory = 0
        print(running_tasks)
        for task in running_tasks["resources"]:
            running_tasks_memory += task["memory_in_mb"]
        return running_tasks_memory
