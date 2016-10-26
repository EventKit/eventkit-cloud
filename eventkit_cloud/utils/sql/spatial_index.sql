SELECT gpkgAddSpatialIndex('planet_osm_point', 'geom');
SELECT gpkgAddSpatialIndex('planet_osm_line', 'geom');
SELECT gpkgAddSpatialIndex('planet_osm_polygon', 'geom');

DROP TABLE rtree_lines_geom;
DROP TABLE rtree_multilinestrings_geom;
DROP TABLE rtree_multipolygons_geom;
DROP TABLE rtree_other_relations_geom;
DROP TABLE rtree_points_geom;


