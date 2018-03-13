from django.contrib import admin

from .models import GroupPermission, JobPermission

admin.site.register(GroupPermission)
admin.site.register(JobPermission)
