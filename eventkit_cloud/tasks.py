from __future__ import absolute_import

from celery import shared_task
from .service_manager import create_confs_from_voyager

@shared_task(name="eventkit.tasks.task_create_confs_from_voyager")
def task_create_confs_from_voyager(service_list, base_url, bbox=None):
    create_confs_from_voyager(service_list, base_url, bbox=None)