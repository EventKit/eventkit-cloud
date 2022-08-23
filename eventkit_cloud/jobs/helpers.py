from __future__ import annotations

import logging
import os

from django.conf import settings
from django.utils import timezone

from eventkit_cloud.utils.types.django_helpers import DjangoUserType

logger = logging.getLogger()


def get_provider_image_dir(provider_uid):
    """
    Get the directory where images for a specified provider will be stored for download.

    :param provider_uid: uid from the DataProvider model.
    """
    return os.path.join(settings.IMAGES_STAGING.rstrip("\/"), "providers", str(provider_uid))


def get_provider_thumbnail_name(provider_slug):
    """
    Get a short identifier for thumbnail images for a provider.

    :param provider_slug: slug (or identifier) for the specified DataProvider
    """
    return f"{provider_slug}_thmb"


def get_valid_regional_justification(regional_policy, user: DjangoUserType):
    """
    Checks if a user has an active regional justification for a specific regional policy.
    Returns the regional justification or None.
    """
    regional_justifications = regional_policy.justifications.filter(user=user)

    if not regional_justifications:
        return None

    regional_justification = regional_justifications.latest("created_at")

    # If a timeout was set in the environment, use that timeout.
    if settings.REGIONAL_JUSTIFICATION_TIMEOUT_DAYS:
        timeout_seconds = settings.REGIONAL_JUSTIFICATION_TIMEOUT_DAYS * 3600 * 24
        seconds_since_created = (timezone.now() - regional_justification.created_at).total_seconds()
        if seconds_since_created > timeout_seconds:
            return None
    else:
        # If there's no timeout set, use the last login instead.
        if regional_justification.created_at < user.last_login:
            return None

    return regional_justification
