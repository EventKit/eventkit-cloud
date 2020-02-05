# -*- coding: utf-8 -*-
"""API url configuration."""

from django.urls import include, re_path
from django.views.generic import TemplateView

from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from eventkit_cloud.api.views import (
    ExportFormatViewSet,
    ExportRunViewSet,
    ProjectionViewSet,
    ExportTaskViewSet,
    JobViewSet,
    RegionViewSet,
    DataProviderViewSet,
    DataProviderTaskViewSet,
    UserDataViewSet,
    GroupViewSet,
    LicenseViewSet,
    UserJobActivityViewSet,
    NotificationViewSet,
    EstimatorView,
    AuditEventViewSet,
)

import notifications.urls


app_name = "api"

router = DefaultRouter(trailing_slash=False)
router.register(r"jobs", JobViewSet, base_name="jobs")
router.register(r"formats", ExportFormatViewSet, base_name="formats")
router.register(r"providers", DataProviderViewSet, base_name="providers")
router.register(r"licenses", LicenseViewSet, base_name="licenses")
router.register(r"runs", ExportRunViewSet, base_name="runs")
router.register(r"provider_tasks", DataProviderTaskViewSet, base_name="provider_tasks")
router.register(r"tasks", ExportTaskViewSet, base_name="tasks")
router.register(r"regions", RegionViewSet, base_name="regions")
router.register(r"users", UserDataViewSet, base_name="users")
router.register(r"user/activity/jobs", UserJobActivityViewSet, base_name="user_job_activity")
router.register(r"groups", GroupViewSet, base_name="groups")
router.register(r"notifications", NotificationViewSet, base_name="notifications")
router.register(r"projections", ProjectionViewSet, base_name="projections")
router.register(r"audit_events", AuditEventViewSet, base_name="audit_events")


urlpatterns = [
    re_path(r"^api/docs/$", TemplateView.as_view(
        template_name='swagger-ui.html',
        extra_context={'schema_url':'api:openapi-schema'}
    ), name='swagger-ui'),
    re_path(r"^api/openapi", get_schema_view(
        title="EventKit",
        url="/"
    ), name='openapi-schema'),
    re_path(r"^api/", include(router.urls)),
    re_path(r"^api/", include(notifications.urls)),
    re_path(r"^api/estimate$", EstimatorView.as_view()),
]
