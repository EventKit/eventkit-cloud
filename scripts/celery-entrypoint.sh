#!/bin/bash
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
#/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
#/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/admin_user.json
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py celery worker --concurrency=$CONCURRENCY --loglevel=$LOGLEVEL --statedb=/var/run/celery/worker.state -n $HOSTNAME -Q celery,$HOSTNAME
