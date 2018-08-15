# -*- coding: utf-8 -*-
from __future__ import with_statement

import logging
import os
import shutil
from string import Template

from pysqlite2 import dbapi2 as sqlite3

from eventkit_cloud.utils.geopackage import create_table_from_existing
from eventkit_cloud.utils.sqlite import enable_spatialite
from sqlite import execute_spatialite_script

logger = logging.getLogger(__name__)


class ThematicGPKG(object):
    """
    Thin wrapper around ogr2ogr to convert sqlite to shp using thematic layers.
    """

    def __init__(self, gpkg=None, stage_dir=None, tags=None, job_name=None, debug=False, task_uid=None):
        """
        Initialize the ThematicGPKG utility.

        Args:
            gpkg: the gpkg file to convert
            tags: the selected tags for this export
            job_name: the name of the export job
            debug: turn on/off debug logging output.
        """
        self.gpkg = gpkg
        self.tags = tags
        self.job_name = job_name
        if not os.path.exists(self.gpkg):
            raise IOError('Cannot find gpkg file for this task.')
        self.debug = debug
        # create thematic gpkg file
        self.stage_dir = stage_dir
        self.thematic_gpkg = os.path.join(self.stage_dir, '{0}.gpkg'.format(self.job_name))
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.task_uid = task_uid

        # think more about how to generate this more flexibly, eg. using admin / db / settings?
        self.thematic_spec = {
            'amenities_all_points': {'type': 'point', 'key': 'amenity', 'table': 'planet_osm_point',
                                     'select_clause': 'amenity is not null'},
            'amenities_all_polygons': {'type': 'polygon', 'key': 'amenity', 'table': 'planet_osm_polygon',
                                       'select_clause': 'amenity is not null'},
            'health_schools_points': {'type': 'point', 'key': 'amenity', 'table': 'planet_osm_point',
                                      'select_clause': 'amenity="clinic" OR amenity="hospital" OR amenity="school" OR amenity="pharmacy"'},
            'health_schools_polygons': {'key': 'amenity', 'table': 'planet_osm_polygon',
                                        'select_clause': 'amenity="clinic" OR amenity="hospital" OR amenity="school" OR amenity="pharmacy"'},
            'aviation_all_points': {'key': 'aeroway', 'table': 'planet_osm_point',
                                    'select_clause': 'aeroway is not null'},
            'aviation_all_polygons': {'key': 'aeroway', 'table': 'planet_osm_polygon',
                                      'select_clause': 'aeroway is not null'},
            'aviation_all_lines': {'key': 'aeroway', 'table': 'planet_osm_line',
                                      'select_clause': 'aeroway is not null'},
            'places_points': {'key': 'place', 'table': 'planet_osm_point', 'select_clause': 'place is not null'},
            'buildings_polygons': {'key': 'building', 'table': 'planet_osm_polygon',
                                   'select_clause': 'building is not null'},
            'natural_polygons': {'key': 'natural', 'table': 'planet_osm_polygon',
                                 'select_clause': 'natural is not null'},
            'natural_lines': {'key': 'natural', 'table': 'planet_osm_line', 'select_clause': 'natural is not null'},
            'landuse_other_polygons': {'key': 'landuse', 'table': 'planet_osm_polygon',
                                       'select_clause': '(landuse is not null AND landuse!="residential") OR (leisure is not null and building is null)'},
            'landuse_residential_polygons': {'key': 'landuse', 'table': 'planet_osm_polygon',
                                             'select_clause': 'landuse is not null AND landuse="residential"'},
            'roads_paths_lines': {'key': 'highway', 'table': 'planet_osm_line', 'select_clause': 'highway is not null'},
            'railway_lines': {'key': 'railway', 'table': 'planet_osm_line', 'select_clause': 'railway is not null'},
            'waterways_lines': {'key': 'waterway', 'table': 'planet_osm_line', 'select_clause': 'waterway is not null'},
            'towers_antennas_points': {'key': 'man_made', 'table': 'planet_osm_point',
                                       'select_clause': 'man_made="antenna" OR man_made="mast" OR man_made="tower"'},
            'harbours_points': {'key': 'harbour', 'table': 'planet_osm_point', 'select_clause': 'harbour is not null'},
            'grassy_fields_polygons': {'key': 'leisure', 'table': 'planet_osm_polygon',
                                       'select_clause': 'leisure="pitch" OR leisure="common" OR leisure="golf_course"'},
            'bridges_lines': {'key': 'bridge', 'table': 'planet_osm_line', 'select_clause': 'bridge is not null'},
        }

    def convert(self, user_details=None):
        """
        Generate the thematic schema.

        Iterates through the thematic_spec, checks the 'key' entry in the spec against
        the exports tags. Dynamically constructs sql statements to generate to
        generate the thematic layers based on the exports categoried_tags.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {'username': 'unknown-ThematicGPKG.convert'}

        # setup sqlite connection
        valid_layers = []
        shutil.copy(self.gpkg, self.thematic_gpkg)
        assert os.path.exists(self.thematic_gpkg), 'Thematic gpkg file not found.'
        conn = sqlite3.connect(self.thematic_gpkg)
        # load spatialite extension
        enable_spatialite(conn)
        # get info for gpkg_contents
        try:
            cmd = "SELECT * FROM gpkg_contents LIMIT 1;"
            with conn:
                select = conn.execute(cmd)
            insert_data = select.fetchone()
        except sqlite3.OperationalError:
            logger.error('Could not find entry in gpkg contents table')
            raise
        geom_types = {'points': 'POINT', 'lines': 'LINESTRING', 'polygons': 'MULTIPOLYGON'}
        # create and execute thematic sql statements
        for layer, spec in self.thematic_spec.iteritems():
            layer_type = layer.split('_')[-1]
            isPoly = layer_type == 'polygons'
            osm_way_id = ''
            # check if the thematic tag is in the jobs tags, if not skip this thematic layer
            if not spec['key'] in self.tags[layer_type]:
                continue
            else:
                valid_layers.append(layer)
            if isPoly:
                osm_way_id = 'osm_way_id,'

            """
            Construct the parameters for the thematic sql statement.
            Pull out the tags from self.tags according to their geometry type.
            See jobs.models.Job.categorised_tags property.
            """
            sql = ""
            params = {'tablename': layer, 'osm_way_id': osm_way_id,
                      'planet_table': spec['table'], 'select_clause': spec['select_clause']}

            create_table_from_existing(self.thematic_gpkg, spec['table'], layer)

            sql_tmpl = Template('INSERT INTO $tablename SELECT * '
                                'FROM $planet_table WHERE $select_clause')
            sql = sql_tmpl.safe_substitute(params)
            try:
                with conn:
                    conn.execute(sql)
            except Exception as e:
                logger.error("SQL Execute for: {}, has failed.".format(sql))
                raise e
            geom_type = geom_types[layer_type]

            insert_contents_temp = Template(
                "INSERT INTO gpkg_contents VALUES ('$table_name', 'features', '$identifier', '', '$last_change', '$min_x', '$min_y', '$max_x', '$max_y', '$srs');")
            insert_geom_temp = Template(
                "INSERT INTO gpkg_geometry_columns VALUES ('$table_name', 'geom', '$geom_type', '$srs', '0', '0');")
            try:
                with conn:
                    insert_contents_cmd = insert_contents_temp.safe_substitute(
                        {'table_name': layer, 'identifier': layer, 'last_change': insert_data[4], 'min_x': insert_data[5],
                         'min_y': insert_data[6], 'max_x': insert_data[7], 'max_y': insert_data[8], 'srs': insert_data[9]})
                    conn.execute(insert_contents_cmd)
                    insert_geom_cmd = insert_geom_temp.safe_substitute(
                        {'table_name': layer, 'geom_type': geom_type, 'srs': insert_data[9]})
                    conn.execute(insert_geom_cmd)
            except Exception as e:
                logger.error("GPKG Contents Insert failed for {}".format(layer))
                raise e
        with conn:
            conn.execute("DELETE FROM gpkg_contents WHERE table_name='planet_osm_point'")
            conn.execute("DELETE FROM gpkg_contents WHERE table_name='planet_osm_line'")
            conn.execute("DELETE FROM gpkg_contents WHERE table_name='planet_osm_polygon'")

            conn.execute("DELETE FROM gpkg_geometry_columns WHERE table_name='planet_osm_point'")
            conn.execute("DELETE FROM gpkg_geometry_columns WHERE table_name='planet_osm_line'")
            conn.execute("DELETE FROM gpkg_geometry_columns WHERE table_name='planet_osm_polygon'")

            # drop existing spatial indexes
            conn.execute('DROP TABLE rtree_planet_osm_point_geom')
            conn.execute('DROP TABLE rtree_planet_osm_line_geom')
            conn.execute('DROP TABLE rtree_planet_osm_polygon_geom')

            conn.execute("DELETE FROM gpkg_extensions WHERE table_name='planet_osm_point'")
            conn.execute("DELETE FROM gpkg_extensions WHERE table_name='planet_osm_line'")
            conn.execute("DELETE FROM gpkg_extensions WHERE table_name='planet_osm_polygon'")

            # drop default schema tables
            conn.execute('DROP TABLE planet_osm_point')
            conn.execute('DROP TABLE planet_osm_line')
            conn.execute('DROP TABLE planet_osm_polygon')

        thematic_spatial_index_file = os.path.join(self.stage_dir, 'thematic_spatial_index.sql')

        from audit_logging.file_logging import logging_open
        with logging_open(thematic_spatial_index_file, 'w+', user_details=user_details) as sql_file:
            convert_to_cmd_temp = Template("UPDATE '$layer' SET geom=GeomFromGPB(geom);\n")
            index_cmd_temp = Template("SELECT gpkgAddSpatialIndex('$layer', 'geom');\n")
            convert_from_cmd_temp = Template("UPDATE '$layer' SET geom=AsGPB(geom);\n")
            for layer in valid_layers:
                convert_to_cmd = convert_to_cmd_temp.safe_substitute({'layer': layer})
                index_cmd = index_cmd_temp.safe_substitute({'layer': layer})
                convert_from_cmd = convert_from_cmd_temp.safe_substitute({'layer': layer})
                sql_file.write(convert_to_cmd)
                sql_file.write(index_cmd)
                sql_file.write(convert_from_cmd)

        # self.update_index = Template("spatialite $gpkg < $update_sql")
        # index_cmd = self.update_index.safe_substitute({'gpkg': self.thematic_gpkg,
        #                                                'update_sql': thematic_spatial_index_file})
        execute_spatialite_script(self.thematic_gpkg, thematic_spatial_index_file)
        if self.debug:
            print 'Running: %s' % sql
        # task_process = TaskProcess(task_uid=self.task_uid)
        # task_process.start_process(index_cmd, shell=True, executable='/bin/bash',
        #                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # if task_process.exitcode != 0:
        # if self.debug:
        #     print 'spatialite returned: %s' % task_process.exitcode
        os.remove(thematic_spatial_index_file)

        return self.thematic_gpkg
