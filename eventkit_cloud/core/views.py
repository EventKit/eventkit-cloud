# -*- coding: utf-8 -*-

from django.conf import settings

from django.shortcuts import redirect
from django.http import HttpResponse
from ..jobs.models import DataProvider, Job, User, UserDownload

from logging import getLogger

logger = getLogger(__name__)


def download(request):
    """
    Logs and redirects a dataset download request
    :return: A redirect to the download provided in the URL query string
    """
    username = request.GET.get('user')
    provider_slug = request.GET.get('provider')
    job_id = request.GET.get('job')
    if username and provider_slug and job_id:
        user = User.objects.get(username=username)
        provider = DataProvider.objects.get(slug=provider_slug)
        job = Job.objects.get(uid=job_id)

        size = request.GET.get('size')
        if size and size != 'None':
            size = int(size) / 1024 / 1024.00
        else:
            size = None

        user_download = UserDownload.objects.create(user=user, provider=provider, size=size, job=job)
        user_download.save()
    url = request.GET.get('url')
    if url:
        url = url.replace('%26', '&')
        return redirect(url)
    else:
        return HttpResponse(status=400)
