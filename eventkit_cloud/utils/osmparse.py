# -*- coding: utf-8 -*-
import argparse
import logging
import os
import subprocess
from os.path import exists
from string import Template

from osgeo import gdal, ogr, osr

from eventkit_cloud.tasks.task_process import TaskProcess
from sqlite import execute_spatialite_script

logger = logging.getLogger(__name__)


class OSMParser(object):
    """
    Parse a OSM file (.osm or .pbf) dumped from overpass query.
    Creates an ouput spatialite file to be used in export pipeline.
    """

    def __init__(self, osm=None, gpkg=None, osmconf=None, debug=None, task_uid=None):
        """
        Initialize the OSMParser.

        Args:
            osm: the osm file to convert
            sqlite: the location of the sqlite output file.
            debug: turn on / off debug output.
        """
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.osm = osm
        if not exists(self.osm):
            raise IOError('Cannot find PBF data for this task.')
        self.gpkg = gpkg
        self.debug = debug
        self.task_uid = task_uid
        if osmconf:
            self.osmconf = osmconf
        else:
            self.osmconf = os.path.join(os.path.join(self.path, 'conf'), 'hotosm.ini')
            logger.debug('Found osmconf ini file at: {0}'.format(self.osmconf))
        """
        OGR Command to run.
        OSM_CONFIG_FILE determines which OSM keys should be translated into OGR layer fields.
        See osmconf.ini for details. See gdal config options at http://www.gdal.org/drv_osm.html
        """
        self.ogr_cmd = Template("""
            ogr2ogr -f GPKG $gpkg $osm \
            --config OSM_CONFIG_FILE $osmconf \
            --config OGR_INTERLEAVED_READING YES \
            --config OSM_MAX_TMPFILE_SIZE 100 -gt 65536
        """)

        # Enable GDAL/OGR exceptions
        gdal.UseExceptions()
        self.srs = osr.SpatialReference()
        self.srs.ImportFromEPSG(4326)  # configurable

    def create_geopackage(self,):
        """
        Create the spatialite file from the osm data.
        """
        ogr_cmd = self.ogr_cmd.safe_substitute({'gpkg': self.gpkg,
                                                'osm': self.osm, 'osmconf': self.osmconf})
        if (self.debug):
            print 'Running: %s' % ogr_cmd
        task_process = TaskProcess(task_uid=self.task_uid)
        task_process.start_process(ogr_cmd, shell=True, executable='/bin/bash',
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if task_process.exitcode != 0:
            logger.error('%s', task_process.stderr)
            raise Exception, "ogr2ogr process failed with returncode: {0}".format(task_process.exitcode)
        if (self.debug):
            print 'ogr2ogr returned: %s' % task_process.exitcode

    def create_default_schema_gpkg(self, user_details=None):
        """
        Create the default osm gpkg schema
        Creates planet_osm_point, planet_osm_line, planed_osm_polygon tables
        """
        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {'username': 'unknown-create_default_schema_gpkg'}

        assert exists(self.gpkg), "No geopackage file. Run 'create_gpkg()' method first."

        execute_spatialite_script(
            self.gpkg, os.path.join(self.path, 'sql', 'planet_osm_schema.sql'), user_details=user_details
        )
        execute_spatialite_script(
            self.gpkg, os.path.join(self.path, 'sql', 'spatial_index.sql'), user_details=user_details
        )

    def update_zindexes(self,):
        """
        Update the zindexes on sqlite layers.
        """
        assert exists(self.gpkg), "No geopackage file. Run 'create_geopackage()' method first."
        ds = ogr.Open(self.gpkg, update=True)
        zindexes = {
            3: ('path', 'track', 'footway', 'minor', 'road', 'service', 'unclassified', 'residential'),
            4: ('tertiary_link', 'tertiary'),
            6: ('secondary_link', 'secondary'),
            7: ('primary_link', 'primary'),
            8: ('trunk_link', 'trunk'),
            9: ('motorway_link', 'motorway')
        }
        layer_count = ds.GetLayerCount()
        assert layer_count == 3, """Incorrect number of layers found. Run 'create_default_schema()' method first."""
        for layer_idx in range(layer_count):
            layer = ds.GetLayerByIndex(layer_idx).GetName()
            try:
                # update highway z_indexes
                for key in zindexes.keys():
                    sql = 'UPDATE {0} SET z_index = {1} WHERE highway IN {2};'.format(layer, key, zindexes[key])
                    ds.ExecuteSQL(sql)
            except RuntimeError:
                pass
            try:
                # update railway z_indexes
                sql = "UPDATE {0} SET z_index = z_index + 5 WHERE railway <> ''".format(layer)
                ds.ExecuteSQL(sql)
            except RuntimeError:
                pass
            try:
                # update layer
                sql = "UPDATE {0} SET z_index = z_index + 10 * cast(layer as int) WHERE layer <> ''".format(layer)
                ds.ExecuteSQL(sql)
            except RuntimeError:
                pass
            try:
                # update bridge z_index
                sql = "UPDATE {0} SET z_index = z_index + 10 WHERE bridge IN ('yes', 'true', 1)".format(layer)
                ds.ExecuteSQL(sql)
            except RuntimeError:
                pass
            try:
                # update tunnel z_index
                sql = "UPDATE {0} SET z_index = z_index - 10 WHERE tunnel IN ('yes', 'true', 1)".format(layer)
                ds.ExecuteSQL(sql)
            except RuntimeError:
                pass

        # close connection
        ds.Destroy()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description=(
            'Converts OSM (xml|pbf) to GPKG. \n'
            'Updates schema to create planet_osm_* tables.\n'
            'Updates z_indexes on all layers.'
        )
    )
    parser.add_argument('-o', '--osm-file', required=True, dest="osm", help='The OSM file to convert (xml or pbf)')
    parser.add_argument('-f', '--geopackage-file', required=True, dest="gpkg", help='The sqlite output file')
    parser.add_argument('-q', '--schema-sql', required=False, dest="schema",
                        help='A sql file to refactor the output schema')
    parser.add_argument('-d', '--debug', action="store_true", help="Turn on debug output")
    args = parser.parse_args()
    config = {}
    for k, v in vars(args).items():
        if (v == None):
            continue
        else:
            config[k] = v
    osm = config.get('osm')
    gpkg = config.get('gpkg')
    debug = False
    if config.get('debug'):
        debug = True
    parser = OSMParser(osm=osm, gpkg=gpkg, debug=debug)
    parser.create_geopackage()
    user_details = {'username': 'unknown-osmparse__main__'}
    parser.create_default_schema_gpkg()
    parser.update_zindexes()
