#!/bin/bash

rm -rf celerybeat.pid &
celery -A eventkit_cloud beat --loglevel=$LOG_LEVEL &
celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n scale@%h -Q scale
