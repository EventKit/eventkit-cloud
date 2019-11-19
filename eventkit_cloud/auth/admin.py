

import logging

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from eventkit_cloud.auth.models import OAuth
from eventkit_cloud.jobs.models import UserLicense

logger = logging.getLogger(__name__)


class OAuthAdmin(admin.ModelAdmin):

    search_fields = ['user__username', 'identification', 'commonname', 'user_info']
    list_display = ['user', 'identification', 'commonname']

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super(OAuthAdmin, self).get_actions(request)
        actions.pop('delete_selected', None)
        return actions


class UserLicenseInline(admin.TabularInline):
    model = UserLicense
    extra = 0


UserAdmin.inlines = [UserLicenseInline]
UserAdmin.readonly_fields += 'last_login', 'date_joined'


admin.site.unregister(Token)
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
admin.site.register(OAuth, OAuthAdmin)
