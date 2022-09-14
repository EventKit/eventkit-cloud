# -*- coding: utf-8 -*-

"""Provides classes for handling API requests."""
import itertools
import json
import logging
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Type, Union

from audit_logging.models import AuditEvent
from dateutil import parser
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import GEOSException, GEOSGeometry  # type: ignore
from django.core.cache import cache
from django.db import transaction
from django.db.models import Exists, Func, OuterRef, Q, QuerySet, Subquery
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from notifications.models import Notification
from rest_framework import filters, mixins, permissions, status, views, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import APIException, NotFound, PermissionDenied
from rest_framework.parsers import JSONParser
from rest_framework.renderers import BrowsableAPIRenderer, JSONRenderer
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from eventkit_cloud.api.filters import (
    ExportRunFilter,
    GroupFilter,
    JobFilter,
    LogFilter,
    UserFilter,
    UserJobActivityFilter,
)
from eventkit_cloud.api.pagination import LinkHeaderPagination
from eventkit_cloud.api.permissions import HasValidAccessToken, IsOwnerOrReadOnly
from eventkit_cloud.api.renderers import GeojsonRenderer, PlainTextRenderer
from eventkit_cloud.api.serializers import (
    AuditEventSerializer,
    DataProviderGeoFeatureSerializer,
    DataProviderRequestSerializer,
    DataProviderSerializer,
    DataProviderTaskRecordSerializer,
    ExportFormatSerializer,
    ExportRunGeoFeatureSerializer,
    ExportRunSerializer,
    ExportTaskRecordSerializer,
    FilteredDataProviderGeoFeatureSerializer,
    FilteredDataProviderSerializer,
    FilteredDataProviderTaskRecordSerializer,
    GroupSerializer,
    GroupUserSerializer,
    JobSerializer,
    LicenseSerializer,
    ListJobSerializer,
    NotificationSerializer,
    ProjectionSerializer,
    ProviderTaskSerializer,
    RegionalJustificationSerializer,
    RegionalPolicySerializer,
    RegionMaskSerializer,
    RegionSerializer,
    RunZipFileSerializer,
    SizeIncreaseRequestSerializer,
    TopicSerializer,
    UserDataSerializer,
    UserJobActivitySerializer,
    basic_data_provider_list_serializer,
    basic_geojson_list_serializer,
    filtered_basic_data_provider_serializer,
)
from eventkit_cloud.api.utils import (
    get_binned_groups,
    get_download_counts_by_area,
    get_download_counts_by_product,
    get_logins_per_day,
    get_run_zip_file,
)
from eventkit_cloud.api.validators import (
    get_area_in_sqkm,
    get_bbox_area_in_sqkm,
    validate_bbox_params,
    validate_search_bbox,
)
from eventkit_cloud.auth.views import requires_oauth_authentication
from eventkit_cloud.core.helpers import NotificationLevel, NotificationVerb, get_query_cache_key, sendnotification
from eventkit_cloud.core.mapped_cache import MappedCache
from eventkit_cloud.core.models import (
    GroupPermission,
    GroupPermissionLevel,
    annotate_groups_restricted,
    annotate_users_restricted,
    attribute_class_filter,
    get_group_counts,
)
from eventkit_cloud.jobs.models import (
    DatamodelPreset,
    DataProvider,
    DataProviderTask,
    ExportFormat,
    Job,
    JobPermission,
    JobPermissionLevel,
    License,
    Projection,
    Region,
    RegionalJustification,
    RegionalPolicy,
    RegionMask,
    Topic,
    UserFavoriteProduct,
    UserJobActivity,
    VisibilityState,
)
from eventkit_cloud.tasks.export_tasks import cancel_export_provider_task, pick_up_run_task
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportTaskRecord,
    RunZipFile,
    UserDownload,
    prefetch_export_runs,
)
from eventkit_cloud.tasks.task_factory import (
    Error,
    InvalidLicense,
    check_job_permissions,
    create_run,
    get_invalid_licenses,
)
from eventkit_cloud.tasks.util_tasks import rerun_data_provider_records
from eventkit_cloud.user_requests.models import DataProviderRequest, SizeIncreaseRequest
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator
from eventkit_cloud.utils.stats.geomutils import get_estimate_cache_key

# Get an instance of a logger
logger = logging.getLogger(__name__)

# controls how api responses are rendered
renderer_classes: Tuple[Type, ...] = (BrowsableAPIRenderer, JSONRenderer)

DEFAULT_TIMEOUT = 60 * 60 * 24  # One Day
ESTIMATE_CACHE_TIMEOUT = 60 * 60 * 12


class EventkitViewSet(viewsets.ModelViewSet):
    renderer_classes = renderer_classes


