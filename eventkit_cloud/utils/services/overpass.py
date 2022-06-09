import logging

import requests

from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.check_result import CheckResult
from eventkit_cloud.utils.services.errors import ProviderCheckError

logger = logging.getLogger(__name__)


class Overpass(GisClient):
    aoi = None

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to service type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to service type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to service type")

    def get_response(self, *args, **kwargs) -> requests.Response:
        initial_query = "out meta;"

        response = self.session.post(url=self.service_url, data=initial_query, timeout=self.timeout)

        if not response.ok:
            # Workaround for https://bugs.python.org/issue27777
            query = {"data": initial_query}
            response = self.session.post(url=self.service_url, data=query, timeout=self.timeout)

        return response

    def check_response(self, head_only=False) -> requests.Response:
        """
        Sends a POST request for metadata to Overpass URL and returns its response if status code is ok
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            response = self.get_response()
            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            return response

        except (requests.exceptions.ConnectTimeout, requests.exceptions.ReadTimeout) as ex:
            logger.error("Provider check timed out for URL {}: {}".format(self.service_url, str(ex)), exc_info=True)
            raise ProviderCheckError(CheckResult.TIMEOUT)

        except requests.exceptions.SSLError as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)), exc_info=True)
            raise ProviderCheckError(CheckResult.SSL_EXCEPTION)

        except (requests.exceptions.ConnectionError, requests.exceptions.MissingSchema) as ex:
            logger.error("Provider check failed for URL {}: {}".format(self.service_url, str(ex)), exc_info=True)
            raise ProviderCheckError(CheckResult.CONNECTION)

        except Exception as ex:
            logger.error(
                "An unknown error has occurred for URL {}: {}".format(self.service_url, str(ex)), exc_info=True
            )
            raise ProviderCheckError(CheckResult.UNKNOWN_ERROR)
