import copy
from logging import getLogger
from typing import Optional, TypedDict, Union

import requests
from django.contrib.gis.geos import Polygon

from eventkit_cloud.feature_selection.feature_selection import slugify
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
        self.service_description = None
        self.layer = self.layer.lower() if self.layer else None

    def download_geometry(self) -> Optional[Polygon]:
        response = self.session.get(self.service_url, params={"f": "json"})
        response.raise_for_status()
        data = response.json()
        extent = data.get("fullExtent") or data.get("extent") or data.get("initialExtent")
        return get_polygon_from_arcgis_extent(extent)

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to service type")

    @cacheable(key_fields=["layer_id"])
    def get_capabilities(
        self, layer_id: Optional[Union[str, int]] = None, layers: dict = None, get_sublayers: bool = True
    ):
        # If there is not a layer_id provided then the service url is used
        # that implies that it is the general service description for the instantiated client.
        if not layer_id and self.service_description:
            return self.service_description
        url = f"{self.service_url.removesuffix('/')}/{layer_id}" if layer_id is not None else self.service_url
        try:
            logger.info("Getting service description from %s", url)
            result = self.session.get(url, params={"f": "json"})
            result.raise_for_status()
            service_description = result.json()
            layers = copy.deepcopy(layers) or {}
            sub_layers = {}
            for layer in service_description.get("layers", {}):
                # The top level service description will have the definition for all of the layers
                # We can make a request for all of those layers now, then when we get the sublayers we can just pass
                # in the "prefetched" version.
                logger.debug("Getting service layer: %s", layer.get("id"))
                new_layer = self.get_capabilities(layer_id=layer.get("id"), layers=layers, get_sublayers=False)
                logger.debug("setting layer id: %s with new layer %s", layer.get("id"), new_layer)
                layers[layer["id"]] = new_layer
            # from celery.contrib import rdb;
            # rdb.set_trace()
            if get_sublayers:
                for sub_layer in service_description.get("subLayers", {}):
                    logger.debug("Getting layer %s sublayer: %s", layer_id, sub_layer.get("id"))
                    new_sub_layer = layers.get(sub_layer["id"]) or [
                        self.get_capabilities(layer_id=sub_layer.get("id"), layers=layers)
                    ]
                    logger.debug("setting sublayer id: %s with new layer %s", sub_layer.get("id"), new_layer)
                    sub_layers[sub_layer["id"]] = new_sub_layer
            service_description["subLayers"] = list(sub_layers.values()) or list(layers.values())
            service_description["url"] = url  # Not in spec but helpful for calling the layer for data.
            if not layer_id:
                self.service_description = service_description
            return service_description
        except requests.exceptions.HTTPError:
            if url:
                logger.error("Could not get service description for %s", url)
            raise

    def get_layers(self) -> LayersDescription:
        cap_doc = self.get_capabilities(layer_id=self.layer)

        if cap_doc and self.layer:
            return {self.layer: {"name": str(self.layer), "url": str(cap_doc["url"])}}
        if cap_doc.get("layers"):
            # TODO: This logic is specific for feature layers,
            #  this will need to change or be subclassed to separate raster/feature services.
            return {
                slugify(layer["name"]): layer for layer in (cap_doc.get("subLayers", [])) if "Feature" in layer["type"]
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
