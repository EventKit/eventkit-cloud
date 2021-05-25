# -*- coding: utf-8 -*-
"""UI view definitions."""
from logging import getLogger
from urllib.parse import parse_qs

from django.http.request import HttpRequest
from django.http.response import HttpResponse

from eventkit_cloud.core.helpers import get_cached_model
from eventkit_cloud.tasks.models import DataProvider
from eventkit_cloud.utils.map_query import get_map_query
from eventkit_cloud.utils.mapproxy import create_mapproxy_app

logger = getLogger(__file__)


def map(request: HttpRequest, slug: str, path: str) -> HttpResponse:
    """
    Makes a proxy request to mapproxy used to get map tiles.
    :param request: The httprequest.
    :param slug: A string matching the slug of a DataProvider.
    :param path: The rest of the url context (i.e. path to the tile some_service/0/0/0.png).
    :return: The HttpResponse.
    """
    mapproxy_app = create_mapproxy_app(slug, request.user)
    params = parse_qs(request.META["QUERY_STRING"])
    script_name = f"/map/{slug}"
    mp_response = mapproxy_app.get(
        path, params, request.headers, extra_environ=dict(SCRIPT_NAME=script_name), expect_errors=True
    )
    response = HttpResponse(mp_response.body, status=mp_response.status_int)
    for header, value in mp_response.headers.items():
        response[header] = value
    if params.get("REQUEST") == ["GetFeatureInfo"]:
        provider = get_cached_model(DataProvider, "slug", slug)
        if response.status_code in [200, 202]:
            try:
                map_query = get_map_query(provider.metadata.get("type"))
                response = map_query().get_geojson(response)
            except Exception as e:
                logger.error(e)
                response.status_code = 500
                response.content = "No data available."
        else:
            if provider.metadata:
                response.content = "The service was unable to provide data for this location."
            else:
                response.content = "No data is available for this service."

    response["Content-length"] = len(response.content)
    return response
