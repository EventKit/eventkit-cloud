from django.contrib import admin

from .models import ExportRun, ExportTaskRecord

class ExportRunAdmin(admin.ModelAdmin):
    readonly_fields=('delete_user',)

admin.site.register(ExportRun, ExportRunAdmin)
admin.site.register(ExportTaskRecord)