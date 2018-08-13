# -*- coding: utf-8 -*-
from __future__ import with_statement

import argparse
import logging
import os
import subprocess
from string import Template

from pysqlite2 import dbapi2 as sqlite3

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


class GPKGToSQLite(object):
    """
    Thin wrapper around ogr2ogr to convert gpkg to sqlite.
    """

    def __init__(self, gpkg=None, sqlitefile=None, debug=None, task_uid=None):
        """
        Initialize the GPKGToSQLite utility.

        Args:
            gpgk: the gpkg file to convert
            sqlite: where to write the sqlite output
            debug: turn debugging on / off
        """
        self.gpkg = gpkg
        if not os.path.isfile(self.gpkg):
            raise IOError('Cannot find gpkg file for this task.')
        self.sqlitefile = sqlitefile
        if not self.sqlitefile:
            # create gpkg path from sqlite path.
            root = self.gpkg.split('.')[0]
            self.sqlitefile = root + '.sqlite'
        self.debug = debug
        self.cmd = Template("ogr2ogr -f 'SQLite' $sqlitefile $gpkg")
        self.task_uid = task_uid

    def convert(self,):
        """
        Convert sqlite to gpkg.
        """
        convert_cmd = self.cmd.safe_substitute({'sqlitefile': self.sqlitefile,
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
        return self.sqlitefile


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


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Converts a GPKG database to SQLite.')
    parser.add_argument('-i', '--geopackage-file', required=True,
                        dest="gpkg", help='The GPKG file to convert.')
    parser.add_argument('-g', '--sqlite-file', required=True,
                        dest="sqlitefile", help='The SQlite file to write to.')
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
    sqlitefile = config['sqlitefile']
    debug = False
    zipped = False
    if config.get('debug'):
        debug = True
    if config.get('zipped'):
        zipped = True
    s2g = GPKGToSQLite(gpkg=gpkg, sqlitefile=sqlitefile, debug=debug)
    s2g.convert()
