# -*- coding: utf-8 -*-
"""API url configuration."""

from rest_framework.routers import DefaultRouter
from rest_framework_swagger.views import get_swagger_view

from eventkit_cloud.api.views import (
    ExportFormatViewSet, ExportRunViewSet,
    ExportTaskViewSet, JobViewSet, RegionMaskViewSet,
    RegionViewSet, ExportProviderViewSet,
    ExportProviderTaskViewSet
)

router = DefaultRouter(trailing_slash=False)
router.register(r'jobs', JobViewSet, base_name='jobs')
router.register(r'formats', ExportFormatViewSet, base_name='formats')
router.register(r'providers', ExportProviderViewSet, base_name='providers')
router.register(r'runs', ExportRunViewSet, base_name='runs')
router.register(r'provider_tasks', ExportProviderTaskViewSet, base_name='provider_tasks')
router.register(r'tasks', ExportTaskViewSet, base_name='tasks')
router.register(r'regions', RegionViewSet, base_name='regions')
router.register(r'maskregions', RegionMaskViewSet, base_name='mask')

schema_view = get_swagger_view(title='EventKit-Cloud API')