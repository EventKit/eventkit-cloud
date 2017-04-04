"""Provides classes for handling API requests."""
# -*- coding: utf-8 -*-
from collections import OrderedDict
import logging
import os
import json

from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.translation import ugettext as _

from eventkit_cloud.jobs import presets
from eventkit_cloud.jobs.models import (
    ExportConfig, ExportFormat, Job, Region, RegionMask, Tag, ExportProvider, ProviderTask
)
from eventkit_cloud.jobs.presets import PresetParser
from eventkit_cloud.tasks.models import ExportRun, ExportTask, ExportProviderTask
from eventkit_cloud.tasks.task_factory import create_run
from rest_framework import filters, permissions, status, views, viewsets
from rest_framework.decorators import detail_route
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from serializers import (
    ExportConfigSerializer, ExportFormatSerializer, ExportRunSerializer,
    ExportTaskSerializer, JobSerializer, RegionMaskSerializer, ExportProviderTaskSerializer,
    RegionSerializer, ListJobSerializer, ProviderTaskSerializer,
    ExportProviderSerializer
)

from ..tasks.export_tasks import pick_up_run_task, cancel_export_provider_task
from .filters import ExportConfigFilter, ExportRunFilter, JobFilter
from .pagination import LinkHeaderPagination
from .permissions import IsOwnerOrReadOnly
from .renderers import HOTExportApiRenderer
from .validators import validate_bbox_params, validate_search_bbox


# Get an instance of a logger
logger = logging.getLogger(__name__)

# controls how api responses are rendered
renderer_classes = (JSONRenderer, HOTExportApiRenderer)


class JobViewSet(viewsets.ModelViewSet):
    """
    Main endpoint for export creation and managment. Provides endpoints
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
        * If no preset parameter is provided, then the default [HDM](http://export.hotosm.org/api/hdm-data-model?format=json) tags will be used for the export.
    * published: `true` if this export is to be published globally, `false` otherwise.
        * Unpublished exports will be purged from the system 48 hours after they are created.

    """

    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwnerOrReadOnly)
    parser_classes = (JSONParser,)
    lookup_field = 'uid'
    pagination_class = LinkHeaderPagination
    filter_backends = (filters.DjangoFilterBackend, filters.SearchFilter)
    filter_class = JobFilter
    search_fields = ('name', 'description', 'event', 'user__username', 'region__name')

    def get_queryset(self):
        """Return all objects user can view."""
        return Job.objects.filter(Q(user=self.request.user) | Q(published=True))

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
            errors['id'] = _('missing_bbox_parameter')
            errors['message'] = _('Missing bounding box parameter')
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
        Associates the *Job* with required *ExportFormats*, *ExportConfig* and *Tags*

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


        To monitor the resulting export run retreive the `uid` value from the returned json
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
                  "url": "http://cloud.eventkit.dev/api/jobs/cf9c038c-a09a-4058-855a-b0b1d5a6c5c4",
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
                          "url": "http://cloud.eventkit.dev/api/formats/gpkg",
                          "slug": "gpkg",
                          "name": "Geopackage",
                          "description": "GeoPackage"
                        }
                      ],
                      "provider": "OpenStreetMap Tiles"
                    }
                  ],
                  "configurations": [],
                  "published": false,
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

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            """Get the required data from the validated request."""

            export_providers = request.data.get('export_providers', [])
            provider_tasks = request.data.get('provider_tasks', [])
            tags = request.data.get('tags')
            preset = request.data.get('preset')
            translation = request.data.get('translation')
            transform = request.data.get('transform')

            with transaction.atomic():
                if export_providers:
                    for ep in export_providers:
                        ep['user'] = request.user.id
                    provider_serializer = ExportProviderSerializer(
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
                            many=True
                        )
                        try:
                            provider_serializer.is_valid(raise_exception=True)
                        except ValidationError:
                            error_data = OrderedDict()
                            error_data['errors'] = [_('A provider and an export format must be selected.')]
                            return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
                        job.provider_tasks = provider_serializer.save()
                        if preset:
                            """Get the tags from the uploaded preset."""
                            logger.debug('Found preset with uid: %s' % preset)
                            config = ExportConfig.objects.get(uid=preset)
                            job.configs.add(config)
                            preset_path = config.upload.path
                            """Use the UnfilteredPresetParser."""
                            parser = presets.UnfilteredPresetParser(preset=preset_path)
                            tags_dict = parser.parse()
                            filters = {}
                            for entry in tags_dict:
                                Tag.objects.create(name=entry['name'], key=entry['key'], value=entry['value'],
                                                   geom_types=entry['geom_types'], data_model='PRESET', job=job)
                                filters[entry['key']] = entry['value']
                            job.json_filters = filters
                            job.save()
                        elif tags:
                            """Get tags from request."""
                            filters = {}
                            for entry in tags:
                                Tag.objects.create(name=entry['name'], key=entry['key'], value=entry['value'],
                                                   job=job, data_model=entry['data_model'],
                                                   geom_types=entry['geom_types'], groups=entry['groups'])
                                filters[entry['key']] = entry['value']
                            job.json_filters = filters
                            job.save()
                        else:
                            """
                            Use hdm preset as default tags if no preset or tags
                            are provided in the request.
                            """
                            path = os.path.dirname(os.path.realpath(__file__))
                            parser = presets.PresetParser(preset=path + '/presets/hdm_presets.xml')
                            tags_dict = parser.parse()
                            filters = {}
                            for entry in tags_dict:
                                Tag.objects.create(name=entry['name'], key=entry['key'], value=entry['value'],
                                                   geom_types=entry['geom_types'], data_model='HDM', job=job)
                                filters[entry['key']] = entry['value']
                            job.json_filters = filters
                            job.save()
                        # check for translation file
                        if translation:
                            config = ExportConfig.objects.get(uid=translation)
                            job.configs.add(config)
                        # check for transform file
                        if transform:
                            config = ExportConfig.objects.get(uid=transform)
                            job.configs.add(config)
                    except Exception as e:
                        error_data = OrderedDict()
                        error_data['id'] = _('server_error')
                        error_data['message'] = _('Error creating export job: %(error)s') % {'error': e}
                        return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                else:
                    error_data = OrderedDict()
                    error_data['provider_tasks'] = [_('Invalid provider task.')]
                    return Response(error_data, status=status.HTTP_400_BAD_REQUEST)

            # run the tasks
            job_uid = str(job.uid)
            # run needs to be created so that the UI can be updated with the task list.
            run_uid = create_run(job_uid=job_uid)

            running = JobSerializer(job, context={'request': request})
            # Run is passed to celery to start the tasks.
            pick_up_run_task.delay(run_uid=run_uid)
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
        # run needs to be created so that the UI can be updated with the task list.
        run_uid = create_run(job_uid=uid)
        # Run is passed to celery to start the tasks.
        run = ExportRun.objects.get(uid=run_uid)
        if run.user != request.user and not request.user.is_superuser:
            return Response([{'detail': _('Unauthorized.')}], status.HTTP_403_FORBIDDEN)
        if run:
            pick_up_run_task.delay(run_uid=run_uid)
            running = ExportRunSerializer(run, context={'request': request})
            return Response(running.data, status=status.HTTP_202_ACCEPTED)
        else:
            return Response([{'detail': _('Failed to run Export')}], status.HTTP_400_BAD_REQUEST)


class PresetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns the list of PRESET configuration files.
    """
    CONFIG_TYPE = 'PRESET'
    serializer_class = ExportConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = ExportConfig.objects.filter(config_type=CONFIG_TYPE)
    lookup_field = 'uid'


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


class ExportProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the supported export formats.
    """
    serializer_class = ExportProviderSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'id'
    ordering = ['name']

    def get_queryset(self):
        """
        This view should return a list of all the purchases
        for the currently authenticated user.
        """
        return ExportProvider.objects.filter(Q(user=self.request.user) | Q(user=None))


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint exposing the supported regions.
    """
    serializer_class = RegionSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = Region.objects.all()
    lookup_field = 'uid'


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
    Provides an endpoint for querying export runs.

    Export runs for a particular job can be filtered by status by appending one of
    `COMPLETED`, `SUBMITTED`, `INCOMPLETE` or `FAILED` as the value of the `STATUS` parameter:
    `/api/runs?job_uid=a_job_uid&status=STATUS`
    """
    serializer_class = ExportRunSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (filters.DjangoFilterBackend,)
    filter_class = ExportRunFilter
    lookup_field = 'uid'
    search_fields = ('job__uid',)

    def get_queryset(self):
        return ExportRun.objects.filter(Q(user=self.request.user) | Q(job__published=True)).order_by('-started_at')

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
        queryset = self.get_queryset().filter(uid=uid)
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        List the ExportRuns for a single Job.

        Gets the job_uid from the request and returns run data for the
        associated Job.

        * request: the http request.

        * Returns: the serialized run data.
        """
        job_uid = self.request.query_params.get('job_uid', None)
        if job_uid:
            queryset = self.filter_queryset(self.get_queryset().filter(job__uid=job_uid)).order_by('-started_at')
        else:
            queryset = self.get_queryset().order_by('-started_at')
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, uid=None, *args, **kwargs):
        field = self.request.query_params.get('field', None)
        job_uid = self.request.query_params.get('job_uid', None)
        if field == 'expiration' and job_uid:
            updated_time = timezone.now() + timezone.timedelta(days=14)
            run = ExportRun.objects.get(job__uid=job_uid)
            if not run.expiration > updated_time:
                run.expiration = updated_time
                run.save()
            return Response({'success': True, 'expiration': run.expiration }, status=status.HTTP_200_OK)
        else:
            return Response({'success': False}, status=status.HTTP_400_BAD_REQUEST)



class ExportConfigViewSet(viewsets.ModelViewSet):
    """
    Endpoint for operations on export configurations.

    Lists all available configuration files.
    """
    serializer_class = ExportConfigSerializer
    pagination_class = LinkHeaderPagination
    filter_backends = (filters.DjangoFilterBackend, filters.SearchFilter)
    filter_class = ExportConfigFilter
    search_fields = ('name', 'config_type', 'user__username')
    permission_classes = (permissions.IsAuthenticated,
                          IsOwnerOrReadOnly)
    parser_classes = (FormParser, MultiPartParser, JSONParser)
    queryset = ExportConfig.objects.filter(config_type='PRESET')
    lookup_field = 'uid'


class ExportTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """
    serializer_class = ExportTaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'uid'

    def get_queryset(self):
        return ExportTask.objects.filter(Q(export_provider_task__run__user=self.request.user) | Q(export_provider_task__run__job__published=True)).order_by('-started_at')

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        GET a single export task.

        Args:
            request: the http request.
            uid: the uid of the export task to GET.
        Returns:
            the serialized ExportTask data.
        """
        queryset = ExportTask.objects.filter(uid=uid)
        serializer = self.get_serializer(
            queryset,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)


class ExportProviderTaskViewSet(viewsets.ModelViewSet):
    """
    Provides List and Retrieve endpoints for ExportTasks.
    """
    serializer_class = ExportProviderTaskSerializer
    permission_classes = (permissions.IsAuthenticated,)
    lookup_field = 'uid'

    def get_queryset(self):
        """Return all objects user can view."""
        return ExportProviderTask.objects.filter(Q(run__user=self.request.user) | Q(run__job__published=True))

    def retrieve(self, request, uid=None, *args, **kwargs):
        """
        GET a single export task.

        Args:
            request: the http request.
            uid: the uid of the export provider task to GET.
        Returns:
            the serialized ExportTask data
        """
        serializer = self.get_serializer(
            self.get_queryset().filter(uid=uid),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def partial_update(self, request, uid=None, *args, **kwargs):

        export_provider_task = ExportProviderTask.objects.get(uid=uid)

        if export_provider_task.run.user != request.user and not request.user.is_superuser:
            return Response({'success': False}, status=status.HTTP_403_FORBIDDEN)

        cancel_export_provider_task.run(export_provider_task_uid=uid, canceling_user=request.user)
        return Response({'success': True}, status=status.HTTP_200_OK)

class PresetViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Returns the list of PRESET configuration files.
    """
    CONFIG_TYPE = 'PRESET'
    serializer_class = ExportConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = ExportConfig.objects.filter(config_type=CONFIG_TYPE)
    lookup_field = 'uid'


class TranslationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Return the list of TRANSLATION configuration files.
    """
    CONFIG_TYPE = 'TRANSLATION'
    serializer_class = ExportConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = ExportConfig.objects.filter(config_type=CONFIG_TYPE)
    lookup_field = 'uid'


class TransformViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Return the list of TRANSFORM configuration files.
    """
    CONFIG_TYPE = 'TRANSFORM'
    serializer_class = ExportConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    queryset = ExportConfig.objects.filter(config_type=CONFIG_TYPE)
    lookup_field = 'uid'


class HDMDataModelView(views.APIView):
    """Endpoint exposing the HDM Data Model."""
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def get(request, format='json'):
        path = os.path.dirname(os.path.realpath(__file__))
        parser = PresetParser(path + '/presets/hdm_presets.xml')
        data = parser.build_hdm_preset_dict()
        return JsonResponse(data, status=status.HTTP_200_OK)


class OSMDataModelView(views.APIView):
    """Endpoint exposing the OSM Data Model."""
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def get(request, format='json'):
        # TODO: move __file__ reference to pkgutil
        path = os.path.dirname(os.path.realpath(__file__))
        parser = PresetParser(path + '/presets/osm_presets.xml')
        data = parser.build_hdm_preset_dict()
        return JsonResponse(data, status=status.HTTP_200_OK)


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
        export_provider: An ExportProvider model for the content provider (i.e. osm or wms service)
        export_formats: An ExportFormat model for the geospatial data format (i.e. shapefile or geopackage)

    Returns:

    """
    provider_task = ProviderTask.objects.create(provider=export_provider)
    for export_format in export_formats:
        supported_formats = \
            export_provider.export_provider_type.supported_formats.all()
        if export_format in supported_formats:
            provider_task.formats.add(export_format)
    provider_task.save()
    return provider_task


