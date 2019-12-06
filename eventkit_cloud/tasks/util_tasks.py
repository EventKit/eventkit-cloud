import json
import logging
import os

from celery import Task
from celery.app import app_or_default

from eventkit_cloud.celery import app
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.tasks.models import DataProviderTaskRecord
from eventkit_cloud.utils.pcf import PcfClient

# Get an instance of a logger
logger = get_task_logger(__name__)

class RevokeTask(Task):
    def run(self, task_uid):
        pt = DataProviderTaskRecord.objects.filter(uid=task_uid).first()
        export_tasks = pt.tasks.all()
        app = app_or_default()

        for et in export_tasks:
            app.control.revoke(
                str(et.celery_uid),
                terminate=True,
                signal='SIGKILL'
            )

            et.status = 'CANCELED'
            et.save()

        pt.status = 'CANCELED'
        pt.save()
app.register_task(RevokeTask())

@app.task(name="Shutdown Celery Worker")
def shutdown_celery_workers(request):
    if os.getenv('CELERY_TASK_APP'):
        app_name = os.getenv('CELERY_TASK_APP')
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    client = PcfClient()
    client.login()

    queue_type, hostname = request.hostname.split("@")
    workers = [f"{queue_type}@{hostname}", f"cancel@{hostname}"]

    # In our current setup the queue name always mirrors the routing_key, if this changes this logic will break.
    queue_name = request.delivery_info["routing_key"]
    messages = get_message_count(queue_name)
    running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
    running_tasks_by_queue_count = running_tasks_by_queue["pagination"]["total_results"]

    if running_tasks_by_queue_count > messages:
        logger.info(f"No work remaining on this queue, shutting down {workers}")
        app.control.shutdown(destination=workers)
