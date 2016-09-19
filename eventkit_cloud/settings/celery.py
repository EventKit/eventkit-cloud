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
CELERY_CHORD_PROPAGATES = False

CELERYBEAT_SCHEDULER='djcelery.schedulers.DatabaseScheduler'
CELERY_RESULT_BACKEND='djcelery.backends.database:DatabaseBackend'
# configure periodic task
CELERYBEAT_SCHEDULE = {
    'purge-unpublished-exports': {
        'task': 'Purge Unpublished Exports',
        'schedule': crontab(minute='0', hour='*', day_of_week='*')
    },
}

if os.environ.get('VCAP_SERVICES'):
    services = json.loads(os.environ.get('VCAP_SERVICES'))
    try:
        BROKER_URL = services['cloudamqp'][0]['credentials']['uri']
    except KeyError:
        BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@rabbitmq:5672//')
else:
    BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@rabbitmq:5672//')
