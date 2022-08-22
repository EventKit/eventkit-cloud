# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import json
import logging
import os
import time
from typing import Dict, Optional, Union

import requests
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon, WKTWriter
from django.core.cache import cache
from jsonschema import ValidationError, validate

from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.tasks.enumerations import OGC_Status
from eventkit_cloud.utils.client import EventKitClient
from eventkit_cloud.utils.generic import retry
from eventkit_cloud.utils.services.base import GisClient
from eventkit_cloud.utils.services.check_result import CheckResult
from eventkit_cloud.utils.services.errors import ProviderCheckError
from eventkit_cloud.utils.services.types import ProcessFormat

logger = logging.getLogger(__name__)

PROCESS_CACHE_TIMEOUT = 600


class OGCAPIProcess(GisClient):

    job_url: str = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = self.service_url.removesuffix("/")
        self.jobs_url = f"{self.base_url}/jobs/"
        self.process_config = self.config["ogcapi_process"]
        self.processes_url = f"{self.base_url}/processes/"
        self.process_url = f"{self.base_url}/processes/{self.process_config['id']}"

    def get_bbox(self, element):
        raise NotImplementedError("Get BBOX isn't supported for OGCAPI Processes")

    def get_layer_name(self):
        raise NotImplementedError("Get Layer Name isn't supported for OGCAPI Processes")

    def get_layers(self):
        raise NotImplementedError("Get Layers isn't supported for OGCAPI Processes")

    def get_layer_geometry(self, element):
        raise NotImplementedError("Get Layer Geometry isn't supported for OGCAPI Processes")

    def download_geometry(self) -> Optional[Polygon]:
        raise NotImplementedError("Download Geometry isn't supported for OGCAPI Processes")

    def find_layers(self, process):
        raise NotImplementedError("Find Layers isn't supported for OGCAPI Processes")

    def create_job(self, geometry: GEOSGeometry, file_format: str = None):
        payload = self.get_job_payload(geometry, file_format=file_format)
        response = None
        try:
            logger.debug(self.jobs_url)
            logger.debug(json.dumps(payload))

            response = self.session.post(self.jobs_url, json=payload)
            response.raise_for_status()

        except requests.exceptions.RequestException as e:
            logger.error("Failed to post OGC Process payload:")
            if payload:
                try:
                    logger.error("payload: %s", json.dumps(payload))
                except Exception:
                    logger.error("payload: %s", payload)
            else:
                logger.error("config %s", self.config)
            if response:
                logger.error("Response Content: %s", response.content)
            raise Exception("Failed to post request to remote service.") from e

        response_content = response.json()
        job_id = response_content.get("jobID")
        if not job_id:
            logger.error(response_content)
            raise Exception("Unable to post to OGC process request.")

        self.job_url = f"{self.jobs_url}{job_id}"

        return response_content

    def get_job_results(self):
        """
        Fetches the job results
        Returns the results' download URL.
        """

        # poll job status
        ogc_job = self.wait_for_ogc_process_job(self.job_url)
        if ogc_job.get("status") != OGC_Status.SUCCESSFUL.value:
            logger.error(ogc_job)
            raise Exception(f"Unsuccessful OGC export. {ogc_job.get('status')}: {ogc_job.get('message')}")

        # fetch job results
        try:
            response = self.session.get(f"{self.job_url}/results")
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise Exception(f"Unsuccessful request:{e}")

        response_content = response.json()
        download_url = response_content.get("archive_format", dict()).get("href")

        if not download_url:
            logger.error(response_content)
            raise Exception("The OGC Process server did not produce a download.")

        return download_url

    @retry
    def wait_for_ogc_process_job(self, job_url, interval=5):
        """
        Function polls an OGC process' job until it is done processing.
        Returns the final response's content, which includes the job' status.
        """

        job_status = None
        counter = 0
        while job_status not in OGC_Status.get_finished_status():
            counter += interval
            time.sleep(interval)
            try:
                response = self.session.get(job_url)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                raise Exception(f"Unsuccessful request:{e}")
            response_content = response.json()
            job_status = response_content.get("status")
            if not job_status:
                logger.error(response_content)
                raise Exception("OGC API Process service did not provide a valid status.")

        if job_status in OGC_Status.get_finished_status():
            return response_content

    def get_process_session(self, url):
        credentials = self.process_config.get("download_credentials", dict())
        session = get_or_update_session(**credentials)
        if getattr(settings, "SITE_NAME", os.getenv("HOSTNAME")) in url:
            session = EventKitClient(
                getattr(settings, "SITE_URL"), username=session.auth[0], password=session.auth[1], session=session
            ).session
        return session

    def get_response(self, url: Optional[str] = None, query: Optional[Dict[str, str]] = None) -> requests.Response:
        url = url or self.process_url
        query_params = copy.deepcopy(query) or self.query
        logger.error("Making request to %s", url)
        return self.session.get(url=url, params=query_params, timeout=self.timeout)

    def check_response(self):
        """
        Sends a HEAD request to the provided service URL returns its response if the status code is OK
        """
        try:
            if not self.service_url:
                raise ProviderCheckError(CheckResult.NO_URL)

            response = self.get_response()
            logger.debug(response)
            if response.status_code in [401, 403]:
                raise ProviderCheckError(CheckResult.UNAUTHORIZED)

            if response.status_code == 404:
                raise ProviderCheckError(CheckResult.NOT_FOUND)

            if not response.ok:
                raise ProviderCheckError(CheckResult.UNAVAILABLE, status=response.status_code)

            if not self.has_valid_process_inputs(response):
                raise ProviderCheckError(CheckResult.INVALID_CONFIGURATION)

            return response

        except ProviderCheckError:
            # Since we are catching all exceptions below ensure we raise the providercheckerror.
            raise

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

    def has_valid_process_inputs(self, response=None) -> bool:
        """
        Checks if the configured process is valid based on the allowed inputs of the provider.
        """

        if not response:
            url = f"{self.processes_url}{self.process_config['id']}?format=json"
            logger.info("Making request to %s", url)
            response = self.session.get(url=url, timeout=self.timeout)

        if response.status_code != 200:
            logger.error("The configured process returned invalid status_code: %s", response.status_code)
            return False

        data = response.json()
        expected_keys = ["version", "id", "title", "inputs"]
        if any(key not in data for key in expected_keys):
            logger.error("The configured process returned an unexpected result")
            logger.error(data)
            return False

        allowed_inputs = data["inputs"]
        configured_inputs = self.process_config["inputs"].items()

        for configured_input_key, configured_input_value in configured_inputs:
            allowed_keys = allowed_inputs.keys()
            if configured_input_key not in allowed_keys:
                logger.error("Provider configured input %s not in allowed keys %s", configured_input_key, allowed_keys)
                return False

            try:
                validate(instance=configured_input_value, schema=allowed_inputs[configured_input_key]["schema"])
            except ValidationError as ve:
                logger.error("The provider has an invalid schema")
                logger.error(json.dumps({k: str(v) for k, v in vars(ve).items()}))
                return False

        return True

    def get_process(self):
        process = self.process_config.get("id")
        cache_key = f"{process}-cache"
        process_json = cache.get(cache_key)
        if process_json is None:
            try:
                response = self.session.get(
                    f"{self.processes_url}{process}",
                    stream=True,
                )
                response.raise_for_status()
                process_json = json.loads(response.content)
                cache.set(cache_key, process_json, timeout=PROCESS_CACHE_TIMEOUT)
            except requests.exceptions.RequestException as e:
                logger.error(f"Could not access OGC Process:{e}")

        return process_json

    def get_product_id(self):
        return self.process_config["inputs"]["product"]["id"]

    @staticmethod
    def get_format_field(config: dict):
        format_field = None
        for input_field, data in config.items():
            if "format" in input_field:
                return None, input_field
            if isinstance(data, dict):
                _, format_field = OGCAPIProcess.get_format_field(data)
            if format_field:
                return input_field, format_field
        return None, None

    def get_job_payload(self, geometry: GEOSGeometry, file_format: str = None):
        """
        Function generates the request body needed for a POST request to the OGC /jobs endpoint.
        """
        payload = copy.deepcopy(self.process_config)

        if file_format:
            input_field, format_field = self.get_format_field(payload["inputs"])
            if format_field:
                if input_field:
                    payload["inputs"][input_field][format_field] = file_format
                else:
                    payload["inputs"][format_field] = file_format
        payload["mode"] = "async"
        payload["response"] = "document"
        payload["outputs"] = payload["outputs"] or {}
        for output in payload["outputs"]:
            payload["outputs"][output]["transmissionMode"] = "reference"
        payload = self.convert_geometry(payload, geometry)
        return payload

    @staticmethod
    def convert_geometry(original_payload: dict, geometry: Union[Polygon, MultiPolygon, GEOSGeometry]):
        """Converts the user requested geometry into the format supported by the ogcapi process services"""
        # This is configured for a single implementation to be more flexible would require parsing the process
        # description, and attempting to map the values to the correct schema type.
        if isinstance(geometry, Polygon):
            geometry = MultiPolygon(geometry)
        payload = copy.deepcopy(original_payload)
        area = payload.get("area")
        payload["inputs"]["geometry"] = {"format": area["type"]}
        if area["type"] == "wkt":
            payload["inputs"]["geometry"]["input"] = WKTWriter().write(geometry).decode()
        if area["type"] == "geojson":
            payload["inputs"]["geometry"]["input"] = {
                "type": "FeatureCollection",
                "features": [{"type": "Feature", "geometry": json.loads(geometry.geojson)}],
            }
        if area["type"] == "bbox":
            payload["inputs"]["geometry"]["input"] = list(geometry.extent)
        return payload

    @staticmethod
    def get_process_formats_from_json(process_json: dict, product_slug: str) -> list[ProcessFormat]:
        """Extract format information from a valid JSON object representing an OGC Process."""
        all_products = process_json["inputs"]["product"]["schema"]["oneOf"]
        product_data = None
        for product in all_products:
            if product["properties"]["id"]["const"] == product_slug:
                product_data = product
        if not product_data:
            raise Exception(f"A product matching {product_slug} was not found.")
        file_formats = product_data["properties"]["file_format"]["oneOf"]
        return [
            {
                "name": file_format["title"],
                "slug": file_format["const"],
                "description": file_format.get("description") or file_format["title"],
            }
            for file_format in file_formats
        ]

    def get_process_formats(self) -> list[ProcessFormat]:
        """Retrieve formats for a given provider if it is an ogc-process type."""
        process_formats = []

        process_json = self.get_process()
        if process_json:
            process_formats = self.get_process_formats_from_json(process_json, self.get_product_id())
        return process_formats
