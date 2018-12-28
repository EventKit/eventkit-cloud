"""Provides classes for handling API requests."""
import logging
# -*- coding: utf-8 -*-
from collections import OrderedDict
from datetime import datetime, timedelta

from dateutil import parser
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import GEOSException, GEOSGeometry
from django.db import transaction
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.translation import ugettext as _
from notifications.models import Notification
from rest_framework import exceptions
from rest_framework import filters, permissions, status, views, viewsets, mixins
from rest_framework.decorators import detail_route, list_route, action
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.schemas import SchemaGenerator
from rest_framework.serializers import ValidationError

from eventkit_cloud.api.filters import ExportRunFilter, JobFilter, UserFilter, GroupFilter, UserJobActivityFilter
from eventkit_cloud.api.pagination import LinkHeaderPagination
from eventkit_cloud.api.permissions import IsOwnerOrReadOnly
from eventkit_cloud.api.renderers import HOTExportApiRenderer, PlainTextRenderer, CustomSwaggerUIRenderer, \
    CustomOpenAPIRenderer
from eventkit_cloud.api.serializers import (
    ExportFormatSerializer, ExportRunSerializer,
    ExportTaskRecordSerializer, JobSerializer, RegionMaskSerializer, DataProviderTaskRecordSerializer,
    RegionSerializer, ListJobSerializer, ProviderTaskSerializer, DataProviderSerializer, LicenseSerializer,
    UserDataSerializer, GroupSerializer, UserJobActivitySerializer, NotificationSerializer, GroupUserSerializer
)
from eventkit_cloud.api.validators import validate_bbox_params, validate_search_bbox
from eventkit_cloud.core.helpers import sendnotification, NotificationVerb, NotificationLevel
from eventkit_cloud.core.models import GroupPermission, GroupPermissionLevel, JobPermission, JobPermissionLevel
from eventkit_cloud.jobs.models import (
    ExportFormat, Job, Region, RegionMask, DataProvider, DataProviderTask, DatamodelPreset, License, VisibilityState,
    UserJobActivity
)
from eventkit_cloud.tasks.export_tasks import pick_up_run_task, cancel_export_provider_task
from eventkit_cloud.tasks.models import ExportRun, ExportTaskRecord, DataProviderTaskRecord, prefetch_export_runs
from eventkit_cloud.tasks.task_factory import create_run, get_invalid_licenses, InvalidLicense, Error
from eventkit_cloud.utils.gdalutils import get_area
from eventkit_cloud.utils.provider_check import perform_provider_check
from eventkit_cloud.utils.stats.size_estimator import get_size_estimate_slug

# Get an instance of a logger
logger = logging.getLogger(__name__)

# controls how api responses are rendered
renderer_classes = (JSONRenderer, HOTExportApiRenderer)


