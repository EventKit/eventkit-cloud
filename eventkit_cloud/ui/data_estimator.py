from django.core.exceptions import ObjectDoesNotExist
from mapproxy import grid as mapproxy_grid
from mapproxy import srs as mapproxy_srs

import math
import statistics
import time
import datetime
import json

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.tasks.models import ExportTaskRecord
import eventkit_cloud.ui.statistics_gen as ek_stats


def get_size_estimate(provider, bbox, srs='3857'):
    """
    Args:
        provider: The name of the provider, corresponds to the name field in Export Provider model
        bbox: A bbox in the format of an array
        srs: An EPSG code for the map being used.

    Returns: Estimated size in MB
    """
    try:
        provider = DataProvider.objects.select_related("export_provider_type").get(name=provider)
    except ObjectDoesNotExist:
        raise ValueError("Provider name '{}' is not valid".format(provider))

    if is_raster_tile_grid(provider):
        return get_raster_tile_grid_size_estimate(provider, bbox, srs)
    elif is_raster_single(provider):
        return get_raster_tile_grid_size_estimate(provider, bbox, srs)
    elif is_vector(provider):
        return ek_stats.estimate_size(bbox, provider.export_provider_type.type_name, 'provider_type')
    else:
        # TODO Do we want to just use global stats or avoid making estimate all together?
        return ek_stats.estimate_size(bbox, 'GLOBAL', 'provider_type')


def is_raster_tile_grid(provider):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports a tilegrid of raster data
    """
    type_name = provider.export_provider_type.type_name
    return type_name == 'wms' or type_name == 'wmts' or type_name == 'tms'


def is_raster_single(provider):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports a single raster file
    """
    type_name = provider.export_provider_type.type_name
    return type_name == 'wcs'


def is_vector(provider):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports vector data (usually as geopackage)
    """
    type_name = provider.export_provider_type.type_name
    return type_name == 'osm-generic' or type_name == 'osm' or type_name == 'wfs'


def get_raster_tile_grid_size_estimate(provider, bbox, srs='3857'):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports vector data (usually as geopackage)
    """
    levels = list(range(provider.level_from, provider.level_to+1))
    req_srs = mapproxy_srs.SRS(srs)
    bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(4326), req_srs)

    tile_size = (256, 256)
    tile_grid = mapproxy_grid.TileGrid(srs, tile_size=tile_size, levels=len(levels))
    total_tiles = 0
    tiles = []
    for level in levels:
        # get_affected_level_tiles() returns a list with three
        # things: first a tuple with the bounding box, second
        # the height and width in tiles, and third a list of tile
        # coordinate tuples. result[1] gives the tuple with
        # the width/height of the desired set of tiles.
        result = tile_grid.get_affected_level_tiles(bbox, int(level))
        total_tiles += result[1][0] * result[1][1]
        tiles.append(result[1][0] * result[1][1])
    return [total_tiles, get_raster_gb_estimate(total_tiles), tiles]


def get_raster_gb_estimate(total_tiles, tile_width=256, tile_height=256):
    """
    :param total_tiles: total number of affected tiles
    :param tile_width: Width of a single tile in pixels
    :param tile_height: Height of a single tile in pixels
    :return: Estimated size of the resulting export in GBs
    """
    # the literal number there is the average pixels/GB ratio for tiles.
    return total_tiles*tile_width*tile_height*estimate_gigs_per_pixel()


def estimate_gigs_per_pixel():
    return 0.0000000006


def compute_estimator_error(task_limit=None, filename=None):
    # Loop through every job and compute the error of the estimate against the actual
    os = None
    geom_cache = {}
    ek_stats.prefetch_geometry_cache(geom_cache)

    records = ExportTaskRecord.objects\
        .filter(result__isnull=False, status='SUCCESS') \
        .select_related("result", "export_provider_task__run") \
        .all()

    if task_limit is not None:
        records = records[:task_limit]

    try:
        if filename:
            os = open(filename, 'w')
            os.write("area(sq.km), size(mb), estimate(mb), error(mb), error(%), stat, group, description\n")

        processed_count = 0
        total_count = records.count()

        raw_diffs = []
        perc_diffs = []
        is_lt = 0
        est_time = 0

        for etr in records:
            if processed_count % 100 == 0:
                print('[{} - Processed {} of {} completed]'.format(datetime.datetime.now(), processed_count, total_count))
            processed_count += 1

            try:
                if not ek_stats.has_tiles(etr.name):
                    continue

                dptr = etr.export_provider_task
                run = dptr.run
                bbox = geom_cache[run.id]['bbox']

                start_time = time.time()
                estimate, method = get_size_estimate(dptr.name, bbox)
                est_time += (time.time() - start_time)

                actual = etr.result.size
            except ValueError:
                continue

            if os:
                os.write("{}, {}, {}, {}, {}, {}, {}, \"{}\", \"{}\"\n".format(ek_stats.get_area_bbox(bbox), actual,
                                                    estimate, abs(estimate - actual), 100*abs(estimate-actual)/actual,
                                                    method['stat'], method['group'], method['tiles'],
                                                    json.dumps(bbox)))

            raw_diffs += [actual - estimate]
            perc_diffs += [abs(actual - estimate)/actual]

            if estimate < actual:
                is_lt += 1
    finally:
        if os:
            os.close()

    sse = sum(map(lambda e: math.pow(e, 2), raw_diffs))
    return {
        'sum_squared_error': sse,
        'mean_squared_error': sse/len(raw_diffs),
        'mean_percentage_error': 100*sum(perc_diffs)/len(perc_diffs),
        'mean_absolute_error': statistics.mean((map(lambda e: abs(e), raw_diffs))),
        'percent_less_than': 100*is_lt/len(raw_diffs),  # % of estimates that were smaller than actual
        "total_time": est_time,
        "time_per_estimate": est_time / len(raw_diffs)
    }


def perf_benchmark(num_iters=500, seed=None):
    import time
    import random

    random.seed(seed)

    # Make sure stats are there, we want to benchmark only live estimation
    ek_stats.get_statistics('provider_type', False)

    start = time.time()
    for i in range(0, num_iters):
        width = random.random() * .01
        height = random.random() * .01

        w = random.random() * 340.0 - 170.0
        s = random.random() * 160.0 - 80.0

        get_size_estimate('OpenStreetMap Data (Themes)', [w, s, w + width, s + height])

    end = time.time()
    return {
        "total_time": end - start,
        "time_per_estimate": (end - start) / num_iters
    }
