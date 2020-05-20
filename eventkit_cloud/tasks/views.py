# -*- coding: utf-8 -*-

from logging import getLogger

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import redirect
from django.contrib.auth.models import User

from eventkit_cloud.api.filters import attribute_class_filter
from eventkit_cloud.jobs.models import JobPermission, JobPermissionLevel
from eventkit_cloud.tasks.models import FileProducingTaskResult, UserDownload, DataProviderTaskRecord
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
        downloadable = FileProducingTaskResult.objects.select_related("export_task__export_provider_task__provider",
                                                                      "export_task__export_provider_task__run").get(
            uid=download_uid)

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


