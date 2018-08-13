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

    def convert(self,):
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


def add_geojson_to_geopackage(geojson=None, gpkg=None, layer_name=None, task_uid=None, user_details=None):
    """Uses an ogr2ogr script to upload a geojson file.
        Args:
            geojson: A geojson string.
            gpkg: Database dict from the django settings.
            layer_name: A DB table.
            task_uid: A task uid to update.
        Returns:
            True if the file is successfully uploaded.
        """
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-add_geojson_to_geopackage'}

    if not geojson or not gpkg:
        raise Exception(
            "A valid geojson: {0} was not provided\nor a geopackage: {1} was not accessible.".format(geojson, gpkg))

    geojson_file = os.path.join(os.path.dirname(gpkg),
                                "{0}.geojson".format(os.path.splitext(os.path.basename(gpkg))[0]))

    from audit_logging.file_logging import logging_open
    with logging_open(geojson_file, 'w', user_details=user_details) as open_file:
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
    """Uses an ogr2ogr and/or gdalwarp script to clip a geopackage.
        Args:
            geojson_file: A geojson file to serve as a cutline.
            gpkg: Geopackage to clip.
            task_uid: A task uid to update.
        Returns:
            True if the file is successfully clipped.
        """

    if not geojson_file or not gpkg:
        raise Exception("A geojson_file: {0} \nor a geopackage: {1} was not accessible.".format(geojson_file, gpkg))

    # set cmd to gdalwarp if tiled gpkg, otherwise ogr2ogr
    if get_tile_table_names(gpkg):
        cmd = Template("gdalwarp -cutline $geojson_file -crop_to_cutline -dstalpha $in_gpkg $out_gpkg")
    else:
        cmd = Template("ogr2ogr -f GPKG -clipsrc $geojson_file $out_gpkg $in_gpkg")

    in_gpkg = os.path.join(os.path.dirname(gpkg), "old_{0}".format(os.path.basename(gpkg)))
    os.rename(gpkg, in_gpkg)

    append_cmd = cmd.safe_substitute({'geojson_file': geojson_file,
                                      'in_gpkg': in_gpkg,
                                      'out_gpkg': gpkg})

    logger.info(append_cmd)
    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(append_cmd, shell=True, executable='/bin/bash',
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("{} process failed with returncode: {0}".format(append_cmd.split()[0], task_process.exitcode))
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


def get_table_gpkg_contents_information(gpkg, table_name):
    """
    
    :param gpkg: Path to geopackage file.
    :param table_name: A table name to look up in gpkg_contents.
    :return: A dict with the column names as the keys.
    """
    with sqlite3.connect(gpkg) as conn:
        result = conn.execute(
            "SELECT table_name, data_type, identifier, description, last_change, min_x, min_y, max_x, max_y, srs_id FROM gpkg_contents WHERE table_name = '{0}';".format(
                table_name))
        table_information = result.fetchone()
        return {"table_name": table_information[0],
                "data_type": table_information[1],
                "identifier": table_information[2],
                "description": table_information[3],
                "last_change": table_information[4],
                "min_x": table_information[5],
                "min_y": table_information[6],
                "max_x": table_information[7],
                "max_y": table_information[8],
                "srs_id": table_information[9]}


def set_gpkg_contents_bounds(gpkg, table_name, bbox):
    """

    :param gpkg: Path to geopackage file.
    :param table_name: A table name to set the bounds.
    :param bbox: An iterable with doubles representing the bounds [w,s,e,n]
    :return: A dict with the column names as the key.
    """
    with sqlite3.connect(gpkg) as conn:
        if not conn.execute(
            "UPDATE gpkg_contents SET min_x = {0}, min_y = {1}, max_x = {2}, max_y = {3} WHERE table_name = '{4}';".format(
                bbox[0], bbox[1], bbox[2], bbox[3], table_name)).rowcount:
            raise Exception("Unable to set bounds for {1} in {2}".format(table_name, gpkg))


def get_table_tile_matrix_information(gpkg, table_name):
    with sqlite3.connect(gpkg) as conn:
        result = conn.execute(
            "SELECT table_name, zoom_level, matrix_width, matrix_height, tile_width, tile_height, pixel_x_size, pixel_y_size FROM gpkg_tile_matrix WHERE table_name = '{0}' ORDER BY zoom_level;".format(
                table_name))
        tile_matrix_information = []
        for table_information in result:
            tile_matrix_information += [{"table_name": table_information[0],
                                         "zoom_level": table_information[1],
                                         "matrix_width": table_information[2],
                                         "matrix_height": table_information[3],
                                         "tile_width": table_information[4],
                                         "tile_height": table_information[5],
                                         "pixel_x_size": table_information[6],
                                         "pixel_y_size": table_information[7]}]
    return tile_matrix_information


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
            if conn.execute("DELETE FROM gpkg_tile_matrix "
                         "WHERE table_name = '{0}' AND zoom_level = '{1}';".format(table, zoom_level)).rowcount:
                return True
        raise Exception("Unable to remove zoom level {0} for {1} from {2}".format(zoom_level, table, gpkg))


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


def create_table_from_existing(gpkg, old_table, new_table):
    """
    Creates a new gpkg table, from an existing table.  This assumed the original table is from a gpkg and as such has a primary key column.
    
    :param gpkg: 
    :param old_table: 
    :param new_table: 
    :return: 
    """
    columns = [('id', 'INTEGER PRIMARY KEY AUTOINCREMENT')]
    for (cid, name, type, notnull, dflt_value, pk) in get_table_info(gpkg, old_table):
        if pk:
            columns = [(name, 'INTEGER PRIMARY KEY AUTOINCREMENT')]
        else:
            columns += [(name, type)]
    with sqlite3.connect(gpkg) as conn:
        logger.debug("CREATE TABLE {0} ({1});".format(new_table, ','.join(
            ["{0} {1}".format(column[0], column[1]) for column in columns])))
        conn.execute("CREATE TABLE {0} ({1});".format(new_table, ','.join(
            ["{0} {1}".format(column[0], column[1]) for column in columns])))


def create_metadata_tables(gpkg):
    """
    Creates tables needed to add metadata.

    :param gpkg: A geopackage to create the metadata tables.
    :return:
    """
    create_extension_table(gpkg)
    commands = [
        """
        CREATE TABLE IF NOT EXISTS gpkg_metadata (
          id INTEGER CONSTRAINT m_pk PRIMARY KEY ASC NOT NULL,
          md_scope TEXT NOT NULL DEFAULT 'dataset',
          md_standard_uri TEXT NOT NULL,
          mime_type TEXT NOT NULL DEFAULT 'text/xml',
          metadata TEXT NOT NULL DEFAULT ''
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS gpkg_metadata_reference (
          reference_scope TEXT NOT NULL,
          table_name TEXT,
          column_name TEXT,
          row_id_value INTEGER,
          timestamp DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          md_file_id INTEGER NOT NULL,
          md_parent_id INTEGER,
          CONSTRAINT crmr_mfi_fk FOREIGN KEY (md_file_id) REFERENCES gpkg_metadata(id),
          CONSTRAINT crmr_mpi_fk FOREIGN KEY (md_parent_id) REFERENCES gpkg_metadata(id)
        );
        """,
        """
        INSERT OR IGNORE INTO gpkg_extensions(table_name, column_name, extension_name, definition, scope)
            VALUES (NULL, NULL, "gpkg_metadata", "http://www.geopackage.org/spec/#extension_metadata", "read-write");
        """
    ]
    with sqlite3.connect(gpkg) as conn:
        for command in commands:
            logger.debug(command)
            conn.execute(command)


def create_extension_table(gpkg):
    """

    :param gpkg: A geopackage to create the gpkg_extensions table.
    :return:
    """
    command = """
CREATE TABLE IF NOT EXISTS gpkg_extensions (
  table_name TEXT,
  column_name TEXT,
  extension_name TEXT NOT NULL,
  definition TEXT NOT NULL,
  scope TEXT NOT NULL,
  CONSTRAINT ge_tce UNIQUE (table_name, column_name, extension_name)
);
"""

    with sqlite3.connect(gpkg) as conn:
        logger.debug(command)
        conn.execute(command)


def add_file_metadata(gpkg, metadata):
    """
    :param gpkg: A geopackage to add metadata.
    :param metadata: The xml metadata to add as a string.
    :return:
    """
    create_metadata_tables(gpkg)

    with sqlite3.connect(gpkg) as conn:
        command = "INSERT OR IGNORE INTO gpkg_metadata (md_scope, md_standard_uri, mime_type, metadata)" \
                  "VALUES ('dataset', 'http://schemas.opengis.net/iso/19139/20070417/resources/Codelist/gmxCodelists.xml#MD_ScopeCode', 'text/xml', ?);"
        logger.debug(command)
        conn.execute(command, (metadata,))

        command = """
INSERT OR IGNORE INTO gpkg_metadata_reference (reference_scope, table_name, column_name, row_id_value, timestamp, md_file_id, md_parent_id)
VALUES ('geopackage', NULL, NULL, NULL, strftime('%Y-%m-%dT%H:%M:%fZ','now'), 1, null);
                 """
        logger.debug(command)
        conn.execute(command)


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
