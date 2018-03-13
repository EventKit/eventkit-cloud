# -*- coding: utf-8 -*-
import argparse
import logging
from datetime import datetime
from string import Template
import os
from requests import exceptions

import auth_requests

from django.conf import settings

logger = logging.getLogger(__name__)


class Overpass(object):
    """
    Wrapper around an Overpass query.

    Returns all nodes, ways and relations within the specified bounding box.
    """

    def __init__(self, url=None, slug=None, bbox=None, stage_dir=None, job_name=None, debug=False, task_uid=None,
                 raw_data_filename=None):
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

        self.url = url or settings.OVERPASS_API_URL or 'http://localhost/interpreter'

        self.slug = slug
        self.query = None
        self.stage_dir = stage_dir
        self.job_name = job_name
        self.debug = debug
        self.task_uid = task_uid
        self.verify_ssl = not getattr(settings, "DISABLE_SSL_VERIFICATION", False)
        if bbox:
            # Overpass expects a bounding box string of the form "<lat0>,<long0>,<lat1>,<long1>"
            self.bbox = '{},{},{},{}'.format(bbox[1], bbox[0], bbox[3], bbox[2])
        else:
            raise Exception('A bounding box is required: miny,minx,maxy,maxx')

        # extract all nodes / ways and relations within the bounding box
        # see: http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
        self.default_template = Template('[maxsize:$maxsize][timeout:$timeout];(node($bbox);<;);out body;')

        # dump out all osm data for the specified bounding box
        max_size = settings.OVERPASS_MAX_SIZE
        timeout = settings.OVERPASS_TIMEOUT
        self.query = self.default_template.safe_substitute(
            {'maxsize': max_size, 'timeout': timeout, 'bbox': self.bbox}
        )
        # set up required paths
        if raw_data_filename is None:
            raw_data_filename = 'query.osm'

        self.raw_osm = os.path.join(self.stage_dir, raw_data_filename)

    def get_query(self,):
        """Get the overpass query used for this extract."""
        return self.query

    def run_query(self, user_details=None, subtask_percentage=100):
        """
        Run the overpass query.
        subtask_percentage is the percentage of the task referenced by self.task_uid this method takes up.
            Used to update progress.

        Return:
            the path to the overpass extract
        """

        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {'username': 'unknown-run_query'}

        from ..tasks.export_tasks import update_progress

        q = self.get_query()
        logger.debug(q)
        logger.debug('Query started at: %s'.format(datetime.now()))
        try:
            req = auth_requests.post(self.url, slug=self.slug, data=q, stream=True, verify=self.verify_ssl)

            # Since the request takes a while, jump progress to an arbitrary 50 percent...
            update_progress(self.task_uid, progress=50, subtask_percentage=subtask_percentage)
            try:
                size = int(req.headers.get('content-length'))
            except (ValueError, TypeError):
                if req.content:
                    size = len(req.content)
                else:
                    raise Exception("Overpass Query failed to return any data")
            inflated_size = size * 2
            CHUNK = 1024 * 1024 * 2  # 2MB chunks
            from audit_logging.file_logging import logging_open
            with logging_open(self.raw_osm, 'wb', user_details=user_details) as fd:
                for chunk in req.iter_content(CHUNK):
                    fd.write(chunk)
                    size += CHUNK
                    # removing this call to update_progress for now because every time update_progress is called,
                    # the ExportTask model is updated, causing django_audit_logging to update the audit way to much
                    # (via the post_save hook). In the future, we might try still using update progress just as much
                    # but update the model less to make the audit log less spammed, or making audit_logging only log
                    # certain model changes rather than logging absolutely everything.
                    ## Because progress is already at 50, we need to make this part start at 50 percent
                    #update_progress(
                    #    self.task_uid, progress=(float(size) / float(inflated_size)) * 100,
                    #    subtask_percentage=subtask_percentage
                    #)
        except exceptions.RequestException as e:
            logger.error('Overpass query threw: {0}'.format(e))
            raise exceptions.RequestException(e)

        logger.debug('Query finished at %s'.format(datetime.now()))
        logger.debug('Wrote overpass query results to: %s'.format(self.raw_osm))
        return self.raw_osm


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Runs an overpass query using the provided bounding box')
    parser.add_argument('-o', '--osm-file', required=False, dest="osm",
                        help='The OSM file to write the query results to')
    parser.add_argument('-b', '--bounding-box', required=True, dest="bbox",
                        help='A comma separated list of coordinates in the format: miny,minx,maxy,maxx')
    parser.add_argument('-u', '--url', required=False, dest="url", help='The url endpoint of the overpass interpreter')
    parser.add_argument('-d', '--debug', action="store_true", help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v == None):
            continue
        else:
            config[k] = v
    osm = config.get('osm')
    url = config.get('url')
    bbox = config.get('bbox')
    debug = False
    if config.get('debug'):
        debug = config.get('debug')
    overpass = Overpass(url=url, bbox=bbox, raw_data_filename=osm, debug=debug)
    overpass.run_query()
