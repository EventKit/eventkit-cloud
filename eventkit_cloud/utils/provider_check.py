from __future__ import absolute_import

from django.utils.translation import ugettext as _
from enum import Enum
import json
import logging
from osgeo import ogr
import re
import requests
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)


class CheckResults(Enum):
    """
    Enum describing possible results of the provider check. Returns are in JSON format, with a status field
    containing an error code, and a message field containing more detailed information. Status may be one of:
        TIMEOUT - The connection timed out (requests.get raised ConnectionTimeout)
        CONNECTION - Could not connect to endpoint (requests.get raised a different ConnectionError)
        UNAUTHORIZED - Not authorized to connect (response status 401 or 403)
        UNAVAILABLE - Server returned a status other than 200; service may not be available
        UNKNOWN_FORMAT - GetCapabilities returned blank, or unrecognized metadata format
        LAYER_NOT_AVAILABLE - The requested layer wasn't found among those listed by GetCapabilities reply
        NO_INTERSECT - The given AOI doesn't intersect the response's bounding box for the given layer
        SUCCESS - No problems: export should proceed without issues
        (NB: for OWS sources in some cases, GetCapabilities may return 200 while GetMap/Coverage/Feature returns 403.
        In these cases, a success case will be falsely reported instead of ERR_UNAUTHORIZED.)
    """
    TIMEOUT = {"status": "ERR_TIMEOUT",
               "message": _("Your connection has timed out; the provider may be offline. Refresh to try again.")},

    CONNECTION = {"status": "ERR_CONNECTION",
                  "message": _("A connection to this data provider could not be established.")},

    UNAUTHORIZED = {"status": "ERR_UNAUTHORIZED",
                    "message": _("Authorization is required to connect to this data provider.")},

    NOT_FOUND = {"status": "ERR_NOT_FOUND",
                    "message": _("The data provider was not found on the server (status 404).")},

    UNAVAILABLE = {"status": "WARN_UNAVAILABLE",
                   "message": _("This data provider may be unavailable (status %(status)s).")},

    UNKNOWN_FORMAT = {"status": "WARN_UNKNOWN_FORMAT",
                      "message": _("This data provider returned metadata in an unexpected format; "
                                   "errors may occur when creating the DataPack.")},

    LAYER_NOT_AVAILABLE = {"status": "WARN_LAYER_NOT_AVAILABLE",
                           "message": _("This data provider does not offer the requested layer.")},

    NO_INTERSECT = {"status": "WARN_NO_INTERSECT",
                    "message": _("The selected AOI does not intersect the data provider's layer.")},

    SUCCESS = {"status": "SUCCESS",
               "message": "Export should proceed without issues."},


class ProviderCheck(object):
    """
    During the second stage of creating a datapack, each available data provider is pinged to apprise the user
    of its availability. This class and its subclasses contain methods to ping OWS and Overpass servers, and determine:
        * Whether they are online
        * Whether authorization is required
        * Whether they are able to serve the requested layers; and
        * Whether the requested layer intersects the AOI of the DataPack to be created.
    Once returned, the information is displayed via an icon and tooltip in the EventKit UI.
    """

    def __init__(self, service_url, layer, aoi_geojson):
        """
        Initialize this ProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """

        self.service_url = service_url
        self.query = None
        self.layer = layer
        self.result = CheckResults.SUCCESS
        self.timeout = 10

        if aoi_geojson is not None and aoi_geojson is not "":
            if isinstance(aoi_geojson, str):
                aoi_geojson = json.loads(aoi_geojson)

            aoi_geom = aoi_geojson['features'][0]['geometry']
            logger.debug("AOI Geometry: {}".format(json.dumps(aoi_geom)))
            self.aoi = ogr.CreateGeometryFromJson(json.dumps(aoi_geom))
        else:
            self.aoi = None
            logger.debug("AOI was not given")

        self.token_dict = {}  # Parameters to include in message field of response

    def get_check_response(self):
        """
        Sends a GET request to provider URL and returns its response if status code is ok
        """

        try:
            response = requests.get(self.service_url, params=self.query, timeout=self.timeout)

            self.token_dict['status'] = response.status_code

            if response.status_code in [401, 403]:
                self.result = CheckResults.UNAUTHORIZED
                return None

            if response.status_code == 404:
                self.result = CheckResults.NOT_FOUND
                return None

            if not response.ok:
                self.result = CheckResults.UNAVAILABLE
                return None

        except requests.exceptions.ConnectTimeout as ex:
            logger.error("Provider check timed out for URL {}".format(self.service_url))
            self.result = CheckResults.TIMEOUT
            return None

        except requests.exceptions.ConnectionError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, ex.message))
            self.result = CheckResults.CONNECTION
            return None

        return response

    def validate_response(self, response):
        """
        Given a 200 response, check it for validity (intersection, layer contents, etc).
        Base implementation always returns True if a response was given at all; subclasses may override
        :param response: requests.Response object
        :return: True if response is not None
        """
        return response is not None

    def check(self):
        """
        Main call to check the status of a provider. Returns JSON with a status string and more detailed message.
        """
        self.result = CheckResults.SUCCESS

        response = self.get_check_response()
        if response is not None:
            self.validate_response(response)

        result_json = json.dumps(self.result.value[0]) % self.token_dict
        logger.debug("Provider check returning result: {}".format(result_json))
        return result_json


class OverpassProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for Overpass providers.
    """
    def __init__(self, service_url, layer, aoi_geojson):
        super(self.__class__, self).__init__(service_url, layer, aoi_geojson)

    def get_check_response(self):
        """
        Sends a POST request for metadata to Overpass URL and returns its response if status code is ok
        """
        try:
            response = requests.post(url=self.service_url, data="out meta;", timeout=self.timeout)

            self.token_dict['status'] = response.status_code

            if response.status_code in [401, 403]:
                self.result = CheckResults.UNAUTHORIZED
                return None

            if response.status_code == 404:
                self.result = CheckResults.NOT_FOUND
                return None

            if not response.ok:
                self.result = CheckResults.UNAVAILABLE
                return None

        except requests.exceptions.ConnectTimeout as ex:
            logger.error("Provider check timed out for URL {}".format(self.service_url))
            self.result = CheckResults.TIMEOUT
            return None

        except (requests.exceptions.ConnectionError, requests.exceptions.MissingSchema) as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, ex.message))
            self.result = CheckResults.CONNECTION
            return None


class OWSProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for OWS (WMS, WMTS, WFS, WCS) providers.
    """
    def __init__(self, service_url, layer, aoi_geojson):
        """
        Initialize this OWSProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """
        super(OWSProviderCheck, self).__init__(service_url, layer, aoi_geojson)

        self.query = {
            "VERSION": "1.0.0",
            "REQUEST": "GetCapabilities"
            # Amended with "SERVICE" parameter by subclasses
        }

        # If service or version parameters are left in query string, it can lead to a protocol error and false negative
        self.service_url = service_url
        if "?" in service_url:
            self.service_url = service_url.split("?")[0]

        self.ns = ""  # Common namespace for XML parsing
        self.layer = self.layer.lower()

    def find_layer(self, root):
        raise NotImplementedError("Method is specific to provider type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to provider type")

    def check_intersection(self, bbox):
        """
        Given a bounding box, set result to NO_INTERSECT if it doesn't intersect the DataPack's AOI.
        :param bbox: Bounding box array: [minx, miny, maxx, maxy] in EPSG:4326
        """
        logger.debug("Data provider bbox: [minx, miny, maxx, maxy] = {}".format(str(bbox)))
        minx, miny, maxx, maxy = bbox

        bbox_ring = ogr.Geometry(ogr.wkbLinearRing)
        bbox_ring.AddPoint(minx, miny)
        bbox_ring.AddPoint(maxx, miny)
        bbox_ring.AddPoint(maxx, maxy)
        bbox_ring.AddPoint(minx, maxy)
        bbox_ring.AddPoint(minx, miny)
        bbox = ogr.Geometry(ogr.wkbPolygon)
        bbox.AddGeometry(bbox_ring)

        if self.aoi is not None and not self.aoi.Intersects(bbox):
            self.result = CheckResults.NO_INTERSECT

    def validate_response(self, response):

        try:
            xml = response.content
            xmll = xml.lower()

            doctype = re.search(r"<!DOCTYPE[^>[]*(\[[^]]*\])?>", xml)
            if doctype is not None:
                doctype_pos = doctype.end()
                xmll = xml[:doctype_pos] + xml[doctype_pos+1:].lower()

            xmll = xmll.replace("![cdata[", "![CDATA[")
            root = ET.fromstring(xmll)
            # Check for namespace
            m = re.search(r"^{.*?}", root.tag)
            self.ns = m.group() if m else ""

            layer_element = self.find_layer(root)

            if layer_element is None:
                return

            bbox = self.get_bbox(layer_element)
            if bbox is not None:
                self.check_intersection(bbox)

        except ET.ParseError as ex:
            logger.error("Provider check failed to parse GetCapabilities XML: {}".format(ex.message))
            self.result = CheckResults.UNKNOWN_FORMAT
            return


