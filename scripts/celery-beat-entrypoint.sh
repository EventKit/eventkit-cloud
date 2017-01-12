#!/bin/bash

-rm /var/lib/eventkit/celerybeat.pid
python /var/lib/eventkit/manage.py collectstatic --noinput
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
celery beat -A eventkit_cloud --loglevel=$LOG_LEVEL
