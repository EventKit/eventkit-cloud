import uuid

import requests
import os
import logging
import docker

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)

class DockerClient(object):
    def __init__(self):
        self.client = docker.from_env()
        self.session = requests.Session()

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb="1g", app_name="eventkit/eventkit-base:1.9.0"):

        if not app_name:
            raise Exception("An app_name (docker image) was not provided to run_task.")
        if not memory_in_mb:
            memory_in_mb = os.getenv("CELERY_TASK_MEMORY", "2G")
        # TODO: Do we need to clean any host specific environment variables.
        name = f"celery_task_{uuid.uuid4()}"
        return self.client.containers.run(
            app_name, command, name=name, environment=dict(os.environ), detach=True, mem_limit=memory_in_mb
        )

    def get_running_tasks(self) -> dict:
        """
        Get running celery tasks.
        :return: A list of the running task names.
        """
        containers = self.client.containers.list(filters={"name": "celery_task"})
        result = {"resources": []}
        for container in containers:
            result["resources"].append(
                {
                    "guid": container.name,
                    "memory_in_mb": container.stats(stream=False)["memory_stats"]["limit"] / 1000000,
                }
            )
        return result

    def get_running_tasks_memory(self) -> int:
        """
        Get running tasks memory for a single app.
        :param app_name: Name of app running tasks
        :return: Running task memory in mb.
        """

        running_tasks = self.get_running_tasks()
        running_tasks_memory = 0
        print(running_tasks)
        for task in running_tasks["resources"]:
            running_tasks_memory += task["memory_in_mb"]
        return running_tasks_memory
