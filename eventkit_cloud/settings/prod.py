# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .project import *  # NOQA
import dj_database_url
import os
import json


# Authentication Settings
if os.environ.get('LDAP_SERVER_URI'):
    import ldap
    from django_auth_ldap.config import LDAPSearch

    AUTH_LDAP_SERVER_URI = os.environ.get('LDAP_SERVER_URI')
    AUTH_LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD')
    AUTH_LDAP_USER_DN_TEMPLATE = os.environ.get('LDAP_USER_DN_TEMPLATE')
    LDAP_SEARCH_DN = os.environ.get('LDAP_SEARCH_DN')
    AUTH_LDAP_USER = os.environ.get('LDAP_USER')
    AUTH_LDAP_BIND_DN = os.environ.get('LDAP_BIND_DN')

    AUTHENTICATION_BACKENDS = (
      'django_auth_ldap.backend.LDAPBackend',
      'django.contrib.auth.backends.ModelBackend',
      #'guardian.backends.ObjectPermissionBackend',
    )
    AUTH_LDAP_USER_ATTR_MAP = {
      'first_name': 'givenName',
      'last_name': 'sn',
      'email': 'mail',
    }
    AUTH_LDAP_USER_SEARCH = LDAPSearch(
      LDAP_SEARCH_DN,
      ldap.SCOPE_SUBTREE,
      AUTH_LDAP_USER
    )

# Set debug to True for development
DEBUG = os.environ.get('DEBUG', False)

if not DEBUG:
    ALLOWED_HOSTS = [HOSTNAME]

LOGGING_OUTPUT_ENABLED = DEBUG
LOGGING_LOG_SQL = DEBUG

INSTALLED_APPS += (
    'django_extensions',

)

DATABASES = {}

if os.environ.get('VCAP_SERVICES'):
    DATABASES = {'default': dj_database_url.config()}
else:
    DATABASES['default'] = dj_database_url.config(default='postgis://eventkit:eventkit_exports@localhost:5432/eventkit_exports')

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
                'django_classification_banner.context_processors.classification',
            ],
            'debug': DEBUG
        },
    },
]

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

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
#         'eventkit_cloud.api': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.api.tests': {
#             'handlers': ['console'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.tasks.tests': {
#             'handlers': ['console'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.tasks': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.celery.task': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.jobs': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.jobs.tests': {
#             'handlers': ['console', 'file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.utils': {
#             'handlers': ['file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud.utils.tests': {
#             'handlers': ['console', 'file'],
#             'propagate': True,
#             'level': 'DEBUG',
#         },
#         'eventkit_cloud': {
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

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
# STATICFILES_STORAGE = 'whitenoise.django.GzipManifestStaticFilesStorage'

if os.environ.get('USE_S3'):
    USE_S3 = True
else:
    USE_S3 = False

AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')

