import logging
import os

from django.conf import settings

logger = logging.getLogger()


def get_provider_image_dir(provider_uid):
    """


    :param provider_uid:
    :return: .
    """
    return os.path.join(settings.IMAGES_ROOT.rstrip('\/'), 'providers', str(provider_uid))


def get_provider_thumbnail_name(provider_uid):
    """

    :param provider_uid:
    :return:
    """
    return f'{provider_uid}_thmb'


def get_provider_image_staging_dir(provider_uid):
    """


    :param provider_uid:
    :return: .
    """
    return os.path.join(settings.IMAGES_ROOT.rstrip('\/'), 'providers', str(provider_uid))
