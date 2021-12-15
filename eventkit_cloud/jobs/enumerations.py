from enum import Enum


class GeospatialDataType(Enum):

    VECTOR = "vector"
    RASTER = "raster"
    ELEVATION = "elevation"
    MESH = "mesh"
    POINT_CLOUD = "point_cloud"
