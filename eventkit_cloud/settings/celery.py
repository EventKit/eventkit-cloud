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
# CELERYD_PREFETCH_MULTIPLIER limits the amount of tasks per worker, 0 means unlimited this is required so that a
# worker can take a whole task chain, otherwise "out-of-order" issues occur.
CELERYD_PREFETCH_MULTIPLIER = 0
CELERYBEAT_SCHEDULER='djcelery.schedulers.DatabaseScheduler'
CELERY_RESULT_BACKEND=os.environ.get('CELERY_RESULT_BACKEND', 'djcelery.backends.database:DatabaseBackend')
# configure periodic task
CELERYBEAT_SCHEDULE = {
    'purge-unpublished-exports': {
        'task': 'Purge Unpublished Exports',
        'schedule': crontab(minute='0', hour='*', day_of_week='*')
    },
    'expire-runs': {
        'task': 'Expire Runs',
        'schedule': crontab(minute='0', hour='0', day_of_week='*')
    }
}

if os.environ.get('VCAP_SERVICES'):
    services = json.loads(os.environ.get('VCAP_SERVICES'))
    try:
        BROKER_URL = services['cloudamqp'][0]['credentials']['uri']
    except KeyError:
        BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@localhost:5672//')
else:
    BROKER_URL = os.environ.get('BROKER_URL', 'amqp://guest:guest@localhost:5672//')