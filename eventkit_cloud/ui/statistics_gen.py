from eventkit_cloud.utils.client import parse_duration, convert_seconds_to_hms
from mapproxy import grid as mapproxy_grid
from django.core.cache import cache
from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.tasks.models import ExportTaskRecord, ExportRun

import datetime
import json
import math
import statistics

_dbg_geom_cache_misses = 0
MAX_SAMPLES_PER_TARGET = 2000
DEFAULT_CACHE_EXPIRATION = 86400  # expire in a day


def get_statistics(grouping='provider_name', force=False):
    """
    :param force: True to re-compute the desired statistics
    :param grouping: see group_providers_by
    :return: The statistics object
    """
    cache_key = "DATA_STATISTICS_BY_{}".format(grouping)
    if not force:
        stats = cache.get(cache_key)
        if stats:
            return json.loads(stats)

    etr = ExportTaskRecord.objects\
        .filter(result__isnull=False) \
        .select_related("result") \
        .all()

    grouper = group_providers_by(grouping)
    stats = compute_statistics(etr, grouper)
    cache.set(cache_key, json.dumps(stats), timeout=DEFAULT_CACHE_EXPIRATION)
    return stats


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


def get_area_geojson(geojson):
    """
    Given a GeoJSON string or object, return an approximation of its geodesic area in km².

    The geometry must contain a single polygon with a single ring, no holes.
    Based on Chamberlain and Duquette's algorithm: https://trs.jpl.nasa.gov/bitstream/handle/2014/41271/07-0286.pdf
    :param geojson: GeoJSON selection area
    :return: area of geojson ring in square kilometers
    """
    earth_r = 6371  # km

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


def get_default_tile_grid(level=10):
    """
    A geodetic grid for EPSG:4326 containing only the specified tile level
    :param level: The desired level for the tiling grid
    :return:
    """
    tmp = mapproxy_grid.tile_grid_for_epsg('EPSG:4326')
    res = tmp.resolution(level)

    return mapproxy_grid.tile_grid_for_epsg('EPSG:4326', res=[res])


def group_providers_by(grouping='provider_name'):
    """
    :param grouping: Group by either 'provider_name' (e.g. OSM, NOME, ..) or 'provider_type' (osm, wms, wmts)
    :return: A function used to determine a group id given a DataProviderExportTask
    """
    providers = DataProvider.objects.all().values()
    if grouping == 'provider_name':
        def grp_by_name(t):
            return t.name
        get_group = grp_by_name
    elif grouping == 'provider_type':
        providers_name_idx = {}
        for provider in providers:
            providers_name_idx[provider.get('name')] = provider

        def grp_by_type(t):
            p = providers_name_idx.get(t.name)
            if p:
                return p.get('slug')

            return 'unknown_provider'

        get_group = grp_by_type
    else:
        raise ValueError('Invalid value for "grouping" parameter')

    return get_group


def has_tiles(export_task_record_name):
    """
    Some output types are spatially invariant and it is a waste to try and build per-tile statistics for them. Also
    the Project File will contain a copy of each export format which could grossly over estimate data in a region
    (i.e. a job may export gpkg and shapefile so the project.zip will contain 2x copies of the data)
    :param export_task_record_name: The name of the ExportTaskRecord
    :return: True if the result of this task should be included in per-tile statistics
    """
    return export_task_record_name not in ['Area of Interest (.geojson)', 'Project File (.zip)']


