# -*- coding: utf-8 -*-
"""API url configuration."""
from __future__ import absolute_import

from rest_framework.routers import DefaultRouter

from .views import (
    ExportFormatViewSet, ExportRunViewSet,
    ExportTaskViewSet, JobViewSet, RegionMaskViewSet,
    RegionViewSet, DataProviderViewSet, SwaggerSchemaView,
    DataProviderTaskViewSet, UserDataViewSet, GroupViewSet, LicenseViewSet)


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
router.register(r'groups', GroupViewSet, base_name='groups')

schema_view = SwaggerSchemaView.as_view()

