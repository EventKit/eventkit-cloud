from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from mapproxy import grid as mapproxy_grid
from mapproxy import srs as mapproxy_srs

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.tasks.models import ExportTaskRecord
from eventkit_cloud.utils.client import parse_duration
from eventkit_cloud.utils.stats.geomutils import prefetch_geometry_cache, lookup_cache_geometry,\
    get_area_bbox, get_bbox_intersect

from threading import Lock
import logging
import datetime
import json
import math
import statistics

logger = logging.getLogger(__name__)
_dbg_geom_cache_misses = 0
MAX_SAMPLES_PER_TARGET = 2000
DEFAULT_CACHE_EXPIRATION = 86400  # expire in a day
COMPUTATION_LOCK = Lock()


def get_statistics(grouping='provider_name', force=False):
    """
    :param force: True to re-compute the desired statistics
    :param grouping: see group_providers_by
    :return: The statistics object
    """
    with COMPUTATION_LOCK:
        cache_key = "DATA_STATISTICS_BY_{}".format(grouping)
        if not force:
            stats = cache.get(cache_key)
            if stats:
                return json.loads(stats)

        # Order by time descending to ensure more recent samples are collected first
        etr = ExportTaskRecord.objects\
            .filter(result__isnull=False) \
            .order_by('-finished_at') \
            .select_related("result") \
            .all()

        grouper = group_providers_by(grouping)
        stats = compute_statistics(etr, grouper)
        cache.set(cache_key, json.dumps(stats), timeout=DEFAULT_CACHE_EXPIRATION)

    return stats


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
    :param grouping: Group by either 'provider_name' (e.g. OSM, ..) or 'provider_type' (osm, wms, wmts)
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


