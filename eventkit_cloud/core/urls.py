# -*- coding: utf-8 -*-
from __future__ import absolute_import

"""
URL Configuration
"""
from django.conf.urls import include, url
from django.contrib import admin
from ..ui import urls as ui_urls
from ..api.urls import schema_view
from ..api.urls import router

admin.autodiscover()

urlpatterns = []

urlpatterns += [
    url(r'^', include(ui_urls), name='index'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/docs$', schema_view),
    url(r'^api/', include(router.urls, namespace='api')),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework'))
]
