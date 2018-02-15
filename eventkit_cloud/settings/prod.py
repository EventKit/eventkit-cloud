# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .celery import *  # NOQA
import dj_database_url
import os
import logging
import json
import urllib

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Project apps
INSTALLED_APPS += (
    'eventkit_cloud.core',
    'eventkit_cloud.auth',
    'eventkit_cloud.jobs',
    'eventkit_cloud.tasks',
    'eventkit_cloud.api',
    'eventkit_cloud.ui',
    'eventkit_cloud.utils',
    'eventkit_cloud',
)

INSTALLED_APPS += ("django_celery_results", "django_celery_beat", )

LOGIN_URL = '/login'
LOGOUT_URL = '/logout'

EXPORT_TASKS = {
    'shp': 'eventkit_cloud.tasks.export_tasks.shp_export_task',
    'obf': 'eventkit_cloud.tasks.export_tasks.ObfExportTask',
    'sqlite': 'eventkit_cloud.tasks.export_tasks.sqlite_export_task',
    'kml': 'eventkit_cloud.tasks.export_tasks.kml_export_task',
    'thematic': 'eventkit_cloud.tasks.export_tasks.ThematicLayersExportTask',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.geopackage_export_task'
}

# where exports are staged for processing
EXPORT_STAGING_ROOT = None
if os.getenv("VCAP_SERVICES"):
    for service, listings in json.loads(os.getenv("VCAP_SERVICES")).iteritems():
        if 'nfs' in service:
            try:
                EXPORT_STAGING_ROOT = os.path.join(listings[0]['volume_mounts'][0]['container_dir'], 'eventkit_stage')
            except (KeyError, TypeError) as e:
                print(e)
                continue
if not EXPORT_STAGING_ROOT:
    EXPORT_STAGING_ROOT = os.getenv('EXPORT_STAGING_ROOT', '/var/lib/eventkit/exports_stage/')

# where exports are stored for public download
EXPORT_DOWNLOAD_ROOT = os.getenv('EXPORT_DOWNLOAD_ROOT', '/var/lib/eventkit/exports_download/')

# the root url for export downloads
EXPORT_MEDIA_ROOT = os.getenv('EXPORT_MEDIA_ROOT', '/downloads/')

# url to overpass api endpoint
# OVERPASS_API_URL = 'http://cloud.eventkit.dev/overpass-api/interpreter'
OVERPASS_API_URL = os.getenv('OVERPASS_API_URL', 'http://overpass-api.de/api/interpreter')
GEOCODING_API_URL = os.getenv('GEOCODING_API_URL', 'http://api.geonames.org/searchJSON')
REVERSE_GEOCODING_API_URL = os.getenv('REVERSE_GEOCODING_API_URL', None)
REVERSE_GEOCODING_API_TYPE = os.getenv('REVERSE_GEOCODING_API_TYPE', 'PELIAS')
GEOCODING_API_TYPE = os.getenv('GEOCODING_API_TYPE', 'GEONAMES')
GEOCODING_UPDATE_URL = os.getenv('GEOCODING_UPDATE_URL', None)
CONVERT_API_URL = os.getenv('CONVERT_API_URL', None)

# zoom extents of reverse geocode point result (in degrees)
REVERSE_GEOCODE_ZOOM = 0.1;

"""
Maximum extent of a Job
max of (latmax-latmin) * (lonmax-lonmin)
"""
JOB_MAX_EXTENT = os.getenv('JOB_MAX_EXTENT', 2500000)  # default export max extent in sq km

# maximum number of runs to hold for each export
EXPORT_MAX_RUNS = 1

import socket
HOSTNAME = os.getenv('HOSTNAME', socket.gethostname())
if os.environ.get('VCAP_APPLICATION'):
    env = json.loads(os.environ.get('VCAP_APPLICATION'))
    if env['application_uris']:
        HOSTNAME = os.getenv('HOSTNAME', env['application_uris'][0])
SITE_NAME = os.getenv('SITE_NAME', HOSTNAME)
if SITE_NAME == '':
    SITE_NAME = 'localhost'
if os.environ.get('VCAP_APPLICATION'):
    SITE_URL = os.getenv('SITE_URL', 'https://{0}'.format(SITE_NAME))
else:
    SITE_URL = os.getenv('SITE_URL', 'http://{0}'.format(SITE_NAME))
SITE_ID = 1

"""
Admin email address
which receives task error notifications.
"""
TASK_ERROR_EMAIL = os.getenv('TASK_ERROR_EMAIL', 'eventkit.team@gmail.com')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Eventkit Team <eventkit.team@gmail.com>')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'eventkit.team@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', None)

if EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

if 'f' in os.getenv('EMAIL_USE_TLS', '').lower():
    EMAIL_USE_TLS = False
else:
    EMAIL_USE_TLS = True

