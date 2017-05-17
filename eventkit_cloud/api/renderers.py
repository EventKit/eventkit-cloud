# -*- coding: utf-8 -*-
from rest_framework.renderers import BrowsableAPIRenderer
from rest_framework.renderers import BaseRenderer


class HOTExportApiRenderer(BrowsableAPIRenderer):
    """Custom APIRenderer to remove editing forms from Browsable API."""

    def get_context(self, data, accepted_media_type, renderer_context):
        context = super(HOTExportApiRenderer, self).get_context(data, accepted_media_type, renderer_context)
        context['display_edit_forms'] = False
        return context


class PlainTextRenderer(BaseRenderer):
    media_type = 'text/plain'
    format = 'txt'

    def render(self, data, media_type=None, renderer_context=None):
        if isinstance(data, str):
            return data.encode(self.charset)
        return data
