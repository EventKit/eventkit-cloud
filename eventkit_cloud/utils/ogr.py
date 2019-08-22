# -*- coding: utf-8 -*-


import logging
import os
import subprocess
import sqlite3
from zipfile import ZipFile, ZIP_DEFLATED

from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.tasks.helpers import cd, get_file_paths
from eventkit_cloud.utils.generic import create_zip_file, get_zip_name, requires_zip


logger = logging.getLogger(__name__)


class OGR(object):
    """
    Thin wrapper around ogr2ogr to convert feature data files.
    """

    def __init__(self, task_uid=None):
        """
        Initialize the OGR converter.
        Args:
            task_uid: the task uid for the celery task
        """
        self.task_uid = task_uid

    def convert(self, file_format, out_file, in_file, params=None):
        """

        :param file_format: The OGR format (e.g. KML, GPKG, ESRI Shapefile)
        :param out_file: The full path to the converted file.
        :param in_file: The full path to the source file.
        :param params: any arbitrary parameters passed as a string.
        :return: The `out_file`, or raises an exception.
        """

        if not params:
            params = ""

        cmd = "ogr2ogr -f '{format}' {params} {out_file} {in_file}".format(
                format=file_format, in_file=in_file, out_file=out_file, params=params)

        logger.info('Running: {}'.format(cmd))
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(cmd, shell=True, executable='/bin/bash',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception("ogr2ogr process failed with returncode: {0}".format(task_process.exitcode))
        if self.requires_zip(file_format):
            logger.debug("Requires zip: {0}".format(out_file))
            out_file = create_zip_file(out_file, get_zip_name(out_file))
        logger.debug('ogr2ogr returned: {0}'.format(task_process.exitcode))
        return out_file


def execute_spatialite_script(db, sql_script, user_details=None):
    # This is just to make it easier to trace when user_details haven't been sent
    from audit_logging.file_logging import logging_open  # NOQA

    if user_details is None:
        user_details = {'username': 'unknown-execute_spatialite_script'}

    conn = sqlite3.connect(db)
    # load spatialite extension
    enable_spatialite(conn)
    try:
        cur = conn.cursor()
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
