#!/bin/bash

rm -rf /var/lib/eventkit/celerybeat.pid
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
celery beat -A eventkit_cloud --loglevel=$LOG_LEVEL
