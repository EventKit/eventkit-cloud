#!/bin/bash

rm -rf celerybeat.pid &
celery beat -A eventkit_cloud --loglevel=$LOG_LEVEL &
celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n scale@%h -Q scale
