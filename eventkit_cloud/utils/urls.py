# -*- coding: utf-8 -*-
from django.contrib.auth.decorators import login_required
from django.urls import re_path

from eventkit_cloud.utils.views import map

urlpatterns = [
    re_path(r"^map\/(?P<slug>.*?)(?P<path>\/.*)$", login_required(map), name="map"),
]
