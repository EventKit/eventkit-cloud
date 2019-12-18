"""
arcgis2geojson is a derivative work of ESRI's arcgis-to-geojson-utils:
https://github.com/Esri/arcgis-to-geojson-utils/
Original code is Copyright 2015 by Esri and was licensed under
the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
Ported to Python in 2016 by Chris Shaw.
Updated in 2019 by EventKit Contributors.

arcgis2geojson is made available under the MIT License.

The MIT Licence (MIT)

Original work Copyright (c) 2015 Esri
Modifications Copyright (c) 2016 Christopher Shaw
Modifications Copyright (c) 2019 EventKit Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
"""

import logging
import numbers


def points_equal(a, b):
    """
    checks if 2 [x, y] points are equal
    """
    for i in range(0, len(a)):
        if a[i] != b[i]:
            return False
    return True


def close_ring(coordinates):
    """
    checks if the first and last points of a ring are equal and closes the ring
    """
    if not points_equal(coordinates[0], coordinates[len(coordinates) - 1]):
        coordinates.append(coordinates[0])
    return coordinates


def ring_is_clockwise(ring):
    """
    determine if polygon ring coordinates are clockwise. clockwise signifies
    outer ring, counter-clockwise an inner ring or hole.
    """

    total = 0
    i = 0
    r_length = len(ring)
    pt1 = ring[i]
    for i in range(0, r_length - 1):
        pt2 = ring[i + 1]
        total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1])
        pt1 = pt2

    return total >= 0


def vertex_intersects_vertex(a1, a2, b1, b2):
    ua_t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0])
    ub_t = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0])
    u_b = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1])

    if u_b != 0:
        ua = ua_t / u_b
        ub = ub_t / u_b

        if 0 <= ua <= 1 and 0 <= ub <= 1:
            return True

    return False


def array_intersects_array(a, b):
    for i in range(0, len(a) - 1):
        for j in range(0, len(b) - 1):
            if vertex_intersects_vertex(a[i], a[i + 1], b[j], b[j + 1]):
                return True
    return False


def coordinates_contain_point(coordinates, point):
    contains = False
    coordinates_length = len(coordinates)
    i = -1
    j = coordinates_length - 1
    while (i + 1) < coordinates_length:
        i = i + 1
        ci = coordinates[i]
        cj = coordinates[j]
        if ((ci[1] <= point[1] < cj[1]) or (cj[1] <= point[1] < ci[1])) and (
            point[0] < (cj[0] - ci[0]) * (point[1] - ci[1]) / (cj[1] - ci[1]) + ci[0]
        ):
            contains = not contains
        j = i
    return contains


def coordinates_contain_coordinates(outer, inner):
    intersects = array_intersects_array(outer, inner)
    contains = coordinates_contain_point(outer, inner[0])
    if not intersects and contains:
        return True
    return False


def convert_rings_to_geojson(rings):
    """
    do any polygons in this array contain any other polygons in this array?
    used for checking for holes in arcgis rings
    """

    outer_rings = []
    holes = []

    # for each ring
    for r in range(0, len(rings)):
        ring = close_ring(rings[r])
        if len(ring) < 4:
            continue

        # is this ring an outer ring? is it clockwise?
        if ring_is_clockwise(ring):
            polygon = [ring[::-1]]
            outer_rings.append(polygon)  # wind outer rings counterclockwise for RFC 7946 compliance
        else:
            holes.append(ring[::-1])  # wind inner rings clockwise for RFC 7946 compliance

    uncontained_holes = []

    # while there are holes left...
    while len(holes):
        # pop a hole off out stack
        hole = holes.pop()

        # loop over all outer rings and see if they contain our hole.
        contained = False
        x = len(outer_rings) - 1
        while x >= 0:
            outer_ring = outer_rings[x][0]
            if coordinates_contain_coordinates(outer_ring, hole):
                # the hole is contained push it into our polygon
                outer_rings[x].append(hole)
                contained = True
                break
            x = x - 1

        # ring is not contained in any outer ring
        # sometimes this happens https://github.com/Esri/esri-leaflet/issues/320
        if not contained:
            uncontained_holes.append(hole)

    # if we couldn't match any holes using contains we can try intersects...
    while len(uncontained_holes):
        # pop a hole off out stack
        hole = uncontained_holes.pop()

        # loop over all outer rings and see if any intersect our hole.
        intersects = False
        x = len(outer_rings) - 1
        while x >= 0:
            outer_ring = outer_rings[x][0]
            if array_intersects_array(outer_ring, hole):
                # the hole is contained push it into our polygon
                outer_rings[x].append(hole)
                intersects = True
                break
            x = x - 1

        if not intersects:
            outer_rings.append([hole[::-1]])

    if len(outer_rings) == 1:
        return {"type": "Polygon", "coordinates": outer_rings[0]}
    else:
        return {"type": "MultiPolygon", "coordinates": outer_rings}


