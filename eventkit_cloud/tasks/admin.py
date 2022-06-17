import logging
import pickle
import traceback

from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.db.models import QuerySet
from django.http import HttpRequest

from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportRunFile,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
    UserDownload,
)

logger = logging.getLogger(__name__)


class DataProviderTaskRecordAdmin(admin.ModelAdmin):
    model = DataProviderTaskRecord

    readonly_fields = (
        "name",
        "slug",
        "run",
        "status",
        "display",
        "estimated_size",
        "estimated_duration",
        "preview",
        "created_at",
        "updated_at",
    )
    search_fields = ("uid", "name", "provider", "status")
    list_display = ["uid", "name", "provider", "run", "status", "updated_at"]

    def has_add_permission(self, request, obj=None):
        return False


class ExportTaskRecordAdmin(admin.ModelAdmin):
    model = ExportTaskRecord

    readonly_fields = (
        "export_provider_task",
        "celery_uid",
        "name",
        "status",
        "created_at",
        "started_at",
        "updated_at",
        "finished_at",
        "progress",
        "estimated_finish",
        "pid",
        "worker",
        "cancel_user",
        "result",
        "exceptions",
    )
    search_fields = [
        "uid",
        "name",
        "status",
        "export_provider_task__uid",
        "export_provider_task__slug",
        "export_provider_task__run__uid",
        "export_provider_task__run__job__uid",
    ]

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
            exceptions += [" ".join(traceback.format_exception(*exc_info))]  # type: ignore
        return "\n".join(exceptions)

    list_display = ["uid", "name", "progress", "status", "display"]

    def has_add_permission(self, request, obj=None):
        return False


def soft_delete_runs(modeladmin: ModelAdmin, request: HttpRequest, queryset: "QuerySet[ExportRun]"):
    for run in queryset:
        run.soft_delete()


class ExportRunAdmin(admin.ModelAdmin):
    readonly_fields = ("delete_user", "user", "status", "created_at", "started_at", "finished_at")
    list_display = ["uid", "get_name", "status", "user", "notified", "created_at", "deleted"]
    list_filter = ("status",)
    # Searching by date (created_at) supports string like "2022-06-09" to search for June 9, 2022
    search_fields = ("job__name", "created_at", "user__username")

    actions = [soft_delete_runs]

    def get_name(self, obj):
        return obj.job.name

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    get_name.short_description = "Job Name"  # type: ignore
    get_name.admin_order_field = "job__name"  # type: ignore

    def has_add_permission(self, request, obj=None):
        return False


class ExportRunFileAdmin(admin.ModelAdmin):
    list_display = ["uid", "file", "provider", "directory"]


class UserDownloadAdmin(admin.ModelAdmin):
    """
    User download records
    """

    from eventkit_cloud.jobs.models import DataProvider

    provider: DataProvider

    def list_display_provider(self):
        if self.provider is None:
            return "DataPack Zip"
        else:
            return self.provider.slug

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    list_display_provider.short_description = "Provider"  # type: ignore
    model = UserDownload

    readonly_fields = ("user", "provider", "job", "downloaded_at")
    list_display = ("user", list_display_provider, "job", "downloaded_at")
    list_filter = ("user", ("downloaded_at", admin.DateFieldListFilter))

    def has_add_permission(self, request, obj=None):
        return False


class FileProducingTaskResultAdmin(admin.ModelAdmin):
    list_display = ["filename", "size", "download_url", "deleted"]


class RunZipFileAdmin(admin.ModelAdmin):
    list_display = ["uid", "run", "downloadable_file"]


admin.site.register(DataProviderTaskRecord, DataProviderTaskRecordAdmin)
admin.site.register(ExportRun, ExportRunAdmin)
admin.site.register(ExportRunFile, ExportRunFileAdmin)
admin.site.register(UserDownload, UserDownloadAdmin)
admin.site.register(ExportTaskRecord, ExportTaskRecordAdmin)
admin.site.register(FileProducingTaskResult, FileProducingTaskResultAdmin)
admin.site.register(RunZipFile, RunZipFileAdmin)
