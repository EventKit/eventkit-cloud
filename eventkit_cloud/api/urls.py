# -*- coding: utf-8 -*-
"""API url configuration."""
from __future__ import absolute_import

from rest_framework.routers import DefaultRouter

from eventkit_cloud.api.views import (
    ExportFormatViewSet, ExportRunViewSet,
    ExportTaskViewSet, JobViewSet, RegionViewSet, DataProviderViewSet, SwaggerSchemaView,
    DataProviderTaskViewSet, UserDataViewSet, GroupViewSet, LicenseViewSet,
    UserJobActivityViewSet, NotificationViewSet
)

router = DefaultRouter(trailing_slash=False)
router.register(r'jobs', JobViewSet, base_name='jobs')
router.register(r'formats', ExportFormatViewSet, base_name='formats')
router.register(r'providers', DataProviderViewSet, base_name='providers')
router.register(r'licenses', LicenseViewSet, base_name='licenses')
router.register(r'runs', ExportRunViewSet, base_name='runs')
router.register(r'provider_tasks', DataProviderTaskViewSet, base_name='provider_tasks')
router.register(r'tasks', ExportTaskViewSet, base_name='tasks')
router.register(r'regions', RegionViewSet, base_name='regions')
router.register(r'users', UserDataViewSet, base_name='users')
router.register(r'user/activity/jobs', UserJobActivityViewSet, base_name='user_job_activity')
router.register(r'groups', GroupViewSet, base_name='groups')
router.register(r'notifications', NotificationViewSet, base_name='notifications')

schema_view = SwaggerSchemaView.as_view()
