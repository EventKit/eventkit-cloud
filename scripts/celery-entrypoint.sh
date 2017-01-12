#!/bin/bash

python /var/lib/eventkit/manage.py collectstatic --noinput
python /var/lib/eventkit/manage.py migrate
python /var/lib/eventkit/manage.py celery worker --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n $HOSTNAME -Q celery,$HOSTNAME

