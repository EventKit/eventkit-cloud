# -*- coding: utf-8 -*-
import base64
import json
import logging
import re
import xml.etree.ElementTree as ET
from enum import Enum
from io import StringIO
from typing import Type, Union, Optional, List

import requests
import yaml
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, Polygon, GeometryCollection
from django.core.cache import cache
from django.utils.translation import ugettext as _

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.core.helpers import get_or_update_session
from urllib.parse import urljoin

from eventkit_cloud.tasks.helpers import normalize_name
from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.errors import UnsupportedFormatError, MissingLayerError
from eventkit_cloud.utils.services.tms import TMS
from eventkit_cloud.utils.services.wmts import WMTS

logger = logging.getLogger(__name__)

DEFAULT_CACHE_TIMEOUT = 60 * 30  # 30 minutes


class CheckResult(Enum):
    """
    Enum describing possible results of the provider check. Returns are in JSON format, with a status field
    containing an error code, and a message field containing more detailed information. Status may be one of:
        TIMEOUT - The connection timed out (requests.get raised ConnectionTimeout)
        CONNECTION - Could not connect to endpoint (requests.get raised a different ConnectionError)
        NOT_FOUND - Server returned status 404; service is unlikely to be available
        SSL_EXCEPTION - Secure connection failed, probably due to a missing or misconfigured client cert/key
        UNAUTHORIZED - Not authorized to connect (response status 401 or 403)
        UNAVAILABLE - Server returned a status other than 200; service may not be available
        UNKNOWN_FORMAT - GetCapabilities returned blank, or unrecognized metadata format
        LAYER_NOT_AVAILABLE - The requested layer wasn't found among those listed by GetCapabilities reply
        NO_INTERSECT - The given AOI doesn't intersect the response's bounding box for the given layer
        NO_URL - No service url was given in the data provider config, so availability couldn't be checked
        UNKNOWN_ERROR - An exception was thrown that wasn't handled by any of the other Exception handlers.
        SUCCESS - No problems: export should proceed without issues
        (NB: for OWS sources in some cases, GetCapabilities may return 200 while GetMap/Coverage/Feature returns 403.
        In these cases, a success case will be falsely reported instead of ERR_UNAUTHORIZED.)
    """

    TIMEOUT = {
        "status": "ERR",
        "type": "TIMEOUT",
        "message": _("Your connection has timed out; the provider may be offline. Refresh to try again."),
    }

    CONNECTION = {
        "status": "ERR",
        "type": "CONNECTION",
        "message": _("A connection to this data provider could not be established."),
    }

    UNAUTHORIZED = {
        "status": "ERR",
        "type": "UNAUTHORIZED",
        "message": _("Authorization is required to connect to this data provider."),
    }

    NOT_FOUND = {
        "status": "ERR",
        "type": "NOT_FOUND",
        "message": _("The data provider was not found on the server (status 404)."),
    }

    SSL_EXCEPTION = {
        "status": "WARN",
        "type": "SSL_EXCEPTION",
        "message": _("Could not connect securely to provider; possibly missing client certificate"),
    }

    UNAVAILABLE = {
        "status": "WARN",
        "type": "UNAVAILABLE",
        "message": _("This data provider may be unavailable (status %(status)s)."),
    }

    UNKNOWN_FORMAT = {
        "status": "WARN",
        "type": "UNKNOWN_FORMAT",
        "message": _(
            "This data provider returned metadata in an unexpected format; "
            "errors may occur when creating the DataPack."
        ),
    }

    LAYER_NOT_AVAILABLE = {
        "status": "WARN",
        "type": "LAYER_NOT_AVAILABLE",
        "message": _("This data provider does not offer the requested layer."),
    }

    NO_INTERSECT = {
        "status": "WARN",
        "type": "NO_INTERSECT",
        "message": _("The selected AOI does not intersect the data provider's layer."),
    }

    NO_URL = {
        "status": "WARN",
        "type": "NO_URL",
        "message": _("No Service URL was found in the data provider config; " "availability cannot be checked"),
    }

    TOO_LARGE = {
        "status": "WARN",
        "type": "SELECTION_TOO_LARGE",
        "message": _("The selected AOI is larger than the maximum allowed size for this data provider."),
    }

    UNKNOWN_ERROR = {
        "status": "ERR",
        "type": "ERROR",
        "message": _("An error has occurred, please contact an administrator."),
    }

    SUCCESS = {"status": "SUCCESS", "type": "SUCCESS", "message": _("Export should proceed without issues.")}


