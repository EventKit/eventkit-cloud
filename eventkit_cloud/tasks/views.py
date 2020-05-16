# -*- coding: utf-8 -*-

from logging import getLogger

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect

from eventkit_cloud.core.models import JobPermission, JobPermissionLevel
from eventkit_cloud.tasks.models import FileProducingTaskResult, UserDownload
from eventkit_cloud.utils.s3 import get_presigned_url

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
        downloadable = FileProducingTaskResult.objects.get(uid=download_uid)
        jobs = JobPermission.userjobs(current_user, JobPermissionLevel.READ.value)
        jobs = jobs.filter(runs__provider_tasks__tasks__result=downloadable)
        if not jobs:
            return HttpResponse(
                status=401, content=f"User {current_user.username} does not have permission to download this file."
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
