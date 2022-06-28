import os

import celery
import django
from django.core.cache import cache

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.celery import app
from eventkit_cloud.tasks.scheduled_tasks import scale_celery_task, scale_by_runs

if __name__ == '__main__':
    scale_celery_task(30000)
