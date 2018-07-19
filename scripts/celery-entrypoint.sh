#!/bin/bash

python3 manage.py hotreload celery worker -A eventkit_cloud --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n worker@%h -Q $HOSTNAME & \
python3 manage.py hotreload celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery & \
python3 manage.py hotreload celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n cancel@%h -Q $HOSTNAME.cancel
