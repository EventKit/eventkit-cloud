import json
import os
import shutil
import socket
import subprocess

from audit_logging.celery_support import UserDetailsBase
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.translation import ugettext as _
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from eventkit_cloud.celery import app
from eventkit_cloud.jobs.models import DataProviderTask
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.helpers import get_message_count
from eventkit_cloud.tasks.helpers import get_provider_staging_dir, get_run_staging_dir
from eventkit_cloud.tasks.models import ExportRun, DataProviderTaskRecord, ExportTaskRecord
from eventkit_cloud.utils.docker_client import DockerClient
from eventkit_cloud.utils.pcf import PcfClient
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator

User = get_user_model()

# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="Shutdown Celery Workers", base=UserDetailsBase, bind=True, default_retry_delay=60)
def shutdown_celery_workers(self):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up.

    :param self: The Task instance.
    """
    subprocess.run("pkill -15 -f 'celery worker'", shell=True)
    return {"action": "shutdown", "hostname": socket.gethostname()}


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

    old_run = ExportRun.objects.select_related("job__user").get(uid=run_uid)

    user = User.objects.get(pk=user_id)

    try:
        new_run_uid, run_zip_file_slug_sets = create_run(job_uid=old_run.job.uid, user=user, clone=True)
    except Unauthorized:
        raise PermissionDenied(code="permission_denied", detail="ADMIN permission is required to run this DataPack.")
    except (InvalidLicense, Error) as err:
        return Response([{"detail": _(str(err))}], status.HTTP_400_BAD_REQUEST)

    run = ExportRun.objects.get(uid=new_run_uid)

    # Remove the old data provider task record for the providers we're recreating.
    for data_provider_task_record in run.data_provider_task_records.all():
        if data_provider_task_record.provider is not None:
            if data_provider_task_record.provider.slug in data_provider_slugs:
                data_provider_task_record.delete()

    # Remove the files for the providers we want to recreate.
    run_dir = get_run_staging_dir(new_run_uid)
    for data_provider_slug in data_provider_slugs:
        stage_dir = get_provider_staging_dir(run_dir, data_provider_slug)
        if os.path.exists(stage_dir):
            logger.debug(f"REMOVING OLD STAGE DIR: {stage_dir}")
            shutil.rmtree(stage_dir)

    if run and not getattr(settings, "CELERY_SCALE_BY_RUN"):
        pick_up_run_task.apply_async(
            queue="runs",
            routing_key="runs",
            kwargs={
                "run_uid": new_run_uid,
                "user_details": user_details,
                "data_provider_slugs": data_provider_slugs,
                "run_zip_file_slug_sets": run_zip_file_slug_sets,
            },
        )