def compute_statistics(export_task_records, get_group, tile_grid=get_default_tile_grid()):
    """
    :param export_task_records: ExporTaskRecords is a list of all export tasks
    :param get_group: Function to generate a group id given a DataExportProviderTask
    :param tile_grid: Calculate statistics for each tile in the tile grid
    :return: A dict with statistics including area, duration, and package size per sq. kilometer
    """

    # Method to pull normalized data values off of the run, provider_task, or provider_task.task objects
    accessors = {
        # Get the size in GBs per unit area (valid for tasks objects)
        'size': lambda t, area_km: t.result.size / area_km,
        # Get the duration per unit area (valid for runs, provider_tasks, or tasks)
        'duration': lambda o, area_km: parse_duration(o.duration) / area_km,
        # Get the area from the run or use the parent's area
        'area': lambda o, area_km: area_km
    }

    # TODO: Better way for select distinct on etr??
    processed_runs = {}
    processed_dptr = {}
    tid_cache = {}
    geom_cache = {}
    export_task_count = 0
    processed_count = 0
    total_count = export_task_records.count()
    all_stats = {}
    default_stats = {'duration': [], 'area': [], 'size': []}

    print('[{}] - Prefetching geometry data from all Jobs'.format(datetime.datetime.now()))
    prefetch_geometry_cache(geom_cache)

    print('[{}] - Beginning collection of statistics for {} ExportTaskRecords'.format(datetime.datetime.now(),
                                                                                      total_count))
    for etr in export_task_records:
        if processed_count % 100 == 0:
            print('[{} - Processed {} of {} using {} completed]'.format(datetime.datetime.now(), processed_count,
                                                                        total_count, export_task_count))
        processed_count += 1

        if etr.status != "SUCCESS" \
                or etr.export_provider_task.status != "COMPLETED" \
                or etr.export_provider_task.run.status != "COMPLETED":
            continue

        export_task_count += 1

        dptr = etr.export_provider_task
        run = etr.export_provider_task.run

        gce = lookup_cache_geometry(run, geom_cache)
        area = gce['area']

        group_name = get_group(dptr)
        run_stats = get_child_entry(all_stats, 'GLOBAL', default_stats)
        group_stats = get_child_entry(all_stats, group_name, default_stats)
        task_stats = get_child_entry(group_stats, etr.name, default_stats)

        if has_tiles(etr.name):
            affected_tile_stats = get_tile_stats(group_stats, tile_grid, gce['bbox'], True, tid_cache, run.id)
        else:
            affected_tile_stats = []

        if run.id not in processed_runs:
            processed_runs[run.id] = True
            collect_samples(run, [run_stats], ['duration', 'area'], accessors, area)
        if dptr.id not in processed_dptr:
            processed_dptr[dptr.id] = True
            collect_samples(dptr, [group_stats], ['duration', 'area'], accessors, area)

        collect_samples(etr, affected_tile_stats + [task_stats], ['duration', 'area', 'size'], accessors, area)
        group_stats['size'] += [accessors['size'](etr, area)]  # Roll-up into provider_task level
        run_stats['size'] += [accessors['size'](etr, area)]  # Roll-up into global level

    print('[{}] - Computing statistics across {} completed ExportTaskRecords (geom_cache_misses={})'
          .format(datetime.datetime.now(), export_task_count, _dbg_geom_cache_misses))
    totals = {
        'run_count': len(processed_runs),
        'data_provider_task_count': len(processed_dptr),
        'export_task_count': export_task_count
    }

    for group_name in all_stats:
        totals[group_name] = get_summary_stats(all_stats[group_name])
        tile_count = 0

        for task_name in all_stats[group_name]:
            if task_name in ['duration', 'area', 'size']:
                # These are properties on the roll'ed up statistics
                continue
            elif task_name.startswith('tile_'):
                # Two-level map, index by y then x+z
                y_s = all_stats[group_name][task_name]
                total_ys = {}
                totals[group_name][task_name] = total_ys
                for xz_s in y_s:
                    total_ys[xz_s] = get_summary_stats(y_s[xz_s])
                    total_ys[xz_s]['tile_coord'] = y_s[xz_s]['tile_coord']
                    tile_count += 1
            else:
                totals[group_name][task_name] = get_summary_stats(all_stats[group_name][task_name])

        totals[group_name]['tile_count'] = tile_count
        print('Generated statistics for {} tiles for group {}'.format(tile_count, group_name))

    return totals


def get_child_entry(parent, key, default=None):
    """
    Helper method for accessing an element in a dictionary that optionally inserts missing elements
    :param parent: The dictionary to search
    :param key: The lookup key
    :param default: A default value if key is missing on parent, if default is None missing elements are not filled
    :return:
    """
    if key not in parent:
        if default is not None:
            parent[key] = default.copy()
        else:
            return None

    return parent[key]


