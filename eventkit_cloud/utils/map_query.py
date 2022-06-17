import json
import logging
from abc import ABC
from collections import defaultdict
from typing import Any, Dict, Type

from eventkit_cloud.utils.arcgis2geojson import convert as convert_arcgis_to_geojson

logger = logging.getLogger(__name__)


class MapQuery(ABC):
    def __init__(self):
        pass

    def get_geojson(self, response):
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


def get_map_query(type: str) -> Type[MapQuery]:

    print(f"get_map_query: {type}")
    query_map: Dict[str, Any] = defaultdict(lambda: MapQuery)
    query_map["arcgis"] = ArcGISQuery

    return query_map[type]
