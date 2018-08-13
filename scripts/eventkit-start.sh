#!/bin/bash

chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
cd /var/lib/eventkit && gunicorn eventkit_cloud.wsgi:application --bind 0.0.0.0:6080 --worker-class eventlet --workers 1 --threads 2 --name eventkit --user eventkit --no-sendfile --reload
