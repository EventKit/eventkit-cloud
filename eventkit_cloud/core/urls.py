# -*- coding: utf-8 -*-


"""
URL Configuration
"""

from django.contrib import admin
from eventkit_cloud.ui import urls as ui_urls
from eventkit_cloud.auth import urls as auth_urls
from eventkit_cloud.api.urls import schema_view
from eventkit_cloud.api.urls import router
from eventkit_cloud.tasks import urls as task_urls

from django.conf.urls import url, include
import notifications.urls

admin.autodiscover()

urlpatterns = []

urlpatterns += [
    url(r'^', include(auth_urls)),
    url(r'^', include(task_urls)),
    url(r'^', include(ui_urls), name='index'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api/docs$', schema_view),
    url(r'^api/', include(router.urls, namespace='api')),
    url(r'^api/', include('rest_framework.urls', namespace='rest_framework')),
    url('^api/', include(notifications.urls, namespace='api')),
]