def compute_statistics(export_task_records, get_group, tile_grid=get_default_tile_grid(), filename=None):
    """
    :param export_task_records: ExporTaskRecords is a list of all export tasks
    :param get_group: Function to generate a group id given a DataExportProviderTask
    :param tile_grid: Calculate statistics for each tile in the tile grid
    :param filename: Serializes the intermediate data-sample data so it can be shared btw different deployments
    :return: A dict with statistics including area, duration, and package size per sq. kilometer
    """

    # Method to pull normalized data values off of the run, provider_task, or provider_task.task objects
    accessors = {
        # Get the size in MBs per unit area (valid for tasks objects)
        'size': lambda t, area_km: t.result.size / area_km,
        # Get the duration per unit area (valid for runs, provider_tasks, or tasks)
        'duration': lambda o, area_km: parse_duration(o.duration) / area_km,
        # Get the area from the run or use the parent's area
        'area': lambda o, area_km: area_km,
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
    default_stat = {'duration': [], 'area': [], 'size': [], 'mpp': []}

    logger.debug('Prefetching geometry data from all Jobs')
    prefetch_geometry_cache(geom_cache)

    logger.info('Beginning collection of statistics for %d ExportTaskRecords', total_count)
    for etr in export_task_records:
        if processed_count % 500 == 0:
            logger.debug('Processed %d of %d using %d completed', processed_count, total_count, export_task_count)
        processed_count += 1

        if etr.status != "SUCCESS" \
                or etr.export_provider_task.status != "COMPLETED" \
                or etr.export_provider_task.run.status != "COMPLETED" \
                or not is_valid_result(etr.result):
            continue

        export_task_count += 1

        dptr = etr.export_provider_task
        run = etr.export_provider_task.run

        gce = lookup_cache_geometry(run, geom_cache)
        area = gce['area']

        group_name = get_group(dptr)
        global_stats = get_child_entry(all_stats, 'GLOBAL', default_stat)
        group_stats = get_child_entry(all_stats, group_name, default_stat)
        task_stats = get_child_entry(group_stats, etr.name, default_stat)

        if has_tiles(etr.name):
            affected_tile_stats = get_tile_stats(group_stats, tile_grid, gce['bbox'], True, tid_cache, run.id)
        else:
            affected_tile_stats = []

        if run.id not in processed_runs:
            processed_runs[run.id] = True
            collect_samples(run, [global_stats], ['duration', 'area'], accessors, area)
        if dptr.id not in processed_dptr:
            processed_dptr[dptr.id] = True
            collect_samples(dptr, [group_stats], ['duration', 'area'], accessors, area)

        collect_samples(etr, affected_tile_stats + [task_stats], ['duration', 'area', 'size'], accessors, area)

        sz = accessors['size'](etr, area)
        group_stats['size'] += [sz]  # Roll-up into provider_task level
        global_stats['size'] += [sz]  # Roll-up into global level

        # Collect a sample of the megabytes per pixel
        if has_tiles(etr.name):
            try:
                provider = DataProvider.objects.get(name=dptr.name)
                mpp = compute_mpp(provider, gce['bbox'], etr.result.size)
                if len(group_stats['mpp']) < MAX_SAMPLES_PER_TARGET:
                    group_stats['mpp'] += [mpp]
                if len(global_stats['mpp']) < MAX_SAMPLES_PER_TARGET:
                    global_stats['mpp'] += [mpp]
                for ts in affected_tile_stats:
                    if len(ts['mpp']) < MAX_SAMPLES_PER_TARGET:
                        ts['mpp'] += [mpp]

            except ObjectDoesNotExist:
                pass

    logger.info('Computing statistics across %d completed ExportTaskRecords (geom_cache_misses=%d)',
                export_task_count, _dbg_geom_cache_misses)

    # TODO: Merge in any auxiliary sample data?

    if filename is not None:
        all_stats['timestamp'] = datetime.datetime.now()
        with open(filename, 'w') as os:
            json.dump(all_stats, os)

    totals = {
        'run_count': len(processed_runs),
        'data_provider_task_count': len(processed_dptr),
        'export_task_count': export_task_count
    }

    for group_name in all_stats:
        if group_name in ['timestamp']:
            continue

        totals[group_name] = get_summary_stats(all_stats[group_name], ('area', 'duration', 'size', 'mpp'))
        tile_count = 0

        for task_name in all_stats[group_name]:
            if task_name in ['duration', 'area', 'size', 'mpp']:
                # These are properties on the roll'ed up statistics
                continue
            elif task_name.startswith('tile_'):
                # Two-level map, index by y then x+z
                y_s = all_stats[group_name][task_name]
                total_ys = {}
                totals[group_name][task_name] = total_ys
                for xz_s in y_s:
                    total_ys[xz_s] = get_summary_stats(y_s[xz_s], ('area', 'duration', 'size', 'mpp'))
                    total_ys[xz_s]['tile_coord'] = y_s[xz_s]['tile_coord']
                    tile_count += 1
            else:
                totals[group_name][task_name] = get_summary_stats(all_stats[group_name][task_name],
                                                                  ('area', 'duration', 'size'))

        totals[group_name]['tile_count'] = tile_count
        logger.info('Generated statistics for %d tiles for group %s', tile_count, group_name)

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
        run_bbox = mapproxy_grid.grid_bbox(bbox, bbox_srs=mapproxy_srs.SRS(4326), srs=tile_grid.srs)
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
        default_val = {'duration': [], 'size': [], 'mpp': [], 'tile_coord': tile_coord} if create_if_absent else None
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


def compute_mpp(provider, bbox, size_mb, srs='4326', with_clipping=True):
    """
    Computes the megabytes per pixel within the specified bounding box
    :param provider: The DataProvider
    :param bbox: The bounding box defining the export region
    :param size_mb: The size of the export output in megabytes
    :param srs: The SRS of the bounding box
    :param with_clipping: When True tiles within the bbox will also have any pixels outside
                          the bbox excluded.  False will use all pixels from tiles that intersect the bbox
    :return: Megabytes per pixel
    """
    tile_grid = get_provider_grid(provider)
    return size_mb / get_total_num_pixels(tile_grid, bbox, srs, with_clipping)


def get_total_num_pixels(tile_grid, bbox, srs='4326', with_clipping=True):
    """
    Determine the number of pixels in the tile_grid (across all levels) that are within the specified bounding box
    :param tile_grid:
    :param bbox: The bounding box defining the export region
    :param srs: The SRS of the bounding box
    :param with_clipping: When True tiles within the bbox will also have any pixels outside
                          the bbox excluded.  False will use all pixels from tiles that intersect the bbox
    :return: Total number of pixels
    """
    grid_bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(srs), tile_grid.srs)

    # Determine all affected tiles across all provider levels
    total_pixels = 0
    px_per_tile = tile_grid.tile_size[0] * tile_grid.tile_size[1]

    for lvl in range(0, tile_grid.levels):
        result = tile_grid.get_affected_level_tiles(grid_bbox, int(lvl))
        tile_coords = result[2]

        if with_clipping:
            # Determine number of pixels contained in the bbox ONLY
            for tile_coord in tile_coords:
                tile_bbox = tile_grid.tile_bbox(tile_coord, True)
                i = get_bbox_intersect(grid_bbox, tile_bbox)

                # Assume uniform spacing of pixels in the tile
                tile_num_px = (get_area_bbox(i) / get_area_bbox(tile_bbox)) * px_per_tile
                total_pixels += tile_num_px
        else:
            num_tiles = result[1][0]*result[1][1]  # xdim * ydim
            total_pixels += px_per_tile * num_tiles

    return total_pixels


def get_summary_stats(input_item, fields):
    """
    Computes all statistics at a particular granularity defined by the input_item across each
    of the fields of interest (e.g. 'areas', 'times', 'sizes').  input_item could represent
    all samples from 'osm' providers, or all 'runs', or all tasks at a particular tile in a tile grid
    :param input_item: The item containing arrays holding all data samples
    :param fields: The list of fields of interest, input_item should contain a list of samples for each field
    :return: Object holding the computed statistics for each field
    """
    target = {}

    def compute_stats_for(field):
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

            target[field] = st

    for fld in fields:
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


