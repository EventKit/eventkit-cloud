from __future__ import absolute_import

import logging
import os
import re
import requests
import subprocess
from string import Template
import xml.etree.ElementTree as ET
from ..tasks.task_process import TaskProcess
from ..utils.geopackage import check_content_exists

logger = logging.getLogger(__name__)


def ping_wfs(service_url, layer):
    """
    Contacts the specified URL and confirms that it can supply the requested feature layer
    :param service_url:
    :param layer:
    :return: 2-tuple: (True if source is up and has data available, description if false)
    """
    query = {
        "SERVICE": "WFS",
        "VERSION": "1.0.0",
        "REQUEST": "GetCapabilities"
    }
    # If service or version parameters are included in query string, it can lead to a protocol error and false negative
    if "?" in service_url:
        service_url = service_url.split("?")[0]

    response = requests.get(url=service_url, params=query)
    if response.status_code != 200:
        logger.error("WFS ping failed: code {}, message {}".format(response.status_code, response.content))
        return False, "WFS server returned status {}".format(response.status_code)

    root = ET.fromstring(response.content)

    # Check for namespace
    m = re.search(r"^{.*?}", root.tag)
    ns = m.group() if m else ""

    feature_type_list = root.find(".//{}FeatureTypeList".format(ns))
    if feature_type_list is None:
        return False, "Unknown format or layer not available"

    feature_types = feature_type_list.findall("{}FeatureType".format(ns))
    titles = [ft.find("{}Title".format(ns)).text for ft in feature_types]
    if layer not in titles:
        return False, "Layer '{}' not available".format(layer)

    return True, None


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
