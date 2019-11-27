# -*- coding: utf-8 -*-


from django.urls import re_path
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie

from eventkit_cloud.auth.views import oauth, callback, logout

urlpatterns = [
    re_path(r"^oauth$", ensure_csrf_cookie(oauth), name="oauth"),
    re_path(r"^callback$", ensure_csrf_cookie(callback), name="callback"),
    re_path(r"^logout$", never_cache(ensure_csrf_cookie(logout)), name="logout"),
]
