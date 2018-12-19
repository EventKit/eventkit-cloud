from django.core.exceptions import ObjectDoesNotExist
from mapproxy import grid as mapproxy_grid
from mapproxy import srs as mapproxy_srs

import logging

from eventkit_cloud.jobs.models import DataProvider
import eventkit_cloud.utils.stats.generator as ek_stats

logger = logging.getLogger(__name__)


def get_size_estimate_slug(slug, bbox, srs='4326'):
    """
    See get_size_estimate
    :param slug: slug of the DataProvider
    :param bbox
    :param srs
    """
    try:
        provider = DataProvider.objects.select_related("export_provider_type").get(slug=slug)
    except ObjectDoesNotExist:
        raise ValueError("Provider slug '{}' is not valid".format(slug))

    return get_size_estimate(provider, bbox, srs)


def get_size_estimate_name(provider_name, bbox, srs='4326'):
    """
    See get_size_estimate
    :param provider_name: Name of the DataProvider
    :param bbox
    :param srs
    """
    try:
        provider = DataProvider.objects.select_related("export_provider_type").get(name=provider_name)
    except ObjectDoesNotExist:
        raise ValueError("Provider name '{}' is not valid".format(provider_name))

    return get_size_estimate(provider, bbox, srs)


def get_size_estimate(provider, bbox, srs='4326'):
    """
    The estimate size of a data export from provider over the specified region, in MBs
    :param provider: DataProvider
    :param bbox: Bounding box defining the area to estimate
    :param srs: The srs of the bounding box
    :return: (estimate_size_mb, metadata)
    """
    if is_raster_tile_grid(provider):
        # return get_raster_tile_grid_size_estimate(provider, bbox, srs)
        return estimate_size(bbox, provider.export_provider_type.type_name, 'provider_type', bbox_srs=srs)
    elif is_raster_single(provider):
        return get_raster_tile_grid_size_estimate(provider, bbox, srs)
    elif is_vector(provider):
        return estimate_size(bbox, provider.export_provider_type.type_name, 'provider_type', bbox_srs=srs)
    else:
        # Might have statistics on this type, or it will revert to GLOBAL
        return estimate_size(bbox, provider.export_provider_type.type_name, 'provider_type', bbox_srs=srs)


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


def get_raster_tile_grid_size_estimate(provider, bbox, srs='4326', with_clipping=False):
    """
    :param provider: The DataProvider to test
    :return: True if the DataProvider exports vector data (usually as geopackage)
    """
    tile_grid = ek_stats.get_provider_grid(provider)
    total_pixels = ek_stats.get_total_num_pixels(tile_grid, bbox, srs, with_clipping)
    return get_raster_mb_estimate(total_pixels, provider)


def get_raster_mb_estimate(total_pixels, provider=None):
    """
    :param total_pixels: The total number of pixels in all of the images in the dataset
    :param provider:
    :return: (estimate in mbs, object w/ metadata about how it was generated)
    """
    all_stats = ek_stats.get_statistics(grouping='provider_name')
    mpp = 0.00000006  # Default value

    method = {
        'stat': 'mean'
    }

    if all_stats:
        group_stats = all_stats.get(provider.name)
        if group_stats and 'mpp' in group_stats:
            method['group'] = provider.name
            mpp = group_stats['mpp']['mean']
        else:
            method['group'] = 'GLOBAL'
            mpp = all_stats['GLOBAL']['mpp']['mean']
    else:
        method['group'] = 'None'

    method['mpp'] = mpp
    return total_pixels * mpp, method


def estimate_size(bbox, group_name, grouping='provider_name', gap_fill_thresh=0.1, bbox_srs='4326'):
    """
    Estimates the size of a data export based off of the mb/sq.km statistics of past exports

    :param bbox: Bounding box of export
    :param group_name: Name of the group
    :param grouping: Method of grouping (e.g. provider_type, provider_name)
    :param gap_fill_thresh: If bbox has less that this % overlap with tile-level statistics then fill-gaps using group
                            level or global level size/sq.km, otherwise gap-fill using the mean of observed tile-level
                            stats
    :param bbox_srs: SRS of bounding box
    :return:
    """
    # TODO tile_grid params should be serialized on all_stats object
    all_stats = ek_stats.get_statistics(grouping=grouping)

    tile_grid = ek_stats.get_default_tile_grid()
    req_bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(bbox_srs), tile_grid.srs)
    req_area = ek_stats.get_area_bbox(req_bbox)

    method = {
        'stat': 'mean',
    }

    # We'll use the upper bound of the 99% confidence interval... can change this based on desired risk profile
    # (i.e. overall accuracy vs. not under-estimating)
    def get_sz_per_km(o):
        # if 'ci_99' in o['size']:  # Can missing if for instance only 1 data point was found at o's granularity
        #     return o['size']['ci_99'][1]
        return o['size']['mean']

    if all_stats:
        group_stats = all_stats.get(group_name)
        if group_stats:
            # We have some statistics specific to this group (e.g. osm, wms, etc)
            affected_tiles = ek_stats.get_tile_stats(group_stats, tile_grid, req_bbox)

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
                        inter = ek_stats.get_bbox_intersect(req_bbox, tile_grid.tile_bbox(tile_coord, True))
                        weight = ek_stats.get_area_bbox(inter) / req_area

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
                    sz_per_km += (1.0 - total_weight) * ek_stats.statistics.mean(sizes)

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
