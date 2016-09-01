# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .dev import *  # NOQA

DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'hot_exports_dev',
        'OPTIONS': {
            'options': '-c search_path=exports,public',
            'sslmode': 'require',
        },
        'CONN_MAX_AGE': None,
        'USER': 'hot',
        'PASSWORD': 'password',
        'HOST': 'localhost'
    }
}


EXPORT_STAGING_ROOT = '/project/data/export_staging/'

# where exports are stored for public download
EXPORT_DOWNLOAD_ROOT = '/project/data/export_downloads/'

# the root url for export downloads
EXPORT_MEDIA_ROOT = '/downloads/'

OVERPASS_API_URL = 'http://localhost:8000/cgi-bin/interpreter'
