web: python manage.py migrate && python manage.py loaddata eventkit_cloud/fixtures/admin_user.json && gunicorn eventkit_cloud.wsgi --log-level=debug --logger-class=simple -b 0.0.0.0:$PORT
