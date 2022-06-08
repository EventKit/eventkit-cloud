# -*- coding: utf-8 -*-
import logging
import re
import xml.etree.ElementTree as ET
from io import StringIO
from typing import List, Optional

import requests
from django.contrib.gis.geos import Polygon

from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.check_result import CheckResult
from eventkit_cloud.utils.services.errors import (
    MissingLayerError,
    ProviderCheckError,
    ServiceError,
    UnsupportedFormatError,
)

logger = logging.getLogger(__name__)


class OWS(GisClient):
    def __init__(self, *args, **kwargs):
        """
        Initialize this OWSProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """
        super(OWS, self).__init__(*args, **kwargs)

        self.query = {"VERSION": "1.0.0", "REQUEST": "GetCapabilities"}
        # Amended with "SERVICE" parameter by subclasses

        # If service or version parameters are left in query string, it can lead to a protocol error and false negative
        self.service_url = re.sub(r"(?i)(version|service|request)=.*?(&|$)", "", self.service_url)

        self.layer = self.layer.lower() if self.layer else None
        self.layer_elements = None

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to provider type")

    def get_bbox(self, elements) -> List[float]:
        raise NotImplementedError("Method is specific to provider type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")

    def validate_response(self, response: requests.Response) -> bool:
        try:
            xml = response.content.decode()
            xmll = xml.lower()
            doctype = re.search(r"<!DOCTYPE[^>[]*(\[[^]]*\])?>", xml)
            if doctype is not None:
                doctype_pos = doctype.end()
                xmll = xml[:doctype_pos] + xml[doctype_pos + 1 :].lower()

            xmll = xmll.replace("![cdata[", "![CDATA[")

            # Strip namespaces from tags (from http://bugs.python.org/issue18304)
            iterator = ET.iterparse(StringIO(xmll))
            for event, element in iterator:
                if "}" in element.tag:
                    element.tag = element.tag.split("}", 1)[1]
            root = iterator.root
            try:
                layer_elements = self.find_layers(root)
            except UnsupportedFormatError:
                logger.error("Missing expected root layer", exc_info=True)
                raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)
            except MissingLayerError:
                logger.error("Missing expected layer %s", self.layer, exc_info=True)
                raise ProviderCheckError(CheckResult.LAYER_NOT_AVAILABLE)
            except ServiceError:
                logger.error("Failed to properly parse the response", exc_info=True)
                logger.info(xml)
                raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)

            if not layer_elements:
                return False
            self.layer_elements = layer_elements
            geom = self.download_geometry()
            if geom is not None:
                self.check_intersection(geom)
            return True

        except ET.ParseError as ex:
            logger.error("Provider check failed to parse GetCapabilities XML: {}".format(str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)

    def get_bboxes(self, elements: List[ET.Element]) -> List[List[float]]:
        bboxes = []
        for element in elements:
            bbox = self.get_bbox(element)
            if bbox:
                bboxes.append(bbox)
        return bboxes

    def download_geometry(self) -> Optional[Polygon]:
        if not self.layer_elements:
            self.check(self.aoi)
        bboxes = self.get_bboxes(self.layer_elements)
        polygon = Polygon()
        for bbox in bboxes:
            polygon = polygon.union(Polygon.from_bbox(bbox))
        if polygon.area:
            return polygon
        return None
