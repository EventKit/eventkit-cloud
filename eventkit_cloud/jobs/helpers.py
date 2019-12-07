import logging
import os

from django.conf import settings

logger = logging.getLogger()


def get_provider_image_dir(provider_uid):
    """
    Get the directory where images for a specified provider will be stored for download.

    :param provider_uid: uid from the DataProvider model.
    """
    return os.path.join(
        settings.IMAGES_STAGING.rstrip("\/"), "providers", str(provider_uid)
    )


def get_provider_thumbnail_name(provider_slug):
    """
    Get a short identifier for thumbnail images for a provider.

    :param provider_slug: slug (or identifier) for the specified DataProvider
    """
    return f"{provider_slug}_thmb"


def get_provider_image_download_dir(provider_uid):
    """
    Get the download path for images of a specified provider.

    :param provider_uid: uid from the DataProvider model.
    """
    return os.path.join(
        settings.IMAGES_DOWNLOAD_ROOT.rstrip("\/"), "providers", str(provider_uid)
    )


def get_provider_image_download_path(provider_uid):
    """
    Get the download path for images of a specified provider.

    :param provider_uid: uid from the DataProvider model.
    """
    return os.path.join(
        settings.EXPORT_MEDIA_ROOT.rstrip("\/"),
        "images",
        "providers",
        str(provider_uid),
    )
