# -*- coding: utf-8 -*-
from __future__ import absolute_import

import os
from .base import *  # NOQA

# Extra installed apps
INSTALLED_APPS += (
    # any 3rd party apps
    'rest_framework',
    'rest_framework_gis',
    'rest_framework.authtoken',
    'rest_framework_swagger',
    # 'social.apps.django_app.default'
)

# 3rd party specific app settings


REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend',
                                'rest_framework.filters.SearchFilter',
                                'rest_framework.filters.OrderingFilter'),
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework.authentication.SessionAuthentication',
                                       'rest_framework.authentication.TokenAuthentication'),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        'eventkit_cloud.api.renderers.HOTExportApiRenderer',
    ),
    'EXCEPTION_HANDLER': 'eventkit_cloud.api.utils.eventkit_exception_handler',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.AcceptHeaderVersioning',
    'DEFAULT_VERSION': '1.0',
}


SWAGGER_SETTINGS = {
    'LOGIN_URL': 'rest_framework:login',
    'LOGOUT_URL': 'rest_framework:logout',
    'JSON_EDITOR': False if os.getenv('SWAGGER_JSON_EDITOR', 'False').lower() == 'false' else True,
    'SHOW_REQUEST_HEADERS': False if os.getenv('SWAGGER_SHOW_REQUEST_HEADERS', 'False').lower() == 'false' else True,
    'VALIDATOR_URL': os.getenv('SWAGGER_VALIDATOR_URL', None)
}
