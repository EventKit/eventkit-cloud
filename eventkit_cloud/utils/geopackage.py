# -*- coding: utf-8 -*-
from __future__ import with_statement

import argparse
import logging
import os
import subprocess
from string import Template
from ..tasks.task_process import TaskProcess
import sqlite3
import json

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
        if self.debug:
            print 'Running: %s' % convert_cmd
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(convert_cmd, shell=True, executable='/bin/bash',
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode: {0}".format(task_process.exitcode)
        if self.debug:
            print 'ogr2ogr returned: %s' % task_process.exitcode
        return self.gpkgfile


def add_geojson_to_geopackage(geojson=None, gpkg=None, layer_name=None, task_uid=None):
    """Uses an ogr2ogr script to upload a geojson file.
        Args:
            geojson: A geojson string.
            gpkg: Database dict from the django settings.
            layer_name: A DB table.
            task_uid: A task uid to update.
        Returns:
            True if the file is succesfully uploaded.
        """

    if not geojson or not gpkg:
        raise Exception("A valid geojson: {0} was not provided\nor a geopackage: {1} was not accessible.".format(geojson, gpkg))

    geojson_file = os.path.join(os.path.dirname(gpkg),
                                "{0}.geojson".format(os.path.splitext(os.path.basename(gpkg))[0]))

    with open(geojson_file, 'w') as open_file:
        open_file.write(geojson)

    cmd = Template("ogr2ogr -f 'GPKG' $gpkg $geojson_file -nln $layer_name")

    append_cmd = cmd.safe_substitute({'geojson_file': geojson_file,
                                      'gpkg': gpkg,
                                      'layer_name': layer_name})

    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(append_cmd, shell=True, executable='/bin/bash',
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("ogr2ogr process failed with returncode: {0}".format(task_process.exitcode))
    return gpkg


def clip_geopackage(geojson_file=None, gpkg=None, task_uid=None):
    """Uses an ogr2ogr script to upload a geojson file.
        Args:
            geojson: A geojson string.
            gpkg: Database dict from the django settings.
            layer_name: A DB table.
            task_uid: A task uid to update.
        Returns:
            True if the file is succesfully uploaded.
        """

    if not geojson_file or not gpkg:
        raise Exception("A geojson_file: {0} \nor a geopackage: {1} was not accessible.".format(geojson_file, gpkg))

    cmd = Template("ogr2ogr -f GPKG -clipsrc $geojson_file $out_gpkg $in_gpkg")

    in_gpkg = os.path.join(os.path.dirname(gpkg), "old_{0}".format(os.path.basename(gpkg)))
    os.rename(gpkg, in_gpkg)

    append_cmd = cmd.safe_substitute({'geojson_file': geojson_file,
                                      'in_gpkg': in_gpkg,
                                      'out_gpkg': gpkg})

    logger.error(append_cmd)
    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(append_cmd, shell=True, executable='/bin/bash',
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("ogr2ogr process failed with returncode: {0}".format(task_process.exitcode))
    return gpkg



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
    with sqlite3.connect(gpkg) as conn:
        if is_alnum(table):
            result = conn.execute("SELECT COUNT(*) FROM '{0}';".format(table))
            return result.fetchone()[0]
    return False


def get_table_names(gpkg):
    """
    Gets the list of the feature or tile data table names

    :param gpkg: Path to geopackage file.
    :return: List of user data table names in geopackage.
    """
    with sqlite3.connect(gpkg) as conn:
        result = conn.execute("SELECT table_name FROM gpkg_contents;")
    return [table for (table,) in result]


def get_tile_table_names(gpkg):
    """
    Gets the list of tile table names.

    :param gpkg: Path to geopackage file.
    :return: List of tile user data table names in geopackage.
    """
    with sqlite3.connect(gpkg) as conn:
        result = conn.execute("SELECT table_name FROM gpkg_contents WHERE data_type = 'tiles';")
        return [table for (table,) in result]


def get_zoom_levels_table(gpkg, table):
    """
    Inspects the tile user data table for unique zoom levels.
    :param gpkg: Path to geopackage
    :param table: A table name to return the zoom_levels which have data in the user table.
    :return: A list of zoom levels.
    """
    with sqlite3.connect(gpkg) as conn:
        if is_alnum(table):
            result = conn.execute("SELECT DISTINCT zoom_level FROM '{0}';".format(table))
            return [zoom_level for (zoom_level,) in result]
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
    with sqlite3.connect(gpkg) as conn:
        if is_alnum(table):
            conn.execute("DELETE FROM gpkg_tile_matrix "
                         "WHERE table_name = '{0}' AND zoom_level = '{1}';".format(table, zoom_level))
            return True
    return False


def get_tile_matrix_table_zoom_levels(gpkg, table_name):
    """
    Returns the zoom levels listed in the gpkg_tile_matrix for a specific table_name.

    :param gpkg: Path to geopackage file.
    :param table_name: Table to query zoom_levels for in the gpkg_tile_matrix.
    :return: List of zoom levels (i.e. [2,3,4,5]
    """
    with sqlite3.connect(gpkg) as conn:
        if is_alnum(table_name):
            result = conn.execute("SELECT zoom_level "
                                  "FROM gpkg_tile_matrix WHERE table_name = '{0}';".format(table_name))
            return [zoom_level for (zoom_level,) in result]
    return False


def check_content_exists(gpkg):
    """
    :param gpkg: Path to geopackage file.
    :return: True if there is a single raster tile or feature is found.
    """
    for table in get_table_names(gpkg):
        if get_table_count(gpkg, table) > 0:
            return True
    return False


def check_zoom_levels(gpkg):
    """
    Checks the zoom levels for the geopackage returns False if ANY gpkg_tile_matrix sets do no match the zoom levels
    of the user data tables.

    :param gpkg: Path to geopackage file.
    :return: True if the zoom levels in the data tables match the zoom levels in the gpkg_tile_matrix_table
    """
    for table in get_table_names(gpkg):
        if not get_tile_matrix_table_zoom_levels(gpkg, table) == get_zoom_levels_table(gpkg, table):
            return False
    return True

def get_table_info(gpkg, table):
    """
    Checks the zoom levels for the geopackage returns False if ANY gpkg_tile_matrix sets do no match the zoom levels
    of the user data tables.

    :param gpkg: Path to geopackage file.
    :return: The type of the first value in  if the zoom levels in the data tables match the zoom levels in the gpkg_tile_matrix_table
    """
    with sqlite3.connect(gpkg) as conn:
        logger.debug("PRAGMA table_info({0});".format(table))
        return conn.execute("PRAGMA table_info({0});".format(table))
    return False


def get_geometry_column(gpkg, table):
    """
    Attempts to get a geometry column from the table info (see get_table_info()), 
    otherwise returns the first column beginning with geom.

    :param gpkg: Path to geopackage file.
    :return: The type of the first value in  if the zoom levels in the data tables match the zoom levels in the gpkg_tile_matrix_table
    """
    with sqlite3.connect(gpkg) as conn:
        logger.debug("SELECT column_name FROM gpkg_geometry_columns WHERE table_name='{0}';".format(table))
        result = conn.execute("SELECT column_name FROM gpkg_geometry_columns WHERE table_name='{0}';".format(table))
        return result.fetchone()[0]
    return False


def add_geometry_column(gpkg, table, add_autoincrement=False):
    """
    Adds a geometry_column to the table in the gpkg provided.

    :param gpkg: Path to geopackage file.
    :return: None
    """
    geometry_column = get_geometry_column(gpkg, table)
    if not geometry_column:
        geometry_column = "geometry"
        if 'line' in table:
            geometry_type = "LINESTRING"
        if 'point' in table:
            geometry_type = "POINT"
        if 'poly' in table:
            geometry_type = "MULTIPOLYGON"
        with sqlite3.connect(gpkg) as conn:
            logger.debug("INSERT INTO gpkg_geometry_columns VALUES ({0}, {1}, {2}, 4326, 0, 0);".format(table, geometry_column, geometry_type))
            conn.execute("INSERT INTO gpkg_geometry_columns VALUES ({0}, {1}, {2}, 4326, 0, 0);".format(table, geometry_column, geometry_type))
    columns = []
    if add_autoincrement:
        columns += [('id', 'INTEGER PRIMARY KEY AUTOINCREMENT')]
    for (cid, name, type, notnull, dflt_value, pk) in get_table_info(gpkg, table):
        if name == geometry_column:
            type = "GEOMETRY"
        columns += [(name, type)]
    with sqlite3.connect(gpkg) as conn:
        logger.debug("ALTER TABLE {0} RENAME TO tmp;".format(table))
        conn.execute("ALTER TABLE {0} RENAME TO tmp;".format(table))
        logger.debug("CREATE TABLE {0} ({1}));".format(table, ','.join(["{0} {1}".format(column[0], column[1]) for column in columns])))
        conn.execute("CREATE TABLE {0} ({1}));".format(table, ','.join(["{0} {1}".format(column[0], column[1]) for column in columns])))
        logger.debug("INSERT INTO {0}({1}) SELECT {1} FROM tmp;".format(table, ','.join([column[0] for column in columns])))
        conn.execute("INSERT INTO {0}({1}) SELECT {1} FROM tmp;".format(table, ','.join([column[0] for column in columns])))
        logger.debug("DROP TABLE tmp")
        conn.execute("DROP TABLE tmp")


def check_autoincrement(gpkg, table):
    is_autoincrement = False
    columns = []
    for (cid, name, type, notnull, dflt_value, pk) in get_table_info(gpkg, table):
        columns += [name]
    with sqlite3.connect(gpkg) as conn:
        logger.debug("INSERT INTO {0} VALUES({1});".format(table, ','.join(columns)))
        conn.execute("INSERT INTO {0} VALUES({1});".format(table, ','.join(columns)))
        logger.debug("SELECT COUNT(*) FROM sqlite_sequence WHERE name='{0}';".format(table))
        result = conn.execute("SELECT COUNT(*) FROM sqlite_sequence WHERE name='{0}';".format(table))
        if result.fetchone()[0]:
            is_autoincrement = True
        logger.debug("DELETE FROM {0} WHERE {1};".format(table, ','.join(['{0} and {0}'.format(column) for column in columns])))
        conn.execute("DELETE FROM {0} WHERE {1};".format(table, ','.join(['{0} and {0}'.format(column) for column in columns])))
    return is_autoincrement


def repair_gpkg(gpkg):
    """
    Attempts to check and correct items that are not compliant with the OGC Geopackage Specification Version 1.

    :param gpkg: Path to geopackage file.
    :return: True if the geopackage is compliant, or False if a deficiency has been found and cannot be repaired.
    """
    tables = get_table_names(gpkg)
    for table in tables:
        if not table.startswith('gpkg_'):
            geometry_column = get_geometry_column(gpkg, table)
            valid_geometry_column = False
            for (cid, name, type, notnull, dflt_value, pk) in get_table_info(gpkg, table):
                if name == geometry_column and type == "GEOMETRY":
                    valid_geometry_column=True
            is_autoincrement = check_autoincrement(gpkg, table)
            if not valid_geometry_column or not is_autoincrement:
                add_geometry_column(gpkg, table, primary_key=(not is_autoincrement))
    return True


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
