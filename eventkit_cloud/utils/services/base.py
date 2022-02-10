import abc
import base64
import copy
import json
import logging
from typing import Optional, Dict

import requests
from django.contrib.gis.geos import GEOSGeometry, GeometryCollection, Polygon
from django.core.cache import cache

from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.tasks.helpers import normalize_name
from eventkit_cloud.utils.services import DEFAULT_CACHE_TIMEOUT
from eventkit_cloud.utils.services.check_result import CheckResult, get_status_result
from eventkit_cloud.utils.services.errors import ProviderCheckError

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
        self.session = get_or_update_session(session=None, **self.config)

        self.set_aoi(aoi_geojson)

    def set_aoi(self, aoi_geojson: dict):
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

    def check_response(self, head_only=False) -> requests.Response:
        """
        Sends a GET request to provider URL and returns its response if status code is ok
        """

        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            if head_only:
                response = self.session.head(url=self.service_url, timeout=self.timeout)
            else:
                response = self.get_response()

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

    def check(self, aoi_geojson: Optional[dict] = None) -> dict:
        """
        Main call to check the status of the service. Returns JSON with a status string and more detailed message.
        :param aoi: A geojson as a dict representing an AOI to check within the service instance.
        """

        if aoi_geojson:
            self.set_aoi(aoi_geojson)

        #  If the last check was successful assume checks will be successful for some period of time.
        status_check_cache_key = self.get_cache_key(aoi=self.aoi)

        try:
            status = cache.get(status_check_cache_key)
            if status:
                return status

            status = get_status_result(CheckResult.SUCCESS)

            # If the area is not valid, don't bother with a size.
            if not self.check_area():
                raise ProviderCheckError(CheckResult.TOO_LARGE)

            # This response will rarely change, it will be information about the service.
            response = cache.get_or_set(
                self.get_cache_key(), lambda: self.check_response(), timeout=DEFAULT_CACHE_TIMEOUT
            )

            if not self.validate_response(response):
                raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)

            cache.set(status_check_cache_key, status, timeout=DEFAULT_CACHE_TIMEOUT)
            return status

        except ProviderCheckError as pce:
            logger.error(pce, exc_info=True)
            #  If checks fail throw that away so that we will check again on the next request.
            cache.delete(status_check_cache_key)
            cache.delete(self.get_cache_key())
            return pce.status_result

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to service type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to service type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to service type")

    def get_layer_geometry(self, element):
        raise NotImplementedError("Method is specific to service type")

    def get_response(self, url: Optional[str] = None, query: Optional[Dict[str, str]] = None) -> requests.Response:
        url = url or self.service_url
        query_params = copy.deepcopy(query) or self.query
        service_url = url.rstrip("/\\")
        return self.session.get(url=service_url, params=query_params, timeout=self.timeout)

    def check_intersection(self, geometry: GEOSGeometry):
        """
        Given a geometry, set result to NO_INTERSECT if it doesn't intersect the DataPack's AOI.
        :param geom: GEOSGeometry
        """

        if self.aoi is not None and not self.aoi.intersects(geometry):
            raise ProviderCheckError(CheckResult.NO_INTERSECT)

    def download_geometry(self) -> Optional[Polygon]:
        raise NotImplementedError("Method is specific to service type")