class WCSProviderCheck(OWSProviderCheck):
    """
    Implementation of OWSProviderCheck for WCS providers
    """

    def __init__(self, service_url, layer, aoi_geojson):
        super(self.__class__, self).__init__(service_url, layer, aoi_geojson)
        self.query["SERVICE"] = "WCS"

    def find_layer(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """

        content_meta = root.find(".//{}contentmetadata".format(self.ns))
        if content_meta is None:
            self.result = CheckResults.UNKNOWN_FORMAT
            return None

        # Get names of available coverages
        coverage_offers = content_meta.findall("{}coverageofferingbrief".format(self.ns))

        cover_names = map(lambda c: (c, c.find("{}name".format(self.ns))), coverage_offers)
        if len(cover_names) == 0:  # No coverages are offered
            self.result = CheckResults.LAYER_NOT_AVAILABLE
            return None

        covers = [c for c, n in cover_names if n is not None and self.layer == n.text]
        if len(covers) == 0:  # Requested coverage is not offered
            self.result = CheckResults.LAYER_NOT_AVAILABLE
            return None

        return covers[0]

    def get_bbox(self, element):

        envelope = element.find("{}lonlatenvelope".format(self.ns))
        if envelope is None:
            return None

        pos = envelope.getchildren()
        # Make sure there aren't any surprises
        coord_pattern = re.compile(r"^-?\d+(\.\d+)? -?\d+(\.\d+)?$")
        if len(pos) == 0 or not all("pos" in p.tag and re.match(coord_pattern, p.text) for p in pos):
            return None

        x1, y1 = map(float, pos[0].text.split(' '))
        x2, y2 = map(float, pos[1].text.split(' '))

        minx, maxx = sorted([x1, x2])
        miny, maxy = sorted([y1, y2])

        return [minx, miny, maxx, maxy]


class WFSProviderCheck(OWSProviderCheck):
    """
    Implementation of OWSProviderCheck for WFS providers
    """

    def __init__(self, service_url, layer, aoi_geojson):
        super(self.__class__, self).__init__(service_url, layer, aoi_geojson)
        self.query["SERVICE"] = "WFS"

    def find_layer(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        feature_type_list = root.find(".//{}featuretypelist".format(self.ns))
        if feature_type_list is None:
            self.result = CheckResults.UNKNOWN_FORMAT
            return None

        feature_types = feature_type_list.findall("{}featuretype".format(self.ns))

        # Get layer names
        feature_names = map(lambda f: (f, f.find("{}name".format(self.ns))), feature_types)
        logger.debug("WFS layers offered: {}".format([n.text for f, n in feature_names if n]))
        features = [f for f, n in feature_names if n is not None and self.layer == n.text]

        if len(features) == 0:
            self.result = CheckResults.LAYER_NOT_AVAILABLE
            return None

        feature = features[0]
        return feature

    def get_bbox(self, element):

        bbox_element = element.find("{}latlongboundingbox".format(self.ns))

        if bbox_element is None:
            return None

        bbox = [float(bbox_element.attrib[point]) for point in ['minx', 'miny', 'maxx', 'maxy']]
        return bbox


class WMSProviderCheck(OWSProviderCheck):
    """
    Implementation of OWSProviderCheck for WMS providers
    """

    def __init__(self, service_url, layer, aoi_geojson):
        super(self.__class__, self).__init__(service_url, layer, aoi_geojson)
        self.query["SERVICE"] = "WMS"

        # 1.3.0 will work as well, if that's returned. 1.0.0 isn't widely supported.
        self.query["VERSION"] = "1.1.1"

    def find_layer(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        capability = root.find(".//{}capability".format(self.ns))
        if capability is None:
            self.result = CheckResults.UNKNOWN_FORMAT
            return None

        # Flatten nested layers to single list
        layers = capability.findall("{}layer".format(self.ns))
        sublayers = layers
        while len(sublayers) > 0:
            sublayers = [l for layer in sublayers for l in layer.findall("{}layer".format(self.ns))]
            layers.extend(sublayers)

        # Get layer names
        layer_names = map(lambda l: (l, l.find("{}name".format(self.ns))), layers)
        logger.debug("WMS layers offered: {}".format([n.text for l,n in layer_names if n]))
        layer = [l for l, n in layer_names if n is not None and self.layer == n.text]
        if len(layer) == 0:
            self.result = CheckResults.LAYER_NOT_AVAILABLE
            return None

        layer = layer[0]
        return layer

    def get_bbox(self, element):

        bbox_element = element.find("{}latlonboundingbox".format(self.ns))

        if bbox_element is None:
            return None

        bbox = [float(bbox_element.attrib[point]) for point in ['minx', 'miny', 'maxx', 'maxy']]
        return bbox


PROVIDER_CHECK_MAP = {
    "wfs": WFSProviderCheck,
    "wcs": WCSProviderCheck,
    "wms": WMSProviderCheck,
    "osm": OverpassProviderCheck,
    "wmts": WMSProviderCheck,
    "arcgis-raster": ProviderCheck,
    "arcgis-feature": ProviderCheck
}


def get_provider_checker(type_slug):
    """
    Given a string describing a provider type, return a reference to the class appropriate for checking the status
    of a provider of that type.
    :param type_slug: String describing provider type
    :return: Checker for given provider type
    """
    try:
        return PROVIDER_CHECK_MAP[type_slug]
    except KeyError:
        return ProviderCheck
