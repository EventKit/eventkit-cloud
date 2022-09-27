# -*- coding: utf-8 -*-
import argparse
import logging
import os
from datetime import datetime
from string import Template

from django.conf import settings
from requests import exceptions

from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.tasks.exceptions import AreaLimitExceededError, TooManyRequestsError

logger = logging.getLogger(__name__)


class Overpass(object):
    """
    Wrapper around an Overpass query.

    Returns all nodes, ways and relations within the specified bounding box.
    """

    def __init__(
        self,
        url=None,
        slug=None,
        bbox=None,
        stage_dir=None,
        job_name=None,
        debug=False,
        task_uid=None,
        raw_data_filename=None,
        config="",
    ):
        """
        Initialize the Overpass utility.

        Args:
            slug: data provider's slug, used for looking up cert env vars
            url: location of Overpass endpoint; defaults to env var if not specified
            bbox: the bounding box to extract
            stage_dir: where to stage the extract job
            job_name: the name of the export job
            debug: turn on/off debug logging
        """

        self.url = url
        if not self.url:
            self.url = settings.OVERPASS_API_URL

        self.slug = slug
        self.query = None
        self.stage_dir = stage_dir
        self.job_name = job_name
        self.debug = debug
        self.task_uid = task_uid
        self.config = config
        if bbox:
            # Overpass expects a bounding box string of the form "<lat0>,<long0>,<lat1>,<long1>"
            self.bbox = f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}"
        else:
            raise Exception("A bounding box is required: miny,minx,maxy,maxx")

        # extract all nodes / ways and relations within the bounding box
        # see: http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
        # conf: dict = yaml.safe_load(self.config) or dict()
        conf = config or dict()
        default_template_str = (
            "[maxsize:$maxsize][timeout:$timeout];relation($bbox);way($bbox);node($bbox);<;(._;>;);out body;"
        )
        self.default_template = Template(conf.get("overpass_query", default_template_str))

        # dump out all osm data for the specified bounding box
        max_size = settings.OVERPASS_MAX_SIZE
        timeout = settings.OVERPASS_TIMEOUT
        self.query = self.default_template.safe_substitute({"maxsize": max_size, "timeout": timeout, "bbox": self.bbox})
        # set up required paths
        if raw_data_filename is None:
            raw_data_filename = "query.osm"

        self.raw_osm = os.path.join(self.stage_dir, raw_data_filename)
        try:
            os.remove(self.raw_osm)
        except Exception:
            pass

    def get_query(self):
        """Get the overpass query used for this extract."""
        return self.query

    def run_query(self, user_details=None, subtask_percentage=100, subtask_start=0, eta=None):
        """
        Run the overpass query.
        subtask_percentage is the percentage of the task referenced by self.task_uid this method takes up.
            Used to update progress.

        Return:
            the path to the overpass extract
        """
        from audit_logging.file_logging import logging_open

        from eventkit_cloud.tasks.helpers import update_progress

        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {"username": "unknown-run_query"}

        response = None
        query = self.get_query()
        logger.debug(query)
        logger.debug(f"Query started at: {datetime.now()}")
        try:
            update_progress(
                self.task_uid,
                progress=0,
                subtask_percentage=subtask_percentage,
                subtask_start=subtask_start,
                eta=eta,
                msg="Querying provider data",
            )
            conf = self.config or dict()
            session = get_or_update_session(slug=self.slug, **conf)
            response = session.post(self.url, data=query, stream=True)
            if not response.ok and response.status_code != 429:
                # Workaround for https://bugs.python.org/issue27777
                query = {"data": query}
                response = session.post(self.url, data=query, stream=True)
            if response.status_code == 429:
                raise TooManyRequestsError(service_name="Overpass API")
            response.raise_for_status()
            logger.info("Downloading OSM data for bbox %s to %s", self.bbox, self.raw_osm)
            try:
                total_size = int(response.headers.get("content-length"))
            except (ValueError, TypeError):
                if response.content:
                    total_size = len(response.content)
                else:
                    raise Exception("Overpass Query failed to return any data")

            # Since the request takes a while, jump progress to a very high percent...
            query_percent = 85.0
            download_percent = 100.0 - query_percent
            update_progress(
                self.task_uid,
                progress=query_percent,
                subtask_percentage=subtask_percentage,
                subtask_start=subtask_start,
                eta=eta,
                msg="Downloading data from provider: 0 of {:.2f} MB(s)".format(total_size / float(1e6)),
            )

            CHUNK = 1024 * 1024 * 2  # 2MB chunks
            update_interval = 1024 * 1024 * 250  # Every 250 MB

            written_size = 0
            last_update = 0
            with logging_open(self.raw_osm, "wb", user_details=user_details) as fd:
                for chunk in response.iter_content(CHUNK):
                    fd.write(chunk)
                    written_size += CHUNK

                    # Limit the number of calls to update_progress because every time update_progress is called,
                    # the ExportTask model is updated, causing django_audit_logging to update the audit way to much
                    # (via the post_save hook). In the future, we might try still using update progress just as much
                    # but update the model less to make the audit log less spammed, or making audit_logging only log
                    # certain model changes rather than logging absolutely everything.
                    last_update += CHUNK
                    if last_update > update_interval:
                        last_update = 0
                        progress = query_percent + (float(written_size) / float(total_size) * download_percent)
                        update_progress(
                            self.task_uid,
                            progress=progress,
                            subtask_percentage=subtask_percentage,
                            subtask_start=subtask_start,
                            eta=eta,
                            msg="Downloading data from provider: {:.2f} of {:.2f} MB(s)".format(
                                written_size / float(1e6), total_size / float(1e6)
                            ),
                        )

            # Done w/ this subtask
            update_progress(
                self.task_uid,
                progress=100,
                subtask_percentage=subtask_percentage,
                subtask_start=subtask_start,
                eta=eta,
                msg="Completed downloading data from provider",
            )
        except exceptions.RequestException as e:
            logger.error("Overpass query threw: {0}".format(e))
            raise exceptions.RequestException(e)
        finally:
            if response:
                response.close()

        logger.debug(f"Query finished at {datetime.now()}")
        logger.debug(f"Wrote overpass query results to: {self.raw_osm}")
        if os.path.isfile(self.raw_osm):
            with open(self.raw_osm, "r") as osm_file:
                for line in osm_file.readline():
                    if "Query run out of memory" in line:
                        raise AreaLimitExceededError(bbox)
        return self.raw_osm


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Runs an overpass query using the provided bounding box")
    parser.add_argument(
        "-o", "--osm-file", required=False, dest="osm", help="The OSM file to write the query results to"
    )
    parser.add_argument(
        "-b",
        "--bounding-box",
        required=True,
        dest="bbox",
        help="A comma separated list of coordinates in the format: miny,minx,maxy,maxx",
    )
    parser.add_argument("-u", "--url", required=False, dest="url", help="The url endpoint of the overpass interpreter")
    parser.add_argument("-d", "--debug", action="store_true", help="Turn on debug output")
    args = parser.parse_args()
    configuration = {}
    for k, v in list(vars(args).items()):
        if v is None:
            continue
        else:
            configuration[k] = v
    osm = configuration.get("osm")
    url = configuration.get("url")
    bbox = configuration.get("bbox")
    debug = False
    if configuration.get("debug"):
        debug = configuration.get("debug")
    overpass = Overpass(url=url, bbox=bbox, raw_data_filename=osm, debug=debug)
    overpass.run_query()
