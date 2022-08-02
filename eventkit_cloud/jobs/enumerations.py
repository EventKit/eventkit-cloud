from enum import Enum


class GeospatialDataType(Enum):

    VECTOR = "vector"
    RASTER = "raster"
    ELEVATION = "elevation"
    MESH = "mesh"
    POINT_CLOUD = "point_cloud"


class StyleType(Enum):

    ARCGIS = "arcgis_layer"
    QGIS = "qgis_layer"
    MAPBOX = "mapbox"
    SLD = "sld"
    KML = "kml"
