from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.sites.models import Site

from .models import GroupPermission, JobPermission


# http://djangoweekly.com/blog/post/viewbrowse-all-django-admin-edits-recent-actions-listing
class LogEntryAdmin(admin.ModelAdmin):
    readonly_fields = ('content_type', 'user', 'action_time', 'object_id', 'object_repr', 'action_flag',
                       'change_message')

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request, obj=None):
        return False

    def get_action(self, request):
        actions = super(LogEntryAdmin, self).get_actions(request)
        del actions['delete_selected']
        return actions


admin.site.unregister(Site)

admin.site.register(LogEntry, LogEntryAdmin)
admin.site.register(GroupPermission)
admin.site.register(JobPermission)
