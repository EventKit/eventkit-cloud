# -*- coding: utf-8 -*-
"""UI view definitions."""
from logging import getLogger

from django.http import HttpResponse
from django.core.cache import cache
import yaml

from eventkit_cloud.utils import auth_requests
from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.utils.auth_requests import cert_var_to_cert
from mapproxy.config.config import load_config, load_default_config
from mapproxy.config.loader import ProxyConfiguration, ConfigurationError, validate_references
from mapproxy.wsgiapp import MapProxyApp
from urllib.parse import parse_qs

from webtest import TestApp

logger = getLogger(__file__)


def map(request, slug, path):

    try:
        provider = cache.get_or_set(F"DataProvider-{slug}", lambda: DataProvider.objects.get(slug=slug), 360)
    except Exception:
        raise Exception(F"Unable to find provider for slug {slug}")

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
                    "layers": [{"name": slug, "title": provider.name, "sources": slug}]
                    }

    try:
        #TODO: Can this be consolidated with mapproxy utils?
        conf_dict = yaml.load(provider.config)

        mapproxy_config = load_default_config()
        mapproxy_config.update(base_config)
        load_config(mapproxy_config, config_dict=conf_dict)
        mapproxy_configuration = ProxyConfiguration(mapproxy_config)
    except ConfigurationError as e:
        logger.error(e)
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

