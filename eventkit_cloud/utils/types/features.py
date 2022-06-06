from __future__ import annotations

from typing import Dict, List, Literal, TypedDict, Union


Coordinates = List[Union[float, List[Union[float, List[float]]]]]


class GeojsonGeometry(TypedDict):
    type: Literal[
        "Position",
        "Point",
        "MultiPoint",
        "LineString",
        "MultiLineString",
        "Polygon",
        "MultiPolygon",
        "GeometryCollection",
    ]
    coordinates: Coordinates


class _GeojsonFeature(TypedDict):
    type: Literal["Feature"]
    geometry: GeojsonGeometry


class GeojsonFeature(_GeojsonFeature, total=False):
    bbox: List[float]


class GeojsonFeatureCollection(TypedDict):
    type: Literal["FeatureCollection"]
    features: List[GeojsonFeature]


Geojson = Union[GeojsonFeatureCollection, GeojsonFeature, GeojsonGeometry]

SimpleDict = Dict[str, Union[str, int, float, bool, None]]
