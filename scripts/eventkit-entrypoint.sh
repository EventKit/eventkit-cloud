#!/bin/bash

python /var/lib/eventkit/manage.py collectstatic --noinput
python /var/lib/eventkit/manage.py migrate
python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/admin_user.json
python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/insert_provider_types.json
python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/osm_provider.json

chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
cd /var/lib/eventkit && gunicorn eventkit_cloud.wsgi:application --bind 0.0.0.0:6080 --worker-class eventlet --workers 1 --threads 2 --name eventkit --user eventkit --no-sendfile
