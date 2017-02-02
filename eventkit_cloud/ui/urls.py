# -*- coding: utf-8 -*-
from django.conf.urls import url
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView

from .views import logout

urlpatterns = [
    # url(r'^login/$', ensure_csrf_cookie(TemplateView.as_view(template_name='ui/index.html')), name="home"),
    url(r'^$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="home"),
    url(r'^exports$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="exports"),
    url(r'^create$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="create"),
    url(r'^account', login_required(TemplateView.as_view(template_name='ui/index.html')), name="account"),
    url(r'^logout', logout, name="logout"),
]
