#!/bin/bash

. /var/lib/.virtualenvs/eventkit/bin/activate
python /var/lib/eventkit/manage.py collectstatic --noinput
python /var/lib/eventkit/manage.py migrate
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
flower -A eventkit_cloud --address=0.0.0.0 --port=5555 --broker=$BROKER_URL --broker_api=$BROKER_API
