from django.apps import AppConfig
from django.core.cache import caches


class EventKitCore(AppConfig):
    name = "eventkit_cloud.core"
    verbose_name = "Eventkit-Cloud Core"

    def ready(self):
        from eventkit_cloud.core.signals import delete_user  # NOQA

        caches["primary_cache"].set("primary_cache", True)
        if not caches["primary_cache"].get("primary_cache"):
            print("Primary cache is not available, using fallback cache.")
