# -*- coding: utf-8 -*-


from django.urls import re_path

from eventkit_cloud.tasks.views import download

urlpatterns = []


urlpatterns += [
    re_path(r'^download', download)
]

