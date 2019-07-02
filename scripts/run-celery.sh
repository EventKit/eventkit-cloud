#!/bin/bash

celery worker -A eventkit_cloud --concurrency=$RUNS_CONCURRENCY --loglevel=$LOG_LEVEL -n runs@%h -Q runs & \
celery worker -A eventkit_cloud --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n worker@%h -Q $CELERY_GROUP_NAME & \
celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n celery@%h -Q celery & \
celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n cancel@%h -Q $HOSTNAME.cancel & \
celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n finalize@%h -Q $CELERY_GROUP_NAME.finalize & \
celery worker -A eventkit_cloud --concurrency=$OSM_CONCURRENCY --loglevel=$LOG_LEVEL -n osm@%h -Q $CELERY_GROUP_NAME.osm
