import logging
import os

from django.conf import settings

logger = logging.getLogger()


def get_relative_path_from_staging(staging_path):
    """
    Tries to return a relative path from staging

    :param staging_path: Full file path positioned within the staging dir.
    :return: relative path or empty
    """
    staging_dir = settings.EXPORT_STAGING_ROOT.lstrip(os.path.sep).rstrip(os.path.sep)
    staging_path = staging_path.lstrip(os.path.sep)
    if staging_dir in staging_path:
        return staging_path.replace(staging_dir, "")
    return staging_path


def get_download_paths(relative_path):
    downloads_filepath = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT.rstrip(os.path.sep),
        relative_path.lstrip(os.path.sep),
    )
    download_url = os.path.join(
        settings.EXPORT_MEDIA_ROOT.rstrip(os.path.sep),
        relative_path.lstrip(os.path.sep),
    )
    return downloads_filepath, download_url
