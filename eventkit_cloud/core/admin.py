from django.contrib import admin
from django.contrib.sites.models import Site

from .models import GroupPermission, JobPermission

admin.site.unregister(Site)

admin.site.register(GroupPermission)
admin.site.register(JobPermission)
