# -*- coding: utf-8 -*-
import json
from logging import getLogger

from django.http import HttpResponse
from django.shortcuts import redirect

from eventkit_cloud.auth.views import requires_oauth_authentication
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.models import ExportRun, FileProducingTaskResult, RunZipFile, UserDownload
from eventkit_cloud.tasks.task_factory import get_zip_task_chain
from eventkit_cloud.utils.s3 import download_folder_from_s3

logger = getLogger(__name__)


@requires_oauth_authentication
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

    logger.info("Redirecting to {0}".format(downloadable.file.url))
    return redirect(downloadable.file.url)


def generate_zipfile(data_provider_task_record_uids, run_zip_file):

    # Check to make sure the UIDs are all from the same ExportRun.
    runs = ExportRun.objects.filter(data_provider_task_records__uid__in=data_provider_task_record_uids).distinct()
    if runs.count() != 1:
        return HttpResponse(
            json.dumps({"error": "Cannot zip files from different datapacks."}),
            content_type="application/json",
            status=400,
        )

    run = runs.first()

    run_zip_file.message = "Downloading files to be zipped..."
    run_zip_file.status = TaskState.RUNNING.value
    download_folder_from_s3(str(run.uid))

    # Kick off the zip process with get_zip_task_chain
    return get_zip_task_chain(
        data_provider_task_record_uid=run.data_provider_task_records.get(slug="run").uid,
        data_provider_task_record_uids=data_provider_task_record_uids,
        run_zip_file_uid=run_zip_file.uid,
        # TODO: mypy called out that this is an unexpected param. verify before removal?
        # stage_dir=stage_dir,
    )


def generate_zipfile_chain(run_uid, run_zip_file_slug_set):
    run = ExportRun.objects.get(uid=run_uid)
    run_zip_file = RunZipFile.objects.create()
    all_data_provider_task_record_uids = [
        data_provider_task_record.uid for data_provider_task_record in run.data_provider_task_records.all()
    ]

    data_provider_task_record_uids = [
        run.data_provider_task_records.get(provider__slug=run_zip_file_slug).uid
        for run_zip_file_slug in run_zip_file_slug_set
    ]

    # Don't regenerate the overall project zipfile.
    if data_provider_task_record_uids == all_data_provider_task_record_uids:
        return None

    zip_file_chain = generate_zipfile(data_provider_task_record_uids, run_zip_file)

    return zip_file_chain
