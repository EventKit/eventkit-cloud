# -*- coding: utf-8 -*-


from django.urls import re_path
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache

from eventkit_cloud.auth.views import requires_oauth_authentication
from eventkit_cloud.tasks.views import download

urlpatterns = []


urlpatterns += [
    re_path(r"^download", never_cache(requires_oauth_authentication(login_required(download)))),
]
