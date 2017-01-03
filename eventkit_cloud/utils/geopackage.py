# -*- coding: utf-8 -*-
from __future__ import with_statement

import argparse
import logging
import os
import subprocess
from string import Template
from ..tasks.task_process import TaskProcess
import sqlite3

logger = logging.getLogger(__name__)


class SQliteToGeopackage(object):
    """
    Thin wrapper around ogr2ogr to convert sqlite to KML.
    """

    def __init__(self, sqlite=None, gpkgfile=None, debug=None, task_uid=None):
        """
        Initialize the SQliteToKml utility.

        Args:
            sqlite: the sqlite file to convert
            gpkgfile: where to write the gpkg output
            debug: turn debugging on / off
        """
        self.sqlite = sqlite
        if not os.path.isfile(self.sqlite):
            raise IOError('Cannot find sqlite file for this task.')
        self.gpkgfile = gpkgfile
        if not self.gpkgfile:
            # create gpkg path from sqlite path.
            root = self.sqlite.split('.')[0]
            self.gpkgfile = root + '.gkpg'
        self.debug = debug
        self.cmd = Template("ogr2ogr -f 'GPKG' $gpkgfile $sqlite")
        self.task_uid = task_uid

    def convert(self, ):
        """
        Convert sqlite to gpkg.
        """
        convert_cmd = self.cmd.safe_substitute({'gpkgfile': self.gpkgfile,
                                                'sqlite': self.sqlite})
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
        return self.gpkgfile


def is_alnum(data):
    """
    Used to ensure that only 'safe' data can be used to query or create data.
    >>> is_alnum("test")
    True
    >>> is_alnum("test_2")
    True
    >>> is_alnum(";")
    False
    >>> is_alnum("test 4")
    False
    @param: String of data to be tested.
    @return: if data is only alphanumeric or '_' chars.
    """
    import re
    if re.match(r'[\w:]+$', data):
        return True
    return False


def get_table_count(gpkg, table):
    """

    :param gpkg: Path to geopackage file.
    :param table: A table name to count the rows.
    :return: A count of the rows in a table.
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    if is_alnum(table):
        cur.execute("SELECT COUNT(*) FROM '{0}';".format(table))
        result = cur.fetchone()
        conn.close()
        return result[0]
    conn.close()
    return False


def get_table_names(gpkg):
    """
    Gets the list of the feature or tile data table names

    :param gpkg: Path to geopackage file.
    :return: List of user data table names in geopackage.
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    result = cur.execute("SELECT table_name FROM gpkg_contents;")
    table_names = [table for (table,) in result]
    conn.close()
    return table_names


def get_tile_table_names(gpkg):
    """
    Gets the list of tile table names.

    :param gpkg: Path to geopackage file.
    :return: List of tile user data table names in geopackage.
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    result = cur.execute("SELECT table_name FROM gpkg_contents WHERE data_type = 'tiles';")
    table_names = [table for (table,) in result]
    conn.close()
    return table_names


def get_zoom_levels_table(gpkg, table):
    """
    Inspects the tile user data table for unique zoom levels.
    :param gpkg: Path to geopackage
    :param table: A table name to return the zoom_levels which have data in the user table.
    :return: A list of zoom levels.
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    if is_alnum(table):
        result = cur.execute("SELECT DISTINCT zoom_level FROM '{0}';".format(table))
        zoom_levels = [zoom_level for (zoom_level,) in result]
        conn.close()
        return zoom_levels
    conn.close()
    return False


def remove_empty_zoom_levels(gpkg):
    """
    Inspects geopackage for tile tables, and ensures that the tile matrix lists only levels with data in it.
    :param gpkg: Path to geopackage
    :return: None
    """
    for table in get_tile_table_names(gpkg):
        populated_zoom_levels = get_zoom_levels_table(gpkg, table)
        for zoom_level in get_tile_matrix_table_zoom_levels(gpkg, table):
            if zoom_level not in populated_zoom_levels:
                remove_zoom_level(gpkg, table, zoom_level)


def remove_zoom_level(gpkg, table, zoom_level):
    """
    Removes a specific zoom level, for a table in the gpkg_tile_matrix table.

    :param gpkg: Path to geopackage.
    :param table: Table name in gpkg_tile_matrix.
    :param zoom_level: A specific zoom level to remove from gpkg_tile_matrix.
    :return:
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    if is_alnum(table):
        cur.execute("DELETE FROM '{0}' WHERE zoom_level = '{1}';".format(table, int(zoom_level)))
        conn.close()
        return True
    conn.close()
    return False


def get_tile_matrix_table_zoom_levels(gpkg, table_name):
    """
    Returns the zoom levels listed in the gpkg_tile_matrix for a specific table_name.

    :param gpkg: Path to geopackage file.
    :param table_name: Table to query zoom_levels for in the gpkg_tile_matrix.
    :return: List of zoom levels (i.e. [2,3,4,5]
    """
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    if is_alnum(table_name):
        result = cur.execute("SELECT zoom_level FROM gpkg_tile_matrix WHERE table_name = '{0}';".format(table_name))
        zoom_levels = [zoom_level for (zoom_level,) in result]
        conn.close()
        return zoom_levels
    conn.close()
    return False


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Converts a SQlite database to GPKG.')
    parser.add_argument('-i', '--sqlite-file', required=True,
                        dest="sqlite", help='The SQlite file to convert.')
    parser.add_argument('-g', '--gpkg-file', required=True,
                        dest="gpkgfile", help='The GPKG file to write to.')
    parser.add_argument('-d', '--debug', action="store_true",
                        help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v == None):
            continue
        else:
            config[k] = v
    sqlite = config['sqlite']
    gpkgfile = config['gpkgfile']
    debug = False
    zipped = False
    if config.get('debug'):
        debug = True
    if config.get('zipped'):
        zipped = True
    s2g = SQliteToGeopackage(sqlite=sqlite, gpkgfile=gpkgfile, debug=debug)
    s2g.convert()
