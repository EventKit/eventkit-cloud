import json
import logging
import os
from enum import Enum
from typing import Optional, cast

import requests

from eventkit_cloud.utils.scaling import types as scale_types
from eventkit_cloud.utils.scaling.exceptions import TaskTerminationError
from eventkit_cloud.utils.scaling.scale_client import ScaleClient
from eventkit_cloud.utils.scaling.types import pcf as pcf_types

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)


class PcfTaskStates(Enum):
    SUCCEEDED = "SUCCEEDED"  # Used for runs when all tasks were successful
    RUNNING = "RUNNING"  # Used for runs when one or more tasks were unsuccessful
    FAILED = "FAILED"  # Used for runs that have not been started


class Pcf(ScaleClient):
    def __init__(self, api_url=None, org_name=None, space_name=None):
        self.api_url: Optional[str] = api_url or os.getenv("PCF_API_URL")
        if not self.api_url:
            raise Exception("No api_url or PCF_API_URL provided.")
        self.api_url = cast(str, self.api_url.rstrip("/"))
        self.session = requests.Session()
        self.links: dict[str, pcf_types.Link] = dict()
        self.token: Optional[str] = None
        self.org_name: Optional[str] = org_name or os.getenv("PCF_ORG")
        self.space_name: Optional[str] = space_name or os.getenv("PCF_SPACE")
        self.user: Optional[str] = os.getenv("PCF_USER")
        self.passwd: Optional[str] = os.getenv("PCF_PASS")
        if not (self.user and self.passwd):
            raise Exception("Both PCF_USER and PCF_PASS are required to use PCF client.")
        self.org_guid: Optional[str] = None
        self.space_guid: Optional[str] = None
        self.login()

    def login(self, org_name=None, space_name=None):
        org_name = org_name or self.org_name
        space_name = space_name or self.space_name
        if not org_name and space_name:
            raise Exception("Both an org and space are required to login.")
        self.links = self.get_links()
        self.token = self.get_token()
        self.org_guid, self.org_name = self.get_org_guid(org_name=self.org_name)
        self.space_guid, self.space_name = self.get_space_guid(space_name=self.space_name)

    def get_links(self):
        response = self.session.get(self.api_url, headers={"Accept": "application/json"}).json()
        return response["links"]

    def get_token(self):
        authorization_url: str = self.links.get("login", {"href": None}).get("href")
        logger.debug(authorization_url)
        if not authorization_url:
            raise Exception("The api %s did not have a valid link for 'login'", self.api_url)
        login_url = f"{authorization_url}/login"
        response = self.session.get(login_url)
        logger.debug(response.headers)
        payload = {
            "grant_type": "password",
            "username": self.user,
            "password": self.passwd,
            "scope": "",
            "response_type": "token",
        }
        token_url = f"{authorization_url}/oauth/token"
        logger.debug(token_url)
        response = self.session.post(
            token_url,
            data=payload,
            headers={
                "Authorization": "Basic Y2Y6",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
        )
        if response.status_code in ["401", "403"]:
            raise Exception("The user %s and password provided were invalid.", self.user)
        token = response.json().get("access_token")
        if not token:
            raise Exception("Successfully logged into PCF but a token was not provided.")
        return token

    def get_entity_guid(self, name: str, url: str, data: dict) -> tuple[str, str]:
        response = self.session.get(
            url,
            params=data,
            headers={
                "Authorization": f"bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        response.raise_for_status()
        entity_response: pcf_types.ListResponse = response.json()
        resources = entity_response.get("resources")
        for resource in resources:
            if resource["name"].lower() == name.lower():
                return resource["guid"], name
        raise Exception("Error the entity %s does not exist.", name)

    def get_org_guid(self, org_name) -> tuple[str, str]:
        data = {"order_by": "name"}
        url = f"{self.api_url}/v3/organizations"
        return self.get_entity_guid(org_name, url, data)

    def get_space_guid(self, space_name) -> tuple[str, str]:
        data = {"order_by": "name", "organization_guids": [self.org_guid]}
        url = f"{self.api_url}/v3/spaces"
        return self.get_entity_guid(space_name, url, data)

    def get_app_guid(self, app_name) -> tuple[str, str]:
        data = {"names": [app_name], "organization_guids": [self.org_guid], "space_guids": [self.space_guid]}
        url = f"{self.api_url}/v3/apps"
        return self.get_entity_guid(app_name, url, data)

    def run_task(self, name, command, disk_in_mb=None, memory_in_mb=None, app_name=None) -> scale_types.TaskResource:
        app_name = (
            os.getenv("PCF_APP", json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")) or app_name
        )
        if not app_name:
            raise Exception("An application name was not provided to run_task.")
        app_guid, _ = self.get_app_guid(app_name)
        if not app_guid:
            raise Exception("An application guid could not be recovered for app %s.", app_name)
        disk_in_mb = disk_in_mb or os.getenv("CELERY_TASK_DISK", "2048")
        memory_in_mb = memory_in_mb or os.getenv("CELERY_TASK_MEMORY", "2048")
        payload = {
            "name": name,
            "command": command,
            "disk_in_mb": disk_in_mb,
            "memory_in_mb": memory_in_mb,
        }
        url = f"{self.api_url}/v3/apps/{app_guid}/tasks"
        return self.session.post(
            url,
            json=payload,
            headers={
                "Authorization": "bearer {0}".format(self.token),
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        ).json()

    def get_running_tasks(self, app_name: str = None, names: str = None) -> scale_types.ListTaskResponse:
        """
        Get running pcf tasks.
        :param app_name: The name of the PCF app.
        :param names:  A comma separated list of names given to the tasks when they were originally called.
        :return: A list of the running task names.
        """
        app_name = (
            os.getenv("PCF_APP", json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")) or app_name
        )
        if not app_name:
            raise Exception("An application name was not provided to get_running_tasks.")
        app_guid, _ = self.get_app_guid(app_name)

        payload = {
            "states": PcfTaskStates.RUNNING.value,
        }
        if names:
            payload["names"] = names
        url = f"{self.api_url}/v3/apps/{app_guid}/tasks"
        response = self.session.get(
            url,
            params=payload,
            headers={"Authorization": f"bearer {self.token}", "Accept": "application/json"},
        )
        response.raise_for_status()
        task: pcf_types.ListTaskResponse = response.json()
        return task

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
        """
        Get running tasks memory for a single app.
        :param app_name: Name of app running tasks
        :return: Running task memory in mb.
        """

        running_tasks = self.get_running_tasks(names=task_name)
        logger.info(f"Attempting to terminate PCF task with {task_name}")
        resources: list[pcf_types.TaskResource] = running_tasks.get("resources")
        for resource in resources:
            task_guid = resource.get("guid")
            if task_guid:
                logger.info(f"found task {task_guid} calling cancel")

                url = f"{self.api_url}/v3/tasks/{task_guid}/actions/cancel"
                result = self.session.post(
                    url,
                    headers={"Authorization": "bearer {0}".format(self.token), "Accept": "application/json"},
                )
                if result.status_code != 200:
                    raise TaskTerminationError(
                        f"Failed to terminate PCF task with guid: {task_guid} for task named: {task_name}"
                    )
        else:
            logger.warning(f"Terminate task was called with task_name: {task_name} but no running tasks were returned.")
            logger.warning(f"Running tasks: {running_tasks}")
