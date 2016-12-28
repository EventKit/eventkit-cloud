from __future__ import absolute_import

import os

from celery import Celery


if os.getenv("PRODUCTION"):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventkit_cloud.settings.prod')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'eventkit_cloud.settings.dev')

from django.conf import settings  # noqa

app = Celery('eventkit_cloud')
app.conf.task_protocol = 1

app.config_from_object('django.conf:settings')
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)
