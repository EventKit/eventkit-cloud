# -*- coding: utf-8 -*-

from django.conf import settings

from django.shortcuts import redirect
from django.http import HttpResponse
from ..jobs.models import DataProvider, Downloadable, Job, User, UserDownload

from logging import getLogger

logger = getLogger(__name__)


def download(request):
    """
    Logs and redirects a dataset download request
    :return: A redirect to the direct download URL provided in the URL query string
    """
    download_id = request.GET.get('id')
    try:
        downloadable = Downloadable.objects.get(uid=download_id)
    except Downloadable.DoesNotExist:
        return HttpResponse(status=400, content="Downloadable object not found for requested id value.")

    current_user = request.user
    if current_user is None:
        return HttpResponse(status=401)
    user = User.objects.get(username=current_user)

    user_download = UserDownload.objects.create(user=user, downloadable=downloadable)
    user_download.save()

    url = downloadable.url
    logger.info("Redirecting to %s", url)
    return redirect(url)
