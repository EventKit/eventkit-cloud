import abc
import json
import logging

import requests
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection

from eventkit_cloud.core.helpers import get_or_update_session

logger = logging.getLogger(__name__)


class GisClient(abc.ABC):
    aoi = None

    def __init__(self, service_url, layer, aoi_geojson=None, slug=None, max_area=0, config: dict = None):
        """
        Initialize this ProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        :param slug: (Optional) A provider slug to use for getting credentials.
        :param max_area: The upper limit for this datasource.
        """

        self.service_url = service_url
        self.query = None
        self.layer = layer
        self.slug = slug
        self.max_area = max_area
        self.timeout = 10
        self.config = config or dict()
        self.session = get_or_update_session(
            session=None,
            cert_info=self.config.get("cert_info", None),
            slug=self.slug,
            params=self.query,
            timeout=self.timeout,
        )

        if aoi_geojson is not None and aoi_geojson != "":
            if isinstance(aoi_geojson, str):
                aoi_geojson = json.loads(aoi_geojson)

            geoms = tuple(
                [
                    GEOSGeometry(json.dumps(feature.get("geometry")), srid=4326)
                    for feature in aoi_geojson.get("features")
                ]
            )

            geom_collection = GeometryCollection(geoms, srid=4326)

            logger.debug("AOI: {}".format(json.dumps(aoi_geojson)))

            self.aoi = geom_collection
        else:
            self.aoi = None
            logger.debug("AOI was not given")

    def find_layer(self, root):
        raise NotImplementedError("Method is specific to service type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to service type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to service type")

    def get_response(self) -> requests.Response:
        return self.session.get(self.service_url, params=self.query,
                                           timeout=self.timeout)
