# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .project import *  # NOQA
import dj_database_url
import os
import json

# Set debug to True for development
DEBUG = os.environ.get('DEBUG', False)
LOGGING_OUTPUT_ENABLED = DEBUG
LOGGING_LOG_SQL = DEBUG

INSTALLED_APPS += (
    'django_extensions',
)

DATABASES = {}

if os.environ.get('VCAP_SERVICES'):
    DATABASES = {'default': dj_database_url.config()}
else:
    DATABASES['default'] = dj_database_url.config(default='postgis://eventkit:eventkit_exports_dev@localhost:5432/eventkit_exports_dev')

DATABASES['default']['ENGINE'] = 'django.contrib.gis.db.backends.postgis'

DATABASES['default']['OPTIONS'] = {'options': '-c search_path=exports,public'}


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': ['api/templates/', 'ui/templates', 'ui/static/ui/js'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.core.context_processors.i18n',
                'django.core.context_processors.media',
                'django.contrib.messages.context_processors.messages',
                'social.apps.django_app.context_processors.backends',
                'social.apps.django_app.context_processors.login_redirect',
            ],
            'debug': DEBUG
        },
    },
]

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Disable caching while in development
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# session settings
SESSION_COOKIE_NAME = 'eventkit_exports_sessionid'
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN', SITE_NAME)
SESSION_COOKIE_PATH = '/'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# LOGGING = {
#     'version': 1,
#     'disable_existing_loggers': False,
#     'formatters': {
#         'verbose': {
#             'format': "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
#             'datefmt': "%d/%b/%Y %H:%M:%S"
#         },
#         'simple': {
#             'format': '%(levelname)s %(message)s'
#         },
#     },
#     'handlers': {
#         'console': {
#             'class': 'logging.StreamHandler',
#             'formatter': 'simple',
#             'level': 'DEBUG',
#         }
#     },
#     'loggers': {
#         'django': {
#             'handlers': ['file'],
#             'propagate': True,
#            # 'level': 'DEBUG',
#             'level': 'ERROR',
#         },
#         'oet2.api': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.api.tests': {
#             'handlers': ['console'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.tasks.tests': {
#             'handlers': ['console'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.tasks': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.celery.task': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.jobs': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.jobs.tests': {
#             'handlers': ['console', 'file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.utils': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2.utils.tests': {
#             'handlers': ['console', 'file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'oet2': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'tasks': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'celery.task': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG'
#         }
#     }
# }

TILESET_CACHE_DIRECTORY=os.environ.get('TILESET_CACHE_DIRECTORY', '/cache')
DJMP_AUTHORIZATION_CLASS = 'djmp.guardian_auth.GuardianAuthorization'

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'
