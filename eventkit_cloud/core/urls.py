# -*- coding: utf-8 -*-


"""
URL Configuration
"""
from typing import List, Union

from django.conf import settings
from django.contrib import admin
from django.urls import URLPattern, URLResolver, include, re_path
from django.views.generic import RedirectView

from eventkit_cloud.api import urls as api_urls
from eventkit_cloud.auth import urls as auth_urls
from eventkit_cloud.tasks import urls as task_urls
from eventkit_cloud.ui import urls as ui_urls
from eventkit_cloud.utils import urls as util_urls

urlpatterns: List[Union[URLPattern, URLResolver]] = []

urlpatterns += [
    re_path(r"^", include(auth_urls)),
    re_path(r"^", include(api_urls)),
    re_path(r"^", include(task_urls)),
    re_path(r"^", include(util_urls)),
    re_path(r"^", include(ui_urls), name="index"),
    re_path(r"^api/", include("rest_framework.urls", namespace="rest_framework")),
]

# Type ignores because django-stub doesn't seem to pick up these types.
if not settings.ENABLE_ADMIN_LOGIN:  # type: ignore
    # This redirects to the standard eventkit login method instead of the admin page.
    urlpatterns += [
        re_path(rf"^{settings.ADMIN_ROOT}/login$", RedirectView.as_view(url="/login", permanent=False))  # type: ignore
    ]
if settings.ENABLE_ADMIN:  # type: ignore
    admin.autodiscover()
    urlpatterns += [re_path(rf"^{settings.ADMIN_ROOT}/", admin.site.urls)]  # type: ignore