def get_tile_stats(parent, tile_grid, bbox, create_if_absent=False, tid_cache=None, cid=None):
    """
    Intersects the bbox with the tile grid, returning all of the corresponding objects that hold
    data samples for those tiles

    :param parent: Parent dictionary
    :param tile_grid: The tile grid defining per-tile statistics to generate
    :param bbox: Query bounding box
    :param create_if_absent: True if objects should be created if not-currently there
    :param tid_cache: Optional cache storing results of bbox query on grid
    :param cid: Optional id used to access/store results of bbox query on grid, tid_cache MUST be provided when used
    :return: The list of objects intersecting the bbox, or an empty array
    """
    if cid and cid in tid_cache:
        tile_coords = tid_cache[cid]
    else:
        # Not in cache, or not using cache, compute intersection
        run_bbox = mapproxy_grid.grid_bbox(bbox, bbox_srs=None, srs=None)
        affected_tiles = tile_grid.get_affected_level_tiles(run_bbox, tile_grid.levels - 1)  # Use highest res grid

        tile_coords = []
        for tile_coord in affected_tiles[2]:
            tile_coords += [tile_coord]

        if cid:
            tid_cache[cid] = tile_coords

    tile_stats = list(map(lambda t: get_tile_stat(parent, t, create_if_absent), tile_coords))
    if create_if_absent:
        return tile_stats  # We won't have None entries
    else:
        return [x for x in tile_stats if x is not None]


def get_tile_stat(parent, tile_coord, create_if_absent=False):
    """
    :param parent: Parent dictionary
    :param tile_coord: (x, y, z) of the desired tile
    :param create_if_absent: True if objects should be created if not-currently there
    :return: Corresponding object holding data stats of the requested tile
    """
    x, y, z = tile_coord

    y_id = "tile_{}".format(y)
    y_s = get_child_entry(parent, y_id, {} if create_if_absent else None)
    xz_s = None

    if y_id in parent:
        # Currently we only cache 1 z-level so we will only use 2-level map not 3...
        default_val = {'duration': [], 'size': [], 'tile_coord': tile_coord} if create_if_absent else None
        xz_s = get_child_entry(y_s, "{}_{}".format(x, z), default_val)

    return xz_s


def collect_samples(item, targets, fields, accessors, area):
    """
    Appends data points to the list of samples on each target object
    :param item: Item containing a single data point for each field in fields
    :param targets: List of objects collecting the data points
    :param fields: List of fields to collect
    :param accessors: Dictionary of access method applied to item to generate a data point
    :param area: The area in sq. km used for normalizing data points (e.g. size per sq km)
    """
    for i in range(0, len(fields)):
        # Get the value for this field
        field = fields[i]
        sample = accessors[field](item, area)

        if sample:
            # Append to to each target that is interested in that value
            for target in targets:
                if field in target and len(target[field]) < MAX_SAMPLES_PER_TARGET:
                    target[field] += [sample]


def get_summary_stats(input_item, fields=('area', 'duration', 'size')):
    """
    Computes all statistics at a particular granularity defined by the input_item across each
    of the fields of interest (e.g. 'areas', 'times', 'sizes').  input_item could represent
    all samples from 'osm' providers, or all 'runs', or all tasks at a particular tile in a tile grid
    :param input_item: The item containing arrays holding all data samples
    :param fields: The list of fields of interest, input_item should contain a list of samples for each field
    :return: Object holding the computed statistics for each field
    """
    target = {}

    def compute_stats_for(field, conv=None):
        # Computes basic statistics for a single field (e.g. 'sizes')
        value_list = input_item.get(field)
        if value_list and len(value_list) > 0:
            st = dict()
            st['mean'] = statistics.mean(value_list)
            st['min'] = min(value_list)
            st['max'] = max(value_list)
            st['count'] = len(value_list)

            if len(value_list) >= 2:
                st['variance'] = statistics.variance(value_list, st['mean'])
                st['ci_90'] = get_confidence_interval(st['mean'], math.sqrt(st['variance']), st['count'], 1.645)
                st['ci_95'] = get_confidence_interval(st['mean'], math.sqrt(st['variance']), st['count'], 1.960)
                st['ci_99'] = get_confidence_interval(st['mean'], math.sqrt(st['variance']), st['count'], 2.580)

            if conv:
                st['mean'] = conv(st['mean']) if st['mean'] else None
                st['min'] = conv(st['min']) if st['min'] else None
                st['max'] = conv(st['max']) if st['max'] else None

                if len(value_list) >= 2:
                    st['variance'] = conv(st['variance']) if st['variance'] else None
                    st['ci_90'] = [conv(st['ci_90'][0]), conv(st['ci_90'][1])] if st['ci_90'] else None
                    st['ci_95'] = [conv(st['ci_95'][0]), conv(st['ci_95'][1])] if st['ci_95'] else None
                    st['ci_99'] = [conv(st['ci_99'][0]), conv(st['ci_99'][1])] if st['ci_99'] else None

            target[field] = st

    for fld in fields:
        if fld == 'duration':
            # Hack.. need to convert in this case
            compute_stats_for(fld, convert_seconds_to_hms)
        else:
            compute_stats_for(fld)

    return target


