from django.apps import AppConfig


class EventKitCore(AppConfig):
    name = "eventkit_cloud.core"
    verbose_name = "Eventkit-Cloud Core"

    def ready(self):
        from eventkit_cloud.core.signals import delete_user  # NOQA
