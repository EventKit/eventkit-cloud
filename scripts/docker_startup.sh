#!/bin/bash
/usr/bin/python /var/lib/eventkit/manage.py migrate 
/usr/bin/python /var/lib/eventkit/manage.py collectstatic --noinput
chown -R eventkit:eventkit /var/log/eventkit
service apache2 start 
supervisord -c /etc/supervisor/supervisord.conf -n
