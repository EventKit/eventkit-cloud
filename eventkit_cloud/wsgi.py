"""
WSGI config for eventkit_cloud project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

import sys

if os.environ.get("PRODUCTION", False):
    from whitenoise.django import DjangoWhiteNoise
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    application = get_wsgi_application()
    application = DjangoWhiteNoise(application)
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.dev")
    application = get_wsgi_application()
