# -*- coding: utf-8 -*-
from django.conf import settings
from django.conf.urls import url
from django.contrib.auth.decorators import login_required
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie

from .views import logout, data_estimator, auth, geocode, get_config, convert_to_geojson, user_active, reverse_geocode, convert
from django.views.decorators.cache import never_cache

urlpatterns = [
    url(r'^login', never_cache(ensure_csrf_cookie(TemplateView.as_view(template_name='ui/index.html'))), name='login'),
    url(r'^/?$', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="home"),
    url(r'^exports/?$', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="exports"),
    url(r'^status', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="status"),
    url(r'^create/?$', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="create"),
    url(r'^account', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="account"),
    url(r'^about', never_cache(login_required(TemplateView.as_view(template_name='ui/index.html'))), name="about"),
    url(r'^logout', never_cache(login_required(logout)), name="logout"),
    url(r'^estimator/?$', never_cache(login_required(data_estimator))),
    url(r'^geocode/?$', never_cache(login_required(geocode))),
    url(r'^convert/?$', login_required(convert)),
    url(r'^reverse_geocode/?$', login_required(reverse_geocode)),
    url(r'^configuration/?$', never_cache(get_config)),
    url(r'^file_upload/?$', never_cache(login_required(convert_to_geojson))),
    url(r'^user_active$', never_cache(login_required(user_active)), name='user_active'),
]

urlpatterns += [
    url(r'^auth$', never_cache(ensure_csrf_cookie(auth)), name='auth'),
    ]