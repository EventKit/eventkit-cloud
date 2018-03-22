from __future__ import absolute_import

from django.apps import AppConfig


class EventKitTasks(AppConfig):
    name = 'eventkit_cloud.tasks'
    verbose_name = "Eventkit-Cloud Tasks"

    def ready(self):
        from .signals import *