class ProviderCheck(GisClient):
    """
    During the second stage of creating a datapack, each available data provider is pinged to apprise the user
    of its availability. This class and its subclasses contain methods to ping OWS and Overpass servers, and determine:
        * Whether they are online
        * Whether authorization is required
        * Whether they are able to serve the requested layers; and
        * Whether the requested layer intersects the AOI of the DataPack to be created.
    Once returned, the information is displayed via an icon and tooltip in the EventKit UI.
    """

    @staticmethod
    def get_status_result(check_result: CheckResult, *args, **kwargs):
        """Updates the check_result message with parameters.
        >>> get_status_result({"message": "Status ({status})"}, "200")
        {"message": "(200)"}
        """
        status_result = check_result.value
        status_result["message"] = status_result["message"].format(**kwargs)
        return status_result

    def check_area(self):
        """
        Return True if the AOI selection's area is lower than the maximum for this provider, otherwise False.
        :return: True if AOI is lower than area limit
        """

        if self.aoi is None or int(self.max_area) <= 0:
            return True

        geom = self.aoi.transform(3857, clone=True)
        area = geom.area

        area_sq_km = area / 1000000

        return area_sq_km < self.max_area

    def get_provider_response(self) -> requests.Response:
        """
        Sends a GET request to provider URL and returns its response if status code is ok
        """

        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            response = self.session.get(self.service_url, params=self.query, timeout=self.timeout)

            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            return response

        except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout) as ex:
            logger.error("Provider check timed out for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.TIMEOUT)

        except requests.exceptions.SSLError as ex:
            logger.error("SSL connection failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.SSL_EXCEPTION)

        except requests.exceptions.ConnectionError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.CONNECTION)

        except ProviderCheckError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise

        except Exception as ex:
            logger.error("An unknown error has occurred for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)

    def validate_response(self, response) -> bool:
        """
        Given a 200 response, check it for validity (intersection, layer contents, etc).
        Base implementation always returns True if a response was given at all; subclasses may override
        :param response: requests.Response object
        :return: True if response is not None
        """
        return response is not None

    def get_cache_key(self, aoi: GeometryCollection = None):
        cache_key = f"provider-status-{normalize_name(self.service_url)}"
        if aoi:
            cache_key = f"{cache_key}-{base64.b64encode(aoi.wkt.encode())}"
        cache_key = cache_key[:200]
        return cache_key  # Some caches only support keys <250

    def check(self) -> dict:
        """
        Main call to check the status of a provider. Returns JSON with a status string and more detailed message.
        """

        #  If the last check was successful assume checks will be successful for some period of time.
        status_check_cache_key = self.get_cache_key(aoi=self.aoi)

        try:
            status = cache.get(status_check_cache_key)
            if status:
                return status

            status = ProviderCheck.get_status_result(CheckResult.SUCCESS)

            # If the area is not valid, don't bother with a size.
            if not self.check_area():
                raise ProviderCheckError(CheckResult.TOO_LARGE)

            # This response will rarely change, it will be information about the service.
            response = cache.get_or_set(
                self.get_cache_key(), lambda: self.get_provider_response(), timeout=DEFAULT_CACHE_TIMEOUT
            )

            if not self.validate_response(response):
                raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)

            cache.set(status_check_cache_key, status, timeout=DEFAULT_CACHE_TIMEOUT)
            return status

        except ProviderCheckError as pce:
            #  If checks fail throw that away so that we will check again on the next request.
            cache.delete(status_check_cache_key)
            cache.delete(self.get_cache_key())
            return pce.status_result


class OverpassProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for Overpass providers.
    """

    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)

    def get_provider_response(self) -> requests.Response:
        """
        Sends a POST request for metadata to Overpass URL and returns its response if status code is ok
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            query = "out meta;"

            response = self.session.post(url=self.service_url, data=query, timeout=self.timeout)

            if not response.ok:
                # Workaround for https://bugs.python.org/issue27777
                query = {"data": query}
                response = self.session.post(url=self.service_url, data=query, timeout=self.timeout)

            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            return response

        except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout) as ex:
            logger.error("Provider check timed out for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.TIMEOUT)

        except requests.exceptions.SSLError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.SSL_EXCEPTION)

        except (requests.exceptions.ConnectionError, requests.exceptions.MissingSchema) as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.CONNECTION)

        except Exception as ex:
            logger.error("An unknown error has occurred for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)


class OWSProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for OWS (WMS, WMTS, WFS, WCS) providers.
    """

    def check_intersection(self, bbox):
        """
        Given a bounding box, set result to NO_INTERSECT if it doesn't intersect the DataPack's AOI.
        :param bbox: Bounding box array: [minx, miny, maxx, maxy] in EPSG:4326
        """
        logger.debug("Data provider bbox: [minx, miny, maxx, maxy] = {}".format(str(bbox)))
        minx, miny, maxx, maxy = bbox
        bbox = Polygon.from_bbox((minx, miny, maxx, maxy))

        if self.aoi is not None and not self.aoi.intersects(bbox):
            raise ProviderCheckError(CheckResult.NO_INTERSECT)

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
                layer_element = self.find_layer(root)
            except UnsupportedFormatError:
                logger.error("Missing expected root layer", exc_info=True)
                raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)
            except MissingLayerError:
                logger.error("Missing expected layer %s", self.layer,exc_info=True)
                raise ProviderCheckError(CheckResult.LAYER_NOT_AVAILABLE)

            if layer_element is None:
                return False

            bbox = self.get_bbox(layer_element)
            if bbox is not None:
                self.check_intersection(bbox)
            return True

        except ET.ParseError as ex:
            logger.error("Provider check failed to parse GetCapabilities XML: {}".format(str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)


class WCSProviderCheck(OWSProviderCheck):
    """
    Implementation of OWSProviderCheck for WCS providers
    """

    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WCS"

    def find_layer(self, root) -> Union[CheckResult, List[str]]:
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """

        content_meta = root.find(".//contentmetadata")
        if content_meta is None:
            raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)

        # Get names of available coverages
        coverage_offers = content_meta.findall("coverageofferingbrief")

        cover_names = [(c, c.find("name")) for c in coverage_offers]
        if not cover_names:  # No coverages are offered
            raise ProviderCheckError(CheckResult.LAYER_NOT_AVAILABLE)

        try:
            coverages = self.config.get("service", dict()).get("coverages")
            coverages = coverages.split(",") if coverages else None
            coverages = list(map(str.lower, coverages)) if coverages else None
        except AttributeError:
            logger.error("Unable to get coverages from WCS provider configuration.")

        if coverages:
            covers = [c for c, n in cover_names if n is not None and n.text in coverages]
        else:
            covers = [c for c, n in cover_names if n is not None and self.layer == n.text]

        if not covers:  # Requested coverage is not offered
            raise ProviderCheckError(CheckResult.LAYER_NOT_AVAILABLE)

        return covers

    def get_bbox(self, elements):
        bboxes = []
        for element in elements:
            envelope = element.find("lonlatenvelope")
            if envelope is None:
                continue

            pos = list(envelope)
            # Make sure there aren't any surprises
            coord_pattern = re.compile(r"^-?\d+(\.\d+)? -?\d+(\.\d+)?$")
            if not pos or not all("pos" in p.tag and re.match(coord_pattern, p.text) for p in pos):
                continue

            x1, y1 = list(map(float, pos[0].text.split(" ")))
            x2, y2 = list(map(float, pos[1].text.split(" ")))

            minx, maxx = sorted([x1, x2])
            miny, maxy = sorted([y1, y2])

            bboxes.append([minx, miny, maxx, maxy])
        return bboxes if bboxes else None

    def check_intersection(self, bboxes):
        """
        Given a list bounding boxes, set result to NO_INTERSECT if it doesn't intersect the DataPack's AOI.
        :param bboxes: list of bounding box arrays: [[minx, miny, maxx, maxy],..] in EPSG:4326
        """
        for box in bboxes:
            logger.debug("Data provider bbox: [minx, miny, maxx, maxy] = {}".format(str(box)))
            minx, miny, maxx, maxy = box
            bbox = Polygon.from_bbox((minx, miny, maxx, maxy))

            if not (self.aoi is not None and not self.aoi.intersects(bbox)):
                return

        raise ProviderCheckError(CheckResult.NO_INTERSECT)


