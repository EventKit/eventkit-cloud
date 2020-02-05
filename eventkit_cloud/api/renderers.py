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
        context["display_edit_forms"] = False
        return context


class PlainTextRenderer(BaseRenderer):
    media_type = "text/plain"
    format = "txt"

    def render(self, data, media_type=None, renderer_context=None):
        if isinstance(data, str):
            return data.encode(self.charset)
        return data
