from django.apps import AppConfig


class EventKitTasks(AppConfig):
    name = "eventkit_cloud.tasks"
    verbose_name = "Eventkit-Cloud Tasks"

    def ready(self):
        from eventkit_cloud.tasks.signals import (  # NOQA
            export_run_file_delete,
            exportrun_delete_exports,
            exporttaskresult_delete_exports,
        )
