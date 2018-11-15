#!/bin/bash

celery worker -A eventkit_cloud --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n worker@%h -Q $HOSTNAME & \
celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery & \
celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n cancel@%h -Q $HOSTNAME.cancel & \
celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n finalize@%h -Q $HOSTNAME.finalize & \
celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n osm@%h -Q $HOSTNAME.osm
