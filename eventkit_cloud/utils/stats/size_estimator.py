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
        return get_raster_tile_grid_size_estimate(provider, bbox, srs)
    elif is_raster_single(provider):
        return get_raster_tile_grid_size_estimate(provider, bbox, srs)
    elif is_vector(provider):
        return get_vector_estimate(provider, bbox, srs)
    else:
        # Might have statistics on this type, or it will revert to GLOBAL
        return get_vector_estimate(provider, bbox, srs)


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


def get_raster_tile_grid_size_estimate(provider, bbox, srs='4326', with_clipping=True):
    """
    :param provider: The DataProvider to test
    :param bbox: The bounding box of the request
    :param srs: The SRS of the bounding box
    :param with_clipping: see get_total_num_pixels
    :return: (estimate in mbs, object w/ metadata about how it was generated)
    """
    # TODO: Both total_pixels and query intersect the tile grid, can save time if we do it once for both
    tile_grid = ek_stats.get_provider_grid(provider)
    total_pixels = ek_stats.get_total_num_pixels(tile_grid, bbox, srs, with_clipping)

    mpp, method = ek_stats.query(provider.name, 'mpp', 'mean', bbox, srs,
                                 grouping='provider_name',
                                 gap_fill_thresh=0.1,
                                 default_value=0.00000006)

    method['mpp'] = mpp
    method['with_clipping'] = with_clipping
    return total_pixels * mpp, method


def get_vector_estimate(provider, bbox, srs='4326'):
    """
    :param provider: The DataProvider to test
    :param bbox: The bounding box of the request
    :param srs: The SRS of the bounding box
    :return: (estimate in mbs, object w/ metadata about how it was generated)
    """
    # TODO tile_grid params should be serialized on all_stats object
    tile_grid = ek_stats.get_default_tile_grid()
    req_bbox = mapproxy_grid.grid_bbox(bbox, mapproxy_srs.SRS(srs), tile_grid.srs)
    req_area = ek_stats.get_area_bbox(req_bbox)

    # Compute estimate
    size_per_km, method = ek_stats.query(provider.export_provider_type.type_name, 'size', 'mean', bbox, srs,
                                         grouping='provider_type',
                                         gap_fill_thresh=0.1,
                                         default_value=0)
    method['size_per_km'] = size_per_km
    return req_area * size_per_km, method
