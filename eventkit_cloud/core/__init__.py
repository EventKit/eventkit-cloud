import logging
import os

from django.conf import settings

logger = logging.getLogger(__name__)


def create_staging_dir():
    if not os.path.isdir(settings.EXPORT_STAGING_ROOT):
        try:
            os.makedirs(settings.EXPORT_STAGING_ROOT)
        except OSError:
            logger.error("Could not create the EXPORT_STAGING_ROOT directory: {0}".format(settings.EXPORT_STAGING_ROOT))


def create_thumbnail_dir():
    if not os.path.isdir(settings.IMAGES_ROOT):
        try:
            os.makedirs(settings.IMAGES_ROOT)
        except OSError:
            logger.error("Could not create the IMAGES_ROOT directory: {0}".format(settings.IMAGES_ROOT))


create_staging_dir()
create_thumbnail_dir()
