import logging

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from eventkit_cloud.auth.models import OAuth
from eventkit_cloud.core.models import AttributeClass
from eventkit_cloud.jobs.models import UserLicense

logger = logging.getLogger(__name__)


class OAuthAdmin(admin.ModelAdmin):

    search_fields = ["user__username", "identification", "commonname", "user_info"]
    list_display = ["user", "identification", "commonname"]

    def has_delete_permission(self, request, obj=None):
        return False

    def get_actions(self, request):
        actions = super(OAuthAdmin, self).get_actions(request)
        actions.pop("delete_selected", None)
        return actions


class OAuthInline(admin.StackedInline):
    model = OAuth


class UserLicenseInline(admin.TabularInline):
    model = UserLicense
    extra = 0


class CustomUserAdmin(UserAdmin):

    inlines = [OAuthInline, UserLicenseInline]

    readonly_fields = UserAdmin.readonly_fields + ("last_login", "date_joined", "attribute_classes")

    def attribute_classes(self, obj):
        attribute_classes = AttributeClass.objects.filter(users__id=obj.id)
        return ", ".join([attribute_class.name for attribute_class in attribute_classes])

    fieldsets = UserAdmin.fieldsets + (("Attribute_Classes", {"fields": ("attribute_classes",)}),)


admin.site.unregister(Token)
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(OAuth, OAuthAdmin)
