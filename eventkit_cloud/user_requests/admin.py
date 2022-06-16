from django.contrib import admin

from eventkit_cloud.user_requests.models import DataProviderRequest, SizeIncreaseRequest, UserSizeRule


class DataProviderRequestAdmin(admin.ModelAdmin):
    list_display = [
        "uid",
        "status",
        "user",
        "name",
        "url",
        "service_description",
        "created_at",
        "updated_at",
    ]

    list_filter = [
        "status",
    ]

    readonly_fields = [
        "uid",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "uid",
        "user",
    ]


class SizeIncreaseRequestAdmin(admin.ModelAdmin):
    list_display = [
        "uid",
        "status",
        "user",
        "provider",
        "requested_aoi_size",
        "requested_data_size",
        "created_at",
        "updated_at",
    ]

    list_filter = [
        "status",
        "provider",
    ]

    readonly_fields = [
        "uid",
        "created_at",
        "updated_at",
    ]

    search_fields = [
        "uid",
        "user",
    ]


class UserSizeRuleAdmin(admin.ModelAdmin):
    list_display = [
        "get_last_name",
        "get_first_name",
        "user",
        "provider",
        "max_data_size",
        "max_selection_size",
    ]

    search_fields = ("user__last_name", "user__first_name", "user", "provider__slug", "provider__name")

    ordering = ("user__last_name", "user__first_name", "user__username", "provider__name")

    def get_last_name(self, obj):
        return obj.user.last_name

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    get_last_name.short_description = "Last Name"  # type: ignore

    def get_first_name(self, obj):
        return obj.user.first_name

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    get_first_name.short_description = "First Name"  # type: ignore


admin.site.register(DataProviderRequest, DataProviderRequestAdmin)
admin.site.register(SizeIncreaseRequest, SizeIncreaseRequestAdmin)
admin.site.register(UserSizeRule, UserSizeRuleAdmin)
