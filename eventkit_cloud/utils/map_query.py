from abc import ABC
from django.contrib.gis.geos import GEOSGeometry
from collections import defaultdict
from eventkit_cloud.utils.arcgis2geojson import convert as convert_arcgis_to_geojson
import logging
import json

logger = logging.getLogger(__name__)


class MapQuery(ABC):
    def __init__(self):
        pass

    def get_geojson(self, response):
        geom = GEOSGeometry(response.content)
        if geom.valid:
            return response


class ArcGISQuery(MapQuery):
    def get_geojson(self, response):
        data = response.content
        geojson = convert_arcgis_to_geojson(json.loads(data))
        response.content = json.dumps(geojson)
        return response


class OSMQuery(MapQuery):
    pass


class OGCQuery(MapQuery):
    pass


def get_map_query(type: str) -> MapQuery:

    query_map = defaultdict(lambda: MapQuery)
    query_map["arcgis-raster"] = ArcGISQuery

    return query_map.get(type)
