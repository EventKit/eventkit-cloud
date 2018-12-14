# -*- coding: utf-8 -*-


"""
URL Configuration
"""

from django.contrib import admin
from eventkit_cloud.ui import urls as ui_urls
from eventkit_cloud.auth import urls as auth_urls
from eventkit_cloud.api import urls as api_urls
from eventkit_cloud.tasks import urls as task_urls

from django.urls import include, re_path

admin.autodiscover()

urlpatterns = []

urlpatterns += [
    re_path(r'^', include(auth_urls)),
    re_path(r'^', include(api_urls)),
    re_path(r'^', include(task_urls)),
    re_path(r'^', include(ui_urls), name='index'),
    re_path(r'^admin/', admin.site.urls),
    re_path(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
]

