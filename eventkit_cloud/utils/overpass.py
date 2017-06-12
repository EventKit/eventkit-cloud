# -*- coding: utf-8 -*-
import argparse
import logging
import shutil
import subprocess
from ..tasks.task_process import TaskProcess
from datetime import datetime
from string import Template
import os

import requests
from requests import exceptions

from django.conf import settings

logger = logging.getLogger(__name__)


class Overpass(object):
    """
    Wrapper around an Overpass query.

    Returns all nodes, ways and relations within the specified bounding box
    and filtered by the provided tags.
    """

    def __init__(self, url=None, bbox=None, stage_dir=None, job_name=None, filters=None, debug=False, task_uid=None):
        """
        Initialize the Overpass utility.

        Args:
            bbox: the bounding box to extract
            stage_dir: where to stage the extract job
            job_name: the name of the export job
            filters: a list of key=value filters to use to filter the overpass extract.
            debug: turn on/off debug logging
        """
        if settings.OVERPASS_API_URL:
            self.url = settings.OVERPASS_API_URL
        else:
            self.url = 'http://localhost/interpreter'
        self.query = None
        self.stage_dir = stage_dir
        self.job_name = job_name
        self.filters = filters
        self.debug = debug
        self.task_uid = task_uid
        self.verify_ssl = not getattr(settings, "DISABLE_SSL_VERIFICATION", False)
        if url:
            self.url = url
        if bbox:
            self.bbox = bbox
        else:
            raise Exception('A bounding box is required: miny,minx,maxy,maxx')

        # extract all nodes / ways and relations within the bounding box
        # see: http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
        self.default_template = Template('[maxsize:$maxsize][timeout:$timeout];(node($bbox);<;);out body;')

        # see http://wiki.openstreetmap.org/wiki/Osmfilter#Object_Filter
        self.filter_template = '--keep={0}'.format(' or '.join(self.filters))

        # dump out all osm data for the specified bounding box
        max_size = settings.OVERPASS_MAX_SIZE
        timeout = settings.OVERPASS_TIMEOUT
        self.query = self.default_template.safe_substitute(
            {'maxsize': max_size, 'timeout': timeout, 'bbox': self.bbox}
        )
        # set up required paths
        self.raw_osm = os.path.join(self.stage_dir, 'query.osm')
        self.filtered_osm = os.path.join(self.stage_dir, '{0}.osm'.format(job_name))

    def get_query(self,):
        """Get the overpass query used for this extract."""
        return self.query

    def run_query(self,):
        """
        Run the overpass query.

        Return:
            the path to the overpass extract
        """
        from ..tasks.export_tasks import update_progress

        q = self.get_query()
        logger.debug(q)
        logger.debug('Query started at: %s'.format(datetime.now()))
        try:
            req = requests.post(self.url, data=q, stream=True, verify=self.verify_ssl)
            # Since the request takes a while, jump progress to an arbitrary 50 percent...
            update_progress(self.task_uid, progress=50)
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
            with logging_open(self.raw_osm, 'wb') as fd:
                for chunk in req.iter_content(CHUNK):
                    fd.write(chunk)
                    size += CHUNK
                    # Because progress is already at 50, we need to make this part start at 50 percent
                    update_progress(self.task_uid, progress=(float(size) / float(inflated_size)) * 100)
        except exceptions.RequestException as e:
            logger.error('Overpass query threw: {0}'.format(e))
            raise exceptions.RequestException(e)
        if self.debug:
            logger.debug('Query finished at %s'.format(datetime.now()))
            logger.debug('Wrote overpass query results to: %s'.format(self.raw_osm))
        return self.raw_osm

    def filter(self,):
        """
        Filter the overpass extract using the export tags.

        See jobs.models.Job.filters
        """
        if self.filters and len(self.filters) > 0:
            self.filter_params = os.path.join(self.stage_dir, 'filters.txt')
            try:
                from audit_logging.file_logging import logging_open
                with logging_open(self.filter_params, 'w') as f:
                    f.write(self.filter_template)
            except IOError as e:
                logger.error('Error saving filter params file', e)
                # can't filter so return the raw data
                shutil.copy(self.raw_osm, self.filtered_osm)
                return self.filtered_osm

            # convert to om5 for faster processing
            om5 = self._convert_om5()

            # filter om5 data
            filter_tmpl = Template(
                'osmfilter $om5 --parameter-file=$params --out-osm >$filtered_osm'
            )
            filter_cmd = filter_tmpl.safe_substitute({'om5': om5,
                                                      'params': self.filter_params,
                                                      'filtered_osm': self.filtered_osm})
            task_process = TaskProcess(task_uid=self.task_uid)
            task_process.start_process(filter_cmd, shell=True, executable='/bin/bash',
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if task_process.exitcode != 0:
                logger.error('%s', task_process.stderr)
                raise Exception, "osmfilter process failed with returncode {0}".format(task_process.exitcode)
            return self.filtered_osm

        else:
            logger.error('No filters found. Returning raw osm data.')
            shutil.copy(self.raw_osm, self.filtered_osm)
            return self.filtered_osm

    def _convert_om5(self,):
        """
        Convert to om5 for faster filter processing.
        """
        om5 = os.path.join(self.stage_dir, 'query.om5')
        convert_tmpl = Template('osmconvert $raw_osm -o=$om5')
        convert_cmd = convert_tmpl.safe_substitute({'raw_osm': self.raw_osm, 'om5': om5})
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/bash',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "osmconvert process failed with returncode {0}: {1}".format(task_process.exitcode,
                                                                                         task_process.stderr)
        return om5

    def _build_overpass_query(self,):  # pragma: no cover
        """
        Overpass  imposes a limit of 1023 statements per query.
        This is no good for us when querying with the OSM Data Model
        which contains 578 tags. Thats 578 * 3 statements to filter all
        nodes, ways and relations. Instead we use 'osmfilter' as a second
        step in this task. Leaving this here in case things change or
        we decide to build our own overpass api in future.
        """
        template = Template("""
                [out:xml][timeout:3600][bbox:$bbox];
                (
                  $nodes
                  $ways
                  $relations
                );
                (._;>;);
                out body;
            """)

        nodes = []
        ways = []
        relations = []

        node_tmpl = Template('node[$tags];')
        way_tmpl = Template('way[$tags];')
        rel_tmpl = Template('rel[$tags];')

        for tag in self.tags:
            try:
                (k, v) = tag.split(':')
                tag_str = '"' + k + '"="' + v + '"'
                node_tag = node_tmpl.safe_substitute({'tags': tag_str})
                way_tag = way_tmpl.safe_substitute({'tags': tag_str})
                rel_tag = rel_tmpl.safe_substitute({'tags': tag_str})
                nodes.append(node_tag)
                ways.append(way_tag)
                relations.append(rel_tag)
            except ValueError as e:
                continue

        # build strings
        node_filter = '\n'.join(nodes)
        way_filter = '\n'.join(ways)
        rel_filter = '\n'.join(relations)

        q = template.safe_substitute({'bbox': self.bbox, 'nodes': node_filter, 'ways': way_filter,
                                      'relations': rel_filter})
        return q


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
    overpass = Overpass(url=url, bbox=bbox, osm=osm, debug=debug)
    overpass.run_query()
