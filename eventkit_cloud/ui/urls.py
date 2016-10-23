# -*- coding: utf-8 -*-
from django.conf.urls import patterns, url
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView

from .views import clone_export, create_export, view_export


urlpatterns = [
    url(r'^$', login_required(TemplateView.as_view(template_name='ui/list.html')), name='list'),
    url(r'^create/$', login_required(create_export, redirect_field_name=None), name='create'),
    url(r'^configurations/$', login_required(TemplateView.as_view(template_name='ui/configurations.html')), name='configurations'),
    url(r'^(?P<uuid>[^/]+)/$', login_required(view_export), name='detail'),
    url(r'^clone/(?P<uuid>[^/]+)/$', login_required(clone_export), name='clone')
]