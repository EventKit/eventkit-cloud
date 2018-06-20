# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .views import download
from django.conf.urls import url


urlpatterns = []


urlpatterns += [
    url(r'^download', download)
]

