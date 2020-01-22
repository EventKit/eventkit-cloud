# -*- coding: utf-8 -*-
"""UI view definitions."""
from logging import getLogger
from django.http.request import HttpRequest
from django.http.response import HttpResponse
from urllib.parse import parse_qs
from eventkit_cloud.utils.mapproxy import create_mapproxy_app
from eventkit_cloud.utils.map_query import get_map_query

logger = getLogger(__file__)


def map(request: HttpRequest, slug: str, path: str) -> HttpResponse:
    """
    Makes a proxy request to mapproxy used to get map tiles.
    :param request: The httprequest.
    :param slug: A string matching the slug of a DataProvider.
    :param path: The rest of the url context (i.e. path to the tile some_service/0/0/0.png).
    :return: The HttpResponse.
    """
    mapproxy_app = create_mapproxy_app(slug)
    params = parse_qs(request.META["QUERY_STRING"])
    script_name = f"/map/{slug}"
    mp_response = mapproxy_app.get(path, params, request.headers, extra_environ=dict(SCRIPT_NAME=script_name))

    response = HttpResponse(mp_response.body, status=mp_response.status_int)
    for header, value in mp_response.headers.items():
        response[header] = value
    if params.get("REQUEST") == ["GetFeatureInfo"]:
        map_query = get_map_query("arcgis-raster")
        response = map_query().get_geojson(response)
    response["Content-length"] = len(response.content)
    return response
