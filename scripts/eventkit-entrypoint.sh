#!/bin/bash

/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput --clear
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/admin_user.json
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/insert_provider_types.json
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py loaddata /var/lib/eventkit/eventkit_cloud/fixtures/osm_provider.json

chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
cd /var/lib/eventkit && /var/lib/eventkit/.virtualenvs/eventkit/bin/gunicorn eventkit_cloud.wsgi:application --bind 0.0.0.0:6080 --worker-class eventlet --workers 1 --threads 2 --name eventkit --user eventkit --no-sendfile
