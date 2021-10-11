import logging

from eventkit_cloud.jobs.models import DataProviderType
from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.overpass import Overpass
from eventkit_cloud.utils.services.tms import TMS
from eventkit_cloud.utils.services.wcs import WCS
from eventkit_cloud.utils.services.wfs import WFS
from eventkit_cloud.utils.services.wms import WMS
from eventkit_cloud.utils.services.wmts import WMTS

logger = logging.getLogger(__name__)


class GisClientBuilder:

    def __init__(self, service_url, layer):
        self.service_url = service_url
        self.layer = layer
        self.aoi_geojson = None
        self.slug = None
        self.max_area = None
        self.config = None
        self.export_provider_type = None

    def set_aoi_geojson(self, value):
        self.aoi_geojson = value
        return self

    def set_slug(self, value):
        self.slug = value
        return self

    def set_max_area(self, value):
        self.max_area = value
        return self

    def set_config(self, value):
        self.config = value
        return self

    def set_export_provider_type(self, value):
        self.export_provider_type = value
        return self

    def build(self) -> GisClient:
         return self.build(self.export_provider_type)

    def build(self, export_provider_type: DataProviderType) -> GisClient:
        if export_provider_type is None:
            raise KeyError(
                "No export provider type provided, unable to discern which concrete class to instantiate."
            )
        else:
            client_class = PROVIDER_CLIENT_MAP.get(export_provider_type)
            if client_class is None:
                # TODO raise exception for when no client class available
                pass
            else:
                return client_class(
                    self.service_url,
                    self.layer,
                    self.aoi_geojson,
                    self.slug,
                    self.max_area,
                    self.config,
                )


PROVIDER_CLIENT_MAP = {
    "wfs": WFS,
    "wcs": WCS,
    "wms": WMS,
    "osm": Overpass,
    "osm-generic": Overpass,
    "wmts": WMTS,
    "arcgis-raster": GisClient, #TODO: is defaulting to GisClient correct here?
    "arcgis-feature": GisClient,
    "tms": TMS,
    "vector-file": GisClient,
    "raster-file": GisClient,
    "ogcapi-process": GisClient,
}