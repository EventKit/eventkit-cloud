from __future__ import absolute_import

import os

from django.core.wsgi import get_wsgi_application

import sys

proj_path = "/var/lib/eventkit"
sys.path.append(proj_path)
os.chdir(proj_path)

if os.environ.get("PRODUCTION", False):
    from whitenoise.django import DjangoWhiteNoise
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    application = get_wsgi_application()
    application = DjangoWhiteNoise(application)
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.dev")
    application = get_wsgi_application()

from eventkit_cloud.tasks.scripts.debug import run_chain
print("Submitting Celery Chain...")
run_chain()
print("Done.")