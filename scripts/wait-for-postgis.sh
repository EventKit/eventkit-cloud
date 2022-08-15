#!/bin/bash

set -e

source activate conda_env
python scripts/create_bucket.py eventkit
python - << END
import os
import django
from time import sleep

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from django.db import connection

while True:
    try:
        connection.connect()
        connection.close()
        break
    except Exception:
        print("Postgres is unavailable - sleeping")
        sleep(1)
END

exec $@
