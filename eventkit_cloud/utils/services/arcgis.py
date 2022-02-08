import re
from typing import Optional

from django.contrib.gis.geos import Polygon

from eventkit_cloud.api.validators import validate_bbox
from eventkit_cloud.utils.services.base import GisClient

from logging import getLogger

logger = getLogger(__name__)


class ArcGIS(GisClient):
    def __init__(self, *args, **kwargs):
        """
        Initialize this OWSProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """
        super(ArcGIS, self).__init__(*args, **kwargs)

        self.query = {"VERSION": "1.0.0", "REQUEST": "GetCapabilities"}
        # Amended with "SERVICE" parameter by subclasses

        # If service or version parameters are left in query string, it can lead to a protocol error and false negative
        self.service_url = re.sub(r"(?i)(version|service|request)=.*?(&|$)", "", self.service_url)

        self.layer = self.layer.lower()

    def download_product_geometry(self) -> Optional[Polygon]:
        from pyproj import CRS
        response = self.session.get(self.service_url, params={"f": "json"}).json
        response.raise_for_status()
        data = response.json()
        logger.error(data)
        extent = data.get("initialExtent") or data.get("fullExtent") or data.get("extent")
        srid = extent.get("spatialReference", {}).get("latestWkid")
        crs = CRS.from_epsg(srid)

        # Some bbox seem invalid.
        bbox = validate_bbox([extent["xmin"], extent["ymin"], extent["xmax"], extent["ymax"]]) or [-180, -90, 180, 90]
        return Polygon.from_bbox(bbox)