"""
Overpass Element limit

Sets the max ram allowed for overpass query

http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#Element_limit_.28maxsize.29
"""

OVERPASS_MAX_SIZE = os.getenv('OVERPASS_MAX_SIZE', 2147483648)  # 2GB

"""
Overpass timeout setting

Sets request timeout for overpass queries.

http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#timeout
"""

OVERPASS_TIMEOUT = os.getenv('OVERPASS_TIMEOUT', 1600)  # query timeout in seconds

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

MIDDLEWARE += ['audit_logging.middleware.UserDetailsMiddleware']

AUDIT_MODELS = [
    ('eventkit_cloud.tasks.models.ExportRun', 'ExportRun'),
    ('eventkit_cloud.tasks.models.DataProviderTaskRecord', 'DataProviderTaskRecord'),
    ('eventkit_cloud.tasks.models.ExportTaskRecord', 'ExportTaskRecord'),
]

DATABASES = {}

if os.environ.get('VCAP_SERVICES'):
    if os.environ.get('DATABASE_URL'):
        DATABASES = {'default': dj_database_url.config()}
    if not DATABASES:
        for service, listings in json.loads(os.environ.get('VCAP_SERVICES')).iteritems():
            try:
                if ('pg_95' in service) or ('postgres' in service):
                    DATABASES['default'] = dj_database_url.config(default=listings[0]['credentials']['uri'])
                    DATABASES['default']['CONN_MAX_AGE'] = 180
            except (KeyError, TypeError) as e:
                print("Could not configure information for service: {0}".format(service))
                print(e)
                continue
            if DATABASES:
                break
else:
    DATABASES['default'] = dj_database_url.config(default='postgres://eventkit:eventkit_exports@localhost:5432/eventkit_exports')

DATABASES['default']['ENGINE'] = 'django.contrib.gis.db.backends.postgis'

DATABASES['default']['OPTIONS'] = {'options': '-c search_path=exports,public'}

if os.getenv("FEATURE_DATABASE_URL"):
    DATABASES['feature_data'] = dj_database_url.parse(os.getenv("FEATURE_DATABASE_URL"))
else:
    DATABASES['feature_data'] = DATABASES['default']

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
SESSION_USER_LAST_ACTIVE_AT = 'user_last_active_at'

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

UI_CONFIG = {
    'VERSION': os.environ.get('VERSION', ''),
    'LOGIN_DISCLAIMER': os.environ.get('LOGIN_DISCLAIMER', ''),
    'BANNER_BACKGROUND_COLOR': os.environ.get('BANNER_BACKGROUND_COLOR', ''),
    'BANNER_TEXT_COLOR': os.environ.get('BANNER_TEXT_COLOR', ''),
    'BANNER_TEXT': os.environ.get('BANNER_TEXT', ''),
    'BASEMAP_URL': os.environ.get('BASEMAP_URL', 'http://tile.openstreetmap.org/{z}/{x}/{y}.png'),
    'BASEMAP_COPYRIGHT': os.environ.get('BASEMAP_COPYRIGHT', 'Map data © OpenStreetMap contributors'),
    'MAX_DATAPACK_EXPIRATION_DAYS': os.environ.get('MAX_DATAPACK_EXPIRATION_DAYS', '30'),
}

if os.environ.get('USE_S3'):
    USE_S3 = True
else:
    USE_S3 = False

AWS_BUCKET_NAME = AWS_ACCESS_KEY = AWS_SECRET_KEY = None
if os.getenv("VCAP_SERVICES"):
    for service, listings in json.loads(os.getenv("VCAP_SERVICES")).iteritems():
        if 's3' in service.lower():
            try:
                AWS_BUCKET_NAME = listings[0]['credentials']['bucket']
                AWS_ACCESS_KEY = listings[0]['credentials']['access_key_id']
                AWS_SECRET_KEY = listings[0]['credentials']['secret_access_key']
            except (KeyError, TypeError) as e:
                continue
AWS_BUCKET_NAME = AWS_BUCKET_NAME or os.environ.get('AWS_BUCKET_NAME')
AWS_ACCESS_KEY = AWS_ACCESS_KEY or os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = AWS_SECRET_KEY or os.environ.get('AWS_SECRET_KEY')


MAPPROXY_CONCURRENCY = os.environ.get('MAPPROXY_CONCURRENCY', 1)

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

LAND_DATA_URL = os.environ.get('LAND_DATA_URL', "http://data.openstreetmapdata.com/land-polygons-split-3857.zip")

AUTO_LOGOUT_COOKIE_NAME = 'eventkit_auto_logout'

AUTO_LOGOUT_SECONDS = int(os.getenv('AUTO_LOGOUT_SECONDS', 0))
AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT = int(os.getenv('AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT', 5 * 60))
if AUTO_LOGOUT_SECONDS:
    MIDDLEWARE += ['eventkit_cloud.auth.auth.auto_logout']
