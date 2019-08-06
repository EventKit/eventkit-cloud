# -*- coding: utf-8 -*-
"""UI view definitions."""
import json
from datetime import timedelta
from logging import getLogger

from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth import logout as auth_logout
from django.urls import reverse
from django.http import HttpResponse
from django.shortcuts import redirect, render_to_response
from django.template import RequestContext
from django.template.context_processors import csrf
from django.views.decorators.http import require_http_methods
from rest_framework.renderers import JSONRenderer
import yaml

from eventkit_cloud.api.serializers import UserDataSerializer
from eventkit_cloud.ui.helpers import file_to_geojson, set_session_user_last_active_at, is_mgrs, is_lat_lon
from eventkit_cloud.utils import auth_requests
from eventkit_cloud.utils.geocoding.coordinate_converter import CoordinateConverter
from eventkit_cloud.utils.geocoding.geocode import Geocode
from eventkit_cloud.utils.geocoding.reverse import ReverseGeocode
from eventkit_cloud.jobs.models import DataProvider
from mapproxy.config.config import load_config, load_default_config
from mapproxy.config.loader import ProxyConfiguration, ConfigurationError, validate_references
from mapproxy.wsgiapp import MapProxyApp
from urllib.parse import parse_qs

from webtest import TestApp

logger = getLogger(__file__)


def map(request, slug, path):

    #TODO: place this somewhere else consolidate settings.
    base_config = {"services": {"demo": None,
                                 "wmts": None,
                                 },
                    "caches": {slug: {"cache": {"type": "file"},
                                      "sources": ["imagery"],
                                      "grids": ["geodetic"]},
                               "cache": {"cache": {"type": "file"},
                                         "sources": ["imagery"],
                                         "grids": ["geodetic"]}
                               },
                    "layers": [{"name": "imagery", "title": "imagery", "sources": slug}]
                    }

    try:
        #TODO: Can this be consolidated with mapproxy utils?
        #TODO: This provider should be stored on and attempted to retrieve from cache.
        provider = DataProvider.objects.get(slug=slug)
        conf_dict = yaml.load(provider.config)

        mapproxy_config = load_default_config()
        mapproxy_config.update(base_config)
        load_config(mapproxy_config, config_dict=conf_dict)
        mapproxy_configuration = ProxyConfiguration(mapproxy_config)
    except ConfigurationError as e:
            log.error(e)
            raise

    app = MapProxyApp(mapproxy_configuration.configured_services(), mapproxy_config)

    mapproxy_app = TestApp(app)

    cert_var = yaml.load(provider.config).get("cert_var")
    auth_requests.patch_https(slug=provider.name, cert_var=cert_var)

    cred_var = yaml.load(provider.config).get("cred_var")
    auth_requests.patch_mapproxy_opener_cache(slug=provider.name, cred_var=cred_var)

    params = parse_qs(request.META['QUERY_STRING'])

    mp_response = mapproxy_app.get(path, params, request.headers)

    response = HttpResponse(mp_response.body, status=mp_response.status_int)
    for header, value in mp_response.headers.iteritems():
        response[header] = value

    return response

