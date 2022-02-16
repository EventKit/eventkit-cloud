from logging import getLogger
from typing import Optional

from django.contrib.gis.geos import Polygon

from eventkit_cloud.utils.gdalutils import get_polygon_from_arcgis_extent
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
