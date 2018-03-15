from __future__ import absolute_import

import logging
from .models import OAuth
from django.contrib import admin


logger = logging.getLogger(__name__)


class OAuthAdmin(admin.ModelAdmin):

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super(OAuthAdmin, self).get_actions(request)
        del actions['delete_selected']
        return actions


admin.site.register(OAuth, OAuthAdmin)
