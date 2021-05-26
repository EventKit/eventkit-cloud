import json
import os
import shutil

from audit_logging.celery_support import UserDetailsBase
from celery.utils.log import get_task_logger
from django.conf import settings

from django.contrib.auth import get_user_model
from django.utils.translation import ugettext as _
from eventkit_cloud.celery import app
from eventkit_cloud.jobs.models import DataProviderTask
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.tasks.models import ExportRun, DataProviderTaskRecord, ExportTaskRecord
from eventkit_cloud.utils.docker_client import DockerClient
from eventkit_cloud.utils.pcf import PcfClient
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator
from eventkit_cloud.tasks.helpers import get_provider_staging_dir, get_run_staging_dir
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status

User = get_user_model()

# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="Shutdown Celery Workers", base=UserDetailsBase, bind=True, default_retry_delay=60)
def shutdown_celery_workers(self, queue_name, queue_type=None, hostname=None):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up.

    :param self: The Task instance.
    :param queue_name: The full name of the queue, such as GROUP_A.large
    :param queue_type: The type of queue, such as osm.
    :param hostname: The UUID based hostname of the workers.
    """

    if os.getenv("CELERY_TASK_APP"):
        app_name = os.getenv("CELERY_TASK_APP")
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    if os.getenv("PCF_SCALING"):
        client = PcfClient()
        client.login()
    else:
        client = DockerClient()
        app_name = settings.DOCKER_IMAGE_NAME

    # The message was a generic shutdown sent to a specific queue_name.
    if not (hostname or queue_type):
        queue_type, hostname = self.request.hostname.split("@")

    workers = [f"{queue_type}@{hostname}", f"priority@{hostname}"]
    if queue_type in ["run", "scale"]:
        return {"action": "skip_shutdown", "workers": workers}
    messages = get_message_count(queue_name)
    running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
    print(f"RUNNING TASKS BY QUEUE: {running_tasks_by_queue}")
    running_tasks_by_queue_count = running_tasks_by_queue["pagination"]["total_results"]
    export_tasks = ExportTaskRecord.objects.filter(
        worker=hostname, status__in=[task_state.value for task_state in TaskState.get_not_finished_states()]
    )
    # Always shut down after the run is complete if scaling by runs.
    if getattr(settings, "CELERY_SCALE_BY_RUN", False):
        logger.info(f"Shutting down workers {workers} after run completed.")
        app.control.broadcast("shutdown", destination=workers)
        return {"action": "shutdown", "workers": workers}
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
    self.retry(exc=Exception("Tasks still in queue."))


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


@app.task(name="Rerun data provider records", bind=True, base=UserDetailsBase)
def rerun_data_provider_records(self, run_uid, user_id, user_details, data_provider_slugs):
    from eventkit_cloud.tasks.export_tasks import pick_up_run_task
    from eventkit_cloud.tasks.task_factory import create_run, Error, Unauthorized, InvalidLicense

    # old_run
    run = ExportRun.objects.select_related("job__user").get(uid=run_uid)

    user = User.objects.get(pk=user_id)

    try:
        run_uid, run_zip_file_slug_sets = create_run(job_uid=run.job.uid, user=user, clone=True)
    except Unauthorized:
        raise PermissionDenied(code="permission_denied", detail="ADMIN permission is required to run this DataPack.")
    except (InvalidLicense, Error) as err:
        return Response([{"detail": _(str(err))}], status.HTTP_400_BAD_REQUEST)

    run = ExportRun.objects.get(uid=run_uid)

    # Remove the old data provider task record for the providers we're recreating.
    for data_provider_task_record in run.data_provider_task_records.all():
        if data_provider_task_record.provider is not None:
            if data_provider_task_record.provider.slug in data_provider_slugs:
                data_provider_task_record.delete()

    # Remove the files for the providers we want to recreate.
    run_dir = get_run_staging_dir(run_uid)
    for data_provider_slug in data_provider_slugs:
        stage_dir = get_provider_staging_dir(run_dir, data_provider_slug)
        if os.path.exists(stage_dir):
            shutil.rmtree(stage_dir)

    if run:
        pick_up_run_task.apply_async(
            queue="runs",
            routing_key="runs",
            kwargs={
                "run_uid": run_uid,
                "user_details": user_details,
                "data_provider_slugs": data_provider_slugs,
                "run_zip_file_slug_sets": run_zip_file_slug_sets,
            },
        )
