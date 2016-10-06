# -*- coding: utf-8 -*-
from __future__ import absolute_import

import urlparse

from .project import *  # NOQA

# Set debug to True for development
DEBUG = True
LOGGING_OUTPUT_ENABLED = DEBUG
LOGGING_LOG_SQL = DEBUG

INSTALLED_APPS += (
    'django_extensions',
)

uri = os.environ.get('DATABASE_URL')
if uri:
    uri = urlparse.urlparse(uri)
    DATABASES = {
        'default': {
            'ENGINE': 'django.contrib.gis.db.backends.postgis',
            'NAME': uri.path[1:],
            'OPTIONS': {
                'options': '-c search_path=exports,public',
                ##'sslmode': 'require',
            },
            'CONN_MAX_AGE': None,
            'USER': uri.username,
            'PASSWORD': uri.password,
            'HOST': uri.hostname
        }
    }

else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.contrib.gis.db.backends.postgis',
            'NAME': 'eventkit_exports_dev',
            'OPTIONS': {
                'options': '-c search_path=exports,public',
                ##'sslmode': 'require',
            },
            'CONN_MAX_AGE': None,
            'USER': 'eventkit',
            'PASSWORD': 'eventkit_exports_dev',
            'HOST': 'postgis'
        }
    }


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
SESSION_COOKIE_DOMAIN = 'cloud.eventkit.dev'
SESSION_COOKIE_PATH = '/'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)s] %(message)s",
            'datefmt': "%d/%b/%Y %H:%M:%S"
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
		'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'formatter': 'verbose'
        },
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'level': 'DEBUG',
        }
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'propagate': True,
           # 'level': 'DEBUG',
            'level': 'ERROR',
        },
        'eventkit_cloud.api': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.api.tests': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.tasks.tests': {
            'handlers': ['console'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.tasks': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.celery.task': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.jobs': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.jobs.tests': {
            'handlers': ['console', 'file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.utils': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud.utils.tests': {
            'handlers': ['console', 'file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'eventkit_cloud': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'tasks': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG',
        },
        'celery.task': {
            'handlers': ['file'],
            'propagate': True,
            'level': 'DEBUG'
        }
    }
}
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

if os.environ.get('USE_S3'):
    USE_S3 = True
else:
    USE_S3 = False

AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME')
AWS_ACCESS_KEY = os.environ.get('AWS_ACCESS_KEY')
AWS_SECRET_KEY = os.environ.get('AWS_SECRET_KEY')

AWS_BUCKET_NAME = os.environ.get('AWS_BUCKET_NAME', 'eventkit')
ANONYMOUS_USER_ID=-1