class WFSProviderCheck(OWSProviderCheck):
    """
    Implementation of OWSProviderCheck for WFS providers
    """

    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WFS"

    def find_layer(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        feature_type_list = root.find(".//featuretypelist")
        if feature_type_list is None:
            raise ProviderCheckError(CheckResult.UNKNOWN_FORMAT)

        feature_types = feature_type_list.findall("featuretype")

        # Get layer names
        feature_names = [(ft, ft.find("name")) for ft in feature_types]
        logger.debug("WFS layers offered: {}".format([name.text for feature, name in feature_names if name]))
        features = [feature for feature, name in feature_names if name is not None and self.layer == name.text]

        if not features:
            raise ProviderCheckError(CheckResult.LAYER_NOT_AVAILABLE)

        feature = features[0]
        return feature

    def get_bbox(self, element) -> Optional[List[float]]:

        bbox_element = element.find("latlongboundingbox")

        if bbox_element is None:
            return

        bbox = [float(bbox_element.attrib[point]) for point in ["minx", "miny", "maxx", "maxy"]]
        return bbox


class WMSProviderCheck(OWSProviderCheck, WMS):
    """
    Implementation of OWSProviderCheck for WMS providers
    """


class WMTSProviderCheck(OWSProviderCheck, WMTS):
    """
    Implementation of OWSProviderCheck for WMTS providers
    """

class TMSProviderCheck(ProviderCheck, TMS):
    """
    Implementation of TMSProviderCheck for TMS providers
    """

class FileProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for geospatial file providers.
    """

    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)

    def get_provider_response(self) -> requests.Response:
        """
        Sends a HEAD request to the provided service URL returns its response if the status code is OK
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            response = self.session.head(url=self.service_url, timeout=self.timeout)

            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            return response

        except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout) as ex:
            logger.error("Provider check timed out for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.TIMEOUT)

        except requests.exceptions.SSLError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.SSL_EXCEPTION)

        except (requests.exceptions.ConnectionError, requests.exceptions.MissingSchema) as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.CONNECTION)

        except Exception as ex:
            logger.error("An unknown error has occurred for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)


class OGCProviderCheck(ProviderCheck):
    """
    Implementation of ProviderCheck for geospatial file providers.
    """

    def __init__(self, *args, **kwargs):
        super(self.__class__, self).__init__(*args, **kwargs)

    def get_provider_response(self):
        """
        Sends a HEAD request to the provided service URL returns its response if the status code is OK
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            service_url = self.service_url.rstrip("/\\")
            processes_endpoint = urljoin(service_url, "processes/")

            response = self.session.get(url=processes_endpoint, timeout=self.timeout)
            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            return response

        except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout) as ex:
            logger.error("Provider check timed out for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.TIMEOUT)

        except requests.exceptions.SSLError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.SSL_EXCEPTION)

        except (requests.exceptions.ConnectionError, requests.exceptions.MissingSchema) as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.CONNECTION)

        except Exception as ex:
            logger.error("An unknown error has occurred for URL {}: {}".format(self.service_url, str(ex)))
            raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)


PROVIDER_CHECK_MAP = {
    "wfs": WFSProviderCheck,
    "wcs": WCSProviderCheck,
    "wms": WMSProviderCheck,
    "osm": OverpassProviderCheck,
    "osm-generic": OverpassProviderCheck,
    "wmts": WMTSProviderCheck,
    "arcgis-raster": ProviderCheck,
    "arcgis-feature": ProviderCheck,
    "tms": TMSProviderCheck,
    "vector-file": FileProviderCheck,
    "raster-file": FileProviderCheck,
    "ogcapi-process": OGCProviderCheck,
}


def get_provider_checker(type_slug) -> Type[ProviderCheck]:
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


def perform_provider_check(provider: DataProvider, geojson: dict) -> dict:
    try:
        provider_type = str(provider.export_provider_type)

        url = str(provider.url)
        if url == "" and "osm" in provider_type:
            url = settings.OVERPASS_API_URL

        provider_checker = get_provider_checker(provider_type)
        conf = yaml.safe_load(provider.config) or dict()
        checker = provider_checker(
            service_url=url,
            layer=provider.layer,
            aoi_geojson=geojson,
            slug=provider.slug,
            max_area=int(provider.max_selection),
            config=conf,
        )
        response = checker.check()

    except Exception as e:
        logger.error(e)
        response = ProviderCheck.get_status_result(CheckResult.UNKNOWN_ERROR)
        if provider:
            logger.info(f"An exception occurred while checking the {provider.name} provider: {e}")
            logger.info(f"Status of provider '{provider.name}': {response}")

    return response


class ProviderCheckError(Exception):
    def __init__(self, check_result: CheckResult = None, *args, **kwargs):
        if check_result:
            self.status_result = ProviderCheck.get_status_result(check_result=check_result, **kwargs)
            self.message = self.status_result["message"]
        super().__init__(*args, **kwargs)
