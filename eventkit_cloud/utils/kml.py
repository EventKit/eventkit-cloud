# -*- coding: utf-8 -*-
from __future__ import with_statement

import argparse
import logging
import os
import subprocess
from string import Template

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


class GPKGToKml(object):
    """
    Thin wrapper around ogr2ogr to convert GPKG to KML.
    """

    def __init__(self, gpkg=None, kmlfile=None, zipped=True, debug=False, task_uid=None):
        """
        Initialize the GPKGToKml utility.

        Args:
            gpkg: the gpkg file to convert
            kmlfile: where to write the kml output
            zipped: whether to zip the output
            debug: turn debugging on / off
        """
        self.gpkg = gpkg
        if not os.path.exists(self.gpkg):
            raise IOError('Cannot find gpkg file for this task.')
        self.kmlfile = kmlfile
        self.zipped = zipped
        if not self.kmlfile:
            # create kml path from gpkg path.
            root = self.gpkg.split('.')[0]
            self.kmlfile = root + '.kml'
        self.debug = debug
        self.cmd = Template("ogr2ogr -f 'KML' $kmlfile $gpkg")
        self.zip_cmd = Template("zip -j $zipfile $kmlfile")
        self.task_uid = task_uid

    def convert(self, ):
        """
        Convert GPKG to kml.
        """
        convert_cmd = self.cmd.safe_substitute({'kmlfile': self.kmlfile,
                                                'gpkg': self.gpkg})
        if (self.debug):
            print 'Running: %s' % convert_cmd
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/bash',
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode: {0}".format(task_process.exitcode)
        if (self.debug):
            print 'ogr2ogr returned: %s' % task_process.exitcode
        if self.zipped and task_process.exitcode == 0:
            kmzfile = self._zip_kml_file()
            return kmzfile
        else:
            return self.kmlfile

    def _zip_kml_file(self, ):
        """Zip the kml output file."""
        kmzfile = self.kmlfile.split('.')[0] + '.kmz'
        zip_cmd = self.zip_cmd.safe_substitute({'zipfile': kmzfile,
                                                'kmlfile': self.kmlfile})
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(zip_cmd, shell=True, executable='/bin/bash',
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, 'Failed to create zipfile for {0}'.format(self.kmlfile)
        else:
            # remove the kml file
            os.remove(self.kmlfile)
        if self.debug:
            print 'Zipped KML: {0}'.format(kmzfile)
        return kmzfile


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Converts a GPKG database to KML.')
    parser.add_argument('-i', '--geopackage-file', required=True,
                        dest="gpkg", help='The GPKG file to convert.')
    parser.add_argument('-k', '--kml-file', required=True,
                        dest="kmlfile", help='The KML file to write to.')
    parser.add_argument('-z', '--zipped', action="store_true",
                        help="Whether to zip the KML. Default true.")
    parser.add_argument('-d', '--debug', action="store_true",
                        help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v == None):
            continue
        else:
            config[k] = v
    gpkg = config['gpkg']
    kmlfile = config['kmlfile']
    debug = False
    zipped = False
    if config.get('debug'):
        debug = True
    if config.get('zipped'):
        zipped = True
    s2k = GPKGToKml(gpkg=gpkg, kmlfile=kmlfile, zipped=zipped, debug=debug)
    s2k.convert()
