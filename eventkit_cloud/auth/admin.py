from __future__ import absolute_import

import logging
from .models import OAuth
from django.contrib import admin


logger = logging.getLogger(__name__)

admin.site.register(OAuth)