# -*- coding: utf-8 -*-
from django.urls import re_path
from django.contrib.auth.decorators import login_required

from eventkit_cloud.utils.views import map

urlpatterns = [
    re_path(r"^map\/(?P<slug>.*?)(?P<path>\/.*)$", login_required(map), name="map"),
]
