import logging
import os

from django.conf import settings

default_app_config = 'eventkit_cloud.core.apps.EventKitCore'
logger = logging.getLogger(__name__)


def create_staging_dir():
    if not os.path.isdir(settings.EXPORT_STAGING_ROOT):
        try:
            os.makedirs(settings.EXPORT_STAGING_ROOT)
        except OSError:
            logger.error(
                "Could not create the EXPORT_STAGING_ROOT directory: {0}".format(
                    settings.EXPORT_STAGING_ROOT
                )
            )


create_staging_dir()
