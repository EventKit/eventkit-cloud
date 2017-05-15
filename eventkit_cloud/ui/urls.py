# -*- coding: utf-8 -*-
from django.conf.urls import url
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from .views import logout, auth, data_estimator, request_geonames


urlpatterns = [
    url(r'^login', ensure_csrf_cookie(TemplateView.as_view(template_name='ui/index.html')), name='login'),
    url(r'^auth/$', ensure_csrf_cookie(auth), name='auth'),
    url(r'^$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="home"),
    url(r'^status', login_required(TemplateView.as_view(template_name='ui/index.html')), name="status"),
    url(r'^create$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="create"),
    url(r'^account', login_required(TemplateView.as_view(template_name='ui/index.html')), name="account"),
    url(r'^logout', login_required(logout), name="logout"),
    url(r'^estimator$', login_required(data_estimator)),
    url(r'^request_geonames$', login_required(request_geonames)),
]
