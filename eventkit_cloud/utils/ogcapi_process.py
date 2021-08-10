import copy
import json
import logging
import time
import requests

from django.contrib.gis.geos import WKTWriter
from django.core.cache import cache
from urllib.parse import urljoin

from eventkit_cloud.utils import gdalutils
from eventkit_cloud.auth.views import has_valid_access_token
from eventkit_cloud.jobs.models import clean_config
from eventkit_cloud.jobs.models import load_provider_config
from eventkit_cloud.tasks.enumerations import OGC_Status
from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.tasks.helpers import update_progress

logger = logging.getLogger(__name__)


PROCESS_CACHE_TIMEOUT = 600


class OgcApiProcess:
    def __init__(self, url, config, session_token, task_id, *args, **kwargs):
        self.base_url = url.rstrip("/\\")
        self.base_url += "/"
        self.config = config
        self.task_id = task_id

        valid_token = has_valid_access_token(session_token)
        if not valid_token:
            raise Exception("Invalid access token.")
        self.session = get_or_update_session(headers={"Authorization": f"Bearer: {session_token}"})
        ssl_verify = getattr(settings, "SSL_VERIFICATION", True)
        self.session.verify = ssl_verify

    def create_job(self, geometry, file_format=None):
        payload = get_job_payload(self.config, geometry, file_format=file_format)

        jobs_endpoint = urljoin(self.base_url, "jobs/")
        response = None
        try:
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

    @gdalutils.retry
    def wait_for_ogc_process_job(self, job_url, task_id=None, interval=5):
        """
        Function polls an OGC process' job until it is done processing.
        Returns the final response's content, which includes the job' status.
        """

        job_status = None
        while job_status not in OGC_Status.get_finished_status():
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

        if job_status in OGC_Status.get_finished_status():
            return response_content


def get_job_payload(config, geometry, file_format=None):
    """
    Function generates the request body needed for a POST request to the OGC /jobs endpoint.
    """
    payload = copy.deepcopy(config)

    if file_format:
        format_field = get_format_field_from_config(payload)
        if format_field:
            payload["inputs"][format_field]["value"] = file_format
    payload["mode"] = "async"
    payload["response"] = "document"
    payload["outputs"] = payload["outputs"] or {}
    for output in payload["outputs"]:
        payload["outputs"][output]["transmissionMode"] = "reference"
    convert_geometry(payload, geometry)
    return payload


def convert_geometry(config, geometry):
    area = config.get("area")
    config["inputs"][area["name"]] = dict()
    if area["type"] == "wkt":
        config["inputs"][area["name"]]["value"] = WKTWriter().write(geometry).decode()
    if area["type"] == "geojson":
        config["inputs"][area["name"]]["value"] = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "geometry": json.loads(geometry.geojson)}],
        }
    if area["type"] == "bbox":
        config["inputs"]["boundingBoxInput"]["bbox"] = list(geometry.extent)
    return config


def get_process(provider, session):
    config = clean_config(provider.config, return_dict=True)
    service_url = provider.url.rstrip("/")

    process = config.get("ogcapi_process").get("id")
    cache_key = f"{process}-cache"
    process_json = cache.get(cache_key)
    if process_json is None:
        try:
            response = session.get(f"{service_url}/processes/{process}", stream=True,)
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
    product = ogcapi_process_config.get("inputs", {}).get("product").get("value")
    inputs = process_json.get("inputs", list())

    formats = (
        list(filter(lambda input: input.get("id", None) == "product", inputs))[0]
        .get("input")
        .get("literalDataDomains")[0]
        .get("valueDefinition")
        .get("valuesDescription")
        .get(product)
        .get("file_formats")
    )
    return [dict(slug=str(_format.get("value")), **_format,) for _format in formats]


def get_process_formats(provider, request):
    """Retrieve formats for a given provider if it is an ogc-process type."""
    process_formats = []

    if "ogcapi-process" in provider.export_provider_type.type_name:
        session = get_session(request, provider)
        process_json = get_process(provider, session)
        if process_json:
            process_formats = get_process_formats_from_json(process_json, load_provider_config(provider.config))
    return process_formats


def get_session(request, provider):
    config = load_provider_config(provider.config)

    session = get_or_update_session(cert_info=config.get("cert_info"), cred_var=config.get("cred_var"))

    session_token = request.session.get("access_token")
    valid_token = has_valid_access_token(session_token)
    if valid_token:
        session.headers.update({"Authorization": f"Bearer: {session_token}"})

    return session


def get_format_field_from_config(config: dict):
    inputs = config.get("inputs", dict())
    format_field = None
    for input in inputs:
        if "format" in input:
            format_field = input
            break
    return format_field
