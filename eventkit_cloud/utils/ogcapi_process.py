import copy
import json
import logging
import time
from urllib.parse import urljoin

import requests
from django.conf import settings
from django.contrib.gis.geos import WKTWriter

from eventkit_cloud.auth.views import has_valid_access_token
from eventkit_cloud.tasks.enumerations import OGC_Status
from eventkit_cloud.tasks.task_process import update_progress
from eventkit_cloud.utils import gdalutils
from eventkit_cloud.utils.auth_requests import get_or_update_session

logger = logging.getLogger(__name__)


class OgcApiProcess:
    def __init__(self, url, config, session_token, task_id, *args, **kwargs):
        self.base_url = url.rstrip("/\\")
        self.base_url += "/"
        self.config = config
        self.task_id = task_id

        valid_token = has_valid_access_token(session_token)
        if not valid_token:
            raise Exception("Invalid access token.")
        self.session = get_or_update_session(*args, **kwargs)
        self.session.headers.update({"Authorization": f"Bearer: {session_token}"})

    def create_job(self, geometry):
        payload = get_job_payload(self.config, geometry)

        jobs_endpoint = urljoin(self.base_url, "jobs/")
        response = None
        try:
            response = self.session.post(
                jobs_endpoint, json=payload, verify=getattr(settings, "SSL_VERIFICATION", True),
            )
            response.raise_for_status()

        except requests.exceptions.RequestException as e:
            logger.error("Failed to post OGC Process payload:")
            logger.error(json.dumps(payload))
            logger.error(jobs_endpoint)
            if response:
                logger.error(response.content)
            raise Exception("Failed to post request to remote service.") from e

        response_content = response.json()
        job_id = response_content.get("jobID")
        if not job_id:
            logger.error(response_content)
            raise Exception("Unable to post to OGC process request.")

        self.job_url = urljoin(jobs_endpoint, f"{job_id}/")

        return response_content

    def get_job_results(self,):
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
            response = self.session.get(
                urljoin(self.job_url, "results/"), verify=getattr(settings, "SSL_VERIFICATION", True),
            )
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
                response = self.session.get(job_url, verify=getattr(settings, "SSL_VERIFICATION", True),)
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


def get_job_payload(config, geometry):
    """
    Function generates the request body needed for a POST request to the OGC /jobs endpoint.
    """
    payload = copy.deepcopy(config)
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
        config["inputs"][area["name"]]["value"] = WKTWriter().write(geometry)
    if area["type"] == "geojson":
        config["inputs"][area["name"]]["value"] = {
            "type": "FeatureCollection",
            "features": [{"type": "Feature", "geometry": json.loads(geometry.geojson)}],
        }
    if area["type"] == "bbox":
        config["inputs"]["boundingBoxInput"]["bbox"] = list(geometry.extent)
    return config
