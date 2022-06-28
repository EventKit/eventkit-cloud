from __future__ import annotations

import copy
import json
import logging
import time
from typing import TYPE_CHECKING
from urllib.parse import urljoin

import requests
from django.contrib.gis.geos import GEOSGeometry, WKTWriter
from django.core.cache import cache

from eventkit_cloud.auth.views import has_valid_access_token
from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.jobs.models import clean_config, load_provider_config
from eventkit_cloud.tasks.enumerations import OGC_Status
from eventkit_cloud.tasks.helpers import update_progress
from eventkit_cloud.utils.generic import retry

if TYPE_CHECKING:
    from eventkit_cloud.jobs.models import DataProvider

logger = logging.getLogger(__name__)


PROCESS_CACHE_TIMEOUT = 600


class OgcApiProcess:
    def __init__(self, url, config, session_token, task_id, *args, **kwargs):
        self.base_url = url.rstrip("/\\")
        self.base_url += "/"
        self.config = config
        self.task_id = task_id
        self.job_url = None
        self.session = get_or_update_session(*args, **kwargs)

    def create_job(self, geometry: GEOSGeometry, file_format: str = None):
        payload = get_job_payload(self.config, geometry, file_format=file_format)
        jobs_endpoint = urljoin(self.base_url, "jobs/")
        response = None
        try:
            logger.debug(jobs_endpoint)
            logger.debug(json.dumps(payload))

            response = self.session.post(jobs_endpoint, json=payload)
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
            logger.error(jobs_endpoint)
            if response:
                logger.error("Response Content: %s", response.content)
            raise Exception("Failed to post request to remote service.") from e

        response_content = response.json()
        job_id = response_content.get("jobID")
        if not job_id:
            logger.error(response_content)
            raise Exception("Unable to post to OGC process request.")

        self.job_url = urljoin(jobs_endpoint, f"{job_id}/")

        return response_content

    def get_job_results(self):
        """
        Fetches the job results
        Returns the results' download URL.
        """

        # poll job status
        ogc_job = self.wait_for_ogc_process_job(self.job_url, self.task_id)
        if ogc_job.get("status") != OGC_Status.SUCCESSFUL.value:
            logger.error(ogc_job)
            raise Exception(f"Unsuccessful OGC export. {ogc_job.get('status')}: {ogc_job.get('message')}")

        update_progress(self.task_id, progress=50, subtask_percentage=50)

        # fetch job results
        try:
            response = self.session.get(urljoin(self.job_url, "results/"))
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
    def wait_for_ogc_process_job(self, job_url, task_id=None, interval=5):
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
            if task_id:
                update_progress(task_id, progress=25, subtask_percentage=response_content.get("progress", 50))
            logger.info(f"Waiting for {task_id} to finish from {job_url} (total time: %s).", counter)

        if job_status in OGC_Status.get_finished_status():
            return response_content


def get_job_payload(config: dict, geometry: GEOSGeometry, file_format: str = None):
    """
    Function generates the request body needed for a POST request to the OGC /jobs endpoint.
    """
    payload = copy.deepcopy(config)

    if file_format:
        input_field, format_field = get_format_field_from_config(payload)
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
    convert_geometry(payload, geometry)
    return payload


def convert_geometry(config, geometry):
    """Converts the user requested geometry into the format supported by the ogcapi process services"""
    # This is configured for a single implementation to be more flexible would require parsing the process description,
    # and attempting to map the values to the correct schema type.
    area = config.get("area")
    config["inputs"]["geometry"] = {"format": area["type"]}
    if area["type"] == "wkt":
        config["inputs"]["geometry"]["input"] = WKTWriter().write(geometry).decode()
    if area["type"] == "geojson":
        config["inputs"]["geometry"]["input"] = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "geometry": json.loads(geometry.geojson)}],
        }
    if area["type"] == "bbox":
        config["inputs"]["geometry"]["input"] = list(geometry.extent)
    return config


def get_process(provider, session):
    config = clean_config(provider.config)
    service_url = provider.url.rstrip("/")

    process = config.get("ogcapi_process").get("id")
    cache_key = f"{process}-cache"
    process_json = cache.get(cache_key)
    if process_json is None:
        try:
            response = session.get(
                f"{service_url}/processes/{process}",
                stream=True,
            )
            response.raise_for_status()
            process_json = json.loads(response.content)
            cache.set(cache_key, process_json, timeout=PROCESS_CACHE_TIMEOUT)
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not access OGC Process:{e}")

    return process_json


def get_process_formats_from_json(process_json: dict, provider_config: dict):
    """Extract format information from a valid JSON object representing an OGC Process."""
    # TODO: Make more flexible to allow other keys
    ogcapi_process_config = load_provider_config(provider_config).get("ogcapi_process")
    product_slug = ogcapi_process_config.get("inputs", {}).get("product").get("id")
    if not product_slug:
        raise Exception("A product name needs to be configured {'inputs':{'product':{'id': <product_name>'}}}")

    all_products = process_json["inputs"]["product"]["schema"]["oneOf"]
    product_data = None
    for product in all_products:
        if product["properties"]["id"]["const"] == product_slug:
            product_data = product
    file_formats = product_data["properties"]["file_format"]["oneOf"]
    return [
        {
            "name": file_format["title"],
            "slug": file_format["const"],
            "description": file_format.get("description") or file_format["title"],
        }
        for file_format in file_formats
    ]


def get_process_formats(provider: DataProvider):
    """Retrieve formats for a given provider if it is an ogc-process type."""
    process_formats = []

    if provider.export_provider_type and "ogcapi-process" in provider.export_provider_type.type_name:
        client = provider.get_service_client()
        process_json = get_process(provider, client.session)
        if process_json:
            process_formats = get_process_formats_from_json(process_json, load_provider_config(provider.config))
    return process_formats


def get_session(request, provider):
    config = load_provider_config(provider.config)

    session = get_or_update_session(**config)

    session_token = request.session.get("access_token")
    valid_token = has_valid_access_token(session_token)
    if valid_token:
        session.headers.update({"Authorization": f"Bearer: {session_token}"})

    return session


def find_format_field(schema):
    format_field = None
    for input_field, data in schema.items():
        if "format" in input_field:
            return None, input_field
        if isinstance(data, dict):
            _, format_field = find_format_field(data)
        if format_field:
            return input_field, format_field
    return None, None


def get_format_field_from_config(config: dict):
    return find_format_field(config.get("inputs", dict()))
