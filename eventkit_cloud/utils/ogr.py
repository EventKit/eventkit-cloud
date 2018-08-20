# -*- coding: utf-8 -*-
from __future__ import with_statement

import logging
import os
import subprocess
from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.ui.helpers import get_file_paths, cd
from zipfile import ZipFile, ZIP_DEFLATED

from pysqlite2 import dbapi2 as sqlite3

logger = logging.getLogger(__name__)


class OGR(object):
    """
    Thin wrapper around ogr2ogr to convert sqlite to KML.
    """

    def __init__(self, task_uid=None):
        """
        Initialize the SQliteToKml utility.

        Args:
            task_uid: the task uid for the celery task
        """
        self.task_uid = task_uid

    def convert(self, file_format, out_file, in_file, layer_name=None, bbox=None, lco=None, dco=None, co=None,
                overwrite=False, skipfailures=False, spat=None, t_srs=None, spat_srs=None):
        """

        :param file_format: The OGR format (e.g. KML, GPKG, ESRI Shapefile)
        :param out_file: The full path to the converted file.
        :param in_file: The full path to the source file.
        :param layer_name: An optional layer name (if only converting one layer).
        :param lco: OGR Layer creation options ("OPTION=SOMETHING")
        :param dco: OGR Data creation options ("OPTION=SOMETHING")
        :param co: OGR creation options ("OPTION=SOMETHING")
        :param overwrite: If wishing to overwrite the source data.
        :return: The `out_file`, or raises an exception.
        """
        layer_param = lco_param = co_param = dco_param = overwrite_param = skipfailures_param = \
                spat_srs = t_srs_param = ""

        bbox = bbox or spat
        
        if layer_name:
            layer_param = "-nln {0}".format(layer_name)

        if lco:
            lco_param = "-lco '{0}'".format(lco)

        if dco:
            dco_param = "-dco '{0}'".format(dco)

        if co:
            co_param = "-co '{0}'".format(co)

        if overwrite:
            overwrite_param = '-overwrite'

        if skipfailures:
            skipfailures_param = "-skipfailures"

        if bbox:
            bbox_param = '-spat {0} {1} {2} {3}'.format(bbox[0], bbox[1], bbox[2], bbox[3])

        if t_srs:
            t_srs_param = '-t_srs {}'.format(t_srs)

        if spat_srs:
            spat_srs_param = '-t_srs {}'.format(spat_srs)


        cmd = "ogr2ogr -f '{format}' {out_file} {in_file} {layer_param} {bbox_param} " \
              "{lco_param} {dco_param} {co_param} {t_srs_param} {spat_srs_param} {overwrite_param} {skipfailures_param}".format(
                format=file_format, in_file=in_file, out_file=out_file, layer_param=layer_param,
                lco_param=lco_param, bbox_param=bbox_param,
                dco_param=dco_param, co_param=co_param,
                overwrite_param=overwrite_param, skipfailures_param=skipfailures_param,
                t_srs_param=t_srs_param, spat_srs_param=spat_srs_param)

        logger.info('Running: {}'.format(cmd))
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(cmd, shell=True, executable='/bin/bash',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode: {0}".format(task_process.exitcode)
        if self.requires_zip(file_format):
            logger.debug("Requires zip: {0}".format(out_file))
            out_file = create_zip_file(out_file, get_zip_name(out_file))
        logger.debug('ogr2ogr returned: {0}'.format(task_process.exitcode))
        return out_file

    @staticmethod
    def requires_zip(file_format):
        zipped_formats = ['KML', 'ESRI Shapefile']
        if file_format in zipped_formats:
            return True


def create_zip_file(in_file, out_file):
    """

    :param in_file: The file to be compressed.
    :param out_file: The result.
    :return: The archive.
    """
    logger.debug("Creating the zipfile {0} from {1}".format(out_file, in_file))
    with ZipFile(out_file, 'a', compression=ZIP_DEFLATED, allowZip64=True) as zipfile:
        if os.path.isdir(in_file):
            # Shapefiles will be all of the layers in a directory.
            # When this gets zipped they will all be in the same zip file.  Some applications (QGIS) will
            # read this without a problem whereas ArcGIS will need the files extracted first.
            file_paths = get_file_paths(in_file)
            for absolute_file_path, relative_file_path in file_paths.iteritems():
                if os.path.isfile(absolute_file_path):
                    zipfile.write(
                        absolute_file_path,
                        arcname=os.path.basename(relative_file_path)
                    )
        else:
            zipfile.write(
                in_file
            )
    return out_file


def get_zip_name(file_name):
    basename, ext = os.path.splitext(file_name)
    if ext == '.kml':
        return basename + ".kmz"
    return basename + ".zip"


def execute_spatialite_script(db, sql_script, user_details=None):
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-execute_spatialite_script'}

    conn = sqlite3.connect(db)
    # load spatialite extension
    enable_spatialite(conn)
    try:
        cur = conn.cursor()
        from audit_logging.file_logging import logging_open
        with logging_open(sql_script, 'r', user_details=user_details) as sql_file:
            sql = sql_file.read()
            cur.executescript(sql)
        conn.commit()
    except Exception as e:
        logger.error('Problem running spatialite script: {}'.format(e))
        raise
    finally:
        cur.close()
        conn.close()


def enable_spatialite(connection):
    """
    Take a connection and enables spatialite.
    :param connection: An sqlite3 connection object.
    :returns: The connection.
    """
    connection.enable_load_extension(True)
    try:
        cmd = "SELECT load_extension('mod_spatialite')"
        with connection:
            connection.execute(cmd)
    except sqlite3.OperationalError:
        cmd = "SELECT load_extension('libspatialite')"
        with connection:
            connection.execute(cmd)
    return connection
