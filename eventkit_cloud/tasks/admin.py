from django.contrib import admin

from eventkit_cloud.tasks.models import ExportRun, UserDownload


class ExportRunAdmin(admin.ModelAdmin):
    readonly_fields=('delete_user', 'user', 'status', 'started_at', 'finished_at')
    list_display = ['uid', 'status', 'user', 'notified', 'expiration', 'deleted']


class UserDownloadAdmin(admin.ModelAdmin):
    """
    User download records
    """

    def list_display_provider(self):
        if self.provider is None:
            return 'DataPack Zip'
        else:
            return self.provider.slug
    list_display_provider.short_description = 'Provider'
    model = UserDownload

    readonly_fields = ('user', 'provider', 'job', 'downloaded_at')
    list_display = ('user', list_display_provider, 'job', 'downloaded_at')
    list_filter = ('user', ('downloaded_at', admin.DateFieldListFilter))

    def has_add_permission(self, request, obj=None):
        return False


admin.site.register(ExportRun, ExportRunAdmin)
admin.site.register(UserDownload, UserDownloadAdmin)
