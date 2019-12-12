import json
import logging
import os

from celery.utils.log import get_task_logger

from eventkit_cloud.celery import app
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.utils.pcf import PcfClient
from eventkit_cloud.tasks.enumerations import TaskStates

import socket


# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="PCF Shutdown Celery Workers", bind=True)
def pcf_shutdown_celery_workers(self, queue_name, queue_type=None, hostname=None):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up. Only call this task on PCF based deploys.

    :param self: The Task instance.
    :param queue_name: The full name of the queue, such as GROUP_A.osm
    :param queue_type: The type of queue, such as osm.
    :param hostname: The UUID based hostname of the workers.
    """
    from eventkit_cloud.tasks.models import ExportTaskRecord # NOQA

    if os.getenv('CELERY_TASK_APP'):
        app_name = os.getenv('CELERY_TASK_APP')
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    client = PcfClient()
    client.login()
    # The message was a generic shutdown sent to a specific queue_name.
    if not (hostname or queue_type):
        queue_type, hostname = self.request.hostname.split("@")

    workers = [f"{queue_type}@{hostname}", f"cancel@{hostname}"]
    messages = get_message_count(queue_name)
    running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
    running_tasks_by_queue_count = running_tasks_by_queue["pagination"]["total_results"]
    export_tasks = ExportTaskRecord.objects.filter(worker=hostname, status__in=TaskStates.get_not_finished_states())

    if running_tasks_by_queue_count > messages and not export_tasks:
        logger.info(f"No work remaining on the {queue_name} queue, shutting down {workers}")
        app.control.shutdown(destination=workers)
        # return value is unused but useful for storing in the celery result.
        return {"action": "shutdown", "workers": workers}
    else:
        logger.info(
            f"There are {running_tasks_by_queue_count} running tasks for \
            {queue_name} and {messages} on the queue, skipping shutdown."
        )
        logger.info(
            f"Waiting on tasks: {export_tasks}"
        )
        return {"action": "skipped shutdown"}

app.register_task(RevokeTask())
