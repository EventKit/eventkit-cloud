# -*- coding: utf-8 -*-
import json as default_json
import os

import simplejson as json
from django.conf import settings
from django.shortcuts import render, resolve_url
from rest_framework import status
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.renderers import BrowsableAPIRenderer


class HOTExportApiRenderer(BrowsableAPIRenderer):
    """Custom APIRenderer to remove editing forms from Browsable API."""

    def get_context(self, data, accepted_media_type, renderer_context):
        context = super(HOTExportApiRenderer, self).get_context(data, accepted_media_type, renderer_context)
        context['display_edit_forms'] = False
        return context


# alot of the code here is pulled right out of swagger-rest-framework to minimize the need for it as a production dependency

def get_swagger_settings():

    from django.test.signals import setting_changed
    from rest_framework.settings import APISettings

    DEFAULTS = {
        'USE_SESSION_AUTH': True,
        'SECURITY_DEFINITIONS': {
            'basic': {
                'type': 'basic'
            }
        },
        'LOGIN_URL': 'rest_framework:login',
        'LOGOUT_URL': 'rest_framework:logout',
        'DOC_EXPANSION': None,
        'APIS_SORTER': None,
        'OPERATIONS_SORTER': None,
        'JSON_EDITOR': False,
        'SHOW_REQUEST_HEADERS': False,
        'SUPPORTED_SUBMIT_METHODS': [
            'get',
            'post',
            'put',
            'delete',
            'patch'
        ],
        'VALIDATOR_URL': '',
        'ACCEPT_HEADER_VERSION': None,  # e.g. '1.0'
        'CUSTOM_HEADERS': {}  # A dictionary of key/vals to override headers
    }

    IMPORT_STRINGS = []

    swagger_settings = APISettings(
        user_settings=getattr(settings, 'SWAGGER_SETTINGS', {}),
        defaults=DEFAULTS,
        import_strings=IMPORT_STRINGS
    )

    def reload_settings(*args, **kwargs):  # pragma: no cover
        """
        Reloads settings during unit tests if override_settings decorator
        is used. (Taken from DRF)
        """
        # pylint: disable=W0603
        global swagger_settings

        if kwargs['setting'] == 'LOGIN_URL':
            swagger_settings.LOGIN_URL = kwargs['value']
        if kwargs['setting'] == 'LOGOUT_URL':
            swagger_settings.LOGOUT_URL = kwargs['value']
        if kwargs['setting'] != 'SWAGGER_SETTINGS':
            return

        swagger_settings = APISettings(
            kwargs['value'],
            DEFAULTS,
            IMPORT_STRINGS
        )

    setting_changed.connect(reload_settings)

    return swagger_settings


swagger_settings = get_swagger_settings()


def get_schema_file():
    return settings.ABS_PATH(os.path.join("eventkit_cloud", "api", "schema.json"))


def update_schema(new_schema):
    if not new_schema:
        return
    schema_file = get_schema_file()
    with open(schema_file, 'r+') as open_file:
        old_schema = default_json.load(open_file)
        open_file.seek(0)
        if old_schema != new_schema:
            default_json.dump(new_schema, open_file)


class PlainTextRenderer(BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        if isinstance(data, str):
            return data.encode(self.charset)
        return data


class CustomOpenAPIRenderer(BaseRenderer):
    media_type = 'application/openapi+json'
    charset = None
    format = 'openapi'

    def encode(self, document, **options):
        import coreapi
        from coreapi.compat import force_bytes
        from openapi_codec.encode import generate_swagger_object

        if not isinstance(document, coreapi.Document):
            raise TypeError('Expected a `coreapi.Document` instance')

        data = generate_swagger_object(document)
        data.update(**options)

        return force_bytes(json.dumps(data))

    def render(self, data, accepted_media_type=None, renderer_context=None):
        try:
            import coreapi
            from openapi_codec import OpenAPICodec

            OpenAPICodec.encode = self.encode
            if renderer_context['response'].status_code != status.HTTP_200_OK:
                return JSONRenderer().render(data)
            options = self.get_customizations()
            schema = OpenAPICodec().encode(data, **options)
            update_schema(json.loads(schema))
            return schema
        except (ImportError, ModuleNotFoundError) as e:
            # Couldn't import coreapi so this must be in production, just used static schema
            schema_file = get_schema_file()
            with open(schema_file, 'rb') as open_file:
                return open_file.read()

    def get_customizations(self):
        """
        Adds settings, overrides, etc. to the specification.
        """
        data = {}
        if swagger_settings.SECURITY_DEFINITIONS:
            data['securityDefinitions'] = swagger_settings.SECURITY_DEFINITIONS
        return data


class CustomSwaggerUIRenderer(BaseRenderer):

    media_type = 'text/html'
    format = 'swagger'
    template = 'index.html'
    charset = 'utf-8'

    def render(self, data, accepted_media_type=None, renderer_context=None):
        self.set_context(data, renderer_context)
        return render(
            renderer_context['request'],
            self.template,
            renderer_context
        )

    def set_context(self, data, renderer_context):
        renderer_context['USE_SESSION_AUTH'] = swagger_settings.USE_SESSION_AUTH

        renderer_context.update(self.get_auth_urls())

        drs_settings = self.get_ui_settings()
        renderer_context['drs_settings'] = json.dumps(drs_settings)
        renderer_context['spec'] = CustomOpenAPIRenderer().render(
            data=data,
            renderer_context=renderer_context
        ).decode()

    def get_auth_urls(self):
        urls = {}
        if settings.LOGIN_URL is not None:
            urls['LOGIN_URL'] = resolve_url(swagger_settings.LOGIN_URL)
        if settings.LOGOUT_URL is not None:
            urls['LOGOUT_URL'] = resolve_url(swagger_settings.LOGOUT_URL)

        return urls

    def get_ui_settings(self):
        data = {
            'apisSorter': swagger_settings.APIS_SORTER,
            'docExpansion': swagger_settings.DOC_EXPANSION,
            'jsonEditor': swagger_settings.JSON_EDITOR,
            'operationsSorter': swagger_settings.OPERATIONS_SORTER,
            'showRequestHeaders': swagger_settings.SHOW_REQUEST_HEADERS,
            'supportedSubmitMethods': swagger_settings.SUPPORTED_SUBMIT_METHODS,
            'acceptHeaderVersion': swagger_settings.ACCEPT_HEADER_VERSION,
            'customHeaders': swagger_settings.CUSTOM_HEADERS,
        }
        if swagger_settings.VALIDATOR_URL != '':
            data['validatorUrl'] = swagger_settings.VALIDATOR_URL

        return data
