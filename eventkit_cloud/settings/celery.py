# -*- coding: utf-8 -*-
from __future__ import absolute_import

from celery.schedules import crontab

from .contrib import *  # NOQA
import os
import json

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
CELERYBEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'django-db')

# Pickle used to be the default, and accepting pickled content is a security concern.  Using the new default json,
# causes a circular reference error, that will need to be resolved.
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
# configure periodic task
CELERYBEAT_SCHEDULE = {
    'expire-runs': {
        'task': 'Expire Runs',
        'schedule': crontab(minute='0', hour='0', day_of_week='*')
    },
    'provider-statuses': {
        'task': 'Check Provider Availability',
        'schedule': crontab(minute='*/{}'.format(os.getenv('PROVIDER_CHECK_INTERVAL', '30')))
    }
}

CELERYD_USER = CELERYD_GROUP = 'eventkit'
if os.getenv("VCAP_SERVICES"):
    CELERYD_USER = CELERYD_GROUP = "vcap"
CELERYD_USER = os.getenv("CELERYD_USER", CELERYD_USER)
CELERYD_GROUP = os.getenv("CELERYD_GROUP", CELERYD_GROUP)

BROKER_URL = None
if os.getenv("VCAP_SERVICES"):
    for service, listings in json.loads(os.getenv("VCAP_SERVICES")).iteritems():
        try:
            if 'rabbitmq' in service:
                BROKER_URL = listings[0]['credentials']['protocols']['amqp']['uri']
            if 'cloudamqp' in service:
                BROKER_URL = listings[0]['credentials']['uri']
        except KeyError, TypeError:
            continue
        if BROKER_URL:
            break
if not BROKER_URL:
    BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@localhost:5672//')
