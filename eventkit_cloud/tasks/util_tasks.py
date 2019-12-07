import json
import logging
import os

from celery.utils.log import get_task_logger

from eventkit_cloud.celery import app
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.utils.pcf import PcfClient


# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="PCF Shutdown Celery Workers")
def pcf_shutdown_celery_workers(queue_name, queue_type, hostname):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up. Only call this task on PCF based deploys.

    :param queue_name: The full name of the queue, such as GROUP_A.osm
    :param queue_type: The type of queue, such as osm.
    :param hostname: The UUID based hostname of the workers.
    """

    if os.getenv('CELERY_TASK_APP'):
        app_name = os.getenv('CELERY_TASK_APP')
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    client = PcfClient()
    client.login()

    workers = [f"{queue_type}@{hostname}", f"cancel@{hostname}"]
    messages = get_message_count(queue_name)
    running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
    running_tasks_by_queue_count = running_tasks_by_queue["pagination"]["total_results"]

    if running_tasks_by_queue_count > messages:
        logger.info(f"No work remaining on the {queue_name} queue, shutting down {workers}")
        app.control.shutdown(destination=workers)
    else:
        logger.info(
            f"There are {running_tasks_by_queue_count} running tasks for \
            {queue_name} and {messages} on the queue, skipping shutdown."
        )
