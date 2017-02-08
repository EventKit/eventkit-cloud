# -*- coding: utf-8 -*-
from __future__ import absolute_import
"""
URL Configuration
"""
from django.conf.urls import include, url
from django.contrib import admin
from ..ui import urls as ui_urls

admin.autodiscover()

urlpatterns = []

urlpatterns += [
                url(r'^', include(ui_urls), name='index'),
]

