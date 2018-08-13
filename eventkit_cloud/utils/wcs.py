from __future__ import absolute_import

import logging
import os
import shutil
import subprocess
import tempfile
from string import Template

import yaml
from django.conf import settings

from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.utils import auth_requests
from eventkit_cloud.utils.gdalutils import get_dimensions, merge_geotiffs

logger = logging.getLogger(__name__)


class WCSConverter(object):
    """
    Convert a WCS request to a file of the specified format.
    """

    def __init__(self, config=None, out=None, bbox=None, service_url=None, layer=None, debug=None, name=None,
                 task_uid=None, fmt=None, slug=None, user_details=None):
        """
        Initialize the WCStoGPKG utility.
        :param slug: An identifier slug for the provider task record.
        :param config: Some yaml configuration to pass parameters to a WCS service.
        :param bbox: A bounding box as a list [w,s,e,n]
        :param service_url: The url to the WCS service.
        :param layer: The specific coverage to request.
        :param debug: Boolean to enable debugging.
        :param name: A name for the service.
        :param task_uid:
        """
        self.config = yaml.load(config) if config is not None else None
        self.out = out
        self.bbox = bbox
        self.service_url = service_url
        self.layer = layer
        self.debug = debug
        self.name = name
        self.task_uid = task_uid
        self.wcs_xml = Template(
            """<WCS_GDAL>
              <ServiceURL>$url</ServiceURL>
              <CoverageName>$coverage</CoverageName>
              <PreferredFormat>GeoTIFF</PreferredFormat>
              <GetCoverageExtra>&amp;crs=EPSG:4326$params</GetCoverageExtra>
              <DescribeCoverageExtra>$params</DescribeCoverageExtra>
              $auth
            </WCS_GDAL>""")
        self.wcs_xml_auth = Template(
            """<UserPwd>$userpwd</UserPwd>
              <HttpAuth>ANY</HttpAuth>"""
        )
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
        self.slug = slug
        self.user_details = user_details

    def get_coverage_with_gdal(self):
        # Get username and password from url params, if possible
        cred = auth_requests.get_cred(slug=self.name, url=self.service_url)

        try:
            # Isolate url params
            self.params = "&amp;" + self.service_url.split('?')[1].replace('&', '&amp;')
            self.service_url = self.service_url.split('?')[0]
        finally:
            self.service_url += "?"

        # Create temporary WCS description XML file for gdal_translate
        (wcs_xml_fd, self.wcs_xml_path) = tempfile.mkstemp()
        wcs_xml_auth_string = self.wcs_xml_auth.safe_substitute({"userpwd": ":".join(cred)}) if cred else ""
        wcs_xml_string = self.wcs_xml.safe_substitute({
            'url': self.service_url,
            'coverage': self.layer,
            'params': self.params,
            'auth': wcs_xml_auth_string
        })
        logger.debug("Creating temporary WCS XML at %s:\n%s", self.wcs_xml_path, wcs_xml_string)
        os.write(wcs_xml_fd, wcs_xml_string)
        os.close(wcs_xml_fd)

        if self.bbox:
            convert_cmd = self.cmd.safe_substitute(
                {'out': self.out, 'wcs': self.wcs_xml_path, 'minX': self.bbox[0], 'minY': self.bbox[1],
                 'maxX': self.bbox[2], 'maxY': self.bbox[3], 'fmt': self.format, 'type': self.band_type})
        else:
            convert_cmd = self.cmd.safe_substitute({'out': self.out, 'wcs': self.wcs_xml_path, 'fmt': self.format,
                                                    'type': self.band_type})

        logger.debug('WCS command: %s' % convert_cmd)

        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/sh',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception("WCS translation failed with code %s: \n%s\n%s",
                            task_process.exitcode,
                            convert_cmd,
                            wcs_xml_string)
        if self.debug:
            logger.debug('gdal_translate returned: %s', task_process.exitcode)

        os.remove(self.wcs_xml_path)

    def get_coverage_with_requests(self):
        logger.info("Using admin configuration for the WCS request.")
        service = self.config.get('service')
        params = self.config.get('params')
        if not service:
            raise Exception('A service key needs to be defined to include the scale of source in meters')
        coverages = service.get('coverages', params.get('COVERAGE'))
        coverages = coverages.split(',')
        if not coverages:
            logger.error('No coverages were specified for this provider, please specify `coverages` under service or `COVERAGE` under params.')
            raise Exception("Data source incorrectly configured.")
        logger.info("Getting Dimensions...")
        width, height = get_dimensions(self.bbox, int(service.get('scale')))
        params['width'] = str(width)
        params['height'] = str(height)
        params['service'] = 'WCS'
        params['bbox'] = ','.join(map(str, self.bbox))
        geotiffs = []
        for idx, coverage in enumerate(coverages):
            params['COVERAGE'] = coverage
            file_path, ext = os.path.splitext(self.out)
            outfile = '{0}-{1}{2}'.format(file_path, idx, ext)
            try:
                req = auth_requests.get(self.service_url, params=params, slug=self.slug, stream=True,
                                        verify=(not getattr(settings, 'DISABLE_SSL_VERIFICATION', False)))
                logger.info("Getting the coverage: {0}".format(req.url))
                try:
                    size = int(req.headers.get('content-length'))
                except (ValueError, TypeError):
                    if req.content:
                        size = len(req.content)
                    else:
                        raise Exception("Overpass Query failed to return any data")
                if not req:
                    logger.error(req.content)
                    raise Exception("WCS request for {0} failed.".format(self.name))
                CHUNK = 1024 * 1024 * 2  # 2MB chunks
                from audit_logging.file_logging import logging_open
                with logging_open(outfile, 'wb', user_details=self.user_details) as fd:
                    for chunk in req.iter_content(CHUNK):
                        fd.write(chunk)
                        size += CHUNK
                geotiffs += [outfile]
            except Exception as e:
                logger.error(e)
                raise Exception("There was an error writing the file to disk.")
        if len(geotiffs) > 1:
            self.out = merge_geotiffs(geotiffs, self.out, task_uid=self.task_uid)
        else:
            shutil.copy(geotiffs[0], self.out)

    def convert(self, ):
        """
        Download WCS data and convert to geopackage
        """
        if not os.path.exists(os.path.dirname(self.out)):
            os.makedirs(os.path.dirname(self.out), 6600)

        if self.config:
            self.get_coverage_with_requests()
        else:
            self.get_coverage_with_gdal()
        return self.out
