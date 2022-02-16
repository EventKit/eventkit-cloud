# -*- coding: utf-8 -*-
import copy
import json
import logging
from typing import Optional, Dict
from urllib.parse import urljoin

import requests

from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.check_result import CheckResult
from eventkit_cloud.utils.services.errors import ProviderCheckError
from jsonschema import validate, ValidationError

logger = logging.getLogger(__name__)


class OGCAPIProcess(GisClient):
    def get_response(self, url: Optional[str] = None, query: Optional[Dict[str, str]] = None) -> requests.Response:
        url = url or self.service_url
        query_params = copy.deepcopy(query) or self.query
        service_url = url.rstrip("/\\")
        processes_endpoint = urljoin(service_url, "processes/")
        return self.session.get(url=processes_endpoint, params=query_params, timeout=self.timeout)

    def check_response(self):
        """
        Sends a HEAD request to the provided service URL returns its response if the status code is OK
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            response = self.get_response()
            logger.error(self.service_url)
            logger.error(response.content)
            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            if not self.has_valid_process_inputs():
                raise ProviderCheckError(CheckResult.INVALID_CONFIGURATION)

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

    def has_valid_process_inputs(self) -> bool:
        """
        Checks if the configured process is valid based on the allowed inputs of the provider.
        """

        url = f"{self.service_url.rstrip('/')}/processes/{self.config['ogcapi_process']['id']}?format=json"
        response = self.session.get(url=url, timeout=self.timeout)

        if response.status_code != 200:
            return False

        data = response.json()
        expected_keys = ["version", "id", "title", "inputs"]
        if any(key not in data for key in expected_keys):
            logger.error("The configured process returned an unexpected result")
            logger.error(data)
            return False

        allowed_inputs = data["inputs"]
        configured_inputs = self.config["ogcapi_process"]["inputs"].items()

        for configured_input_key, configured_input_value in configured_inputs:
            allowed_keys = allowed_inputs.keys()
            if configured_input_key not in allowed_keys:
                logger.error("Provider configured input %s not in allowed keys %s", configured_input_key, allowed_keys)
                return False

            try:
                validate(instance=configured_input_value, schema=allowed_inputs[configured_input_key]["schema"])
            except ValidationError as ve:
                logger.error(json.dumps({k: str(v) for k, v in vars(ve).items()}))
                return False

        return True
