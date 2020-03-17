import json
import os

from audit_logging.celery_support import UserDetailsBase
from celery.utils.log import get_task_logger

from eventkit_cloud.celery import app
from eventkit_cloud.jobs.models import DataProviderTask
from eventkit_cloud.tasks.enumerations import TaskStates
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.tasks.models import ExportRun, DataProviderTaskRecord, ExportTaskRecord
from eventkit_cloud.utils.pcf import PcfClient
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator

# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="PCF Shutdown Celery Workers", base=UserDetailsBase, bind=True, default_retry_delay=60)
def pcf_shutdown_celery_workers(self, queue_name, queue_type=None, hostname=None):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up. Only call this task on PCF based deploys.

    :param self: The Task instance.
    :param queue_name: The full name of the queue, such as GROUP_A.large
    :param queue_type: The type of queue, such as osm.
    :param hostname: The UUID based hostname of the workers.
    """

    if os.getenv("CELERY_TASK_APP"):
        app_name = os.getenv("CELERY_TASK_APP")
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    client = PcfClient()
    client.login()
    # The message was a generic shutdown sent to a specific queue_name.
    if not (hostname or queue_type):
        queue_type, hostname = self.request.hostname.split("@")

    workers = [f"{queue_type}@{hostname}", f"priority@{hostname}"]
    if queue_type in ["run", "scale"]:
        return {"action": "skip_shutdown", "workers": workers}
    messages = get_message_count(queue_name)
    running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
    running_tasks_by_queue_count = running_tasks_by_queue["pagination"]["total_results"]
    export_tasks = ExportTaskRecord.objects.filter(
        worker=hostname, status__in=[task_state.value for task_state in TaskStates.get_not_finished_states()]
    )
    if not export_tasks:
        if running_tasks_by_queue_count > messages or (running_tasks_by_queue == 0 and messages == 0):
            logger.info(f"No work remaining on the {queue_name} queue, shutting down {workers}")
            app.control.broadcast("shutdown", destination=workers)
            # return value is unused but useful for storing in the celery result.
            return {"action": "shutdown", "workers": workers}
    logger.info(
        f"There are {running_tasks_by_queue_count} running tasks for "
        f"{queue_name} and {messages} on the queue, skipping shutdown."
    )
    logger.info(f"Waiting for tasks {export_tasks} to finish before shutting down, {workers}.")
    self.retry(exc=Exception(f"Tasks still in queue."))


@app.task(name="Get Estimates", base=UserDetailsBase, default_retry_delay=60)
def get_estimates_task(run_uid, data_provider_task_uid, data_provider_task_record_uid):

    run = ExportRun.objects.get(uid=run_uid)
    provider_task = DataProviderTask.objects.get(uid=data_provider_task_uid)

    estimator = AoiEstimator(run.job.extents)
    estimated_size, meta_s = estimator.get_estimate(estimator.Types.SIZE, provider_task.provider)
    estimated_duration, meta_t = estimator.get_estimate(estimator.Types.TIME, provider_task.provider)
    data_provider_task_record = DataProviderTaskRecord.objects.get(uid=data_provider_task_record_uid)
    data_provider_task_record.estimated_size = estimated_size
    data_provider_task_record.estimated_duration = estimated_duration
    data_provider_task_record.save()
