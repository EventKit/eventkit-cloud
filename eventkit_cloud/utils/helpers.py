import logging
import os

from django.conf import settings
from django.utils import timezone

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
        settings.EXPORT_DOWNLOAD_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep),
    )
    download_url = os.path.join(settings.EXPORT_MEDIA_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep),)
    return downloads_filepath, download_url


def get_active_regional_justification(regional_policy, user):
    """
    Checks if a user has an active regional justification for a specific regional policy.
    Returns the regional justification or None.
    """
    regional_justifications = regional_policy.justifications.filter(user=user)

    if not regional_justifications:
        return None

    regional_justification = regional_justifications.latest("created_at")

    # If a timeout was set, use that timeout.
    if isinstance(settings.REGIONAL_JUSTIFICATION_TIMEOUT_DAYS, int):
        timeout_seconds = settings.REGIONAL_JUSTIFICATION_TIMEOUT_DAYS * 3600 * 24
        seconds_since_created = (timezone.now() - regional_justification.created_at).total_seconds()
        if seconds_since_created > timeout_seconds:
            return None
    else:
        # If there's no timeout set, use the last login instead.
        if regional_justification.created_at < user.last_login:
            return None

    return regional_justification
