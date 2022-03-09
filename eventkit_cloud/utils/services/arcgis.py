from logging import getLogger
from typing import Optional, TypedDict

from django.contrib.gis.geos import Polygon

from eventkit_cloud.utils.services.base import GisClient

logger = getLogger(__name__)


class ArcGIS(GisClient):
    def __init__(self, *args, **kwargs):
        """
        Initialize this ArcGIS object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """
        super(ArcGIS, self).__init__(*args, **kwargs)

        self.layer = self.layer.lower() if self.layer else None

    def download_geometry(self) -> Optional[Polygon]:
        response = self.session.get(self.service_url, params={"f": "json"})
        response.raise_for_status()
        data = response.json()
        extent = data.get("initialExtent") or data.get("fullExtent") or data.get("extent")
        return get_polygon_from_arcgis_extent(extent)

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to service type")


class _ArcGISSpatialReference(TypedDict):
    wkid: int


class ArcGISSpatialReference(_ArcGISSpatialReference, total=False):
    latestWkid: int


class ArcGISExtent(TypedDict):
    xmin: float
    ymin: float
    xmax: float
    ymax: float
    spatialReference: ArcGISSpatialReference


def get_polygon_from_arcgis_extent(extent: ArcGISExtent):
    spatial_reference = extent.get("spatialReference", {})
    bbox = [
        extent.get("xmin"),
        extent.get("ymin"),
        extent.get("xmax"),
        extent.get("ymax"),
    ]
    try:
        polygon = Polygon.from_bbox(bbox)
        polygon.srid = (
            spatial_reference.get("latestWkid") or spatial_reference.get("wkid") or 4326
        )
        polygon.transform(4326)
        return polygon
    except Exception:
        return Polygon.from_bbox([-180, -90, 180, 90])
