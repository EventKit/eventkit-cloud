from mapproxy import grid as mapproxy_grid
from eventkit_cloud.tasks.models import ExportRun

import json
import math


_dbg_geom_cache_misses = 0


def _create_cache_geom_entry(job):
    """
    Constructs a geometry cache entry
    :param job: job contains the geometry
    """
    orm_geom = job.the_geom
    geojson = json.loads(orm_geom.json)
    bbox = orm_geom.extent

    cache_entry = {
        'bbox': bbox,
        'bbox_area': get_area_bbox(bbox),
        'geometry': geojson,
        'area': get_area_geojson(geojson)
    }
    return cache_entry


def lookup_cache_geometry(run, geom_cache):
    """
    Cache area information to avoid repeated and expensive database lookups to Job when requesting
    area for ExportTasks, DataProviderTasks, or ExportRuns
    :param run: A run
    :param geom_cache: Object holding cached values, lookup by run.id
    :return:
    """
    cache_entry = geom_cache.get(run.id)
    if not cache_entry:
        global _dbg_geom_cache_misses
        _dbg_geom_cache_misses += 1

        # Important that we only touch 'job' on cache miss
        cache_entry = _create_cache_geom_entry(run.job)
        geom_cache[run.id] = cache_entry

    return cache_entry


def get_area_geojson(geojson, earth_r=6371):
    """
    Given a GeoJSON string or object, return an approximation of its geodesic area in km².

    The geometry must contain a single polygon with a single ring, no holes.
    Based on Chamberlain and Duquette's algorithm: https://trs.jpl.nasa.gov/bitstream/handle/2014/41271/07-0286.pdf
    :param geojson: GeoJSON selection area
    :param earth_r: Earth radius in km
    :return: area of geojson ring in square kilometers
    """
    def rad(d):
        return math.pi*d/180

    if isinstance(geojson, str):
        geojson = json.loads(geojson)

    if hasattr(geojson, 'geometry'):
        geojson = geojson['geometry']

    geom_type = geojson['type'].lower()
    if geom_type == 'polygon':
        polys = [geojson['coordinates']]
    elif geom_type == 'multipolygon':
        polys = geojson['coordinates']
    else:
        return RuntimeError("Invalid geometry type: %s" % geom_type)

    a = 0
    for poly in polys:
        ring = poly[0]
        if len(ring) < 4:
            continue
        ring.append(ring[-2])  # convenient for circular indexing
        for i in range(len(ring) - 2):
            a += (rad(ring[i+1][0]) - rad(ring[i-1][0])) * math.sin(rad(ring[i][1]))

    area = abs(a * (earth_r**2) / 2)
    return area


def get_area_bbox(bbox):
    """
    :param bbox: bounding box tuple (w, s, e, n)
    :return: The area of the bounding box
    """
    w, s, e, n = bbox
    return get_area_geojson({
        'type': 'Polygon',
        'coordinates': [[
            [w, s],
            [e, s],
            [e, n],
            [w, n],
            [w, s]
        ]]
    })


def get_bbox_intersect(one, two):
    """
    Finds the intersection of two bounding boxes in the same SRS
    :param one: The first bbox tuple (w, s, e, n)
    :param two: The second bbox tuple (w, s, e, n)
    :return: A bounding box tuple where one and two overlap, or None if there is no overlap
    """
    a_x0, a_y0, a_x1, a_y1 = one
    b_x0, b_y0, b_x1, b_y1 = two

    if mapproxy_grid.bbox_intersects(one, two):
        return max(a_x0, b_x0), max(a_y0, b_y0), min(a_x1, b_x1), min(a_y1, b_y1)
    else:
        return None


def prefetch_geometry_cache(geom_cache):
    """
    Populates geom_cache with all geometries information from all Jobs indexed by ExportRun.id
    :param geom_cache:
    """
    for er in ExportRun.objects.select_related("job").only("id", "job__the_geom").all():
        geom_cache[er.id] = _create_cache_geom_entry(er.job)