def get_provider_grid(provider):
    """
    :param provider: The DataProvider
    :return: The tile grid used by the DataProvider
    """
    # TODO: Pull this provider's grid out of it's config
    levels = list(range(provider.level_from, provider.level_to + 1))
    tmp = mapproxy_grid.tile_grid_for_epsg('EPSG:4326')
    res = list(map(lambda l: tmp.resolution(l), levels))

    return mapproxy_grid.tile_grid_for_epsg('EPSG:4326', tile_size=(256, 256), res=res)


def query(group_name, field, statistic_name, bbox, bbox_srs, gap_fill_thresh=0.1, default_value=None,
          custom_stats=None, grouping='provider_name'):
    """
    Finds the highest resolution of the requested statistic:
        1. Within group and bbox region (leveraging tile grid)
        2. Within group
        3. Global
        4. Default value

    :param group_name: Must match grouping semantics (e.g. grouping='provider_type' then group_name in wms, osm, ...)
    :param field: The field to query (e.g. size, mpp, duration)
    :param statistic_name: The name of the statistic (e.g. mean, ci_90, ..)
    :param bbox: The bounding box defining the region to estimate
    :param bbox_srs: The srs of bbox
    :param gap_fill_thresh: If bbox has less that this % overlap with tile-level statistics then fill-gaps using group
                            level or global level size/sq.km, otherwise gap-fill using the mean of observed tile-level
                            stats
    :param default_value: A default value to return if no statistics exist
    :param custom_stats: Use custom statistics dictionary rather than cached (see get_statistics or compute_statistics)
    :param grouping: iff custom_stats is None, defines which stat grouping to use (must match group_name semantics)
    :return: (Highest resolution of statistic, object w/ metadata about how it was generated incl. resolution)
    """
    if custom_stats is not None:
        all_stats = custom_stats
    else:
        all_stats = get_statistics(grouping=grouping)

    method = {
        'stat': statistic_name,
    }

    def get_single_value(o):
        fld = o.get(field)
        if fld:
            return fld.get(statistic_name)

    def get_upper_ci_value(o):
        fld = o.get(field)
        if fld and fld.get(statistic_name):  # Can be missing (e.g. 1 data sample)
            return fld[statistic_name][1]  # Get the upper bound

    get_value = get_upper_ci_value if statistic_name.startswith('ci_') else get_single_value
    stat_value = None

    if all_stats:
        group_stats = all_stats.get(group_name)
        if group_stats:
            # TODO tile_grid params should be serialized on all_stats object
            # We have some statistics specific to this group (e.g. osm, wms, etc)
            tile_grid = get_default_tile_grid()
            req_bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(bbox_srs), tile_grid.srs)
            req_area = get_area_bbox(req_bbox)

            affected_tiles = get_tile_stats(group_stats, tile_grid, req_bbox)

            if affected_tiles and len(affected_tiles) > 0:
                # We have some stats specific to this group, at tiles within the user-defined region
                # We want to weight tile-specific statistics based on its % overlap with the bbox
                # (e.g. tile1 accounts for 50% of bbox area, its stats should be weighted at 50%
                total_weight = 0
                values = []
                stat_value = 0

                for tile_stat in affected_tiles:
                    t_val = get_value(tile_stat)
                    if t_val is not None:
                        tile_coord = tile_stat['tile_coord']
                        inter = get_bbox_intersect(req_bbox, tile_grid.tile_bbox(tile_coord, True))
                        weight = get_area_bbox(inter) / req_area

                        stat_value += weight * t_val
                        values += [t_val]
                        total_weight += weight

                if total_weight > 1.0:
                    # Shouldn't happen since tile-grid is disjoint...
                    stat_value /= total_weight
                elif total_weight < gap_fill_thresh:
                    # If the overlap was very minor than gap fill using the group-wide stats
                    stat_value += (1.0 - total_weight) * get_value(group_stats)
                else:
                    # Otherwise, gap fill using the average from the tiles we did see
                    stat_value += (1.0 - total_weight) * statistics.mean(values)

                if total_weight > 0:
                    method['group'] = '{}_tiles'.format(group_name)
                    method['tiles'] = {
                        'count': len(affected_tiles),
                        'total_weight': 100 * total_weight,
                        'gap_fill': group_name if total_weight < gap_fill_thresh else 'tile_mean'
                    }
                else:
                    # It's possible that none of the tiles had the stat we were looking for in which case gap_fill
                    # is essentially the same as using the group-level statistic
                    method['group'] = group_name
            else:
                # No overlapping tiles, use group specific stats
                method['group'] = group_name
                stat_value = get_value(group_stats)
        elif 'GLOBAL' in all_stats:
            # No group-specific data, use statistics computed across all groups (i.e. every completed job)
            method['group'] = 'GLOBAL'
            stat_value = get_value(all_stats['GLOBAL'])

    if stat_value is None:
        # No statistics... use default
        method['group'] = 'None'
        stat_value = default_value

    return stat_value, method


def is_valid_result(result):
    # TODO: Determine if there was actually data in this result (e.g. crack open the gpkg
    # and see if tiles are sensical)
    return True
