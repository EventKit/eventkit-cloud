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
router.register(r"jobs", JobViewSet, basename="jobs")
router.register(r"formats", ExportFormatViewSet, basename="formats")
router.register(r"providers", DataProviderViewSet, basename="providers")
router.register(r"licenses", LicenseViewSet, basename="licenses")
router.register(r"runs", ExportRunViewSet, basename="runs")
router.register(r"provider_tasks", DataProviderTaskViewSet, basename="provider_tasks")
router.register(r"tasks", ExportTaskViewSet, basename="tasks")
router.register(r"regions", RegionViewSet, basename="regions")
router.register(r"users", UserDataViewSet, basename="users")
router.register(r"user/activity/jobs", UserJobActivityViewSet, basename="user_job_activity")
router.register(r"groups", GroupViewSet, basename="groups")
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"projections", ProjectionViewSet, basename="projections")
router.register(r"audit_events", AuditEventViewSet, basename="audit_events")


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
