# -*- coding: utf-8 -*-




from django.conf import settings

from django.shortcuts import redirect
from django.http import HttpResponse
from ..jobs.models import User
from ..tasks.models import FileProducingTaskResult,  UserDownload, ExportRun
from eventkit_cloud.utils.s3 import get_presigned_url

from logging import getLogger

logger = getLogger(__name__)


def download(request):
    """
    Logs and redirects a dataset download request
    :return: A redirect to the direct download URL provided in the URL query string
    """
    download_uid = request.GET.get('uid')
    try:
        downloadable = FileProducingTaskResult.objects.get(uid=download_uid)
    except FileProducingTaskResult.DoesNotExist:
        return HttpResponse(status=400, content="Download not found for requested id value.")

    current_user = request.user
    if current_user is None:
        return HttpResponse(status=401)
    user = User.objects.get(username=current_user)

    user_download = UserDownload.objects.create(user=user, downloadable=downloadable)
    user_download.save()

    if getattr(settings, 'USE_S3', False):
        url = get_presigned_url(downloadable.download_url)
    else:
        url = request.build_absolute_uri(downloadable.download_url)
    logger.info("Redirecting to {0}".format(url))
    return redirect(url)
