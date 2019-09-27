# -*- coding: utf-8 -*-
"""UI view definitions."""
from logging import getLogger
from django.core.cache import cache
from django.conf import settings
from django.http.request import HttpRequest
from django.http.response import HttpResponse
import yaml

from eventkit_cloud.utils import auth_requests
from eventkit_cloud.jobs.models import DataProvider
from mapproxy.config.config import load_config, load_default_config
from mapproxy.config.loader import ProxyConfiguration, ConfigurationError, validate_references
from mapproxy.wsgiapp import MapProxyApp
from urllib.parse import parse_qs
import time

from webtest import TestApp

logger = getLogger(__file__)


def map(request: HttpRequest, slug: str, path: str) -> HttpResponse:
    """
    Makes a proxy request to mapproxy used to get map tiles.
    :param request: The httprequest.
    :param slug: A string matching the slug of a DataProvider.
    :param path: The rest of the url context (i.e. the path to the tile some_service/0/0/0.png).
    :return: The HttpResponse.
    """

    start_time = time.time()

    conf_dict = cache.get_or_set(F"base-config-{slug}", lambda: get_conf_dict(slug), 360)

    # TODO: place this somewhere else consolidate settings.
    base_config = {"services": {"demo": None,
                                "wmts": None,
                                },
                   "caches": {slug: {"default": {"type": "file"},
                                     "sources": ["default"],
                                     "grids": ["default"]}},
                   "layers": [{"name": slug, "title": slug, "sources": [slug]}]
                   }
    try:
        mapproxy_config = load_default_config()
        load_config(mapproxy_config, config_dict=conf_dict)
        load_config(mapproxy_config, config_dict=base_config)
        mapproxy_configuration = ProxyConfiguration(mapproxy_config)
    except ConfigurationError as e:
        logger.error(e)
        raise

    cert_var = conf_dict.get("cert_var")
    auth_requests.patch_https(slug=slug, cert_var=cert_var)

    cred_var = conf_dict.get("cred_var")
    auth_requests.patch_mapproxy_opener_cache(slug=slug, cred_var=cred_var)
    config_time = time.time()

    app = MapProxyApp(mapproxy_configuration.configured_services(), mapproxy_config)
    mapproxy_app = TestApp(app)

    app_time = time.time()

    params = parse_qs(request.META['QUERY_STRING'])

    mp_response = mapproxy_app.get(path, params, request.headers)

    response = HttpResponse(mp_response.body, status=mp_response.status_int)
    for header, value in mp_response.headers.iteritems():
        response[header] = value

    return response


def get_conf_dict(slug: str) -> dict:
    """
    Takes a slug value for a DataProvider and returns a mapproxy configuration as a dict.
    :param slug: A string matching the slug of a DataProvider
    :return: a dict.
    """

    try:
        provider = cache.get_or_set(F"DataProvider-{slug}", lambda: DataProvider.objects.get(slug=slug), 360)
    except Exception:
        raise Exception(F"Unable to find provider for slug {slug}")

        # Load and "clean" mapproxy config for displaying a map.
    try:
        conf_dict = yaml.load(provider.config)
        conf_dict.pop("caches", "")
        conf_dict.pop("layers", "")
        ssl_verify = getattr(settings, "SSL_VERIFICATION", True)
        if isinstance(ssl_verify, bool):
            if not ssl_verify:
                conf_dict['globals'] = {'http': {'ssl_no_cert_checks': ssl_verify}}
        else:
            conf_dict['globals'] = {'http': {'ssl_ca_certs': ssl_verify}}
        conf_dict.update({'globals': {'cache': {'lock_dir': "./locks",
                                                'tile_lock_dir': "./locks"}}})
    except Exception as e:
        logger.error(e)
        raise Exception(F"Unable to load a mapproxy configuration for slug {slug}")

    return conf_dict
