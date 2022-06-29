import copy
from logging import getLogger
from math import floor
from typing import Optional, TypedDict, Union

import requests
from django.contrib.gis.geos import Polygon

from eventkit_cloud.feature_selection.feature_selection import slugify
from eventkit_cloud.tasks.helpers import get_zoom_level_from_scale
from eventkit_cloud.utils.generic import cacheable
from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.types import LayersDescription

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
        self.layer = str(self.layer).lower() if self.layer is not None else None

    def download_geometry(self) -> Optional[Polygon]:
        response = self.session.get(self.service_url, params={"f": "json"})
        response.raise_for_status()
        data = response.json()
        extent = data.get("fullExtent") or data.get("extent") or data.get("initialExtent")
        return get_polygon_from_arcgis_extent(extent)

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to service type")

    @cacheable(timeout=86400, key_fields=["layer_id", "layer", "service_url"])  # timeout: 1 day
    def get_capabilities(self, layer_id: Optional[Union[str, int]] = None):
        # If there is not a layer_id provided then the service url is used
        # that implies that it is the general service description for the instantiated client.
        layer_id = str(layer_id) if layer_id is not None else None
        lyr_id = layer_id or self.layer
        url = f"{self.service_url.removesuffix('/')}/{lyr_id}" if lyr_id else self.service_url
        try:
            logger.info("Getting service description from %s", url)
            result = self.session.get(url, params={"f": "json"})
            result.raise_for_status()
            service_capabilities = result.json()
            layers = {}
            for layer in service_capabilities.get("subLayers", []) or service_capabilities.get("layers", []):
                logger.debug("Getting layer %s sublayer: %s", lyr_id, layer.get("id"))
                new_sub_layer = self.get_capabilities(layer_id=layer["id"])
                logger.debug("setting sublayer id: %s with new layer %s", layer.get("id"), new_sub_layer)
                layers[layer["id"]] = new_sub_layer
            if service_capabilities.get("layers"):
                service_capabilities["layers"] = list(layers.values())
            else:
                service_capabilities["subLayers"] = list(layers.values())
            service_capabilities["url"] = url  # Not in spec but helpful for calling the layer for data.
            service_capabilities["level"] = get_zoom_level_from_scale(service_capabilities.get("minScale"), limit=16)
            return service_capabilities
        except requests.exceptions.HTTPError:
            if url:
                logger.error("Could not get service description for %s", url)
            raise

    def get_layers(self) -> LayersDescription:
        cap_doc = self.get_capabilities(layer_id=self.layer)

        if cap_doc and self.layer:
            return {self.layer: {"name": str(self.layer), "url": str(cap_doc["url"])}}
        if cap_doc.get("layers") or cap_doc.get("subLayers"):
            # TODO: This logic is specific for feature layers,
            #  this will need to change or be subclassed to separate raster/feature services.
            return {
                slugify(layer["name"]): layer
                for layer in (cap_doc.get("subLayers", []) or cap_doc.get("layers", []))
                if "Feature" in layer["type"]
            }
        return {self.layer: {"name": str(self.layer), "url": self.service_url}}


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
        polygon.srid = spatial_reference.get("latestWkid") or spatial_reference.get("wkid") or 4326
        polygon.transform(4326)
        return polygon
    except Exception:
        return Polygon.from_bbox([-180, -90, 180, 90])
