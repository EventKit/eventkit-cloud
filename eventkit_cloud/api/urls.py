# -*- coding: utf-8 -*-
"""API url configuration."""

from rest_framework.routers import DefaultRouter

from eventkit_cloud.api.views import (
    ExportConfigViewSet, ExportFormatViewSet, ExportRunViewSet,
    ExportTaskViewSet, JobViewSet, PresetViewSet, RegionMaskViewSet,
    RegionViewSet, TransformViewSet, TranslationViewSet, ExportProviderViewSet,
    ExportProviderTaskViewSet
)
from rest_framework_swagger.views import get_swagger_view
from django.conf.urls import url

schema_view = get_swagger_view(title='EventKit-Cloud API')

urlpatterns = [
    url(r'^docs$', schema_view)
]

router = DefaultRouter(trailing_slash=False)
router.register(r'jobs', JobViewSet, base_name='jobs')
router.register(r'formats', ExportFormatViewSet, base_name='formats')
router.register(r'providers', ExportProviderViewSet, base_name='providers')
router.register(r'runs', ExportRunViewSet, base_name='runs')
router.register(r'provider_tasks', ExportProviderTaskViewSet, base_name='provider_tasks')
router.register(r'tasks', ExportTaskViewSet, base_name='tasks')
router.register(r'regions', RegionViewSet, base_name='regions')
router.register(r'maskregions', RegionMaskViewSet, base_name='mask')
router.register(r'configurations', ExportConfigViewSet, base_name='configs')
router.register(r'configuration/presets', PresetViewSet, base_name='presets')
router.register(r'configuration/translations', TranslationViewSet, base_name='translations')
router.register(r'configuration/transforms', TransformViewSet, base_name='transforms')
