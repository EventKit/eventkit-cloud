# -*- coding: utf-8 -*-
import json
import os
import shutil

from logging import getLogger

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect

from eventkit_cloud.tasks.enumerations import TaskStates
from eventkit_cloud.tasks.helpers import get_run_download_dir, get_run_staging_dir
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.task_factory import get_zip_task_chain
from eventkit_cloud.tasks.models import FileProducingTaskResult, UserDownload
from eventkit_cloud.utils.s3 import download_folder_from_s3, get_presigned_url

logger = getLogger(__name__)


def download(request):
    """
    Logs and redirects a dataset download request
    :return: A redirect to the direct download URL provided in the URL query string
    """

    current_user = request.user

    if current_user is None:
        return HttpResponse(status=401)

    download_uid = request.GET.get("uid")
    try:
        downloadable = FileProducingTaskResult.objects.select_related(
            "export_task__export_provider_task__provider", "export_task__export_provider_task__run"
        ).get(uid=download_uid)

        if not downloadable.user_can_download(current_user):
            return HttpResponse(
                status=401, content=f"The user: {current_user.username} does not have permission to download it."
            )
    except FileProducingTaskResult.DoesNotExist:
        return HttpResponse(status=400, content="Download not found for requested id value.")

    user_download = UserDownload.objects.create(user=current_user, downloadable=downloadable)
    user_download.save()

    if getattr(settings, "USE_S3", False):
        url = get_presigned_url(downloadable.download_url)
    else:
        url = request.build_absolute_uri(downloadable.download_url)
    logger.info("Redirecting to {0}".format(url))
    return redirect(url)


def generate_zipfile(data_provider_task_record_uids, run_zip_file):

    # Check to make sure the UIDs are all from the same ExportRun.
    runs = ExportRun.objects.filter(provider_tasks__uid__in=data_provider_task_record_uids).distinct()
    if runs.count() != 1:
        return HttpResponse(
            json.dumps({"error": "Cannot zip files from different datapacks."}),
            content_type="application/json",
            status=400,
        )

    run = runs.first()

    run_zip_file.message = "Downloading files to be zipped..."
    run_zip_file.status = TaskStates.RUNNING.value
    stage_dir = get_run_staging_dir(run.uid)
    download_dir = get_run_download_dir(run.uid)

    if getattr(settings, "USE_S3", False):
        download_folder_from_s3(str(run.uid))
    else:
        if not os.path.exists(stage_dir):
            shutil.copytree(download_dir, stage_dir, ignore=shutil.ignore_patterns("*.zip"))

    # Kick off the zip process with get_zip_task_chain
    run_zip_task_chain = get_zip_task_chain(
        data_provider_task_record_uid=run.data_provider_task_records.get(slug="run").uid,
        data_provider_task_record_uids=data_provider_task_record_uids,
        run_zip_file_uid=run_zip_file.uid,
        stage_dir=stage_dir,
    )
    run_zip_task_chain.apply_async()

    return HttpResponse(status=200)
