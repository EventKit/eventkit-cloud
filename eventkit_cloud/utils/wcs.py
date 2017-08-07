from __future__ import absolute_import

import logging
import os
from string import Template
import subprocess
from ..tasks.task_process import TaskProcess
import tempfile

logger = logging.getLogger(__name__)


class WCSConverter(object):
    """
    Convert a WCS request to a file of the specified format.
    """

    def __init__(self, config=None, out=None, bbox=None, service_url=None, layer=None, debug=None, name=None,
                 service_type=None, task_uid=None, fmt=None):
        """
        Initialize the WCStoGPKG utility.
        :param config:
        :param gpkg:
        :param bbox:
        :param service_url:
        :param layer:
        :param debug:
        :param name:
        :param service_type:
        :param task_uid:
        """
        self.config = config
        self.out = out
        self.bbox = bbox
        self.service_url = service_url
        self.layer = layer
        self.debug = debug
        self.service_type = service_type
        self.task_uid = task_uid
        self.wcs_xml = Template(
            """<WCS_GDAL>
              <ServiceURL>$url</ServiceURL>
              <CoverageName>$coverage</CoverageName>
              <PreferredFormat>GeoTIFF</PreferredFormat>
              <GetCoverageExtra>&amp;crs=EPSG:4326$params</GetCoverageExtra>
              <DescribeCoverageExtra>$params</DescribeCoverageExtra>
            </WCS_GDAL>""")
        self.params = ""
        self.wcs_xml_path = None # determined after mkstemp call
        if self.bbox:
            self.cmd = Template(
                "gdal_translate -projwin $minX $maxY $maxX $minY -of $fmt $type $wcs $out"
            )
        else:
            self.cmd = Template(
                "gdal_translate -of $fmt $type $wcs $out"
            )

        self.format = fmt or "gtiff"
        self.band_type = ""
        if self.format.lower() == "gpkg":
            self.band_type = "-ot byte"  # geopackage raster is limited to byte band type

    def convert(self, ):
        """
        Download WCS data and convert to geopackage
        """
        if not os.path.exists(os.path.dirname(self.out)):
            os.makedirs(os.path.dirname(self.out), 6600)

        try:
            # Isolate url params
            self.params = "&amp;" + self.service_url.split('?')[1]
            self.service_url = self.service_url.split('?')[0]
        finally:
            self.service_url += "?"

        # Create temporary WCS description XML file for gdal_translate
        (wcs_xml_fd, self.wcs_xml_path) = tempfile.mkstemp()
        wcs_xml_string = self.wcs_xml.safe_substitute({
            'url': self.service_url,
            'coverage': self.layer,
            'params': self.params
        })
        logger.debug("Creating temporary WCS XML at {}:\n{}".format(self.wcs_xml_path, wcs_xml_string))
        os.write(wcs_xml_fd, wcs_xml_string)
        os.close(wcs_xml_fd)

        if self.bbox:
            convert_cmd = self.cmd.safe_substitute(
                {'out': self.out, 'wcs': self.wcs_xml_path, 'minX': self.bbox[0], 'minY': self.bbox[1],
                 'maxX': self.bbox[2], 'maxY': self.bbox[3], 'fmt': self.format, 'type': self.band_type})
        else:
            convert_cmd = self.cmd.safe_substitute({'out': self.out, 'wcs': self.wcs_xml_path, 'fmt': self.format,
                                                    'type': self.band_type})

        if self.debug:
            logger.debug('Running: %s' % convert_cmd)
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/sh',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception("WCS translation failed with code {}: \n{}\n{}".format(task_process.exitcode, convert_cmd, wcs_xml_string))
        if self.debug:
            logger.debug('gdal_translate returned: %s' % task_process.exitcode)

        os.remove(self.wcs_xml_path)

        return self.out
