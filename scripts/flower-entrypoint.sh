#!/bin/bash

/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
/var/lib/eventkit/.virtualenvs/eventkit/bin/celery flower -A eventkit_cloud --address=0.0.0.0 --port=5555 --broker=amqp://guest:guest@rabbitmq:5672/ --broker_api=http://guest:guest@rabbitmq:15672/api/
