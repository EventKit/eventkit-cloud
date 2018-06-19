from django.contrib import admin


from django.utils.html import format_html
from .models import ExportRun, UserDownload


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

    def download_url(self):
        return format_html('<a href=\'{}\'>Link</a>'.format(self.downloadable.download_url))

    model = UserDownload
    readonly_fields = ('user', 'provider', 'job', 'downloaded_at')
    list_display = ('user', list_display_provider, 'job', 'downloaded_at', download_url)
    list_filter = ('user', ('downloaded_at', admin.DateFieldListFilter))

    def has_add_permission(self, request, obj=None):
        return False


admin.site.register(ExportRun, ExportRunAdmin)
admin.site.register(UserDownload, UserDownloadAdmin)
