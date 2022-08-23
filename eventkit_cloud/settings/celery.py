# -*- coding: utf-8 -*-
import json
import os
from typing import Dict, Optional

from celery.schedules import crontab

from eventkit_cloud.settings.base import is_true
from eventkit_cloud.settings.contrib import *  # NOQA

# Celery config
CELERY_TRACK_STARTED = True

"""
 IMPORTANT

 Don't propagate exceptions in the celery chord header to the finalize task.
 If exceptions are thrown in the chord header then allow the
 finalize task to collect the results and update the overall run state.

"""
# CELERY_CHORD_PROPAGATES = False

CELERYD_PREFETCH_MULTIPLIER = 1
CELERYBEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "rpc://")
CELERY_CACHE_BACKEND = "django-cache"

# Pickle used to be the default, and accepting pickled content is a security concern.  Using the new default json,
# causes a circular reference error, that will need to be resolved.
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
# configure periodic task

CELERY_BEAT_SCHEDULE = {
    "expire-runs": {"task": "Expire Runs", "schedule": crontab(minute="0", hour="0")},
    "provider-statuses": {
        "task": "Check Provider Availability",
        "schedule": crontab(minute="*/{}".format(os.getenv("PROVIDER_CHECK_INTERVAL", "30"))),
    },
    "clean-up-queues": {
        "task": "Clean Up Queues",
        "schedule": crontab(minute="0", hour="0"),
    },
    "clear-tile-cache": {
        "task": "Clear Tile Cache",
        "schedule": crontab(minute="0", day_of_month="*/14"),
    },
    "clear-user-sessions": {
        "task": "Clear User Sessions",
        "schedule": crontab(minute="0", day_of_month="*/2"),
    },
    "update-statistics-cache": {
        "task": "Update Statistics Caches",
        "schedule": crontab(minute="0", day_of_month="*/4"),
    },
    "clean-up-stuck-tasks": {
        "task": "Clean Up Stuck Tasks",
        "schedule": 1200.0,
        "options": {"priority": 90, "queue": "scale", "routing_key": "scale"},
    },
    "scale-celery": {
        "task": "Scale Celery",
        "schedule": 60.0,
        "kwargs": {"max_tasks_memory": int(os.getenv("CELERY_MAX_TASKS_MEMORY", 20000))},
        "options": {"priority": 90, "queue": "scale", "routing_key": "scale"},
    },
}
CELERY_TASK_APP: Optional[str] = os.getenv("CELERY_TASK_APP")
CELERY_SCALE_BY_RUN = is_true(os.getenv("CELERY_SCALE_BY_RUN", False))
CELERY_GROUP_NAME = os.getenv("CELERY_GROUP_NAME", None)
celery_default_task_settings: Dict[str, int] = {
    "CELERY_MAX_DEFAULT_TASKS": 3,
    "CELERY_DEFAULT_DISK_SIZE": 3072,
    "CELERY_DEFAULT_MEMORY_SIZE": 3072,
}
CELERY_DEFAULT_TASK_SETTINGS = (
    json.loads(os.getenv("CELERY_DEFAULT_TASK_SETTINGS", "{}")) or celery_default_task_settings
)
CELERY_MAX_DEFAULT_TASKS = int(os.getenv("CELERY_MAX_DEFAULT_TASKS", 3))


CELERYD_USER = CELERYD_GROUP = "eventkit"
if os.getenv("VCAP_SERVICES"):
    CELERYD_USER = CELERYD_GROUP = "vcap"
CELERYD_USER = os.getenv("CELERYD_USER", CELERYD_USER)
CELERYD_GROUP = os.getenv("CELERYD_GROUP", CELERYD_GROUP)

CELERY_BROKER_URL: Optional[str] = None
if os.getenv("VCAP_SERVICES"):
    for service, listings in json.loads(os.getenv("VCAP_SERVICES")).items():
        try:
            if "rabbitmq" in service:
                CELERY_BROKER_URL = listings[0]["credentials"]["protocols"]["amqp"]["uri"]
            if "cloudamqp" in service:
                CELERY_BROKER_URL = listings[0]["credentials"]["uri"]
        except KeyError:
            continue
        if CELERY_BROKER_URL:
            break
if not CELERY_BROKER_URL:
    CELERY_BROKER_URL = os.environ.get("BROKER_URL", "amqp://guest:guest@localhost:5672//")

CELERY_BROKER_API_URL: Optional[str] = None
if os.getenv("VCAP_SERVICES"):
    for service, listings in json.loads(os.getenv("VCAP_SERVICES")).items():
        try:
            if "rabbitmq" in service:
                CELERY_BROKER_API_URL = listings[0]["credentials"]["http_api_uri"]
            if "cloudamqp" in service:
                CELERY_BROKER_API_URL = listings[0]["credentials"]["http_api_uri"]
        except KeyError:
            continue
        if CELERY_BROKER_API_URL:
            break
if not CELERY_BROKER_API_URL:
    CELERY_BROKER_API_URL = os.environ.get("BROKER_API_URL", "http://guest:guest@localhost:15672/api/")

MAX_TASK_ATTEMPTS = int(os.getenv("MAX_TASK_ATTEMPTS", 3))

PCF_SCALING: bool = is_true(os.getenv("PCF_SCALING", False))
TASK_TIMEOUT: int = int(os.getenv("TASK_TIMEOUT", 0)) or None
CELERY_TASK_SOFT_TIME_LIMIT: int = TASK_TIMEOUT
DEBUG_CELERY: bool = is_true(os.getenv("DEBUG_CELERY", False))
CELERY_ALWAYS_EAGER: bool = DEBUG_CELERY
CELERY_TASK_ALWAYS_EAGER: bool = DEBUG_CELERY
CELERY_EAGER_PROPAGATES_EXCEPTIONS = is_true(os.getenv("CELERY_EAGER_PROPAGATES_EXCEPTIONS", DEBUG_CELERY))
