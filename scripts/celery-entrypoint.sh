#!/bin/bash

python /var/lib/eventkit/manage.py collectstatic --noinput
python /var/lib/eventkit/manage.py migrate
celery worker -A eventkit_cloud --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n $HOSTNAME -Q celery,$HOSTNAME

