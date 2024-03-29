# -*- coding: utf-8 -*-
"""API url configuration."""

import notifications.urls
from django.conf import settings
from django.urls import include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework.schemas import get_schema_view

from eventkit_cloud.api.views import (
    AuditEventViewSet,
    DataProviderRequestViewSet,
    DataProviderTaskRecordViewSet,
    DataProviderViewSet,
    EstimatorView,
    ExportFormatViewSet,
    ExportRunViewSet,
    ExportTaskViewSet,
    GroupViewSet,
    JobViewSet,
    LicenseViewSet,
    MetricsView,
    NotificationViewSet,
    ProjectionViewSet,
    RegionalJustificationViewSet,
    RegionalPolicyViewSet,
    RegionViewSet,
    RunZipFileViewSet,
    SizeIncreaseRequestViewSet,
    TopicViewSet,
    UserDataViewSet,
    UserJobActivityViewSet,
    api_docs_view,
)

app_name = "api"

router = DefaultRouter(trailing_slash=False)
router.register(r"jobs", JobViewSet, basename="jobs")
router.register(r"formats", ExportFormatViewSet, basename="formats")
router.register(r"providers/requests/size", SizeIncreaseRequestViewSet, basename="size_requests")
router.register(r"providers/requests", DataProviderRequestViewSet, basename="provider_requests")
router.register(r"providers", DataProviderViewSet, basename="providers")
router.register(r"licenses", LicenseViewSet, basename="licenses")
router.register(r"runs/zipfiles", RunZipFileViewSet, basename="zipfiles")
router.register(r"runs", ExportRunViewSet, basename="runs")
router.register(r"provider_tasks", DataProviderTaskRecordViewSet, basename="provider_tasks")
router.register(r"tasks", ExportTaskViewSet, basename="tasks")
router.register(r"regions/policies", RegionalPolicyViewSet, basename="regional_policies")
router.register(r"regions/justifications", RegionalJustificationViewSet, basename="regional_justifications")
router.register(r"regions", RegionViewSet, basename="regions")
router.register(r"users", UserDataViewSet, basename="users")
router.register(r"user/activity/jobs", UserJobActivityViewSet, basename="user_job_activity")
router.register(r"groups", GroupViewSet, basename="groups")
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"projections", ProjectionViewSet, basename="projections")
router.register(r"audit_events", AuditEventViewSet, basename="audit_events")
router.register(r"topics", TopicViewSet, basename="topics")

urlpatterns = [
    re_path(r"^api/docs/$", api_docs_view, name="swagger-ui"),
    re_path(
        r"^api/openapi",
        get_schema_view(title="EventKit", description="Documentation for the EventKit API.", version=settings.VERSION),
        name="openapi-schema",
    ),
    re_path(r"^api/", include(router.urls)),
    re_path(r"^api/", include(notifications.urls)),
    re_path(r"^api/estimate$", EstimatorView.as_view()),
    re_path(r"^api/metrics$", MetricsView.as_view(), name="metrics"),
]
