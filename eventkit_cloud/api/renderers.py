# -*- coding: utf-8 -*-
from rest_framework.renderers import BaseRenderer, JSONRenderer


class PlainTextRenderer(BaseRenderer):
    media_type = "text/plain"
    format = "txt"

    def render(self, data, media_type=None, renderer_context=None):
        if isinstance(data, str):
            return data.encode(self.charset)
        return data


class GeojsonRenderer(JSONRenderer):
    format = "geojson"
    media_type = "application/geo+json"
