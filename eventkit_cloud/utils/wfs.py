from __future__ import absolute_import

import logging
import os
import subprocess
from string import Template
from ..tasks.task_process import TaskProcess
from ..utils.geopackage import check_content_exists
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

        try:
            # remove any url params so we can add our own
            self.service_url = self.service_url.split('?')[0]
        except ValueError:
            # if no url params we can just check for trailing slash and move on
            self.service_url = self.service_url.rstrip('/\\')
        finally:
            self.service_url = '{}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={}&SRSNAME=EPSG:4326'\
                .format(self.service_url, self.layer)

        if self.bbox:
            convert_cmd = self.cmd.safe_substitute(
                {'gpkg': self.gpkg, 'url': self.service_url, 'minX': self.bbox[0], 'minY': self.bbox[1],
                 'maxX': self.bbox[2], 'maxY': self.bbox[3]})
        else:
            convert_cmd = self.cmd.safe_substitute({'gpkg': self.gpkg, 'url': self.service_url})

        logger.info('Running: %s' % convert_cmd)
        if self.debug:
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
