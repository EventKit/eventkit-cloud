from __future__ import absolute_import

from django.apps import AppConfig


class EventKitJobs(AppConfig):
    name = 'eventkit_cloud.jobs'
    verbose_name = "Eventkit-Cloud Jobs"

    def ready(self):
        from .signals import *