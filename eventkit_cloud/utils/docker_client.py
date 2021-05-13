import requests
import os
import logging
from enum import Enum
import json
import docker

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)

class DockerClient(object):
    def __init__(self):
        self.client = docker.from_env()
        self.session = requests.Session()


    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name=None):
        app_name = (
                os.getenv("PCF_APP", json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name"), ) or app_name
        )
        if not app_name:
            raise Exception("An application name was not provided to run_task.")
        app_guid = self.get_app_guid(app_name)
        if not app_guid:
            raise Exception("An application guid could not be recovered for app {0}.".format(app_name))
        if not disk_in_mb:
            disk_in_mb = os.getenv("CELERY_TASK_DISK", "2048")
        if not memory_in_mb:
            memory_in_mb = os.getenv("CELERY_TASK_MEMORY", "2048")
        payload = {
            "name": name,
            "command": command,
            "disk_in_mb": disk_in_mb,
            "memory_in_mb": memory_in_mb,
        }
        url = "{0}/v3/apps/{1}/tasks".format(self.api_url.rstrip("/"), app_guid)
        return self.session.post(
            url,
            json=payload,
            headers={
                "Authorization": "bearer {0}".format(self.token),
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        ).json()


    def get_running_tasks(self, app_name: str = None, names: str = None) -> list:
        """
        Get running pcf tasks.
        :param app_name: The name of the PCF app.
        :param names:  A comma separated list of names given to the tasks when they were originally called.
        :return: A list of the running task names.
        """
        containers = self.client.containers.list(filters={"ancestor": app_name, "labels": names})
        result = {"resources": []}
        for c in containers:
            result['resources'].append({"guid": c.name})
        #todo: looks like the pcf client returns a dictionary of the running tasks with their various properties
        #will need to to `c.stat(stream=False)` on each container and format the results to emulate the pcf results
        return json.dumps(result)

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
