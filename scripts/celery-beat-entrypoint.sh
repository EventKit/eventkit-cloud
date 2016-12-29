#!/bin/bash

. /var/lib/.virtualenvs/eventkit/bin/activate
python /var/lib/eventkit/manage.py collectstatic --noinput
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
python /var/lib/eventkit/manage.py celery beat --loglevel=$LOGLEVEL
