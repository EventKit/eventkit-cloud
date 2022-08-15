from django.apps import AppConfig


class EventKitTasks(AppConfig):
    name = "eventkit_cloud.tasks"
    verbose_name = "Eventkit-Cloud Tasks"

    def ready(self):
        from eventkit_cloud.tasks.signals import exportrun_delete_exports, exporttaskresult_delete_exports  # NOQA
