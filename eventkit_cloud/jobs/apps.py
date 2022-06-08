from django.apps import AppConfig


class EventKitJobs(AppConfig):
    name = "eventkit_cloud.jobs"
    verbose_name = "Eventkit-Cloud Jobs"

    def ready(self):
        from eventkit_cloud.jobs.signals import job_post_save  # NOQA
