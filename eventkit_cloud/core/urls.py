# -*- coding: utf-8 -*-
from __future__ import absolute_import
"""
URL Configuration
"""
from django.conf.urls import include, url
from django.contrib import admin
from ..ui import urls as ui_urls
from django.contrib.auth.views import login
from django.views.decorators.csrf import ensure_csrf_cookie

admin.autodiscover()

urlpatterns = []

urlpatterns += [
                url(r'^login/$', ensure_csrf_cookie(login), {'template_name': 'ui/index.html'}, name='login'),
                url(r'^', include(ui_urls), name='index'),
]