def get_confidence_interval(mean, std_dev, sample_size, ci=1.96):
    """
    Computes the confidence interval assuming a normal distribution of the data
    :param mean: The sample mean
    :param std_dev: The standard deviation (ideally population - otherwise sample std.dev)
    :param sample_size: The number of samples used to estimate mean and std_dev
    :param ci: The z-* multiplier for the desired confidence interval (e.g. 1.96 = 95% CI)
    :return: [lower_bound, upper_bound] of the specified confidence interval
    """
    error_margin = ci * (std_dev / math.sqrt(sample_size))
    return [mean - error_margin, mean + error_margin]


def estimate_size(bbox, group_name, grouping='provider_name', tile_grid=get_default_tile_grid(), gap_fill_thresh=0.1):
    all_stats = get_statistics(grouping=grouping)
    req_area = get_area_bbox(bbox)
    method = {
        'stat': 'ci_99',
    }

    # We'll use the upper bound of the 99% confidence interval... can change this based on desired risk profile
    # (i.e. overall accuracy vs. not under-estimating)
    def get_sz_per_km(o):
        if 'ci_99' in o['size']:  # Can missing if for instance only 1 data point was found at o's granularity
            return o['size']['ci_99'][1]
        # return o['size']['max']

    if all_stats:
        group_stats = all_stats.get(group_name)
        if group_stats:
            # We have some statistics specific to this group (e.g. osm, wms, etc)
            affected_tiles = get_tile_stats(group_stats, tile_grid, bbox)

            if affected_tiles and len(affected_tiles) > 0:
                # We have some stats specific to this group, at tiles within the user-defined region
                # We want to weight tile-specific statistics based on its % overlap with the bbox
                # (e.g. tile1 accounts for 50% of bbox area, its stats should be weighted at 50%
                total_weight = 0
                sizes = []
                sz_per_km = 0

                for tile_stat in affected_tiles:
                    # TODO: Is this intersect going to be too expensive?
                    t_sz = get_sz_per_km(tile_stat)
                    if t_sz is not None:
                        tile_coord = tile_stat['tile_coord']
                        inter = get_bbox_intersect(bbox, tile_grid.tile_bbox(tile_coord))
                        weight = get_area_bbox(inter) / req_area

                        sz_per_km += weight * t_sz
                        sizes += [t_sz]
                        total_weight += weight

                if total_weight > 1.0:
                    # Shouldn't happen since tile-grid is disjoint...
                    sz_per_km /= total_weight
                elif total_weight < gap_fill_thresh:
                    # If the overlap was very minor than gap fill using the group-wide stats
                    sz_per_km += (1.0 - total_weight) * get_sz_per_km(group_stats)
                else:
                    # Otherwise, gap fill using the average from the tiles we did see
                    sz_per_km += (1.0 - total_weight) * statistics.mean(sizes)

                method['group'] = '{}_tiles'.format(group_name)
                method['tiles'] = {
                    'count': len(affected_tiles),
                    'total_weight': 100 * total_weight,
                    'gap_fill': group_name if total_weight < gap_fill_thresh else 'tile_mean'
                }
            else:
                # No overlapping tiles, use group specific stats
                method['group'] = group_name
                sz_per_km = get_sz_per_km(group_stats)
        else:
            # No group-specific data, use statistics computed across all groups (i.e. every completed job)
            method['group'] = 'GLOBAL'
            sz_per_km = get_sz_per_km(all_stats['GLOBAL'])
    else:
        # No statistics? Oh boy, /random?
        method['group'] = 'None'
        sz_per_km = 0

    # Compute estimate
    return req_area * (sz_per_km if sz_per_km is not None else 0.0), method
