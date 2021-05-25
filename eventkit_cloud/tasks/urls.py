# -*- coding: utf-8 -*-


from django.contrib.auth.decorators import login_required
from django.urls import re_path
from django.views.decorators.cache import never_cache

from eventkit_cloud.tasks.views import download

urlpatterns = []


urlpatterns += [
    re_path(r"^download", never_cache(login_required(download))),
]
