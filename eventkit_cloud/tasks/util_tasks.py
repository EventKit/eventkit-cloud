import socket
import subprocess
from typing import List, cast

import time
from concurrent.futures import ThreadPoolExecutor, wait

from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from eventkit_cloud.celery import app
from eventkit_cloud.jobs.models import DataProviderTask
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.models import ExportRun, DataProviderTaskRecord
from eventkit_cloud.utils.scaling import get_scale_client
from eventkit_cloud.utils.scaling.exceptions import MultipleTaskTerminationErrors, TaskTerminationError
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator
from eventkit_cloud.utils.types.django_helpers import DjangoUserType

User = get_user_model()

# Get an instance of a logger
logger = get_task_logger(__name__)


@app.task(name="Shutdown Celery Workers", bind=True)
def shutdown_celery_workers(self):
    """
    Shuts down the celery workers assigned to a specific queue if there are no
    more tasks to pick up.

    :param self: The Task instance.
    """
    subprocess.run("pkill -15 -f 'celery -A eventkit_cloud worker'", shell=True)
    return {"action": "shutdown", "hostname": socket.gethostname()}


def kill_workers(task_names=None, client=None, timeout=60):
    if not task_names:
        return

    if not client:
        client, app_name = get_scale_client()

    task_names = list(set(task_names))

    # Kill all stuck tasks concurrently
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(kill_worker, task_name, client, timeout) for task_name in task_names]
        wait(futures)

        # Collect any errors that occurred and raise an appropriate exception
        errors = cast(
            List[TaskTerminationError], [task.exception() for task in futures if task.exception() is not None]
        )
        if len(errors) == 1:
            raise errors[0]
        elif len(errors) > 1:
            raise MultipleTaskTerminationErrors(errors)


def kill_worker(task_name=None, client=None, timeout=60):
    if not task_name:
        return

    if not client:
        client, app_name = get_scale_client()

    # try to kill gracefully
    queue_name = f"{str(task_name).removesuffix('.priority')}.priority"
    shutdown_celery_workers.s().apply_async(queue=queue_name, routing_key=queue_name)

    # allow time for soft kill to try to work
    time.sleep(timeout)

    # hard kill task if it hasn't already terminated
    client.terminate_task(str(task_name))


@app.task(name="Get Estimates", default_retry_delay=60)
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


def rerun_data_provider_records(run_uid, user_id, data_provider_slugs):
    from eventkit_cloud.tasks.task_factory import create_run, Error, Unauthorized, InvalidLicense

    with transaction.atomic():
        old_run: ExportRun = ExportRun.objects.select_related("job__user", "parent_run__job__user").get(uid=run_uid)

        user: DjangoUserType = User.objects.get(pk=user_id)

        while old_run and old_run.is_cloning:
            # Find pending providers and add them to list
            for dptr in old_run.data_provider_task_records.all():
                if dptr.status == TaskState.PENDING.value:
                    data_provider_slugs.append(dptr.provider.slug)
            old_run = old_run.parent_run

        # Remove any duplicates
        data_provider_slugs = list(set(data_provider_slugs))

        try:
            new_run_uid = create_run(job=old_run.job, user=user, clone=old_run, download_data=False)
        except Unauthorized:
            raise PermissionDenied(
                code="permission_denied", detail="ADMIN permission is required to run this DataPack."
            )
        except (InvalidLicense, Error) as err:
            return Response([{"detail": _(str(err))}], status.HTTP_400_BAD_REQUEST)

        run: ExportRun = ExportRun.objects.get(uid=new_run_uid)

        # Reset the old data provider task record for the providers we're recreating.
        data_provider_task_record: DataProviderTaskRecord
        run.data_provider_task_records.filter(slug="run").delete()
        for data_provider_task_record in run.data_provider_task_records.all():
            if data_provider_task_record.provider is not None:
                # Have to clean out the tasks that were finished and request the ones that weren't.
                if (
                    data_provider_task_record.provider.slug in data_provider_slugs
                    or TaskState[data_provider_task_record.status] in TaskState.get_not_finished_states()
                ):
                    data_provider_task_record.status = TaskState.PENDING.value
                    # Delete the associated tasks so that they can be recreated.
                    data_provider_task_record.tasks.all().delete()
                    data_provider_task_record.save()

        run.status = TaskState.SUBMITTED.value
        run.save()


def enforce_run_limit(job, user=None):
    max_runs = settings.EXPORT_MAX_RUNS

    runs = job.runs.filter(deleted=False)
    num_runs = len(runs)
    while num_runs > max_runs:
        # delete the earliest runs
        earliest_run: ExportRun = runs.earliest("created_at")
        logger.info(
            f"The number of runs ({len(runs)}) exceeds EXPORT_MAX_RUNS ({max_runs}) "
            f"deleting ({job.name}): {earliest_run}"
        )
        earliest_run.soft_delete(user=user)
        num_runs -= 1