class JobViewSet(EventkitViewSet):
    """
    Main endpoint for export creation and management. Provides endpoints
    for creating, listing and deleting export jobs.

    Updates to existing jobs are not supported as exports can be cloned.

    Request data can be posted as either `application/x-www-form-urlencoded` or `application/json`.

    **Request parameters**:

    * name (required): The name of the export.
    * description (required): A description of the export.
    * event: The project or event associated with this export, eg Nepal Activation.
    * xmin (required): The minimum longitude coordinate.
    * ymin (required): The minimum latitude coordinate.
    * xmax (required): The maximum longitude coordinate.
    * ymax (required): The maximum latitude coordinate.
    * formats (required): One of the supported export formats ([html](/api/formats) or [json](/api/formats.json)).
        * Use the format `slug` as the value of the formats parameter, eg `formats=thematic&formats=shp`.
    * min_zoom: The minimum zoom level for your export on a per provider basis.
    * max_zoom: The maximum zoom level for your export on a per provider basis.
    * preset: One of the published preset files ([html](/api/configurations) or [json](/api/configurations.json)).
        * Use the `uid` as the value of the preset parameter, eg `preset=eed84023-6874-4321-9b48-2f7840e76257`.
        * If no preset parameter is provided, then the default HDM tags will be used for the export.
    * visibility : PUBLIC  PRIVATE or SHARED
        * Unpublished exports will be purged from the system 48 hours after they are created.

    """

    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly, HasValidAccessToken)
    parser_classes = (JSONParser,)
    lookup_field = "uid"
    pagination_class = LinkHeaderPagination
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filter_class = JobFilter
    search_fields = (
        "name",
        "description",
        "visibility",
        "event",
        "user__username",
        "region__name",
    )

    def get_queryset(self):
        """Return all objects user can view."""

        jobs = JobPermission.userjobs(self.request.user, JobPermissionLevel.READ.value)
        return Job.objects.filter(Q(visibility=VisibilityState.PUBLIC.value) | Q(pk__in=jobs))

    def list(self, request, *args, **kwargs):
        """
        List export jobs.

        The list of returned exports can be filtered by the **filters.JobFilter**
        and/or by a bounding box extent.

        Args:
            request: the HTTP request.
            *args: Variable length argument list.
            **kwargs: Arbitary keyword arguments.

        Returns:
            A serialized collection of export jobs.
            Uses the **serializers.ListJobSerializer** to
            return a simplified representation of export jobs.

        Raises:
            ValidationError: if the supplied extents are invalid.
        """
        params = self.request.query_params.get("bbox", None)
        if params is None:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ListJobSerializer(page, many=True, context={"request": request})
                return self.get_paginated_response(serializer.data)
            else:
                serializer = ListJobSerializer(queryset, many=True, context={"request": request})
                return Response(serializer.data)
        if len(params.split(",")) < 4:
            raise ValidationError(code="missing_bbox_parameter", detail="Missing bounding box parameter")
        else:
            extents = params.split(",")
            data = {
                "xmin": extents[0],
                "ymin": extents[1],
                "xmax": extents[2],
                "ymax": extents[3],
            }
            try:
                bbox_extents = validate_bbox_params(data)
                bbox = validate_search_bbox(bbox_extents)
                queryset = self.filter_queryset(Job.objects.filter(the_geom__within=bbox))
                page = self.paginate_queryset(queryset)
                if page is not None:
                    serializer = ListJobSerializer(page, many=True, context={"request": request})
                    return self.get_paginated_response(serializer.data)
                else:
                    serializer = ListJobSerializer(queryset, many=True, context={"request": request})
                    return Response(serializer.data)
            except ValidationError as e:
                logger.debug(e.detail)
                raise ValidationError(code="validation_error", detail=e.detail)

    def create(self, request, *args, **kwargs):
        """
        Create a Job from the supplied request data.

        The request data is validated by *api.serializers.JobSerializer*.
        Associates the *Job* with required *ExportFormats*, *ExportConfig*

        * request: the HTTP request in JSON.

            Example:

                {
                    "name" : "Example Name",
                    "description" : "Example Description",
                    "event" : "Example Event (Project)",
                    "include_zipfile" : true,
                    "selection": { ... valid geojson ... },
                    "tags" : [],
                    "projections" : [4326],
                    "provider_tasks" : [{
                            "provider" : "osm",
                            "formats" : ["shp", "gpkg"]
                        }
                    ]
                }


        To monitor the resulting export run retrieve the `uid` value from the returned json
        and call /api/runs?job_uid=[the returned uid]

        * Returns: the newly created Job instance.

            Example:

                {
                  "provider_tasks": [
                    {
                      "provider": "osm",
                      "formats": [
                        "gpkg"
                      ]
                    }
                  ],
                  "uid": "cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
                  "url": "http://host.docker.internal/api/jobs/cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
                  "name": "test",
                  "description": "test",
                  "event": "test",
                  "created_at": "2017-03-10T15:09:29.802364Z",
                  "owner": "admin",
                  "exports": [
                    {
                      "formats": [
                        {
                          "uid": "167fbc03-83b3-41c9-8034-8566257cb2e8",
                          "url": "http://host.docker.internal/api/formats/gpkg",
                          "slug": "gpkg",
                          "name": "Geopackage",
                          "description": "GeoPackage"
                        }
                      ],
                      "provider": "OpenStreetMap Tiles"
                    }
                  ],
                  "configurations": [],
                  "visibility" : "PRIVATE",
                  "feature_save": false,
                  "feature_pub": false,
                  "region": null,
                  "extent": {
                    "type": "Feature",
                    "properties": {
                      "uid": "cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
                      "name": "test"
                    },
                    "geometry": {
                      "type": "Polygon",
                      "coordinates": [
                        [
                          [
                            -43.248281,
                            -22.816694
                          ],
                          [
                            -43.248281,
                            -22.812105
                          ],
                          [
                            -43.242617,
                            -22.812105
                          ],
                          [
                            -43.242617,
                            -22.816694
                          ],
                          [
                            -43.248281,
                            -22.816694
                          ]
                        ]
                      ]
                    }
                  },
                  "tags": [
                    {
                      "key": "highway",
                      "value": "path",
                      "data_model": "HDM",
                      "geom_types": [
                        "line"
                      ]
                    }
                  ],
                  "include_zipfile": false
                }

        * Raises: ValidationError: in case of validation errors.
        ** returns: Not 202
        """
        from eventkit_cloud.tasks.task_factory import InvalidLicense, Unauthorized

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            """Get the required data from the validated request."""
            export_providers = request.data.get("export_providers", [])
            provider_tasks = request.data.get("provider_tasks", [])
            projections = request.data.get("projections", [])
            tags = request.data.get("tags")
            preset = request.data.get("preset")

            with transaction.atomic():
                if export_providers:
                    for ep in export_providers:
                        ep["user"] = request.user.id
                    provider_serializer = DataProviderSerializer(
                        data=export_providers, many=True, context={"request": request}
                    )
                    if provider_serializer.is_valid():
                        provider_serializer.save()
                if len(provider_tasks) > 0:
                    """Save the job and make sure it's committed before running tasks."""
                    try:
                        job = serializer.save()
                        provider_serializer = ProviderTaskSerializer(
                            data=provider_tasks, many=True, context={"request": request}
                        )
                        try:
                            provider_serializer.is_valid(raise_exception=True)
                            data_provider_tasks = provider_serializer.save()
                            for data_provider_task in data_provider_tasks:
                                data_provider_task.job = job
                                data_provider_task.save()
                        except ValidationError:
                            raise ValidationError(
                                code="invalid_provider_task", detail="A provider and an export format must be selected."
                            )
                        # Check max area (skip for superusers)
                        if not self.request.user.is_superuser:
                            error_data: Dict[str, List[Any]] = {"errors": []}
                            for provider_task in job.data_provider_tasks.all():
                                provider = provider_task.provider
                                bbox = job.extents
                                srs = "4326"
                                cache_key = get_estimate_cache_key(
                                    bbox, srs, provider_task.min_zoom, provider_task.max_zoom, provider.slug
                                )
                                # find cache key that contains the estimator hash with correct time, size values
                                size, time = cache.get(cache_key, (None, None))
                                max_selection = provider.get_max_selection_size(self.request.user)
                                max_data_size = provider.get_max_data_size(self.request.user)

                                if provider.get_use_bbox():
                                    area = get_bbox_area_in_sqkm(job.the_geom)
                                else:
                                    area = get_area_in_sqkm(job.the_geom)

                                # Don't rely solely on max_data_size as estimates can sometimes be inaccurate
                                # Allow user to get a job that passes max_data_size or max_selection condition:
                                if size and max_data_size is not None:
                                    # max_data_size is an optional configuration
                                    if size <= max_data_size:
                                        continue
                                    else:
                                        status_code = status.HTTP_400_BAD_REQUEST
                                        error_data["errors"] += [
                                            {
                                                "status": status_code,
                                                "title": _("Estimated size too large"),
                                                "detail": _(
                                                    f"The estimated size "
                                                    f"exceeds the maximum data size for the {provider.name}"
                                                ),
                                            }
                                        ]

                                if max_selection and 0 < float(max_selection) < area:
                                    status_code = status.HTTP_400_BAD_REQUEST
                                    error_data["errors"] += [
                                        {
                                            "status": status_code,
                                            "title": _("Selection area too large"),
                                            "detail": _(f"The selected area is too large for the {provider.name}"),
                                        }
                                    ]
                            if error_data["errors"]:
                                return Response(error_data, status=status_code)

                        if preset:
                            """Get the tags from the uploaded preset."""
                            logger.debug("Found preset with uid: {0}".format(preset))
                            job.json_tags = preset
                            job.save()
                        elif tags:
                            """Get tags from request."""
                            simplified_tags = []
                            for entry in tags:
                                tag = {
                                    "key": entry["key"],
                                    "value": entry["value"],
                                    "geom": entry["geom_types"],
                                }
                                simplified_tags.append(tag)
                            job.json_tags = simplified_tags
                            job.save()
                        else:
                            """
                            Use hdm preset as default tags if no preset or tags
                            are provided in the request.
                            """
                            hdm_default_tags = DatamodelPreset.objects.get(name="hdm").json_tags
                            job.json_tags = hdm_default_tags
                            job.save()
                    except Exception as e:
                        logger.error(e)
                        raise
                else:
                    # TODO: Specify which provider task is invalid.
                    raise ValidationError(
                        code="invalid_provider_task",
                        detail=f"One or more provider tasks are invalid: {provider_tasks}.",
                    )

                try:
                    projection_db_objects = Projection.objects.filter(srid__in=projections)
                    job.projections.add(*projection_db_objects)
                    job.save()
                except Exception:
                    # TODO: Specify which projection is invalid.
                    raise ValidationError(
                        code="invalid_projection", detail=f"One or more projections are invalid: {projections}."
                    )

            # run the tasks
            # run needs to be created so that the UI can be updated with the task list.
            from audit_logging.utils import get_user_details

            user_details = get_user_details(request.user)
            try:
                # run needs to be created so that the UI can be updated with the task list.
                run_uid = create_run(job=job, user=request.user)
            except InvalidLicense as il:
                raise ValidationError(code="invalid_license", detail=str(il))
            except Unauthorized as ua:
                raise PermissionDenied(code="permission_denied", detail=str(ua))

            running = JobSerializer(job, context={"request": request})

            # It scaling by run we don't put the task on the queue we just run on demand.
            if not getattr(settings, "CELERY_SCALE_BY_RUN", False):
                # Run is passed to celery to start the tasks.
                pick_up_run_task(
                    run_uid=run_uid,
                    user_details=user_details,
                    session_token=request.session.get("access_token"),
                )
            return Response(running.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(methods=["get", "post"], detail=True)
    def run(self, request, uid=None, *args, **kwargs):
        """
        Creates the run (i.e. runs the job).

        Gets the job_uid and current user from the request.
        Creates an instance of the TaskFactory and
        calls run_task on it, passing the job_uid and user.

        *request:* the http request

        *Returns:*
            - the serialized run data.
        """
        from audit_logging.utils import get_user_details

        user_details = get_user_details(request.user)

        from eventkit_cloud.tasks.task_factory import InvalidLicense, Unauthorized

        try:
            # run needs to be created so that the UI can be updated with the task list.
            job = Job.objects.select_related("user").prefetch_related("runs").get(uid=uid)
            run_uid = create_run(job=job, user=request.user)
        except (InvalidLicense, Error) as err:
            return Response([{"detail": _(str(err))}], status.HTTP_400_BAD_REQUEST)
        # Run is passed to celery to start the tasks.
        except Unauthorized:
            raise PermissionDenied(
                code="permission_denied", detail="ADMIN permission is required to run this DataPack."
            )
        run = ExportRun.objects.get(uid=run_uid)
        if run:
            if not getattr(settings, "CELERY_SCALE_BY_RUN", False):
                pick_up_run_task(
                    run_uid=run_uid,
                    user_details=user_details,
                    session_token=request.session.get("access_token"),
                )
            logger.debug("Getting Run Data.")
            running = ExportRunSerializer(run, context={"request": request})
            logger.debug("Returning Run Data.")

            return Response(running.data, status=status.HTTP_202_ACCEPTED)

        else:
            return Response([{"detail": _("Failed to run Export")}], status.HTTP_400_BAD_REQUEST)

    @transaction.atomic
    def partial_update(self, request, uid=None, *args, **kwargs):
        """
        Update one or more attributes for the given job

        * request: the HTTP request in JSON.

            Examples:

                { "visibility" : 'SHARED', "featured" : true }
                { "featured" : false }

        * Returns: a copy of the new  values on success

            Example:

                {
                    "visibility": 'SHARED',
                    "featured" : true,
                    "success": true
                }

        ** returns: 400 on error

        """

        job = Job.objects.get(uid=uid)

        # Does the user have admin permission to make changes to this job?
        jobs = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)
        if not jobs.filter(id=job.id):
            return Response(
                [{"detail": "ADMIN permission is required to update this Datapack."}],
                status.HTTP_400_BAD_REQUEST,
            )
        response = {}
        payload = request.data

        for attribute, value in payload.items():
            if attribute == "visibility" and value not in VisibilityState.__members__:
                msg = "unknown visibility value - %s" % value
                return Response([{"detail": msg}], status.HTTP_400_BAD_REQUEST)

            if attribute == "permissions":
                pass
            elif hasattr(job, attribute):
                setattr(job, attribute, value)
                response[attribute] = value

            else:
                msg = "unidentified job attribute - %s" % attribute
                return Response([{"detail": msg}], status.HTTP_400_BAD_REQUEST)

        # update permissions if present.  Ensure we are not left with 0 admministrators
        # users and / or groups may be updated.  If no update info is provided, maintain
        # the current set of permissions.

        admins = 0
        if "permissions" in payload:
            serializer = JobSerializer(job, context={"request": request})
            current_permissions = serializer.get_permissions(job)
            if "members" not in payload["permissions"]:
                payload["permissions"]["members"] = current_permissions["members"]
            if "groups" not in payload["permissions"]:
                payload["permissions"]["groups"] = current_permissions["groups"]
            users = payload["permissions"]["members"]
            groups = payload["permissions"]["groups"]

            # make sure all user names, group names, and permissions are valid, and insure there is at least one admin
            # if the job is made private

            for index, set in enumerate([users, groups]):
                for key in set:
                    if index == 0:
                        record: Union[QuerySet[Group], QuerySet[User]] = User.objects.filter(username=key)
                    else:
                        record = Group.objects.filter(name=key)

                    if not record.exists():
                        return Response(
                            [{"detail": "unidentified user or group : %s" % key}],
                            status.HTTP_400_BAD_REQUEST,
                        )
                    perm = set[key]
                    if perm not in JobPermissionLevel.__members__:
                        return Response(
                            [{"detail": "invalid permission value : %s" % perm}],
                            status.HTTP_400_BAD_REQUEST,
                        )

                    if perm == GroupPermissionLevel.ADMIN.value:
                        admins += 1

            if admins == 0:
                return Response(
                    [{"detail": "Cannot update job permissions with no administrator."}],
                    status.HTTP_400_BAD_REQUEST,
                )

            # The request represents all expected permissions for the file not a partial update of the permissions.
            # Therefore we delete the existing permissions, because the new permissions should be the only permissions.
            with transaction.atomic():
                job.permissions.all().delete()
                user_objects = User.objects.filter(username__in=users)
                group_objects = Group.objects.filter(name__in=groups)
                user_job_permissions = [
                    JobPermission(job=job, content_object=user, permission=users.get(user.username))
                    for user in user_objects
                ]  # NOQA
                group_job_permissions = [
                    JobPermission(job=job, content_object=group, permission=groups.get(group.name))
                    for group in group_objects
                ]  # NOQA
                JobPermission.objects.bulk_create(user_job_permissions + group_job_permissions)

            response["permissions"] = payload["permissions"]

        job.save()
        response["success"] = True
        return Response(response, status=status.HTTP_200_OK)

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        Look up a single job by uid value.
        * uid: optional job uid lookup field
        * return: The selected job.
        """
        return super(JobViewSet, self).retrieve(self, request, uid, *args, **kwargs)

    def update(self, request, uid=None, *args, **kwargs):
        """
        Update a job object, looked up by uid.
        * uid: optional job uid lookup field
        * return: The status of the update.
        """
        return super(JobViewSet, self).update(self, request, uid, *args, **kwargs)

    @action(methods=["post"], detail=False)
    def filter(self, request, *args, **kwargs):
        """
        Return all jobs that are readable by every
        groups and every user in the payload

        {  "permissions" : {
           groups : [ 'group_one', 'group_two', ...]
           members : ['user_one', 'user_two' ... ]
            }
        }

        """

        if "permissions" not in request.data:
            raise PermissionDenied(code="permission_denied", detail="Missing permissions attribute.")

        jobs = get_jobs_via_permissions(request.data["permissions"])
        serializer = ListJobSerializer(jobs, many=True, context={"request": request})
        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, uid=None, *args, **kwargs):
        """
        Destroy a job
        """

        job = Job.objects.get(uid=uid)

        # Does the user have admin permission to make changes to this job?

        logger.info("DELETE REQUEST")
        jobs = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)

        if not jobs.filter(id=job.id):
            raise PermissionDenied(code="permission_denied", detail="ADMIN permission is required to delete this job.")

        super(JobViewSet, self).destroy(request, *args, **kwargs)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExportFormatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ###ExportFormat API endpoint.

    Endpoint exposing the supported export formats.
    """

    serializer_class = ExportFormatSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = ExportFormat.objects.all()
    lookup_field = "slug"
    ordering = ["description"]

    def list(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of export format
        * return: A list of format types.
        """
        return super(ExportFormatViewSet, self).list(self, request, slug, *args, **kwargs)

    def retrieve(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of export format
        * return: A single format object matching the provided slug value.
        """
        return super(ExportFormatViewSet, self).retrieve(self, request, slug, *args, **kwargs)


class ProjectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for listing or retrieving projections.
    """

    serializer_class = ProjectionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Projection.objects.all()
    lookup_field = "srid"
    ordering = ["srid"]


class AuditEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for listing or retrieving AuditEvents.
    """

    serializer_class = AuditEventSerializer
    permission_classes = (permissions.IsAdminUser,)
    queryset = AuditEvent.objects.all()
    filter_class = LogFilter
    lookup_field = "id"
    ordering = ["datetime"]
    search_fields = ("username", "datetime", "ip", "email", "event")


class LicenseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint to get detailed information about the data licenses.
    """

    serializer_class = LicenseSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = License.objects.all()
    lookup_field = "slug"
    ordering = ["name"]

    def get_queryset(self):
        provider_queryset = (
            DataProvider.objects.select_related("attribute_class", "export_provider_type", "thumbnail", "license")
            .prefetch_related("export_provider_type__supported_formats", "usersizerule_set")
            .filter(Q(user=self.request.user) | Q(user=None))
        )
        providers, filtered_provider = attribute_class_filter(provider_queryset, self.request.user)
        return License.objects.filter(data_providers__in=providers)

    @action(methods=["get"], detail=True, renderer_classes=[PlainTextRenderer])
    def download(self, request, slug=None, *args, **kwargs):
        """
        Responds to a GET request with a text file of the license text

        *request:* the http request
        *slug:* the license slug

        *Returns:*
            - a .txt file of the license text.
        """
        try:
            license_text = License.objects.get(slug=slug).text
            response = Response(license_text, content_type="text/plain")
            response["Content-Disposition"] = 'attachment; filename="{}.txt"'.format(slug)
            return response
        except Exception:
            raise NotFound(code="not_found", detail="Could not find requested license.")

    def list(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of license
        * return: A list of license objects.
        """
        return super(LicenseViewSet, self).list(self, request, slug, *args, **kwargs)

    def retrieve(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of license
        * return: A single license object matching the provided slug value.
        """
        return super(LicenseViewSet, self).retrieve(self, request, slug, *args, **kwargs)


class TopicViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint to get detailed information about the topics.
    """

    serializer_class = TopicSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Topic.objects.all()
    lookup_field = "slug"
    ordering = ["name"]

    def list(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of topic
        * return: A list of topic objects
        """
        return super(TopicViewSet, self).list(self, request, slug, *args, **kwargs)

    def retrieve(self, request, slug=None, *args, **kwargs):
        """
        * slug: optional slug value of topic
        * return: A single topic object matching the provided slug value.
        """
        return super(TopicViewSet, self).retrieve(self, request, slug, *args, **kwargs)


class DataProviderViewSet(EventkitViewSet):
    """
    Endpoint exposing the supported data providers.
    """

    serializer_class = DataProviderSerializer
    renderer_classes += (GeojsonRenderer,)
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "slug"
    ordering = ["name"]

    def get_serializer_classes(self, *args, **kwargs):
        if (
            self.request.query_params.get("format", "").lower() == "geojson"
            or self.request.headers.get("content-type") == "application/geo+json"
        ):
            return DataProviderGeoFeatureSerializer, FilteredDataProviderGeoFeatureSerializer
        return DataProviderSerializer, FilteredDataProviderSerializer

    def get_readonly_serializer_classes(self):
        if (
            self.request.query_params.get("format", "").lower() == "geojson"
            or self.request.headers.get("content-type") == "application/geo+json"
        ):
            return (
                # mypy thinks that this incorrectly passes the include_geometry twice
                lambda queryset, *args, **kwargs: basic_geojson_list_serializer(
                    basic_data_provider_list_serializer(
                        queryset, include_geometry=True, *args, **kwargs
                    ),  # type: ignore
                    "the_geom",
                    *args,
                    **kwargs,
                ),
                lambda queryset, *args, **kwargs: basic_geojson_list_serializer(
                    filtered_basic_data_provider_serializer(queryset, include_geometry=True, *args, **kwargs),
                    "the_geom",
                    *args,
                    **kwargs,
                ),
            )
        return (
            lambda queryset, *args, **kwargs: basic_data_provider_list_serializer(queryset, *args, **kwargs),
            lambda queryset, *args, **kwargs: filtered_basic_data_provider_serializer(queryset, *args, **kwargs),
        )

    def get_queryset(self):
        """
        This view should return a list of all the products for the currently authenticated user.
        """
        # Download Count Subquery
        exptask_q = Q(downloadable__export_task__export_provider_task__provider=OuterRef("pk"))
        slug_q = Q(downloadable__export_task__export_provider_task__slug="run")
        dptask_q = Q(
            downloadable__export_task__export_provider_task__run__job__data_provider_tasks__provider=OuterRef("pk")
        )
        window = settings.DATA_PROVIDER_WINDOW
        download_subquery = (
            UserDownload.objects.filter(downloaded_at__gte=date.today() - timedelta(days=window))
            .order_by()
            .filter(exptask_q | (slug_q & dptask_q))
            .values("uid")
            .annotate(count=Func("uid", function="COUNT"))
            .values("count")
        )
        # Latest Download Subquery
        latest_subquery = (
            UserDownload.objects.filter(exptask_q | (slug_q & dptask_q))
            .order_by("-downloaded_at")
            .values("downloaded_at")[:1]
        )

        return (
            DataProvider.objects.select_related("attribute_class", "export_provider_type", "thumbnail", "license")
            .prefetch_related("export_provider_type__supported_formats", "usersizerule_set")
            # This is used for user made data providers, not user permissions
            .filter(Q(user=self.request.user) | Q(user=None))
            .annotate(download_count=Subquery(download_subquery), latest_download=Subquery(latest_subquery))
            .annotate(
                favorite=Exists(
                    UserFavoriteProduct.objects.filter(provider=OuterRef("pk")).filter(user=self.request.user)
                )
            )
            .order_by(*self.ordering)
        )

    def partial_update(self, request, slug=None, *args, **kwargs):
        """

        Used to update user favorite.

        Request data can be posted as `application/json`.

        * request: the HTTP request in JSON.

        Example:

                {
                    "favorite": true
                }

        Expected Response Example:
                {
                    <updated model>
                }
        """

        data_provider = DataProvider.objects.get(slug=slug)
        user = request.user
        favorite = request.data.get("favorite")

        if favorite:
            UserFavoriteProduct.objects.get_or_create(provider=data_provider, user=user)
        else:
            UserFavoriteProduct.objects.filter(provider=data_provider, user=user).delete()

        return Response(status=status.HTTP_200_OK)

    @action(methods=["get", "post"], detail=True)
    def status(self, request, slug=None, *args, **kwargs):
        """
        Checks the status of a data provider to confirm that it is available.

        * slug: The DataProvider object slug.
        * return: The HTTP response of the data provider health check, in cases where there is no error. If the data
        provider does not exist, returns status 400 bad request.
        """
        try:
            geojson = self.request.data.get("geojson", None)
            providers, filtered_provider = attribute_class_filter(self.get_queryset(), self.request.user)
            provider = providers.get(slug=slug)
            return JsonResponse(provider.check_status(aoi_geojson=geojson), status=status.HTTP_200_OK)

        except DataProvider.DoesNotExist:
            raise NotFound(code="not_found", detail="Could not find the requested provider.")

        except Exception as e:
            logger.error(e)
            raise APIException(code="server_error", detail="Internal server error.")

    def list(self, request, slug=None, *args, **kwargs):
        """
        List all data providers.
        * slug: optional lookup field
        * return: A list of data providers.
        """

        serializer, filtered_serializer = self.get_readonly_serializer_classes()
        user_cache = MappedCache(request.user.username)

        # The cache_key will be different if serializing a geojson or an api json.
        cache_key = get_query_cache_key(DataProvider, request.user.username, "serialized", serializer)
        data = user_cache.get(cache_key)

        if not data:
            queryset = self.get_queryset()
            providers, filtered_providers = attribute_class_filter(queryset, self.request.user)
            data = serializer(providers, many=True, context={"request": request})
            filtered_data = filtered_serializer(filtered_providers, many=True, context={"request": request})
            data = data + filtered_data

            if user_cache.add(cache_key, data, timeout=DEFAULT_TIMEOUT):
                DataProvider.update_cache_key_list(cache_key)

        return Response(data)

    def retrieve(self, request, slug=None, *args, **kwargs):
        """
        Look up a single data provider by slug value.
        * slug: optional lookup field
        * return: The data provider with the given slug.
        """
        providers, filtered_providers = attribute_class_filter(self.get_queryset().filter(slug=slug), self.request.user)
        serializer, filtered_serializer = self.get_readonly_serializer_classes()
        if providers:
            return Response(serializer(providers.get(slug=slug), context={"request": request}))
        elif filtered_providers:
            return Response(filtered_serializer(providers.get(slug=slug)))

    @action(methods=["post"], detail=False)
    def filter(self, request, *args, **kwargs):
        """
        Lists the DataProviders and provides advanced filtering options like geojson geometry.
        POST is required if you want to filter by a geojson geometry contained in the request data.
        :param request: the http request
        :param args:
        :param kwargs:
        :return: the serialized data providers
        """
        qu = self.get_queryset()
        queryset = self.filter_queryset(qu)
        search_geojson = self.request.data.get("geojson", None)
        if search_geojson is not None:
            geometry = (
                search_geojson.get("geometry")
                or search_geojson.get("features", [{}])[0].get("geometry")
                or search_geojson
            )
            try:
                geom = geojson_to_geos(json.dumps(geometry), 4326)
                queryset = queryset.filter(the_geom__intersects=geom)
            except ValidationError as e:
                logger.debug(e.detail)
                raise ValidationError(code="validation_error", detail=e.detail)

        search_topics: Optional[List[Topic]] = self.request.data.get("topics") or []
        if search_topics:
            queryset = queryset.filter(topics__slug__in=search_topics).distinct()

        serializer, filtered_serializer = self.get_readonly_serializer_classes()
        providers, filtered_providers = attribute_class_filter(queryset, self.request.user)

        data = serializer(providers, many=True, context={"request": request})

        filtered_data = filtered_serializer(filtered_providers, many=True)

        if isinstance(data, list):
            data += filtered_data
        else:
            filtered_data.update(data)
            data = filtered_data

        return Response(data)


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the supported regions.
    """

    serializer_class = RegionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Region.objects.all()
    lookup_field = "uid"

    def list(self, request, uid=None, *args, **kwargs):
        """
        List all regions.
        * uid: optional lookup field
        * return: A list of regions.
        """
        return super(RegionViewSet, self).list(self, request, uid, *args, **kwargs)

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        Look up a single region by slug value.
        * uid: optional lookup field
        * return: The region with the given slug.
        """
        return super(RegionViewSet, self).retrieve(self, request, uid, *args, **kwargs)


class RegionMaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Return a MULTIPOLYGON representing the mask of the
    HOT Regions as a GeoJSON Feature Collection.
    """

    serializer_class = RegionMaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = RegionMask.objects.all()


class RegionalPolicyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the available regional policies.
    """

    serializer_class = RegionalPolicySerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = RegionalPolicy.objects.all()
    lookup_field = "uid"


class RegionalJustificationViewSet(EventkitViewSet):
    serializer_class = RegionalJustificationSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "uid"
    http_method_names = ["get", "post"]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return RegionalJustification.objects.all()
        else:
            return RegionalJustification.objects.filter(user=self.request.user)


class ExportRunViewSet(EventkitViewSet):
    """
    **retrieve:**

    Returns the exact run as specified by the run UID in the url `/runs/{uid}`


    **list:**

    Returns a list of all the runs.

    Export runs can be filtered and ordered by adding optional parameters to the url:

    * `user`: The user who created the job.

    * `status`: The current run status (can include any number of the following: COMPLETED, SUBMITTED, INCOMPLETE, or
    FAILED).
        * Example = `/api/runs?status=SUBMITTED,INCOMPLETE,FAILED`

    * `job_uid`: The uid of a particular job.

    * `min_date`: Minimum date (YYYY-MM-DD) for the `started_at` field.

    * `max_date`: Maximum date (YYYY-MM-DD) for the `started_at` field.

    * `started_at`: The DateTime a run was started at in ISO date-time format.

    * `published`: True or False for whether the owning job is published or not.

    * `ordering`: Possible values are `started_at, status, user__username, job__name, job__event, and job__published`.
        * Order can be reversed by adding `-` to the front of the order parameter.

    An example request using some of the parameters.

    `/api/runs?user=test_user&status=FAILED,COMPLETED&min_date=2017-05-20&max_date=2017-12-21&published=True&ordering=
    -job__name`

    **filter:**

    Accessed at `/runs/filter`.

    Accepts GET and POST. Support all the url params of 'list' with the addition of advanced features like
    `search_term`, `bbox`, and `geojson`.

    * `search_term`: A value to search the job name, description and event text for.

    * `bbox`: Bounding box in the form of `xmin,ymin,xmax,ymax`.

    To filter by geojson send the geojson geometry in the body of a POST request under the key `geojson`.
    """

    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    renderer_classes += (GeojsonRenderer,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filter_class = ExportRunFilter
    lookup_field = "uid"
    search_fields = (
        "user__username",
        "status",
        "job__uid",
        "min_date",
        "max_date",
        "started_at",
        "job__published",
    )
    ordering_fields = (
        "job__name",
        "created_at",
        "started_at",
        "user__username",
        "job__published",
        "status",
        "job__event",
        "job__featured",
    )
    ordering = ("-created_at",)

    def get_serializer_class(self, *args, **kwargs):
        if (
            self.request.query_params.get("format", "").lower() == "geojson"
            or self.request.headers.get("content-type") == "application/geo+json"
        ):
            return ExportRunGeoFeatureSerializer
        return ExportRunSerializer

    def get_queryset(self):
        jobs = JobPermission.userjobs(self.request.user, "READ")
        if self.request.query_params.get("slim"):
            return (
                ExportRun.objects.filter(Q(job__in=jobs) | Q(job__visibility=VisibilityState.PUBLIC.value))
                .select_related("job")
                .order_by(*self.ordering)
            )
        else:
            return prefetch_export_runs(
                (ExportRun.objects.filter(Q(job__in=jobs) | Q(job__visibility=VisibilityState.PUBLIC.value)).filter())
            ).order_by(*self.ordering)

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        Get an ExportRun.

        Gets the run_uid from the request and returns run data for the
        associated ExportRun.

        Args:

            *request: the http request.

            *uid: the run uid.

        *Returns:
            the serialized run data.
        """

        from eventkit_cloud.tasks.task_factory import InvalidLicense

        queryset = self.get_queryset().filter(uid=uid)
        if not request.query_params.get("job_uid"):
            queryset = queryset.filter(deleted=False)
        try:
            self.validate_licenses(queryset, user=request.user)
        except InvalidLicense as il:
            raise ValidationError(code="invalid_license", detail=str(il))
        serializer = self.get_serializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Destroy a model instance.
        """

        instance = self.get_object()
        job = instance.job

        jobs = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)
        if not jobs.filter(id=job.id):
            return Response(
                [{"detail": "ADMIN permission is required to delete this DataPack."}],
                status.HTTP_400_BAD_REQUEST,
            )

        permissions = JobPermission.jobpermissions(job)

        instance.soft_delete(user=request.user, permissions=permissions)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def list(self, request, *args, **kwargs):
        """
        List the ExportRuns
        :param request: the http request
        :param args:
        :param kwargs:
        :return: the serialized runs
        """
        queryset = self.filter_queryset(self.get_queryset())
        try:
            self.validate_licenses(queryset, user=request.user)
        except InvalidLicense as il:
            raise ValidationError(code="invalid_license", detail=str(il))
        # This is to display deleted runs on the status and download
        if not request.query_params.get("job_uid"):
            queryset = queryset.filter(deleted=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=["post", "get"], detail=False)
    def filter(self, request, *args, **kwargs):
        """
        Lists the ExportRuns and provides advanced filtering options like search_term, bbox, and geojson geometry.
        Accepts GET and POST request. POST is required if you want to filter by a geojson geometry contained in the
        request data
        :param request: the http request
        :param args:
        :param kwargs:
        :return: the serialized runs
        """
        status_code = status.HTTP_200_OK
        queryset = self.filter_queryset(self.get_queryset())

        if "permissions" in request.data:
            jobs = get_jobs_via_permissions(request.data["permissions"])
            queryset = ExportRun.objects.filter(Q(job__in=jobs))

        search_geojson = self.request.data.get("geojson", None)
        if search_geojson is not None:
            try:
                geom = geojson_to_geos(search_geojson, 4326)
                queryset = queryset.filter(job__the_geom__intersects=geom)
            except ValidationError as e:
                logger.debug(e.detail)
                raise ValidationError(code="validation_error", detail=e.detail)

        search_bbox = self.request.query_params.get("bbox", None)
        if search_bbox is not None and len(search_bbox.split(",")) == 4:
            extents = search_bbox.split(",")
            data = {
                "xmin": extents[0],
                "ymin": extents[1],
                "xmax": extents[2],
                "ymax": extents[3],
            }

            try:
                bbox_extents = validate_bbox_params(data)
                bbox = validate_search_bbox(bbox_extents)
                queryset = queryset.filter(job__the_geom__within=bbox)

            except ValidationError as e:
                logger.debug(e.detail)
                raise ValidationError(code="validation_error", detail=e.detail)

        search_term = self.request.query_params.get("search_term", None)
        if search_term is not None:
            queryset = queryset.filter(
                (
                    Q(job__name__icontains=search_term)
                    | Q(job__description__icontains=search_term)
                    | Q(job__event__icontains=search_term)
                )
            )
        if not request.query_params.get("job_uid"):
            queryset = queryset.filter(deleted=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={"request": request, "no_license": True})
            response = self.get_paginated_response(serializer.data)
            response.status_code = status_code
            return response
        else:
            serializer = self.get_serializer(queryset, many=True, context={"request": request, "no_license": True})
            return Response(serializer.data, status=status_code)

    @transaction.atomic
    def partial_update(self, request, uid=None, *args, **kwargs):
        """
        Update the expiration date for an export run. If the user is a superuser,
        then any date may be specified. Otherwise the date must be before  todays_date + MAX_DATAPACK_EXPIRATION_DAYS
        where MAX_DATAPACK_EXPIRATION_DAYS is a setting found in prod.py

        * request: the HTTP request in JSON.

            Example:

                {
                    "expiration" : "2019-12-31"
                }

        * Returns: a copy of the new expiration value on success

            Example:

                {
                    "expiration": "2019-12-31",
                    "success": true
                }

        ** returns: 400 on error

        """

        payload = request.data
        if "expiration" not in payload:
            return Response({"success": False}, status=status.HTTP_400_BAD_REQUEST)

        expiration = payload["expiration"]
        target_date = parser.parse(expiration).replace(tzinfo=None)
        run = ExportRun.objects.get(uid=uid)

        if not request.user.is_superuser:
            max_days = int(getattr(settings, "MAX_DATAPACK_EXPIRATION_DAYS", 30))
            now = datetime.today()
            max_date = now + timedelta(max_days)
            if target_date > max_date.replace(tzinfo=None):
                message = "expiration date must be before " + max_date.isoformat()
                return Response(
                    {"success": False, "detail": message},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if target_date < run.expiration.replace(tzinfo=None):
                message = "expiration date must be after " + run.expiration.isoformat()
                return Response(
                    {"success": False, "detail": message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        run.expiration = target_date
        run.save()
        return Response({"success": True, "expiration": run.expiration}, status=status.HTTP_200_OK)

    @staticmethod
    def validate_licenses(queryset, user=None):
        for run in queryset.all():
            invalid_licenses = get_invalid_licenses(run.job, user=user)
            if invalid_licenses:
                raise InvalidLicense(
                    "The user: {0} has not agreed to the following licenses: {1}.\n"
                    "Please use the user account page, or the user api to agree to the "
                    "licenses prior to viewing run data.".format(run.job.user.username, invalid_licenses)
                )
        return True

    def create(self, request, *args, **kwargs):
        """
        Create a run.
        * return: The status of the creation.
        """
        return super(ExportRunViewSet, self).create(self, request, *args, **kwargs)

    def update(self, request, uid=None, *args, **kwargs):
        """
        Update a run.
        * uid: optional lookup field
        * return: The status of the update.
        """
        return super(ExportRunViewSet, self).update(self, request, uid, *args, **kwargs)

    @requires_oauth_authentication
    @action(methods=["post"], detail=True)
    def rerun_providers(self, request, uid=None, *args, **kwargs):
        """
        Clones a new run and reruns the passed providers.
        Gets the run_uid, list of provider slugs to rerun
        and current user from the request.
        * returns: the serialized run data.
        """

        data_provider_slugs = request.data["data_provider_slugs"]
        run = ExportRun.objects.get(uid=uid)

        # Check to make sure all of the data provider slugs are valid.
        all_provider_slugs = [
            data_provider_task_record.provider.slug
            for data_provider_task_record in run.data_provider_task_records.exclude(provider=None)
        ]
        for data_provider_slug in data_provider_slugs:
            if data_provider_slug not in all_provider_slugs:
                return Response([{"detail": "Invalid provider slug(s) passed."}], status.HTTP_400_BAD_REQUEST)

        if check_job_permissions(run.job):
            running = ExportRunSerializer(run, context={"request": request})
            rerun_data_provider_records(run.uid, request.user.id, data_provider_slugs)
            return Response(running.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response([{"detail": _("Failed to run Export")}], status.HTTP_400_BAD_REQUEST)


class RunZipFileViewSet(EventkitViewSet):
    serializer_class = RunZipFileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "uid"
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        jobs = JobPermission.userjobs(self.request.user, "READ")
        queryset = RunZipFile.objects.filter(
            Q(run__job__in=jobs) | Q(run__job__visibility=VisibilityState.PUBLIC.value)
        ).filter()

        query_params = self.request.query_params

        run_uid = query_params.get("run_uid")
        if run_uid is not None:
            queryset = queryset.filter(run__uid=run_uid)

        data_provider_task_record_uids = query_params.get("data_provider_task_record_uids", [])
        if data_provider_task_record_uids:
            data_provider_task_record_uids = data_provider_task_record_uids.split(",")
            data_provider_task_records = DataProviderTaskRecord.objects.filter(
                uid__in=data_provider_task_record_uids
            ).exclude(slug="run")
            data_provider_task_record_uids = [
                data_provider_task_record.uid for data_provider_task_record in data_provider_task_records.all()
            ]
            queryset = get_run_zip_file(field="uid", values=data_provider_task_record_uids)

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List all zipfiles.
        * return: A list of zipfiles.
        """
        run_zip_files, filtered_run_zip_files = attribute_class_filter(self.get_queryset(), self.request.user)
        serializer = self.get_serializer(run_zip_files, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        Look up a single zipfile by uid.
        * uid: optional lookup field
        * return: The data provider with the given uid.
        """
        run_zip_files, filtered_run_zip_files = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if run_zip_files:
            serializer = self.get_serializer(run_zip_files.first(), context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ExportTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """

    serializer_class = ExportTaskRecordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "uid"

    def get_queryset(self):
        return ExportTaskRecord.objects.filter(
            Q(export_provider_task__run__user=self.request.user) | Q(export_provider_task__run__job__published=True)
        ).order_by("-started_at")

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        GET a single export task.

        Args:
            request: the http request.
            uid: the uid of the export task to GET.
        Returns:
            the serialized ExportTaskRecord data.
        """
        queryset = ExportTaskRecord.objects.filter(uid=uid)
        serializer = self.get_serializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, uid=None, *args, **kwargs):
        """
        List all tasks.
        * uid: optional lookup field
        * return: A list of all tasks.
        """
        return super(ExportTaskViewSet, self).list(self, request, uid, *args, **kwargs)


class DataProviderTaskRecordViewSet(EventkitViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """

    serializer_class = DataProviderTaskRecordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = "uid"

    def get_queryset(self):
        """Return all objects user can view."""
        jobs = JobPermission.userjobs(self.request.user, "READ")
        return DataProviderTaskRecord.objects.filter(
            Q(run__job__visibility=VisibilityState.PUBLIC.value) | Q(run__job__in=jobs)
        )

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        GET a single export task.

        Args:
            request: the http request.
            uid: the uid of the export provider task to GET.
        Returns:
            the serialized ExportTaskRecord data
        """
        providers_tasks, filtered_provider_task = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if providers_tasks:
            serializer = DataProviderTaskRecordSerializer(providers_tasks.first(), context={"request": request})
        else:
            serializer = FilteredDataProviderTaskRecordSerializer(filtered_provider_task.first())
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, uid=None, *args, **kwargs):
        """
        Cancels an export provider task.
        * param uid: The uid of the DataProviderTaskRecord (export provider task model) to be canceled.
        * return: Returns {'success': True} on success. If the user did not have the correct rights (if not superuser,
                  they must be asking for one of their own export provider tasks), then 403 forbidden will be returned.
        """

        providers_tasks, filtered_provider_task = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if not providers_tasks:
            return Response({"success": False}, status=status.HTTP_401_UNAUTHORIZED)

        data_provider_task_record = providers_tasks.get(uid=uid)

        if data_provider_task_record.run.user != request.user and not request.user.is_superuser:
            return Response({"success": False}, status=status.HTTP_403_FORBIDDEN)

        cancel_export_provider_task(
            data_provider_task_uid=data_provider_task_record.uid,
            canceling_username=request.user.username,
        )

        return Response({"success": True}, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        * return: A list of data provider task objects.
        """
        providers_tasks, filtered_provider_task = attribute_class_filter(self.get_queryset(), self.request.user)
        data = DataProviderTaskRecordSerializer(providers_tasks, many=True, context={"request": request}).data
        data += FilteredDataProviderTaskRecordSerializer(filtered_provider_task, many=True).data
        return Response(data)

    def create(self, request, uid=None, *args, **kwargs):
        """
        Create a data provider task object.
        * uid: optional lookup field
        * return: The status of the object creation.
        """
        providers_tasks, filtered_provider_task = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if not providers_tasks:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        return super(DataProviderTaskRecordViewSet, self).create(self, request, uid, *args, **kwargs)

    def destroy(self, request, uid=None, *args, **kwargs):
        """
        Delete a data provider task object.
        * uid: optional lookup field
        * return: The status of the deletion.
        """
        providers_tasks, filtered_provider_task = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if not providers_tasks:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        return super(DataProviderTaskRecordViewSet, self).destroy(self, request, uid, *args, **kwargs)

    def update(self, request, uid=None, *args, **kwargs):
        """
        Update a data provider task object.
        * uid: optional lookup field
        * return: The status of the update.
        """
        providers_tasks, filtered_provider_task = attribute_class_filter(
            self.get_queryset().filter(uid=uid), self.request.user
        )
        if not providers_tasks:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        return super(DataProviderTaskRecordViewSet, self).update(self, request, uid, *args, **kwargs)


class UserDataViewSet(viewsets.GenericViewSet):
    """
    User Data

    """

    serializer_class = UserDataSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    parser_classes = (JSONParser,)
    pagination_class = LinkHeaderPagination
    filter_class = UserFilter
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    lookup_field = "username"
    lookup_value_regex = "[^/]+"
    search_fields = ("username", "last_name", "first_name", "email")

    def get_queryset(self):
        return User.objects.all()

    def partial_update(self, request, username=None, *args, **kwargs):
        """
        Update user data.

        User data cannot currently be updated via this API menu however UserLicense data can, by sending a patch
        message,
        with the licenses data that the user agrees to.  Users will need to agree to all of the licenses prior to being
        allowed to download data.

        Request data can be posted as `application/json`.

        * request: the HTTP request in JSON.

        Example:

                {"accepted_licenses": {
                    "odbl": true
                    }
              }
        """

        queryset = self.get_queryset().get(username=username)
        serializer = UserDataSerializer(queryset, data=request.data, context={"request": request})

        if serializer.is_valid():

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """
        Get a list of users.
        * return: A list of all users.
        """
        job = None
        if request.query_params.get("job_uid"):
            job = Job.objects.get(uid=request.query_params["job_uid"])
        queryset = JobPermission.get_orderable_queryset_for_job(job, User)
        total = queryset.count()
        filtered_queryset = self.filter_queryset(queryset)
        filtered_queryset = annotate_users_restricted(filtered_queryset, job)
        if request.query_params.get("exclude_self"):
            filtered_queryset = filtered_queryset.exclude(username=request.user.username)
        elif request.query_params.get("prepend_self"):
            if request.user in filtered_queryset:
                filtered_queryset = filtered_queryset.exclude(username=request.user.username)
                filtered_queryset = [qs for qs in filtered_queryset]
                filtered_queryset = [request.user] + filtered_queryset
        page = None
        if not request.query_params.get("disable_page"):
            page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={"request": request})
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(filtered_queryset, many=True, context={"request": request})
            response = Response(serializer.data, status=status.HTTP_200_OK)

        response["Total-Users"] = total
        return response

    def retrieve(self, request, username=None):
        """
        GET a user by username
        """
        queryset = self.get_queryset().get(username=username)
        serializer = self.get_serializer(queryset, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post", "get"])
    def members(self, request, *args, **kwargs):
        """
        Member list from list of group ids

        Example :  [ 32, 35, 36 ]
        """

        targets = request.data
        targetnames = []
        payload = []

        groups = Group.objects.filter(id__in=targets)

        for group in groups:
            serializer = GroupSerializer(group)
            for username in serializer.get_members(group):
                if username not in targetnames:
                    targetnames.append(username)

        users = User.objects.filter(username__in=targetnames).all()
        for u in users:
            serializer = self.get_serializer(u, context={"request": request})
            payload.append(serializer.data)

        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def job_permissions(self, request, username=None):
        """
        Get user's permission level for a specific job

        Example: /api/users/job_permissions/admin_user?uid=job-uid-123

        Response: { 'permission': USERS_PERMISSION_LEVEL }
        where USERS_PERMISSION_LEVEL is either READ, ADMIN, or None
        """
        user = User.objects.get(username=username)
        uid = request.query_params.get("uid", None)

        if not user or not uid:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        permission = JobPermission.get_user_permissions(user, uid)

        return Response({"permission": permission}, status=status.HTTP_200_OK)


class UserJobActivityViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Endpoint to create and retrieve user activity related to jobs.
    """

    serializer_class = UserJobActivitySerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    filter_class = UserJobActivityFilter

    def get_queryset(self):
        activity_type = self.request.query_params.get("activity", "").lower()

        if self.request.query_params.get("slim"):
            activities = UserJobActivity.objects.select_related("job", "user")
        else:
            activities = UserJobActivity.objects.select_related("job", "user").prefetch_related(
                "job__data_provider_tasks__provider",
                "job__data_provider_tasks__formats",
                "job__last_export_run__data_provider_task_records__tasks__result",
                "job__last_export_run__data_provider_task_records__tasks__exceptions",
            )

        if activity_type == "viewed":
            ids = (
                UserJobActivity.objects.filter(
                    user=self.request.user,
                    type=UserJobActivity.VIEWED,
                    job__last_export_run__isnull=False,
                    job__last_export_run__deleted=False,
                )
                .distinct("job")
                .values_list("id", flat=True)
            )

            return activities.filter(id__in=ids).order_by("-created_at")
        else:
            return activities.filter(user=self.request.user).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        """
        Gets the most recent UserJobActivity objects.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        """
        Creates a new UserJobActivity object.
        """
        activity_type = request.query_params.get("activity", "").lower()
        job_uid = request.data.get("job_uid")
        # Save a record of the view activity
        if activity_type == "viewed":
            queryset = UserJobActivity.objects.filter(
                user=self.request.user,
                type=UserJobActivity.VIEWED,
                job__last_export_run__isnull=False,
                job__last_export_run__deleted=False,
            ).order_by("-created_at")

            if queryset.count() > 0:
                last_job_viewed = queryset.first()
                # Don't save consecutive views of the same job.
                if str(last_job_viewed.job.uid) == job_uid:
                    return Response(
                        {"ignored": True},
                        content_type="application/json",
                        status=status.HTTP_200_OK,
                    )
            job = Job.objects.get(uid=job_uid)
            UserJobActivity.objects.create(user=self.request.user, job=job, type=UserJobActivity.VIEWED)
        else:
            raise ValidationError(code="invalid_activity_type", detail=f"Activity type {activity_type} is invalid.")

        return Response({}, content_type="application/json", status=status.HTTP_200_OK)


class GroupViewSet(EventkitViewSet):
    """
    Api components for viewing, creating, and editing groups

    """

    serializer_class = GroupSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    parser_classes = (JSONParser,)
    filter_class = GroupFilter
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    lookup_field = "id"
    lookup_value_regex = "[^/]+"
    search_fields = ("name",)

    def useradmin(self, group, request):
        serializer = GroupSerializer(group)
        user = User.objects.all().filter(username=request.user.username)[0]
        return user.username in serializer.get_administrators(group)

    def get_queryset(self):
        queryset = Group.objects.all()
        return queryset

    def update(self, request, *args, **kwargs):
        """
        We don't support calls to PUT for this viewset.
        * returns: 400 bad request
        """
        return Response("BAD REQUEST", status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """
        GET all groups

        Sample result:

             [
                {
                    "id": 54,
                    "name": "Omaha 319",
                    "members": [
                      "user2",
                      "admin"
                    ],
                    "administrators": [
                      "admin"
                    ]
                  }
            ]

        """

        job = None
        if request.query_params.get("job_uid"):
            job = Job.objects.get(uid=request.query_params["job_uid"])
        queryset = JobPermission.get_orderable_queryset_for_job(job, Group)

        filtered_queryset = self.filter_queryset(queryset)
        filtered_queryset = annotate_groups_restricted(filtered_queryset, job)

        # Total number of inspected groups
        total = queryset.count()
        # Query for a dictionary containing the number of groups this user is a member of and groups
        # this user is an admin in.
        totals = get_group_counts(filtered_queryset, request.user)
        admin_total = totals.get("admin")
        member_total = totals.get("member")
        # 'other' groups are any groups that the user does not have permissions in, i.e. they are not a member.
        # Users cannot be admin in a group that they are not a member of, so this is a safe calculation.
        other_total = total - member_total

        permission_level = request.query_params.get("permission_level")
        if permission_level == "admin":
            filtered_queryset = filtered_queryset.filter(
                group_permissions__user=request.user, group_permissions__permission=GroupPermissionLevel.ADMIN.value
            )
        elif permission_level == "member":
            filtered_queryset = filtered_queryset.filter(
                group_permissions__user=request.user, group_permissions__permission=GroupPermissionLevel.MEMBER.value
            )
        elif permission_level == "none":
            filtered_queryset = filtered_queryset.exclude(
                group_permissions__user=request.user, group_permissions__permission=GroupPermissionLevel.ADMIN.value
            ).exclude(
                group_permissions__user=request.user, group_permissions__permission=GroupPermissionLevel.MEMBER.value
            )

        page = None
        if not request.query_params.get("disable_page"):
            page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={"request": request})
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(filtered_queryset, many=True, context={"request": request})
            response = Response(serializer.data, status=status.HTTP_200_OK)

        response["total-groups"] = total
        response["admin-groups"] = admin_total
        response["member-groups"] = member_total
        response["other-groups"] = other_total
        return response

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        create a new group and place  the current logged in user in the group and its administrators.
        optionally, provide additional group members


        Sample input:

            {
                "name": "Omaha 319"
            }

        """

        name = request.data["name"]

        matches = Group.objects.filter(name__iexact=name.lower())
        if len(matches) > 0:
            error_data = {
                "errors": [
                    {
                        "status": status.HTTP_400_BAD_REQUEST,
                        "title": _("Duplicate Group Name"),
                        "detail": _("A group named %s already exists." % name),
                    }
                ]
            }
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

        response = super(GroupViewSet, self).create(request, *args, **kwargs)
        group_id = response.data["id"]
        user = User.objects.all().filter(username=request.user.username)[0]
        group = Group.objects.get(pk=group_id)
        group.user_set.add(user)
        groupadmin = GroupPermission.objects.create(user=user, group=group, permission=GroupPermissionLevel.ADMIN.value)
        groupadmin.save()
        GroupPermission.objects.create(user=user, group=group, permission=GroupPermissionLevel.MEMBER.value)

        if "members" in request.data:
            for member in request.data["members"]:
                if member != user.username:
                    user = User.objects.all().filter(username=member)[0]
                    if user:
                        GroupPermission.objects.create(
                            user=user,
                            group=group,
                            permission=GroupPermissionLevel.MEMBER.value,
                        )
                        sendnotification(
                            request.user,
                            user,
                            NotificationVerb.ADDED_TO_GROUP.value,
                            group,
                            None,
                            NotificationLevel.INFO.value,
                            GroupPermissionLevel.MEMBER.value,
                        )

        if "administrators" in request.data:
            for admin in request.data["administrators"]:
                if admin != request.user.username:
                    user = User.objects.all().filter(username=admin)[0]
                    if user:
                        GroupPermission.objects.create(
                            user=user,
                            group=group,
                            permission=GroupPermissionLevel.ADMIN.value,
                        )
                        sendnotification(
                            request.user,
                            user,
                            NotificationVerb.SET_AS_GROUP_ADMIN.value,
                            group,
                            None,
                            NotificationLevel.INFO.value,
                            GroupPermissionLevel.ADMIN.value,
                        )

        group = Group.objects.filter(id=group_id)[0]
        serializer = GroupSerializer(group)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, id=None):
        """
        * get a group with a specific ID.  Return its data, including users in the group
        """
        group = Group.objects.filter(id=id)[0]
        serializer = GroupSerializer(group)

        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def destroy(self, request, id=None, *args, **kwargs):
        """
        Destroy a group
        """

        # Not permitted if the requesting user is not an administrator

        group = Group.objects.filter(id=id)[0]

        if not self.useradmin(group, request):
            return Response("Administative privileges required.", status=status.HTTP_403_FORBIDDEN)

        super(GroupViewSet, self).destroy(request, *args, **kwargs)
        return Response("OK", status=status.HTTP_200_OK)

        # instance = self.get_object()
        # instance.soft_delete(user=request.user)
        # return Response(status=status.HTTP_204_NO_CONTENT)

    @transaction.atomic
    def partial_update(self, request, id=None, *args, **kwargs):
        """
        Change the group's name, members, and administrators


        Sample input:

            {
               "name": "Omaha 319"
               "members": [ "user2", "user3", "admin"],
               "administrators": [ "admin" ]
            }

        If a member wishes to remove themselves from a group they can make an patch request with no body.
        However, this will not work if they are a admin of the group.

        """

        group = Group.objects.filter(id=id)[0]

        # we are not going anywhere if the requesting user is not an
        # administrator of the current group or there is an attempt to end up with no administrators

        if not self.useradmin(group, request):
            user = User.objects.filter(username=request.user.username)[0]
            perms = GroupPermission.objects.filter(user=user, group=group, permission=GroupPermissionLevel.MEMBER.value)
            # if the user is not an admin but is a member we remove them from the group
            if perms:
                perms.delete()
                return Response("OK", status=status.HTTP_200_OK)

            return Response("Administative privileges required.", status=status.HTTP_403_FORBIDDEN)

        if "administrators" in request.data:
            request_admins = request.data["administrators"]
            if len(request_admins) < 1:
                error_data = {
                    "errors": [
                        {
                            "status": status.HTTP_403_FORBIDDEN,
                            "title": _("Not Permitted"),
                            "detail": _(
                                "You must assign another group administator before you can perform this action"
                            ),
                        }
                    ]
                }
                return Response(error_data, status=status.HTTP_403_FORBIDDEN)
        super(GroupViewSet, self).partial_update(request, *args, **kwargs)
        # if name in request we need to change the group name
        if "name" in request.data:
            name = request.data["name"]
            if name:
                group.name = name
                group.save()

        # examine provided lists of administrators and members. Adjust as needed.
        for item in [
            ("members", GroupPermissionLevel.MEMBER.value),
            ("administrators", GroupPermissionLevel.ADMIN.value),
        ]:
            permissionlabel = item[0]
            permission = item[1]

            if permissionlabel not in request.data:
                continue

            user_ids = [
                perm.user.id for perm in GroupPermission.objects.filter(group=group).filter(permission=permission)
            ]
            currentusers = [user.username for user in User.objects.filter(id__in=user_ids).all()]
            targetusers = request.data[permissionlabel]

            # Add new users for this permission level
            newusers = list(set(targetusers) - set(currentusers))
            users = User.objects.filter(username__in=newusers).all()
            verb = NotificationVerb.ADDED_TO_GROUP.value
            if permissionlabel == "administrators":
                verb = NotificationVerb.SET_AS_GROUP_ADMIN.value

            for user in users:
                GroupPermission.objects.create(user=user, group=group, permission=permission)
                sendnotification(
                    request.user,
                    user,
                    verb,
                    group,
                    None,
                    NotificationLevel.INFO.value,
                    permission,
                )

            # Remove existing users for this permission level

            removedusers = list(set(currentusers) - set(targetusers))
            users = User.objects.filter(username__in=removedusers).all()
            verb = NotificationVerb.REMOVED_FROM_GROUP.value
            if permissionlabel == "administrators":
                verb = NotificationVerb.REMOVED_AS_GROUP_ADMIN.value
            for user in users:
                sendnotification(
                    request.user,
                    user,
                    verb,
                    group,
                    None,
                    NotificationLevel.INFO.value,
                    permission,
                )
                perms = GroupPermission.objects.filter(user=user, group=group, permission=permission).all()
                for perm in perms:
                    perm.delete()

        return Response("OK", status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def users(self, request, id=None, *args, **kwargs):
        try:
            group = Group.objects.get(id=id)
        except Group.DoesNotExist:
            raise NotFound(code="not_found", detail="Could not find the requested group.")

        serializer = GroupUserSerializer(group, context={"request": request})
        return Response(data=serializer.data, status=status.HTTP_200_OK)


class NotificationViewSet(EventkitViewSet):
    """
    Api components for viewing and working with notifications
    """

    serializer_class = NotificationSerializer
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    pagination_class = LinkHeaderPagination

    def get_queryset(self):
        qs = Notification.objects.filter(recipient_id=self.request.user.id, deleted=False)
        return qs

    def list(self, request, *args, **kwargs):
        """
        Get all user notifications that are not deleted
        """
        notifications = self.get_queryset()
        page = self.paginate_queryset(notifications)
        if page is not None:
            serializer = self.get_serializer(page, context={"request": self.request}, many=True)
        else:
            serializer = self.get_serializer(notifications, context={"request": self.request}, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["delete"])
    def delete(self, request, *args, **kwargs):
        """
        Delete notifications
        If request data of { ids: [....ids] } is provided only those ids will be deleted
        If no request data is included all notifications will be deleted
        """
        notifications = self.get_queryset()
        if request.data.get("ids", None):
            for id in request.data.get("ids"):
                note = notifications.get(id=id)
                if note:
                    note.deleted = True
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_deleted()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def read(self, request, *args, **kwargs):
        """
        Mark notifications as read
        If request data of { ids: [....ids] } is provided only those ids will be marked
        If no request data is included all notifications will be marked read
        """
        notifications = self.get_queryset()
        if request.data.get("ids", None):
            for id in request.data.get("ids"):
                note = notifications.get(id=id)
                if note:
                    note.unread = False
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_read()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def unread(self, request, *args, **kwargs):
        """
        Mark notifications as unread
        If request data of { ids: [....ids] } is provided only those ids will be marked
        If no request data is included all notifications will be marked unread
        """
        notifications = self.get_queryset()
        if request.data.get("ids", None):
            for id in request.data.get("ids"):
                note = notifications.get(id=id)
                if note:
                    note.unread = True
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_unread()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def counts(self, request, *args, **kwargs):
        payload = {
            "read": len(request.user.notifications.read()),
            "unread": len(request.user.notifications.unread()),
        }

        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def mark(self, request, *args, **kwargs):
        """
        Change the status of one or more notifications.
        **Use if you need to modify in more than one way. Otherwise just use 'delete', 'read', or 'unread'**

        Args:
            A list containing one or more records like this:
           [
            {"id": 3, "action": "DELETE" },
            {"id": 17, "action": "READ" },
            {"id" : 19, "action" "UNREAD" },
            ...
           ]

        Returns:
           { "success" : True} or error
        """

        logger.debug(request.data)
        for row in request.data:
            qs = Notification.objects.filter(recipient_id=self.request.user.id, id=row["id"])
            logger.debug(qs)
            if row["action"] == "READ":
                qs.mark_all_as_read()
            if row["action"] == "DELETE":
                qs.mark_all_as_deleted()
            if row["action"] == "UNREAD":
                qs.mark_all_as_unread()

        return Response({"success": True}, status=status.HTTP_200_OK)


class DataProviderRequestViewSet(EventkitViewSet):
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    serializer_class = DataProviderRequestSerializer
    lookup_field = "uid"

    def get_queryset(self):
        """
        This view should return a list of all
        of Data Provider Requests for the
        currently authenticated user.
        """
        user = self.request.user

        # Admins and staff should be able to view all requests.
        if user.is_staff or user.is_superuser:
            return DataProviderRequest.objects.all()

        return DataProviderRequest.objects.filter(user=user)


class SizeIncreaseRequestViewSet(EventkitViewSet):
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    serializer_class = SizeIncreaseRequestSerializer
    lookup_field = "uid"

    def get_queryset(self):
        """
        This view should return a list of all
        of the Data Size Increase Requests for the
        currently authenticated user.
        """
        user = self.request.user

        # Admins and staff should be able to view all requests.
        if user.is_staff or user.is_superuser:
            return SizeIncreaseRequest.objects.all()

        return SizeIncreaseRequest.objects.filter(user=user)


class EstimatorView(views.APIView):
    """
    Api components for computing size estimates for providers within a specified bounding box
    """

    @action(detail=False, methods=["get"])
    def get(self, request, *args, **kwargs):
        """
        Args:
            slugs: Comma separated list of slugs for provider slugs (e.g. 'osm,some_wms1')
            bbox: Bounding box as w,s,e,n (e.g. '-130,-45,-100,10)
            srs: EPSG code for the bbox srs (default=4326)
        Returns:
           [{ "slug" : $slug_1, "size": $estimate_1, "unit": "mb"}, ...] or error
        """
        payload = []
        logger.debug(request.query_params)

        bbox = request.query_params.get("bbox", None).split(",")  # w, s, e, n
        bbox = list(map(lambda a: float(a), bbox))
        srs = request.query_params.get("srs", "4326")
        min_zoom = request.query_params.get("min_zoom", None)
        max_zoom = request.query_params.get("max_zoom", None)
        if request.query_params.get("slugs", None):
            estimator = AoiEstimator(bbox=bbox, bbox_srs=srs, min_zoom=min_zoom, max_zoom=max_zoom)
            for slug in request.query_params.get("slugs").split(","):
                cache_key = get_estimate_cache_key(bbox, srs, min_zoom, max_zoom, slug)
                size, time = cache.get_or_set(
                    cache_key, lambda: estimator.get_provider_estimates(slug), ESTIMATE_CACHE_TIMEOUT
                )
                provider_estimate = {
                    "slug": slug,
                    "size": {"value": size, "unit": "MB"},
                    "time": {"value": time, "unit": "seconds"},
                }
                payload += [provider_estimate]
        else:
            return Response([{"detail": _("No estimates found")}], status=status.HTTP_400_BAD_REQUEST)
        return Response(payload, status=status.HTTP_200_OK)


class MetricsView(views.APIView):
    """
    This view should return a list of metrics detailing the use of the platform
    """

    permission_classes = (permissions.IsAdminUser,)
    renderer_classes = renderer_classes

    def get(self, request, *args, **kwargs):
        """
        Args:
            days: number of days from which to gather information. E.g. if '30' is specified
            the metrics will be from the last 30 days.
            region__<props>: A key value pair to match for the area. For example "?area__name=Africa" would return
            areas that filter on name which equals "Africa". Properties would be "region__properties__admin=admin_name"
            area_count: the number of 'top areas' to display, i.e. top 5 areas with the most downloads
            user_group: one or more user characteristics on which to group users.
            group_count: the number of top user groups to display, i.e. top 10 user groups with the most downloads
        """

        # TODO: Rewrite this after AuditLog links to users.
        User = get_user_model()

        valid_params = ["days", "group_count", "area_count", "user_group"]
        for param in request.query_params.keys():
            if not (param in valid_params or param.startswith("region__")):
                raise ValidationError(
                    f"Param must be one of {', '.join(valid_params)} or a region filter (i.e. region__<region_prop>)"
                )

        days_ago = int(request.query_params.get("days", 30))
        group_count = int(request.query_params.get("group_count", 5))
        area_count = int(request.query_params.get("area_count", 10))
        region_prefix = "region__"
        area_props = {
            field[len(region_prefix) :]: prop
            for field, prop in request.query_params.items()
            if field.startswith(region_prefix)
        }

        user_group_bins = request.query_params.getlist("user_group", None)

        end_date = date.today()
        start_date = end_date - timedelta(days=days_ago)

        users = User.objects.filter(is_superuser=False, is_staff=False)
        events = AuditEvent.objects.filter(
            datetime__gte=start_date,
            datetime__lte=end_date,
            event="login",
            username__in=[user.username for user in users],
        )

        user_logins = get_logins_per_day(users, events)

        payload: Dict[str, Any] = {}

        # Average number of users per day
        total_users_per_duration = users.count()
        payload["Total Users"] = total_users_per_duration

        total_logins = sum([login for user_login in user_logins.values() for login in user_login["logins"].values()])
        payload["Average Users Per Day"] = total_logins / days_ago

        # Top user groups accessing the system
        groups = get_binned_groups(user_logins, user_group_bins)

        payload["Top User Groups"] = dict(itertools.islice(groups.items(), group_count))

        payload["Downloads by Area"] = get_download_counts_by_area(
            region_filter=area_props, users=users, count=area_count, start_date=start_date
        )

        payload["Downloads by Product"] = get_download_counts_by_product(
            users=users, count=area_count, start_date=start_date
        )
        return Response(data=payload, status=status.HTTP_200_OK)


def get_models(model_list, model_object, model_index):
    models: List[Dict] = []
    if not model_list:
        return models
    for model_id in model_list:
        # TODO: would be good to accept either format slug or uuid here..
        try:
            model = model_object.objects.get(**{model_index: model_id})
            models.append(model)
        except model_object.DoesNotExist:
            logger.warning(f"{str(model_object)} with {model_index}: {model_id} does not exist.")
            raise NotFound(
                code="not_found", detail=f"{str(model_object)} with {model_index}: {model_id} does not exist."
            )
    return models


def get_provider_task(export_provider, export_formats):
    """

    Args:
        export_provider: An DataProvider model for the content provider (i.e. osm or wms service)
        export_formats: An ExportFormat model for the geospatial data format (i.e. shapefile or geopackage)

    Returns:

    """
    # TODO:  What is this supposed to do we pass in export format then do nothing with it.
    provider_task = DataProviderTask.objects.create(provider=export_provider)
    for export_format in export_formats:
        supported_formats = export_provider.export_provider_type.supported_formats.all()
        provider_task.formats.add(*supported_formats)
    provider_task.save()
    return provider_task


def geojson_to_geos(geojson_geom, srid=None):
    """
    :param geojson_geom: A stringified geojson geometry
    :param srid: The ESPG code of the input data
    :return: A GEOSGeometry object
    """
    if not geojson_geom:
        raise ValidationError(code="missing_geojson", detail="No geojson geometry string supplied.")
    if not srid:
        srid = 4326
    try:
        geom = GEOSGeometry(geojson_geom, srid=srid)
    except GEOSException:
        raise ValidationError(
            code="invalid_geometry", detail="Could not convert geojson geometry, check that your geometry is valid."
        )
    if not geom.valid:
        raise ValidationError(
            code="invalid_geometry", detail="GEOSGeometry invalid, check that your geojson geometry is valid."
        )
    return geom


def get_jobs_via_permissions(permissions):
    groups = Group.objects.filter(name__in=permissions.get("groups", []))
    group_query = [
        Q(permissions__content_type=ContentType.objects.get_for_model(Group)),
        Q(permissions__object_id__in=groups),
        Q(permissions__permission=JobPermissionLevel.READ.value),
    ]

    users = User.objects.filter(username__in=permissions.get("members", []))
    user_query = [
        Q(permissions__content_type=ContentType.objects.get_for_model(User)),
        Q(permissions__object_id__in=users),
        Q(permissions__permission=JobPermissionLevel.READ.value),
    ]

    return Job.objects.filter(Q(*user_query) | Q(*group_query))


def api_docs_view(request):
    if request.user.is_authenticated:
        return render(request, template_name="swagger-ui.html", context={"schema_url": "api:openapi-schema"})
    else:
        return redirect("/api/login?next=/api/docs")