class JobViewSet(viewsets.ModelViewSet):
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
    * preset: One of the published preset files ([html](/api/configurations) or [json](/api/configurations.json)).
        * Use the `uid` as the value of the preset parameter, eg `preset=eed84023-6874-4321-9b48-2f7840e76257`.
        * If no preset parameter is provided, then the default HDM tags will be used for the export.
    * visibility : PUBLIC  PRIVATE or SHARED
        * Unpublished exports will be purged from the system 48 hours after they are created.

    """

    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    parser_classes = (JSONParser,)
    lookup_field = 'uid'
    pagination_class = LinkHeaderPagination
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filter_class = JobFilter
    search_fields = ('name', 'description', 'visibility', 'event', 'user__username', 'region__name')

    def dispatch(self, request, *args, **kwargs):
        return viewsets.ModelViewSet.dispatch(self, request, *args, **kwargs)

    def get_queryset(self):
        """Return all objects user can view."""

        perms, job_ids = JobPermission.userjobs(self.request.user, JobPermissionLevel.READ.value )

        return Job.objects.filter(
             Q(visibility=VisibilityState.PUBLIC.value) | Q(pk__in=job_ids))

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
        params = self.request.query_params.get('bbox', None)
        if params is None:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = ListJobSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            else:
                serializer = ListJobSerializer(queryset, many=True, context={'request': request})
                return Response(serializer.data)
        if len(params.split(',')) < 4:
            errors = OrderedDict()
            errors['errors'] = {}
            errors['errors']['id'] = _('missing_bbox_parameter')
            errors['errors']['message'] = _('Missing bounding box parameter')
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            extents = params.split(',')
            data = {'xmin': extents[0],
                    'ymin': extents[1],
                    'xmax': extents[2],
                    'ymax': extents[3]
                    }
            try:
                bbox_extents = validate_bbox_params(data)
                bbox = validate_search_bbox(bbox_extents)
                queryset = self.filter_queryset(Job.objects.filter(the_geom__within=bbox))
                page = self.paginate_queryset(queryset)
                if page is not None:
                    serializer = ListJobSerializer(page, many=True, context={'request': request})
                    return self.get_paginated_response(serializer.data)
                else:
                    serializer = ListJobSerializer(queryset, many=True, context={'request': request})
                    return Response(serializer.data)
            except ValidationError as e:
                logger.debug(e.detail)
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

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
                    "provider_tasks" : [{
                            "provider" : "OpenStreetMap Data (Themes)",
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
                      "provider": "OpenStreetMap Tiles",
                      "formats": [
                        "gpkg"
                      ]
                    }
                  ],
                  "uid": "cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
                  "url": "http://cloud.eventkit.test/api/jobs/cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
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
                          "url": "http://cloud.eventkit.test/api/formats/gpkg",
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
            export_providers = request.data.get('export_providers', [])
            provider_tasks = request.data.get('provider_tasks', [])
            tags = request.data.get('tags')
            preset = request.data.get('preset')

            with transaction.atomic():
                if export_providers:
                    for ep in export_providers:
                        ep['user'] = request.user.id
                    provider_serializer = DataProviderSerializer(
                        data=export_providers,
                        many=True,
                        context={'request': request}
                    )
                    if provider_serializer.is_valid():
                        provider_serializer.save()
                if len(provider_tasks) > 0:
                    """Save the job and make sure it's committed before running tasks."""
                    try:
                        job = serializer.save()
                        provider_serializer = ProviderTaskSerializer(
                            data=provider_tasks,
                            many=True,
                            context={'request': request}
                        )
                        try:
                            provider_serializer.is_valid(raise_exception=True)
                            job.provider_tasks.add(*provider_serializer.save())
                            job.save()
                        except ValidationError:
                            status_code = status.HTTP_400_BAD_REQUEST
                            error_data = {"errors": [{"status": status_code,
                                                      "title": _('Invalid provider task.'),
                                                      "detail": _('A provider and an export format must be selected.')
                                                      }]}
                            return Response(error_data, status=status_code)
                        # Check max area (skip for superusers)
                        if not self.request.user.is_superuser:
                            for provider_task in job.provider_tasks.all():
                                provider = provider_task.provider
                                max_selection = provider.max_selection
                                if max_selection and 0 < float(max_selection) < get_area(job.the_geom.geojson):
                                    status_code = status.HTTP_400_BAD_REQUEST
                                    error_data = {"errors": [{"status": status_code,
                                                              "title": _('Selection area too large'),
                                                              "detail": _('The selected area is too large '
                                                                          'for provider \'%s\'') % provider.name}]}
                                    return Response(error_data, status=status_code)

                        if preset:
                            """Get the tags from the uploaded preset."""
                            logger.debug('Found preset with uid: {0}'.format(preset))
                            job.json_tags = preset
                            job.save()
                        elif tags:
                            """Get tags from request."""
                            simplified_tags = []
                            for entry in tags:
                                tag = {'key': entry['key'], 'value': entry['value'], 'geom': entry['geom_types']}
                                simplified_tags.append(tag)
                            job.json_tags = simplified_tags
                            job.save()
                        else:
                            """
                            Use hdm preset as default tags if no preset or tags
                            are provided in the request.
                            """
                            hdm_default_tags = DatamodelPreset.objects.get(name='hdm').json_tags
                            job.json_tags = hdm_default_tags
                            job.save()
                    except Exception as e:
                        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
                        error_data = {"errors": [{"status": status_code,
                                                  "title": _('Server Error'),
                                                  "detail": _('Error creating export job: {0}'.format(e))
                                                  }]}
                        return Response(error_data, status=status_code)
                else:
                    status_code = status.HTTP_400_BAD_REQUEST
                    error_data = {"errors": [{"status": status_code,
                                              "title": _('Invalid provider task'),
                                              "detail": _('One or more: {0} are invalid'.format(provider_tasks))
                                              }]}
                    return Response(error_data, status=status_code)


            # run the tasks
            job_uid = str(job.uid)
            # run needs to be created so that the UI can be updated with the task list.
            user_details = get_user_details(request)
            try:
                # run needs to be created so that the UI can be updated with the task list.
                run_uid = create_run(job_uid=job_uid, user=request.user)
            except InvalidLicense as il:
                status_code = status.HTTP_400_BAD_REQUEST
                error_data = {"errors": [{"status": status_code,
                                          "title": _('Invalid License'),
                                          "detail": _(str(il))
                                          }]}
                return Response(error_data, status=status_code)
                # Run is passed to celery to start the tasks.
            except Unauthorized as ua:
                status_code = status.HTTP_403_FORBIDDEN
                error_data = {"errors": [{"status": status_code,
                                          "title": _('Invalid License'),
                                          "detail": _(str(ua))
                                          }]}
                return Response(error_data, status=status_code)

            running = JobSerializer(job, context={'request': request})

            # Run is passed to celery to start the tasks.
            pick_up_run_task.delay(run_uid=run_uid, user_details=user_details)
            return Response(running.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response(serializer.errors,
                            status=status.HTTP_400_BAD_REQUEST)

    @detail_route(methods=['get', 'post'])
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
        # This is just to make it easier to trace when user_details haven't been sent
        user_details = get_user_details(request)
        if user_details is None:
            user_details = {'username': 'unknown-JobViewSet.run'}

        from eventkit_cloud.tasks.task_factory import InvalidLicense, Unauthorized

        try:
            # run needs to be created so that the UI can be updated with the task list.
            run_uid = create_run(job_uid=uid, user=request.user)
        except (InvalidLicense, Error) as err:
            return Response([{'detail': _(str(err))}], status.HTTP_400_BAD_REQUEST)
        # Run is passed to celery to start the tasks.
        except Unauthorized:
            return Response([{'detail': 'ADMIN permission is required to run this DataPack.'}], status.HTTP_403_FORBIDDEN)
        run = ExportRun.objects.get(uid=run_uid)
        if run:
            logger.debug("Placing pick_up_run_task for {0} on the queue.".format(run.uid))
            pick_up_run_task.delay(run_uid=run_uid, user_details=user_details)
            logger.debug("Getting Run Data.".format(run.uid))
            running = ExportRunSerializer(run, context={'request': request})
            logger.debug("Returning Run Data.".format(run.uid))

            return Response(running.data, status=status.HTTP_202_ACCEPTED)

        else:
            return Response([{'detail': _('Failed to run Export')}], status.HTTP_400_BAD_REQUEST)

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

        perms, job_ids = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)
        if not job.id in job_ids:
            return Response([{'detail': 'ADMIN permission is required to update this job.'}],
                            status.HTTP_400_BAD_REQUEST)

        response = {}
        payload = request.data

        for attribute, value in payload.items():
            if attribute == 'visibility' and value not in VisibilityState.__members__:
                msg = "unknown visibility value - %s" % value
                return Response([{'detail': msg}], status.HTTP_400_BAD_REQUEST)

            if hasattr(job, attribute):
                setattr(job, attribute, value)
                response[attribute] = value
            elif attribute == 'permissions':
                pass
            else:
                msg = "unidentified job attribute - %s" % attribute
                return Response([{'detail': msg}], status.HTTP_400_BAD_REQUEST)

        # update permissions if present.  Insure we are not left with 0 admministrators
        # users and / or groups may be updated.  If no update info is provided, maintain
        # the current set of permissions.

        admins = 0
        if "permissions" in payload:
            serializer = JobSerializer(job, context={'request': request})
            current_permissions = serializer.get_permissions(job)
            if not "members" in payload["permissions"]: payload["permissions"]["members"] =  current_permissions["members"]
            if not "groups" in payload["permissions"]: payload["permissions"]["groups"] = current_permissions["groups"]
            users = payload["permissions"]["members"]
            groups = payload["permissions"]["groups"]

            # make sure all user names, group names, and permissions are valid, and insure there is at least one admin
            # if the job is made private

            for index, set in enumerate([users, groups]):
                for key in set:
                    if index == 0:
                        record = User.objects.filter(username=key)
                    else:
                        record = Group.objects.filter(name=key)

                    if not record.exists():
                        return Response([{'detail': "unidentified user or group : %s" % key}],
                                        status.HTTP_400_BAD_REQUEST)
                    perm = set[key]
                    if not perm in JobPermissionLevel.__members__:
                        return Response([{'detail': "invalid permission value : %s" % perm}],
                                        status.HTTP_400_BAD_REQUEST)

                    if perm == GroupPermissionLevel.ADMIN.value: admins += 1

            if admins == 0:
                return Response([{'detail': "This job has no administrators."}],
                                status.HTTP_400_BAD_REQUEST)

            # throw out all current permissions and rewrite them

            for jp in JobPermission.objects.filter(job=job):
                jp.delete()

            for key in users:
                perm = users[key]
                user = User.objects.filter(username=key).all()[0]
                jp = JobPermission.objects.create(job=job, content_object=user, permission=perm)
                jp.save()

            for key in groups:
                perm = groups[key]
                group = Group.objects.filter(name=key).all()[0]
                jp = JobPermission.objects.create(job=job, content_object=group, permission=perm)
                jp.save()

            response['permissions'] = payload["permissions"]

        job.save()
        response['success'] = True
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

    @list_route(methods=['post', ])
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

        if not "permissions" in request.data:
            return Response([{'detail': "missing permissions attribute"}], status.HTTP_400_BAD_REQUEST)

        job_list = get_job_ids_via_permissions(request.data["permissions"])
        jobs = Job.objects.filter(id__in=job_list)
        serializer = ListJobSerializer(jobs, many=True, context={'request': request})
        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, uid=None, *args, **kwargs):
        """
            Destroy a job
        """

        job = Job.objects.get(uid=uid)

        # Does the user have admin permission to make changes to this job?

        logger.info("DELETE REQUEST")
        perms, job_ids = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)
        logger.info("JOB IDS %s %s" % (job.id, job_ids))

        if not job.id in job_ids:
            return Response([{'detail': 'ADMIN permission is required to delete this job.'}],
                            status.HTTP_400_BAD_REQUEST)

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
    lookup_field = 'slug'
    ordering = ['description']

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


class LicenseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint to get detailed information about the data licenses.
    """
    serializer_class = LicenseSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = License.objects.all()
    lookup_field = 'slug'
    ordering = ['name']

    @detail_route(methods=['get'], renderer_classes=[PlainTextRenderer])
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
            response = Response(license_text, content_type='text/plain')
            response['Content-Disposition'] = 'attachment; filename="{}.txt"'.format(slug)
            return response
        except Exception:
            return Response([{'detail': _('Not found')}], status=status.HTTP_400_BAD_REQUEST)

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


class DataProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the supported data providers.
    """
    serializer_class = DataProviderSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (JSONParser,)
    lookup_field = 'slug'
    ordering = ['name']

    def get_queryset(self):
        """
        This view should return a list of all the purchases
        for the currently authenticated user.
        """
        return DataProvider.objects.filter(Q(user=self.request.user) | Q(user=None))

    @detail_route(methods=['get', 'post'])
    def status(self, request, slug=None, *args, **kwargs):
        """
        Checks the status of a data provider to confirm that it is available.

        * slug: The DataProvider object slug.
        * return: The HTTP response of the data provider health check, in cases where there is no error. If the data provider does not exist, returns status 400 bad request.
        """
        try:
            geojson = self.request.data.get('geojson', None)
            provider = DataProvider.objects.get(slug=slug)
            return Response(perform_provider_check(provider, geojson), status=status.HTTP_200_OK)

        except DataProvider.DoesNotExist as e:
            return Response([{'detail': _('Provider not found')}], status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(e)
            logger.error(str(e))
            return Response([{'detail': _('Internal Server Error')}], status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(self, request, slug=None, *args, **kwargs):
        """
        List all data providers.
        * slug: optional lookup field
        * return: A list of data providers.
        """
        return super(DataProviderViewSet, self).list(self, request, slug, *args, **kwargs)

    def retrieve(self, request, slug=None, *args, **kwargs):
        """
        Look up a single data provider by slug value.
        * slug: optional lookup field
        * return: The data provider with the given slug.
        """
        return super(DataProviderViewSet, self).retrieve(self, request, slug, *args, **kwargs)


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the supported regions.
    """
    serializer_class = RegionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Region.objects.all()
    lookup_field = 'uid'

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


class ExportRunViewSet(viewsets.ModelViewSet):
    """
    **retrieve:**

    Returns the exact run as specified by the run UID in the url `/runs/{uid}`

    **list:**

    Returns a list of all the runs.

    Export runs can be filtered and ordered by adding optional parameters to the url:

    * `user`: The user who created the job.

    * `status`: The current run status (can include any number of the following: COMPLETED, SUBMITTED, INCOMPLETE, or FAILED).
        * Example = `/api/runs?status=SUBMITTED,INCOMPLETE,FAILED`

    * `job_uid`: The uid of a particular job.

    * `min_date`: Minimum date (YYYY-MM-DD) for the `started_at` field.

    * `max_date`: Maximum date (YYYY-MM-DD) for the `started_at` field.

    * `started_at`: The DateTime a run was started at in ISO date-time format.

    * `published`: True or False for whether the owning job is published or not.

    * `ordering`: Possible values are `started_at, status, user__username, job__name, job__event, and job__published`.
        * Order can be reversed by adding `-` to the front of the order parameter.

    An example request using some of the parameters.

    `/api/runs?user=test_user&status=FAILED,COMPLETED&min_date=2017-05-20&max_date=2017-12-21&published=True&ordering=-job__name`

    **filter:**

    Accessed at `/runs/filter`.

    Accepts GET and POST. Support all the url params of 'list' with the addition of advanced features like `search_term`, `bbox`, and `geojson`.

    * `search_term`: A value to search the job name, description and event text for.

    * `bbox`: Bounding box in the form of `xmin,ymin,xmax,ymax`.

    To filter by geojson send the geojson geometry in the body of a POST request under the key `geojson`.
    """
    serializer_class = ExportRunSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filter_class = ExportRunFilter
    lookup_field = 'uid'
    search_fields = ('user__username', 'status', 'job__uid', 'min_date',
                     'max_date', 'started_at', 'job__published')
    ordering_fields = (
    'job__name', 'started_at', 'user__username', 'job__published', 'status', 'job__event', 'job__featured')
    ordering = ('-started_at',)

    def get_queryset(self):
        _, job_ids = JobPermission.userjobs(self.request.user, "READ")
        if self.request.query_params.get('slim'):
            return ExportRun.objects.filter(
                (Q(job_id__in=job_ids) | Q(job__visibility=VisibilityState.PUBLIC.value))
            )
        else:
            return prefetch_export_runs((ExportRun.objects.filter(
                (Q(job_id__in=job_ids) | Q(job__visibility=VisibilityState.PUBLIC.value))
            )))

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
        if not request.query_params.get('job_uid'):
            queryset = queryset.filter(deleted=False)
        try:
            self.validate_licenses(queryset, user=request.user)
        except InvalidLicense as il:
            return Response([{'detail': _(str(il))}], status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Destroy a model instance.
        """

        instance = self.get_object()
        job = instance.job

        perms, job_ids = JobPermission.userjobs(request.user, JobPermissionLevel.ADMIN.value)
        if not job.id in job_ids:
               return Response([{'detail': 'ADMIN permission is required to delete this DataPack.'}],
                            status.HTTP_400_BAD_REQUEST)

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
            return Response([{'detail': _(str(il))}], status.HTTP_400_BAD_REQUEST)
        # This is to display deleted runs on the status and download
        if not request.query_params.get('job_uid'):
            queryset = queryset.filter(deleted=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    @list_route(methods=['post', 'get'])
    def filter(self, request, *args, **kwargs):
        """
        Lists the ExportRuns and provides advanced filtering options like search_term, bbox, and geojson geometry.
        Accepts GET and POST request. POST is required if you want to filter by a geojson geometry contained in the request data
        :param request: the http request
        :param args:
        :param kwargs:
        :return: the serialized runs
        """

        deleted = request.data.get('deleted', False)
        queryset = self.filter_queryset(self.get_queryset())

        if "permissions" in request.data:
            job_ids = get_job_ids_via_permissions(request.data["permissions"])
            queryset = ExportRun.objects.filter(
            Q(job_id__in=job_ids))

        search_geojson = self.request.data.get('geojson', None)
        if search_geojson is not None:
            try:
                geom = geojson_to_geos(search_geojson, 4326)
                queryset = queryset.filter(job__the_geom__intersects=geom)
            except ValidationError as e:
                logger.debug(e.detail)
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        search_bbox = self.request.query_params.get('bbox', None)
        if search_bbox is not None and len(search_bbox.split(',')) == 4:
            extents = search_bbox.split(',')
            data = {
                'xmin': extents[0],
                'ymin': extents[1],
                'xmax': extents[2],
                'ymax': extents[3]
            }

            try:
                bbox_extents = validate_bbox_params(data)
                bbox = validate_search_bbox(bbox_extents)
                queryset = queryset.filter(job__the_geom__within=bbox)

            except ValidationError as e:
                logger.debug(e.detail)
                return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        search_term = self.request.query_params.get('search_term', None)
        if search_term is not None:
            queryset = queryset.filter(
                (
                    Q(job__name__icontains=search_term) |
                    Q(job__description__icontains=search_term) |
                    Q(job__event__icontains=search_term)
                )
            )
        if not request.query_params.get('job_uid'):
            queryset = queryset.filter(deleted=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request, 'no_license': True})
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True, context={'request': request, 'no_license': True})
            return Response(serializer.data, status=status.HTTP_200_OK)

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
        if not "expiration" in payload:
            return Response({'success': False}, status=status.HTTP_400_BAD_REQUEST)

        expiration = payload["expiration"]
        target_date = parser.parse(expiration).replace(tzinfo=None)
        run = ExportRun.objects.get(uid=uid)

        if not request.user.is_superuser:
            max_days = int(getattr(settings, 'MAX_DATAPACK_EXPIRATION_DAYS', 30))
            now = datetime.today()
            max_date = now + timedelta(max_days)
            if target_date > max_date.replace(tzinfo=None):
                message = 'expiration date must be before ' + max_date.isoformat()
                return Response({'success': False, 'detail': message}, status=status.HTTP_400_BAD_REQUEST)
            if (target_date < run.expiration.replace(tzinfo=None)):
                message = 'expiration date must be after ' + run.expiration.isoformat()
                return Response({'success': False, 'detail': message}, status=status.HTTP_400_BAD_REQUEST)

        run.expiration = target_date
        run.save()
        return Response({'success': True, 'expiration': run.expiration}, status=status.HTTP_200_OK)

    @staticmethod
    def validate_licenses(queryset, user=None):
        for run in queryset.all():
            invalid_licenses = get_invalid_licenses(run.job, user=user)
            if invalid_licenses:
                raise InvalidLicense("The user: {0} has not agreed to the following licenses: {1}.\n" \
                                     "Please use the user account page, or the user api to agree to the " \
                                     "licenses prior to viewing run data.".format(run.job.user.username,
                                                                                  invalid_licenses))
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


class ExportTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """
    serializer_class = ExportTaskRecordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'uid'

    def get_queryset(self):
        return ExportTaskRecord.objects.filter(Q(export_provider_task__run__user=self.request.user) | Q(
            export_provider_task__run__job__published=True)).order_by('-started_at')

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
        serializer = self.get_serializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, uid=None, *args, **kwargs):
        """
        List all tasks.
        * uid: optional lookup field
        * return: A list of all tasks.
        """
        return super(ExportTaskViewSet, self).list(self, request, uid, *args, **kwargs)


class DataProviderTaskViewSet(viewsets.ModelViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """
    serializer_class = DataProviderTaskRecordSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'uid'

    def get_queryset(self):
        """Return all objects user can view."""
        return DataProviderTaskRecord.objects.filter(Q(run__user=self.request.user) | Q(run__job__published=True))

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        GET a single export task.

        Args:
            request: the http request.
            uid: the uid of the export provider task to GET.
        Returns:
            the serialized ExportTaskRecord data
        """
        serializer = self.get_serializer(
            self.get_queryset().filter(uid=uid),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, uid=None, *args, **kwargs):
        """
        Cancels an export provider task.
        * param uid: The uid of the DataProviderTaskRecord (export provider task model) to be canceled.
        * return: Returns {'success': True} on success. If the user did not have the correct rights (if not superuser,
                  they must be asking for one of their own export provider tasks), then 403 forbidden will be returned.
        """

        data_provider_task_record = DataProviderTaskRecord.objects.get(uid=uid)

        if data_provider_task_record.run.user != request.user and not request.user.is_superuser:
            return Response({'success': False}, status=status.HTTP_403_FORBIDDEN)

        cancel_export_provider_task.run(data_provider_task_uid=data_provider_task_record.uid, canceling_username=request.user.username)
        return Response({'success': True}, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        * return: A list of data provider task objects.
        """
        return super(DataProviderTaskViewSet, self).list(self, request, *args, **kwargs)

    def create(self, request, uid=None, *args, **kwargs):
        """
        Create a data provider task object.
        * uid: optional lookup field
        * return: The status of the object creation.
        """
        return super(DataProviderTaskViewSet, self).create(self, request, uid, *args, **kwargs)

    def destroy(self, request, uid=None, *args, **kwargs):
        """
        Delete a data provider task object.
        * uid: optional lookup field
        * return: The status of the deletion.
        """
        return super(DataProviderTaskViewSet, self).destroy(self, request, uid, *args, **kwargs)

    def update(self, request, uid=None, *args, **kwargs):
        """
        Update a data provider task object.
        * uid: optional lookup field
        * return: The status of the update.
        """
        return super(DataProviderTaskViewSet, self).update(self, request, uid, *args, **kwargs)


class UserDataViewSet(viewsets.GenericViewSet):
    """
    User Data

    """
    serializer_class = UserDataSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    parser_classes = (JSONParser,)
    pagination_class = LinkHeaderPagination
    filter_class = UserFilter
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    lookup_field = 'username'
    lookup_value_regex = '[^/]+'
    search_fields = ('username', 'last_name', 'first_name', 'email')
    ordering_fields = ('username', 'last_name', 'first_name', 'email', 'date_joined')

    def get_queryset(self):
        return User.objects.all()

    def partial_update(self, request, username=None, *args, **kwargs):
        """
        Update user data.

        User data cannot currently be updated via this API menu however UserLicense data can, by sending a patch message,
        with the licenses data that the user agrees to.  Users will need to agree to all of the licenses prior to being allowed to
        download data.

        Request data can be posted as `application/json`.

        * request: the HTTP request in JSON.

        Example:

                {"accepted_licenses": {
                    "odbl": true
                    }
              }
        """

        queryset = self.get_queryset().get(username=username)
        serializer = UserDataSerializer(queryset, data=request.data, context={'request': request})

        if serializer.is_valid():

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request,  *args, **kwargs):
        """
        Get a list of users.
        * return: A list of all users.
        """
        queryset = self.get_queryset()
        total = queryset.count()
        filtered_queryset = self.filter_queryset(queryset)
        if request.query_params.get('exclude_self'):
            filtered_queryset = filtered_queryset.exclude(username=request.user.username)
        elif request.query_params.get('prepend_self'):
            if request.user in filtered_queryset:
                filtered_queryset = filtered_queryset.exclude(username=request.user.username)
                filtered_queryset = [qs for qs in filtered_queryset]
                filtered_queryset = [request.user] + filtered_queryset

        page = None
        if not request.query_params.get('disable_page'):
            page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(filtered_queryset, many=True, context={'request': request})
            response =  Response(serializer.data, status=status.HTTP_200_OK)

        response['Total-Users'] = total
        return response

    def retrieve(self, request, username=None):
        """
        GET a user by username
        """
        queryset = self.get_queryset().get(username=username)
        serializer = self.get_serializer(queryset, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post', 'get'])
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
                if not username in targetnames: targetnames.append(username)

        users = User.objects.filter(username__in=targetnames).all()
        for u in users:
            serializer = self.get_serializer(u, context={'request': request})
            payload.append(serializer.data)

        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def job_permissions(self, request, username=None):
        """
        Get user's permission level for a specific job

        Example: /api/users/job_permissions/admin_user?uid=job-uid-123

        Response: { 'permission': USERS_PERMISSION_LEVEL }
        where USERS_PERMISSION_LEVEL is either READ, ADMIN, or None
        """
        user = User.objects.get(username=username)
        uid = request.query_params.get('uid', None)

        if not user or not uid:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        permission = JobPermission.get_user_permissions(user, uid)

        return Response({ 'permission': permission }, status=status.HTTP_200_OK)


class UserJobActivityViewSet(mixins.CreateModelMixin,
                             mixins.ListModelMixin,
                             viewsets.GenericViewSet):
    """
    Endpoint to create and retrieve user activity related to jobs.
    """
    serializer_class = UserJobActivitySerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    filter_class = UserJobActivityFilter

    def get_queryset(self):
        activity_type = self.request.query_params.get('activity', '').lower()

        if self.request.query_params.get('slim'):
            activities = UserJobActivity.objects.select_related('job', 'user')
        else:
            activities = UserJobActivity.objects.select_related('job', 'user').prefetch_related(
                'job__provider_tasks__provider',
                'job__provider_tasks__formats',
                'job__last_export_run__provider_tasks__tasks__result',
                'job__last_export_run__provider_tasks__tasks__exceptions')

        if activity_type == 'viewed':
            ids = UserJobActivity.objects.filter(
                user=self.request.user,
                type=UserJobActivity.VIEWED,
                job__last_export_run__isnull=False,
                job__last_export_run__deleted=False,
            ).distinct('job').values_list('id', flat=True)

            return activities.filter(id__in=ids).order_by('-created_at')
        else:
            return activities.filter(
                user=self.request.user).order_by('-created_at')


    def list(self, request, *args, **kwargs):
        """
        Gets the most recent UserJobActivity objects.
        """
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(queryset, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request):
        """
        Creates a new UserJobActivity object.
        """
        activity_type = request.query_params.get('activity', '').lower()
        job_uid = request.data.get('job_uid')
        # Save a record of the view activity
        if activity_type == 'viewed':
            queryset =  UserJobActivity.objects.filter(
                user=self.request.user,
                type=UserJobActivity.VIEWED,
                job__last_export_run__isnull=False,
                job__last_export_run__deleted=False,
            ).order_by('-created_at')

            if queryset.count() > 0:
                last_job_viewed = queryset.first()
                # Don't save consecutive views of the same job.
                if str(last_job_viewed.job.uid) == job_uid:
                    return Response({'ignored': True}, content_type='application/json', status=status.HTTP_200_OK)
            job = Job.objects.get(uid=job_uid)
            UserJobActivity.objects.create(user=self.request.user, job=job, type=UserJobActivity.VIEWED)
        else:
            raise exceptions.ValidationError("Activity type '%s' is invalid." % activity_type)

        return Response({}, content_type='application/json', status=status.HTTP_200_OK)


class GroupViewSet(viewsets.ModelViewSet):
    """
    Api components for viewing, creating, and editing groups

    """
    serializer_class = GroupSerializer
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = LinkHeaderPagination
    parser_classes = (JSONParser,)
    filter_class = GroupFilter
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    lookup_field = 'id'
    lookup_value_regex = '[^/]+'
    search_fields = ('name',)
    ordering_fields = ('name',)

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

        queryset = self.get_queryset()
        total = queryset.count()
        filtered_queryset = self.filter_queryset(queryset)

        page = None
        if not request.query_params.get('disable_page'):
            page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            response = self.get_paginated_response(serializer.data)
        else:
            serializer = self.get_serializer(filtered_queryset, many=True, context={'request': request})
            response = Response(serializer.data, status=status.HTTP_200_OK)

        response['Total-Groups'] = total
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

        name = request.data['name']

        matches = Group.objects.filter(name__iexact=name.lower())
        if len(matches) > 0:
            error_data = {"errors": [{"status": status.HTTP_400_BAD_REQUEST,
                                      "title": _('Duplicate Group Name'),
                                      "detail": _('A group named %s already exists.' % name)
                                      }]}
            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

        response = super(GroupViewSet, self).create(request, *args, **kwargs)
        group_id = response.data["id"]
        user = User.objects.all().filter(username=request.user.username)[0]
        group = Group.objects.get(pk=group_id)
        group.user_set.add(user)
        groupadmin = GroupPermission.objects.create(user=user, group=group,
                                                    permission=GroupPermissionLevel.ADMIN.value)
        groupadmin.save()
        GroupPermission.objects.create(user=user, group=group,
                                                     permission=GroupPermissionLevel.MEMBER.value)

        if "members" in request.data:
            for member in request.data["members"]:
                if member != user.username:
                    user = User.objects.all().filter(username=member)[0]
                    if user:
                        GroupPermission.objects.create(user=user, group=group,
                                                       permission=GroupPermissionLevel.MEMBER.value)
                        sendnotification(request.user, user, NotificationVerb.ADDED_TO_GROUP.value,
                                         group, None, NotificationLevel.INFO.value, GroupPermissionLevel.MEMBER.value)

        if "administrators" in request.data:
            for admin in request.data["administrators"]:
                if admin != request.user.username:
                    user = User.objects.all().filter(username=admin)[0]
                    if user:
                        GroupPermission.objects.create(user=user, group=group,
                                                       permission=GroupPermissionLevel.ADMIN.value)
                        sendnotification(request.user, user, NotificationVerb.SET_AS_GROUP_ADMIN.value,
                                         group, None, NotificationLevel.INFO.value, GroupPermissionLevel.ADMIN.value)

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
            perms = GroupPermission.objects.filter(
                user=user,
                group=group,
                permission=GroupPermissionLevel.MEMBER.value
            )
            # if the user is not an admin but is a member we remove them from the group
            if perms:
                perms.delete()
                return Response("OK", status=status.HTTP_200_OK)

            return Response("Administative privileges required.", status=status.HTTP_403_FORBIDDEN)

        if "administrators" in request.data:
            request_admins = request.data["administrators"]
            if len(request_admins) < 1:
                error_data = {"errors": [{"status": status.HTTP_403_FORBIDDEN,
                                          "title": _('Not Permitted'),
                                          "detail": _(
                                              'You must assign another group administator before you can perform this action')
                                          }]}
                return Response(error_data, status=status.HTTP_403_FORBIDDEN)
        super(GroupViewSet, self).partial_update(request, *args, **kwargs)
        # if name in request we need to change the group name
        if "name" in request.data:
            name = request.data["name"]
            if name:
                group.name = name
                group.save()

        # examine provided lists of administrators and members. Adjust as needed.
        for item in [("members", GroupPermissionLevel.MEMBER.value),
                     ("administrators", GroupPermissionLevel.ADMIN.value)]:
            permissionlabel = item[0]
            permission = item[1]

            if not permissionlabel in request.data:
                continue

            user_ids = [perm.user.id for perm in
                        GroupPermission.objects.filter(group=group).filter(permission=permission)]
            currentusers = [user.username for user in User.objects.filter(id__in=user_ids).all()]
            targetusers = request.data[permissionlabel]

            ## Add new users for this permission level
            newusers = list(set(targetusers) - set(currentusers))
            users = User.objects.filter(username__in=newusers).all()
            verb = NotificationVerb.ADDED_TO_GROUP.value
            if permissionlabel == 'administrators': verb = NotificationVerb.SET_AS_GROUP_ADMIN.value


            for user in users:
                GroupPermission.objects.create(user=user, group=group, permission=permission)
                sendnotification(request.user, user, verb, group, None, NotificationLevel.INFO.value, permission)

            ## Remove existing users for this permission level

            removedusers = list(set(currentusers) - set(targetusers))
            users = User.objects.filter(username__in=removedusers).all()
            verb = NotificationVerb.REMOVED_FROM_GROUP.value
            if permissionlabel == 'administrators': verb = NotificationVerb.REMOVED_AS_GROUP_ADMIN.value
            for user in users:
                sendnotification(request.user, user, verb, group, None, NotificationLevel.INFO.value, permission)
                perms = GroupPermission.objects.filter(user=user, group=group, permission=permission).all()
                for perm in perms: perm.delete()

        return Response("OK", status=status.HTTP_200_OK)


    @action(detail=True, methods=['get'])
    def users(self, request, id=None, *args, **kwargs):
        try:
            group = Group.objects.get(id=id)
        except Group.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = GroupUserSerializer(group, context={'request': request})
        return Response(data=serializer.data, status=status.HTTP_200_OK)





class NotificationViewSet(viewsets.ModelViewSet):
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
            serializer = self.get_serializer(page, context={'request': self.request}, many=True)
        else:
            serializer = self.get_serializer(notifications, context={'request': self.request}, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=['delete'])
    def delete(self, request, *args, **kwargs):
        """
        Delete notifications
        If request data of { ids: [....ids] } is provided only those ids will be deleted
        If no request data is included all notifications will be deleted
        """
        notifications = self.get_queryset()
        if request.data.get('ids', None):
            for id in request.data.get('ids'):
                note = notifications.get(id=id)
                if note:
                    note.deleted = True
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_deleted()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def read(self, request, *args, **kwargs):
        """
        Mark notifications as read
        If request data of { ids: [....ids] } is provided only those ids will be marked
        If no request data is included all notifications will be marked read
        """
        notifications = self.get_queryset()
        if request.data.get('ids', None):
            for id in request.data.get('ids'):
                note = notifications.get(id=id)
                if note:
                    note.unread = False
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_read()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def unread(self, request, *args, **kwargs):
        """
        Mark notifications as unread
        If request data of { ids: [....ids] } is provided only those ids will be marked
        If no request data is included all notifications will be marked unread
        """
        notifications = self.get_queryset()
        if request.data.get('ids', None):
            for id in request.data.get('ids'):
                note = notifications.get(id=id)
                if note:
                    note.unread = True
                    note.save()
        else:
            notifications = self.get_queryset()
            notifications.mark_all_as_unread()
        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def counts(self, request, *args, **kwargs):
        payload = {
            "read": len(request.user.notifications.read()),
            "unread": len(request.user.notifications.unread())
        }

        return Response(payload, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
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

        logger.info(request.data)
        for row in request.data:
            qs = Notification.objects.filter(recipient_id=self.request.user.id, id=row['id'])
            logger.info(qs)
            if row['action'] == 'READ':
                qs.mark_all_as_read()
            if row['action'] == 'DELETE':
                qs.mark_all_as_deleted()
            if row['action'] == 'UNREAD':
                qs.mark_all_as_unread()

        return Response({"success": True}, status=status.HTTP_200_OK)


class EstimatorView(views.APIView):
    """
     Api components for computing size estimates for providers within a specified bounding box
    """
    @action(detail=False, methods=['get'])
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
        logger.info(request.query_params)

        bbox = request.query_params.get('bbox', None).split(',')  # w, s, e, n
        bbox = list(map(lambda a: float(a), bbox))
        srs = request.query_params.get('srs', '4326')

        if request.query_params.get('slugs', None):
            for slug in request.query_params.get('slugs').split(','):
                payload += [{
                    'slug': slug,
                    'size': get_size_estimate_slug(slug, bbox, srs)[0],
                    'unit': 'MB'
                }]

        return Response(payload, status=status.HTTP_200_OK)


def get_models(model_list, model_object, model_index):
    models = []
    if not model_list:
        return models
    for model_id in model_list:
        # TODO: would be good to accept either format slug or uuid here..
        try:
            model = model_object.objects.get(**{model_index: model_id})
            models.append(model)
        except model_object.DoesNotExist:
            logger.warn(
                '%s with %s: %s does not exist',
                str(model_object),
                model_index,
                model_id
            )
    return models


def get_provider_task(export_provider, export_formats):
    """

    Args:
        export_provider: An DataProvider model for the content provider (i.e. osm or wms service)
        export_formats: An ExportFormat model for the geospatial data format (i.e. shapefile or geopackage)

    Returns:

    """
    provider_task = DataProviderTask.objects.create(provider=export_provider)
    for export_format in export_formats:
        supported_formats = \
            export_provider.export_provider_type.supported_formats.all()
        provider_task.formats.add(*supported_formats)
    provider_task.save()
    return provider_task


def get_user_details(request):
    """
    Gets user data from a request.
    :param request: View request.
    :return: A dict with user data.
    """
    logged_in_user = request.user
    return {
        'username': logged_in_user.username,
        'is_superuser': logged_in_user.is_superuser,
        'is_staff': logged_in_user.is_staff
    }


def geojson_to_geos(geojson_geom, srid=None):
    """
    :param geojson_geom: A stringified geojson geometry
    :param srid: The ESPG code of the input data
    :return: A GEOSGeometry object
    """
    if not geojson_geom:
        raise exceptions.ValidationError(
            'No geojson geometry string supplied'
        )
    if not srid:
        srid = 4326
    try:
        geom = GEOSGeometry(geojson_geom, srid=srid)
    except GEOSException:
        raise exceptions.ValidationError(
            'Could not convert geojson geometry, check that your geometry is valid'
        )
    if not geom.valid:
        raise exceptions.ValidationError(
            'GEOSGeometry invalid, check that your geojson geometry is valid'
        )
    return geom


def get_job_ids_via_permissions(permissions):

    groupnames = []
    if "groups" in permissions:
        groupnames = permissions["groups"]
    usernames = []
    if "members" in permissions:
        usernames = permissions["members"]

    groups = Group.objects.filter(name__in=groupnames)
    payload = {}
    master_job_list = []
    initialized = False
    for group in groups:
        perms, job_ids = JobPermission.groupjobs(group, JobPermissionLevel.READ.value)
        temp_list = master_job_list
        if not initialized:
            master_job_list = job_ids
        else:
            master_job_list = list(set(temp_list).intersection(job_ids))
        initialized = True

    users = User.objects.filter(username__in=usernames)
    for user in users:
        perms, job_ids = JobPermission.userjobs(user, JobPermissionLevel.READ.value,include_groups=False)
        temp_list = master_job_list
        if not initialized:
            master_job_list = job_ids
        else:
            master_job_list = list(set(temp_list).intersection(job_ids))
        initialized = True

    return master_job_list


class SwaggerSchemaView(views.APIView):

    _ignore_model_permissions = True
    exclude_from_schema = True
    permission_classes = [AllowAny]
    renderer_classes = [
        # CoreJSONRenderer,
        CustomOpenAPIRenderer,
        CustomSwaggerUIRenderer
    ]

    def get(self, request):

        try:
            import coreapi
            generator = SchemaGenerator()
            generator.get_schema(request=request)
            links = generator.get_links(request=request)
            # This obviously shouldn't go here.  Need to implment better way to inject CoreAPI customizations.
            partial_update_link = links.get('users', {}).get('partial_update')
            if partial_update_link:
                links['users']['partial_update'] = coreapi.Link(
                    url=partial_update_link.url,
                    action=partial_update_link.action,
                    fields=[
                        (coreapi.Field(
                            name='username',
                            required=True,
                            location='path')),
                        (coreapi.Field(
                            name='data',
                            required=True,
                            location='form',
                        )),
                    ],
                    description=partial_update_link.description
                )

            members_link = links.get('users', {}).get('members')['create']
            if members_link:
                links['users']['members'] = coreapi.Link(
                    url=members_link.url,
                    action=members_link.action,
                    fields=[
                        (coreapi.Field(
                            name='data',
                            required=True,
                            location='form',
                        )),
                    ],
                    description=members_link.description
                )

            schema = coreapi.Document(
                title='EventKit API',
                url='/api/docs',
                content=links
            )

            if not schema:
                raise exceptions.ValidationError(
                    'A schema could not be generated, please ensure that you are logged in.'
                )

            return Response(schema)
        except ImportError:
            # CoreAPI couldn't be imported, falling back to static schema
            return Response()
