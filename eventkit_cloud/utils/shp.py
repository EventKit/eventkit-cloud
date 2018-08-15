# -*- coding: utf-8 -*-
from __future__ import with_statement

import argparse
import logging
import os
import shutil
import subprocess
from string import Template

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


class GPKGToShp(object):
    """
    Convert GPKG to shapefile.
    """

    def __init__(self, gpkg=None, shapefile=None, zipped=True, debug=False, task_uid=None):
        """
        Initialize the GPKGToShp utility.

        Args:
            gpkg: the gpkg file to convert.
            shapefile: the path to the shapefile output
            zipped: whether to zip the output
        """
        self.gpkg = gpkg
        if not os.path.exists(self.gpkg):
            raise IOError('Cannot find gpkg file for this task.')
        self.shapefile = shapefile
        self.zipped = zipped
        if not self.shapefile:
            # create shp path from gpkg path.
            root = self.gpkg.split('.')[0]
            self.shapefile = root + '_shp'
        self.debug = debug
        self.cmd = Template("ogr2ogr -f 'ESRI Shapefile' $shp $gpkg -lco ENCODING=UTF-8 -nln $layer_name -overwrite")
        self.zip_cmd = Template("zip -j -r $zipfile $shp_dir")
        self.task_uid = task_uid

    def convert(self,):
        """
        Convert the sqlite to shape.
        """
        layer_name = os.path.splitext(os.path.basename(self.gpkg))[0]
        convert_cmd = self.cmd.safe_substitute({'shp': self.shapefile, 'gpkg': self.gpkg, 'layer_name': layer_name})
        if (self.debug):
            print 'Running: %s' % convert_cmd
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/bash',
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode {0}".format(task_process.exitcode)
        if (self.debug):
            print 'ogr2ogr returned: %s' % task_process.exitcode
        if self.zipped and task_process.exitcode == 0:
            zipfile = self._zip_shape_dir()
            return zipfile
        else:
            return self.shapefile

    def _zip_shape_dir(self,):
        """
        Zip the shapefile output.
        """
        zipfile = self.shapefile + '.zip'
        zip_cmd = self.zip_cmd.safe_substitute({'zipfile': zipfile, 'shp_dir': self.shapefile})
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(zip_cmd, shell=True, executable='/bin/bash',
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode == 12:
            logger.warn('No shapefile files to zip')
        elif task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, 'Error zipping shape directory. Exited with returncode: {0}'.format(task_process.exitcode)

        if task_process.exitcode == 0:
            # remove the shapefile directory
            shutil.rmtree(self.shapefile)

        if self.debug:
            print 'Zipped shapefiles: {0}'.format(self.shapefile)
        return zipfile


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Converts a SQlite database to ESRI Shapefile.')
    parser.add_argument('-i', '--geopackage-file', required=True, dest="gpkg", help='The GPKG file to convert.')
    parser.add_argument('-o', '--shp-dir', required=True, dest="shp",
                        help='The directory to write the Shapefile(s) to.')
    parser.add_argument('-z', '--zipped', action="store_true",
                        help="Whether to zip the shapefile directory. Default true.")
    parser.add_argument('-d', '--debug', action="store_true", help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v == None):
            continue
        else:
            config[k] = v
    gpkg = config['gpkg']
    shapefile = config['shp']
    debug = False
    zipped = False
    if config.get('debug'):
        debug = True
    if config.get('zipped'):
        zipped = True
    s2s = GPKGToShp(gpkg=gpkg, shapefile=shapefile, debug=debug)
    s2s.convert()
