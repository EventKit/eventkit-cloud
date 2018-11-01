from django import forms
from django.contrib import admin

from eventkit_cloud.tasks.models import ExportRun, UserDownload, ExportTaskRecord, FileProducingTaskResult, \
    ExportTaskException

from eventkit_cloud.tasks.enumerations import TaskStates

import logging
import pickle
import traceback

logger = logging.getLogger(__name__)


class ExportTaskRecordAdmin(admin.ModelAdmin):
    model = ExportTaskRecord

    readonly_fields = ('export_provider_task', 'celery_uid', 'name', 'status', 'progress', 'estimated_finish',
                       'pid', 'worker', 'cancel_user', 'result', 'exceptions')
    search_fields = ['uid', 'name', 'status', 'export_provider_task__uid', 'export_provider_task__slug',
                     'export_provider_task__run__uid', 'export_provider_task__run__job__uid']

    @staticmethod
    def exceptions(obj):

        exceptions = []
        for exc in obj.exceptions.all():
            # set a default (incase not found)
            exc_info = ["", "Exception info not found or unreadable."]
            try:
                exc_info = pickle.loads(exc.exception.encode()).exc_info
            except Exception as te:
                logger.warning(te)
            exceptions += [' '.join(traceback.format_exception(*exc_info))]
        return '\n'.join(exceptions)

    list_display = ['uid', 'name', 'progress', 'status', 'display']

    def has_add_permission(self, request, obj=None):
        return False


class ExportRunAdmin(admin.ModelAdmin):
    readonly_fields = ('delete_user', 'user', 'status', 'started_at', 'finished_at')
    list_display = ['uid', 'status', 'user', 'notified', 'expiration', 'deleted']

    def has_add_permission(self, request, obj=None):
        return False


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
admin.site.register(ExportTaskRecord, ExportTaskRecordAdmin)