def get_id(attributes, id_attribute=None):
    keys = [id_attribute, "OBJECTID", "FID"] if id_attribute else ["OBJECTID", "FID"]
    for key in keys:
        if key in attributes and (isinstance(attributes[key], numbers.Number) or isinstance(attributes[key], str)):
            return attributes[key]
    raise KeyError("No valid id attribute found")


def convert(arcgis):
    """
    Convert an ArcGIS JSON object to a GeoJSON object
    """

    geojson = {}

    for iterable_name in ["features", "results"]:
        if iterable_name in arcgis and arcgis[iterable_name]:
            geojson["type"] = "FeatureCollection"
            geojson["features"] = []
            for feature in arcgis[iterable_name]:
                geojson["features"].append(convert_feature(feature))
    return geojson


def convert_feature(esri_feature):
    # Keywords are items that relate to the geometry or other information that we don't want to preserve,
    # as a geojson property
    # Attributes is added to "ignore" because they get added explicitly.
    # Fields and fieldAliases provides schema information about the attributes and won't neatly fit into geojson.
    keywords = ["geometry", "geometryType", "attributes", "fields", "fieldAliases"]

    feature = {}

    if "geometry" in esri_feature or "attributes" in esri_feature:
        feature["type"] = "Feature"
        if "geometry" in esri_feature:
            feature["geometry"] = convert_geometry(esri_feature["geometry"])
        else:
            feature["geometry"] = None

        if "attributes" in esri_feature:
            feature["properties"] = esri_feature["attributes"]
            try:
                feature["id"] = get_id(esri_feature["attributes"])
            except KeyError:
                # don't set an id
                pass

    # RFC 7946 3.2
    if "geometry" in feature and not (feature["geometry"]):
        feature["geometry"] = None

    # RFC 7946 4
    if (
        "spatialReference" in esri_feature
        and "wkid" in esri_feature["spatialReference"]
        and esri_feature["spatialReference"]["wkid"] != 4326
    ):
        logging.warning("Object converted in non-standard crs - " + str(esri_feature["spatialReference"]))

    # RFC 7946 3.2
    if not feature.get("properies"):
        feature["properties"] = dict()

    # Copy everything else.
    for field, value in esri_feature.items():
        if field not in keywords:
            feature["properties"][field] = value

    return feature


def convert_geometry(esri_geometry):
    geometry = {}

    if (
        "x" in esri_geometry
        and isinstance(esri_geometry["x"], numbers.Number)
        and "y" in esri_geometry
        and isinstance(esri_geometry["y"], numbers.Number)
    ):
        geometry["type"] = "Point"
        geometry["coordinates"] = [esri_geometry["x"], esri_geometry["y"]]
        if "z" in esri_geometry and isinstance(esri_geometry["z"], numbers.Number):
            geometry["coordinates"].append(esri_geometry["z"])

    if "points" in esri_geometry:
        geometry["type"] = "MultiPoint"
        geometry["coordinates"] = esri_geometry["points"]

    if "paths" in esri_geometry:
        if len(esri_geometry["paths"]) == 1:
            geometry["type"] = "LineString"
            geometry["coordinates"] = esri_geometry["paths"][0]
        else:
            geometry["type"] = "MultiLineString"
            geometry["coordinates"] = esri_geometry["paths"]

    if "rings" in esri_geometry:
        geometry = convert_rings_to_geojson(esri_geometry["rings"])

    if (
        "xmin" in esri_geometry
        and isinstance(esri_geometry["xmin"], numbers.Number)
        and "ymin" in esri_geometry
        and isinstance(esri_geometry["ymin"], numbers.Number)
        and "xmax" in esri_geometry
        and isinstance(esri_geometry["xmax"], numbers.Number)
        and "ymax" in esri_geometry
        and isinstance(esri_geometry["ymax"], numbers.Number)
    ):
        geometry["type"] = "Polygon"
        geometry["coordinates"] = [
            [
                [esri_geometry["xmax"], esri_geometry["ymax"]],
                [esri_geometry["xmin"], esri_geometry["ymax"]],
                [esri_geometry["xmin"], esri_geometry["ymin"]],
                [esri_geometry["xmax"], esri_geometry["ymin"]],
                [esri_geometry["xmax"], esri_geometry["ymax"]],
            ]
        ]
    return geometry
