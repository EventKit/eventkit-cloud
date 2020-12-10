import logging

from django.apps import AppConfig
from django.conf import settings
from django.core.cache import caches

logger = logging.getLogger(__name__)


class EventKitCore(AppConfig):
    name = "eventkit_cloud.core"
    verbose_name = "Eventkit-Cloud Core"

    def ready(self):
        from eventkit_cloud.core.signals import delete_user  # NOQA

        if "primary_cache" in settings.CACHES:
            caches["primary_cache"].set("primary_cache", True)
            if not caches["primary_cache"].get("primary_cache"):
                logger.info("Primary cache is not available, using fallback cache.")
