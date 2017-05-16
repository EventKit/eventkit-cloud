# -*- coding: utf-8 -*-

from __future__ import absolute_import

from .views import oauth, callback, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf.urls import url

urlpatterns = [
    url(r'^oauth$', ensure_csrf_cookie(oauth), name='oauth'),
    url(r'^callback$', ensure_csrf_cookie(callback), name='callback'),
    url(r'^logout$', ensure_csrf_cookie(logout), name='logout')
]