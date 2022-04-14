from logging import getLogger
import os

from django.conf import settings

default_app_config = "eventkit_cloud.core.apps.EventKitCore"
logger = getLogger(__name__)


def create_staging_dir():
    if not os.path.isdir(settings.EXPORT_STAGING_ROOT):
        try:
            os.makedirs(settings.EXPORT_STAGING_ROOT)
        except OSError as error:
            logger.error(
                f"Could not create the EXPORT_STAGING_ROOT directory: {settings.EXPORT_STAGING_ROOT} because {error}"
            )


create_staging_dir()
