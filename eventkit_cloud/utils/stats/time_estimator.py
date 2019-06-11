from django.core.exceptions import ObjectDoesNotExist



import logging

from eventkit_cloud.jobs.models import DataProvider
import eventkit_cloud.utils.stats.generator as ek_stats

logger = logging.getLogger(__name__)


def get_time_estimate_slug(slug, bbox, srs='4326'):
    """
    See get_time_estimate
    :param slug: slug of the DataProvider
    :param bbox
    :param srs
    """
    try:
        provider = DataProvider.objects.select_related("export_provider_type").get(slug=slug)
    except ObjectDoesNotExist:
        raise ValueError("Provider slug '{}' is not valid".format(slug))

    return get_time_estimate(provider, bbox, srs)


def get_time_estimate_name(provider_name, bbox, srs='4326'):
    """
    See get_time_estimate
    :param provider_name: Name of the DataProvider
    :param bbox
    :param srs
    """
    try:
        provider = DataProvider.objects.select_related("export_provider_type").get(name=provider_name)
    except ObjectDoesNotExist:
        raise ValueError("Provider name '{}' is not valid".format(provider_name))

    return get_time_estimate(provider, bbox, srs)


def get_time_estimate(provider, bbox, srs='4326', with_clipping=True):
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
    from eventkit_cloud.utils.stats.geomutils import prefetch_geometry_cache, lookup_cache_geometry, \
        get_area_bbox, get_bbox_intersect

    duration_per_unit_area, method = ek_stats.query(provider.name, 'duration', 'mean', bbox, srs,
                                 grouping='provider_name',
                                 gap_fill_thresh=0.1,
                                 default_value=0)
    area = get_area_bbox(bbox)
    logger.info("Calculating Time Estimate")
    logger.info("""Area: {}
     Duration per unit area: {}
     Duration Estimate: {}""".format(area, duration_per_unit_area, duration_per_unit_area * area))
    area_as_reported, method = ek_stats.query(provider.name, 'area', 'mean', bbox, srs,
                                                    grouping='provider_name',
                                                    gap_fill_thresh=0.1,
                                                    default_value=0)
    logger.info("""Area as reported: {}""".format(area_as_reported))
    return area * duration_per_unit_area