#!/bin/bash

/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py celery worker --concurrency=$CONCURRENCY --loglevel=$LOGLEVEL -n $HOSTNAME -Q celery,$HOSTNAME

