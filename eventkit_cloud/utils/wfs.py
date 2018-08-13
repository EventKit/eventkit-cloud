from __future__ import absolute_import

import logging
import os
import re
import subprocess
from string import Template

from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.utils.auth_requests import get_cred
from eventkit_cloud.utils.geopackage import check_content_exists

logger = logging.getLogger(__name__)


class WFSToGPKG(object):
    """
    Convert a WFS services to a gpkg file.
    """

    def __init__(self, config=None, gpkg=None, bbox=None, service_url=None, layer=None, debug=None, name=None,
                 service_type=None, task_uid=None):
        """
        Initialize the WFSToGPKG utility.

        Args:
            gpkg: where to write the gpkg output
            debug: turn debugging on / off
        """
        self.gpkg = gpkg
        self.bbox = bbox
        self.service_url = service_url
        self.debug = debug
        self.name = name
        self.layer = layer
        self.config = config
        self.task_uid = task_uid
        if self.bbox:
            self.cmd = Template(
                "ogr2ogr -skipfailures -spat $minX $minY $maxX $maxY -f GPKG $gpkg WFS:'$url'")
        else:
            self.cmd = Template("ogr2ogr -skipfailures -f GPKG $gpkg WFS:'$url'")

    def convert(self, ):
        """
        Convert wfs to gpkg.
        """
        if not os.path.exists(os.path.dirname(self.gpkg)):
            os.makedirs(os.path.dirname(self.gpkg), 6600)

        # Strip out query string parameters that might conflict
        self.service_url = re.sub(r"(?i)(?<=[?&])(version|service|request|typename|srsname)=.*?(&|$)", "",
                                  self.service_url)
        query_str = 'SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={}&SRSNAME=EPSG:4326'.format(self.layer)
        if "?" in self.service_url:
            if "&" != self.service_url[-1]:
                self.service_url += "&"
            self.service_url += query_str
        else:
            self.service_url += "?" + query_str

        url = self.service_url
        cred = get_cred(slug=self.name, url=url)
        if cred:
            user, pw = cred
            if not re.search(r"(?<=://)[a-zA-Z0-9\-._~]+:[a-zA-Z0-9\-._~]+(?=@)", url):
                url = re.sub(r"(?<=://)", "%s:%s@" % (user, pw), url)

        if self.bbox:
            convert_cmd = self.cmd.safe_substitute(
                {'gpkg': self.gpkg, 'url': url, 'minX': self.bbox[0], 'minY': self.bbox[1],
                 'maxX': self.bbox[2], 'maxY': self.bbox[3]})
        else:
            convert_cmd = self.cmd.safe_substitute({'gpkg': self.gpkg, 'url': url})

        logger.debug('Running: %s' % convert_cmd)
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/sh',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode {0}".format(task_process.exitcode)

        # Check for geopackage contents; gdal wfs driver fails silently
        if not check_content_exists(self.gpkg):
            raise Exception, "Empty response: Unknown layer name '{}' or invalid AOI bounds".format(self.layer)

        if self.debug:
            logger.debug('ogr2ogr returned: %s' % task_process.exitcode)

        return self.gpkg
