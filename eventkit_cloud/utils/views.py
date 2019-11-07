# -*- coding: utf-8 -*-
"""UI view definitions."""
from logging import getLogger
from django.core.cache import cache
from django.conf import settings
from django.http.request import HttpRequest
from django.http.response import HttpResponse
import yaml

from eventkit_cloud.jobs.models import DataProvider
from urllib.parse import parse_qs
from eventkit_cloud.utils.mapproxy import create_mapproxy_app

logger = getLogger(__file__)


def map(request: HttpRequest, slug: str, path: str) -> HttpResponse:
    """
    Makes a proxy request to mapproxy used to get map tiles.
    :param request: The httprequest.
    :param slug: A string matching the slug of a DataProvider.
    :param path: The rest of the url context (i.e. tgit sqhe path to the tile some_service/0/0/0.png).
    :return: The HttpResponse.
    """

    mapproxy_app = create_mapproxy_app(slug)
    params = parse_qs(request.META['QUERY_STRING'])

    mp_response = mapproxy_app.get(path, params, request.headers)

    response = HttpResponse(mp_response.body, status=mp_response.status_int)
    for header, value in mp_response.headers.iteritems():
        response[header] = value

    return response
