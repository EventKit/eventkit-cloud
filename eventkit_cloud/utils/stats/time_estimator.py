from django.core.exceptions import ObjectDoesNotExist
from eventkit_cloud.utils.stats.geomutils import get_area_bbox

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


def get_time_estimate(provider, bbox, srs='4326'):
    """
    :param provider: The DataProvider to test
    :param bbox: The bounding box of the request
    :param srs: The SRS of the bounding box
    :param with_clipping: see get_total_num_pixels
    :return: (estimate in seconds, object w/ metadata about how it was generated)
    """
    duration_per_unit_area, method = ek_stats.query(provider.name, 'duration', 'mean', bbox, srs,
                                 grouping='provider_name',
                                 gap_fill_thresh=0.1,
                                 default_value=0)
    area = get_area_bbox(bbox)
    return area * duration_per_unit_area, method