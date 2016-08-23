#!/bin/bash
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py makemigrations
/var/lib/eventkit/.virtualenvs/eventkit/bin/python /var/lib/eventkit/manage.py migrate 
chown -R eventkit:eventkit /var/log/eventkit /var/lib/eventkit
service apache2 start 
supervisord -c /etc/supervisor/supervisord.conf -n
