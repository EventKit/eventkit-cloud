import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.tasks.scheduled_tasks import scale_celery_task

if __name__ == '__main__':
    scale_celery_task(30000)
