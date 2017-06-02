# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .project import *  # NOQA
import dj_database_url
import os
import logging

# Authentication Settings

AUTHENTICATION_BACKENDS = tuple()

if os.environ.get('OAUTH_AUTHORIZATION_URL'):
    OAUTH_NAME = os.environ.get('OAUTH_NAME', 'OAUTH')
    OAUTH_CLIENT_ID = os.environ.get('OAUTH_CLIENT_ID')
    OAUTH_CLIENT_SECRET = os.environ.get('OAUTH_CLIENT_SECRET')
    OAUTH_AUTHORIZATION_URL = os.environ.get('OAUTH_AUTHORIZATION_URL')
    OAUTH_LOGOUT_URL = os.environ.get('OAUTH_LOGOUT_URL')
    OAUTH_TOKEN_URL = os.environ.get('OAUTH_TOKEN_URL')
    OAUTH_TOKEN_KEY = os.environ.get('OAUTH_TOKEN_KEY', 'access_token')
    OAUTH_RESPONSE_TYPE = os.environ.get('OAUTH_RESPONSE_TYPE', 'code')
    OAUTH_REDIRECT_URI = os.environ.get('OAUTH_REDIRECT_URI')
    OAUTH_SCOPE = os.environ.get('OAUTH_SCOPE')

    # The OAuth profile needs to map to the User model.

    # The required fields are:
    # identification, username, email, commonname
    # The optional fields are:
    # first_name, last_name

    # Example:
    # OAUTH_PROFILE_SCHEMA = {"identification": "ID", "username": "username", "email": "email", "first_name": "firstname"...}
    OAUTH_PROFILE_SCHEMA = os.environ.get('OAUTH_PROFILE_SCHEMA')
    OAUTH_PROFILE_URL = os.environ.get('OAUTH_PROFILE_URL')

if os.environ.get('LDAP_SERVER_URI') :

    import ldap
    from django_auth_ldap.config import LDAPSearch

    AUTH_LDAP_SERVER_URI = os.environ.get('LDAP_SERVER_URI')
    AUTH_LDAP_BIND_PASSWORD = os.environ.get('LDAP_BIND_PASSWORD')
    AUTH_LDAP_USER_DN_TEMPLATE = os.environ.get('LDAP_USER_DN_TEMPLATE')
    LDAP_SEARCH_DN = os.environ.get('LDAP_SEARCH_DN')
    AUTH_LDAP_USER = os.environ.get('LDAP_USER')
    AUTH_LDAP_BIND_DN = os.environ.get('LDAP_BIND_DN')
    AUTHENTICATION_BACKENDS += (
        'django_auth_ldap.backend.LDAPBackend',
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

DJANGO_MODEL_LOGIN = os.environ.get('DJANGO_MODEL_LOGIN')
AUTHENTICATION_BACKENDS += (
      'django.contrib.auth.backends.ModelBackend',
    )

# Set debug to True for development
DEBUG = os.environ.get('DEBUG', False)

ALLOWED_HOSTS = [HOSTNAME, SITE_NAME]

LOGGING_OUTPUT_ENABLED = DEBUG
LOGGING_LOG_SQL = DEBUG

INSTALLED_APPS += (
    'django_extensions',

    'audit_logging',
)

DATABASES = {}

if os.environ.get('VCAP_SERVICES'):
    DATABASES = {'default': dj_database_url.config()}
else:
    DATABASES['default'] = dj_database_url.config(default='postgres://eventkit:eventkit_exports@localhost:5432/eventkit_exports')

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
                'django.contrib.messages.context_processors.messages',
                'django_classification_banner.context_processors.classification',
            ],
            'debug': DEBUG
        },
    },
]

if os.environ.get("MEMCACHED"):
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
            'LOCATION': os.environ.get("MEMCACHED"),
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
            'LOCATION': 'eventkit_cache',
        }
    }


# session settings
SESSION_COOKIE_NAME = 'eventkit_exports_sessionid'
SESSION_COOKIE_DOMAIN = os.environ.get('SESSION_COOKIE_DOMAIN', SITE_NAME)
SESSION_COOKIE_PATH = '/'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

if os.environ.get('USE_S3'):
    USE_S3 = True
else:
    USE_S3 = False

AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')

MAPPROXY_CONCURRENCY = os.environ.get('MAPPROXY_CONCURRENCY', 1)

AUDIT_MODELS = [
    ('eventkit_cloud.tasks.models.ExportRun', 'ExportRun'),
    ('eventkit_cloud.tasks.models.ExportProviderTask', 'ExportProviderTask'),
    ('eventkit_cloud.tasks.models.ExportTask', 'ExportTask'),
]


LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'propagate': True,
            'level': os.getenv('DJANGO_LOG_LEVEL', 'WARN'),
        },
        'eventkit_cloud': {
            'handlers': ['console', ],
            'propagate': True,
            'level': os.getenv('LOG_LEVEL', 'INFO'),
        },
        'audit_logging': {
            'handlers': ['console', ],
            'propagate': True,
            'level': os.getenv('LOG_LEVEL', 'INFO'),
        }
    },
}

DISABLE_SSL_VERIFICATION = os.environ.get('DISABLE_SSL_VERIFICATION', False)
