# -*- coding: utf-8 -*-
from django.conf import settings
from django.conf.urls import url
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie
from .views import logout, data_estimator, auth, geocode, get_config
from django.conf import settings

urlpatterns = [
    url(r'^login', ensure_csrf_cookie(TemplateView.as_view(template_name='ui/index.html')), name='login'),
    url(r'^/?$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="home"),
    url(r'^exports/?$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="exports"),
    url(r'^status', login_required(TemplateView.as_view(template_name='ui/index.html')), name="status"),
    url(r'^create/?$', login_required(TemplateView.as_view(template_name='ui/index.html')), name="create"),
    url(r'^account', login_required(TemplateView.as_view(template_name='ui/index.html')), name="account"),
    url(r'^about', login_required(TemplateView.as_view(template_name='ui/index.html')), name="about"),
    url(r'^logout', login_required(logout), name="logout"),
    url(r'^estimator/?$', login_required(data_estimator)),
    url(r'^geocode/?$', login_required(geocode)),
    url(r'^configuration/?$', get_config),
]

urlpatterns += [
    url(r'^auth$', ensure_csrf_cookie(auth), name='auth'),
    ]