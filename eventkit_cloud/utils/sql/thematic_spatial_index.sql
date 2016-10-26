SELECT gpkgAddSpatialIndex('amenities_all_points', 'geom');
SELECT gpkgAddSpatialIndex('amenities_all_polygons', 'geom');
SELECT gpkgAddSpatialIndex('health_schools_polygons', 'geom');
SELECT gpkgAddSpatialIndex('airports_all_points', 'geom');
SELECT gpkgAddSpatialIndex('airports_all_polygons', 'geom');
SELECT gpkgAddSpatialIndex('villages_points', 'geom');
SELECT gpkgAddSpatialIndex('buildings_polygons', 'geom');
SELECT gpkgAddSpatialIndex('natural_polygons', 'geom');
SELECT gpkgAddSpatialIndex('natural_lines', 'geom');
SELECT gpkgAddSpatialIndex('landuse_other_polygons', 'geom');
SELECT gpkgAddSpatialIndex('landuse_residential_polygons', 'geom');
SELECT gpkgAddSpatialIndex('roads_paths_lines', 'geom');
SELECT gpkgAddSpatialIndex('waterways_lines', 'geom');
SELECT gpkgAddSpatialIndex('towers_antennas_points', 'geom');
SELECT gpkgAddSpatialIndex('harbours_points', 'geom');
SELECT gpkgAddSpatialIndex('grassy_fields_polygons', 'geom');

SELECT DiscardGeometryColumn('planet_osm_point','geom');
SELECT DiscardGeometryColumn('planet_osm_line','geom');
SELECT DiscardGeometryColumn('planet_osm_polygon','geom');

DROP TABLE rtree_planet_osm_point_geom;
DROP TABLE rtree_planet_osm_line_geom;
DROP TABLE rtree_planet_osm_polygon_geom;

DROP TABLE planet_osm_point;
DROP TABLE planet_osm_line;
DROP TABLE planet_osm_polygon;