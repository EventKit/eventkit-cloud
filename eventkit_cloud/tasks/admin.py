from django.contrib import admin

from .models import ExportRun

class ExportRunAdmin(admin.ModelAdmin):
    readonly_fields=('delete_user', 'user', 'status', 'started_at', 'finished_at')
    list_display = ['uid', 'status', 'user', 'notified', 'expiration', 'deleted']

admin.site.register(ExportRun, ExportRunAdmin)
