"""
Provides serialization for API responses.

See `DRF serializer documentation  <http://www.django-rest-framework.org/api-guide/serializers/>`_
Used by the View classes api/views.py to serialize API responses as JSON or HTML.
See DEFAULT_RENDERER_CLASSES setting in core.settings.contrib for the enabled renderers.
"""
# -*- coding: utf-8 -*-
import cPickle
import json
import logging
import os
from urlparse import urlparse, urlunparse

from rest_framework_gis import serializers as geo_serializers

from django.contrib.gis.geos import GEOSGeometry
from django.conf import settings
from django.utils import timezone
from django.utils.translation import ugettext as _
from rest_framework import serializers

import validators
from eventkit_cloud.jobs.models import (
    ExportConfig,
    ExportFormat,
    Job,
    Region,
    RegionMask,
    Tag,
    ExportProvider,
    ProviderTask
)
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTask,
    ExportTaskException,
    ExportTaskResult,
    ExportProviderTask
)

try:
    from collections import OrderedDict
# python 2.6
except ImportError:
    from ordereddict import OrderedDict

# Get an instance of a logger
logger = logging.getLogger(__name__)


class TagSerializer(serializers.ModelSerializer):
    """Serialize the Tag model."""

    class Meta:
        model = Tag
        fields = ('key', 'value', 'data_model', 'geom_types')


class SimpleExportConfigSerializer(serializers.Serializer):
    """Return a sub-set of ExportConfig model attributes."""

    def update(self, instance, validated_data):
        super(SimpleExportConfigSerializer, self).update(instance, validated_data)

    uid = serializers.UUIDField(read_only=True)
    name = serializers.CharField()
    config_type = serializers.CharField()
    filename = serializers.CharField()
    published = serializers.BooleanField()
    created = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:configs-detail',
        lookup_field='uid'
    )

    @staticmethod
    def get_created(obj):
        return obj.created_at


class ExportConfigSerializer(serializers.Serializer):
    """Return the full set of ExportConfig model attributes."""
    uid = serializers.UUIDField(read_only=True)
    url = serializers.HyperlinkedIdentityField(
        view_name='api:configs-detail',
        lookup_field='uid'
    )
    name = serializers.CharField(max_length=255)
    config_type = serializers.ChoiceField(['PRESET', 'TRANSLATION', 'TRANSFORM'])
    filename = serializers.CharField(max_length=255, read_only=True, default='')
    size = serializers.SerializerMethodField()
    content_type = serializers.CharField(max_length=50, read_only=True)
    upload = serializers.FileField(allow_empty_file=False, max_length=100)
    published = serializers.BooleanField()
    created = serializers.SerializerMethodField()
    owner = serializers.SerializerMethodField(read_only=True)
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    @staticmethod
    def create(validated_data, **kwargs):
        """Create an ExportConfig instance.
        :param **kwargs:
        """
        return ExportConfig.objects.create(**validated_data)

    @staticmethod
    def update(instance, validated_data, **kwargs):
        """Update an ExportConfig instance.
        :param **kwargs:
        """
        instance.config_type = validated_data.get('config_type', instance.config_type)
        instance.upload.delete(False)  # delete the old file..
        instance.upload = validated_data.get('upload', instance.upload)
        instance.name = validated_data.get('name', instance.name)
        instance.filename = validated_data.get('filename', instance.filename)
        instance.content_type = validated_data.get('content_type', instance.content_type)
        instance.updated_at = timezone.now()
        instance.save()
        return instance

    @staticmethod
    def validate(data, **kwargs):
        """Validate the form data.
        :param **kwargs:
        """
        logger.debug(data)
        upload = data['upload']
        config_type = data['config_type']
        content_type = validators.validate_content_type(upload, config_type)
        if config_type == 'PRESET':
            validators.validate_preset(upload)
        data['content_type'] = content_type
        fname = data['upload'].name
        data['filename'] = fname.replace(' ', '_').lower()
        return data

    @staticmethod
    def get_size(obj):
        size = obj.upload.size
        return size

    @staticmethod
    def get_created(obj):
        return obj.created_at

    @staticmethod
    def get_owner(obj):
        return obj.user.username


class ExportTaskResultSerializer(serializers.ModelSerializer):
    """Serialize ExportTaskResult models."""
    url = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()

    class Meta:
        model = ExportTaskResult
        fields = ('filename', 'size', 'url',)

    def get_url(self, obj):
        request = self.context['request']
        return request.build_absolute_uri(obj.download_url)

    @staticmethod
    def get_size(obj):
        return "{0:.3f} MB".format(obj.size)


class ExportTaskExceptionSerializer(serializers.ModelSerializer):
    """Serialize ExportTaskExceptions."""
    exception = serializers.SerializerMethodField()

    class Meta:
        model = ExportTaskException
        fields = ('exception',)

    @staticmethod
    def get_exception(obj):
        exception = obj.exception
        try:
            exc_info = cPickle.loads(str(exception))
            if exc_info:
                exc_info = exc_info.exc_info
            return str(exc_info[1])
        except:
            return exception

class ExportTaskSerializer(serializers.ModelSerializer):
    """Serialize ExportTasks models."""
    result = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()
    started_at = serializers.SerializerMethodField()
    finished_at = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:tasks-detail',
        lookup_field='uid'
    )

    class Meta:
        model = ExportTask
        fields = (
            'uid', 'url', 'name', 'status', 'progress', 'estimated_finish', 'started_at', 'finished_at', 'duration',
            'result', 'errors',)

    def get_result(self, obj):
        """Serialize the ExportTaskResult for this ExportTask."""
        try:
            result = obj.result
            serializer = ExportTaskResultSerializer(result, many=False, context=self.context)
            return serializer.data
        except ExportTaskResult.DoesNotExist:
            return None  # no result yet

    def get_errors(self, obj):
        """Serialize the ExportTaskExceptions for this ExportTask."""
        try:
            errors = obj.exceptions
            serializer = ExportTaskExceptionSerializer(errors, many=True, context=self.context)
            return serializer.data
        except ExportTaskException.DoesNotExist:
            return None

    @staticmethod
    def get_started_at(obj):
        if not obj.started_at:
            return None  # not started yet
        else:
            return obj.started_at

    @staticmethod
    def get_finished_at(obj):
        if not obj.finished_at:
            return None  # not finished yet
        else:
            return obj.finished_at

    @staticmethod
    def get_duration(obj):
        """Get the duration for this ExportTask."""
        started = obj.started_at
        finished = obj.finished_at
        if started and finished:
            return str(finished - started)
        else:
            return None  # can't compute yet


class ExportProviderTaskSerializer(serializers.ModelSerializer):
    tasks = ExportTaskSerializer(many=True, required=False)
    url = serializers.HyperlinkedIdentityField(
        view_name='api:provider_tasks-detail',
        lookup_field='uid'
    )

    class Meta:
        model = ExportProviderTask
        fields = ('uid', 'url', 'name', 'tasks',)




class SimpleJobSerializer(serializers.Serializer):
    """Return a sub-set of Job model attributes."""

    def update(self, instance, validated_data):
        super(SimpleJobSerializer, self).update(instance, validated_data)

    uid = serializers.SerializerMethodField()
    name = serializers.CharField()
    description = serializers.CharField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:jobs-detail',
        lookup_field='uid'
    )
    extent = serializers.SerializerMethodField()

    @staticmethod
    def get_uid(obj):
        return obj.uid

    @staticmethod
    def get_extent(obj):
        """Return the Job's extent as a GeoJSON Feature."""
        uid = str(obj.uid)
        name = obj.name
        geom = obj.the_geom
        geometry = json.loads(GEOSGeometry(geom).geojson)
        feature = OrderedDict()
        feature['type'] = 'Feature'
        feature['properties'] = {'uid': uid, 'name': name}
        feature['geometry'] = geometry
        return feature


class ExportRunSerializer(serializers.ModelSerializer):
    """Serialize ExportRun."""
    url = serializers.HyperlinkedIdentityField(
        view_name='api:runs-detail',
        lookup_field='uid'
    )
    job = SimpleJobSerializer()  # nest the job details
    provider_tasks = ExportProviderTaskSerializer(many=True)
    finished_at = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    zipfile_url = serializers.SerializerMethodField()

    class Meta:
        model = ExportRun
        fields = (
            'uid', 'url', 'started_at', 'finished_at', 'duration', 'user',
            'status', 'job', 'provider_tasks', 'zipfile_url'
        )

    @staticmethod
    def get_finished_at(obj):
        if not obj.finished_at:
            return {}
        else:
            return obj.finished_at

    @staticmethod
    def get_duration(obj):
        """Return the duration of the the run."""
        started = obj.started_at
        finished = obj.finished_at
        if started and finished:
            return str(finished - started)
        else:
            return None

    @staticmethod
    def get_user(obj):
        return obj.user.username

    def get_zipfile_url(self, obj):
        request = self.context['request']
        if not obj.zipfile_url:
            return None

        if obj.zipfile_url.startswith('http'):
            return obj.zipfile_url

        # get full URL path from current request
        uri = request.build_absolute_uri()
        uri = list(urlparse(uri))
        # modify path, query parmas, and fragment on the URI to match zipfile URL
        path = os.path.join(settings.EXPORT_MEDIA_ROOT, obj.zipfile_url)
        uri[2] = path  # path
        uri[4] = None  # fragment
        uri[5] = None  # query
        return urlunparse(uri)


class UserSerializer(serializers.Serializer):
    def update(self, instance, validated_data):
        super(UserSerializer, self).update(instance, validated_data)

    id = serializers.IntegerField()


class RegionMaskSerializer(geo_serializers.GeoFeatureModelSerializer):
    """Return a GeoJSON representation of the region mask."""

    class Meta:
        model = RegionMask
        geo_field = 'the_geom'
        fields = ('the_geom',)


class RegionSerializer(geo_serializers.GeoFeatureModelSerializer):
    """Serializer returning GeoJSON representation of Regions."""
    url = serializers.HyperlinkedIdentityField(
        view_name='api:regions-detail',
        lookup_field='uid'
    )
    id = serializers.SerializerMethodField()

    class Meta:
        model = Region
        geo_field = 'the_geom'
        fields = ('id', 'uid', 'name', 'description', 'url', 'the_geom')

    @staticmethod
    def get_id(obj):
        return obj.uid


class SimpleRegionSerializer(serializers.ModelSerializer):
    """Serializer for returning Region model data without geometry."""
    url = serializers.HyperlinkedIdentityField(
        view_name='api:regions-detail',
        lookup_field='uid'
    )

    class Meta:
        model = Region
        fields = ('uid', 'name', 'description', 'url')


class ExportFormatSerializer(serializers.ModelSerializer):
    """Return a representation of the ExportFormat model."""
    url = serializers.HyperlinkedIdentityField(
        view_name='api:formats-detail',
        lookup_field='slug'
    )

    class Meta:
        model = ExportFormat
        fields = ('uid', 'url', 'slug', 'name', 'description')


class ExportProviderSerializer(serializers.ModelSerializer):
    model_url = serializers.HyperlinkedIdentityField(
        view_name='api:providers-detail',
        lookup_field='id'
    )
    type = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ExportProvider
        exclude = ('id', 'level_from', 'level_to')
        read_only_fields = ('uid',)

    @staticmethod
    def create(validated_data, **kwargs):
        # try to get existing export Provider
        url = validated_data.get('url')
        user = validated_data.get('user')

        ep = ExportProvider.objects.filter(url=url, user=user).first()
        if not ep:
            ep = ExportProvider.objects.create(**validated_data)
        return ep

    @staticmethod
    def get_type(obj):
        return obj.export_provider_type.type_name


class ListJobSerializer(serializers.Serializer):
    """
    Return a sub-set of Job model attributes.

    Provides a stripped down set of export attributes.
    Removes the selected Tags from the Job representation.
    Used to display the list of exports in the export browser
    where tag info is not required.
    """

    def update(self, instance, validated_data):
        super(ListJobSerializer, self).update(instance, validated_data)

    uid = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:jobs-detail',
        lookup_field='uid'
    )
    name = serializers.CharField()
    description = serializers.CharField()
    event = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    owner = serializers.SerializerMethodField(read_only=True)
    extent = serializers.SerializerMethodField()
    region = SimpleRegionSerializer(read_only=True)
    published = serializers.BooleanField()

    @staticmethod
    def get_uid(obj):
        return obj.uid

    @staticmethod
    def get_extent(obj):
        """Return the export extent as a GeoJSON Feature."""
        uid = str(obj.uid)
        name = obj.name
        geom = obj.the_geom
        geometry = json.loads(GEOSGeometry(geom).geojson)
        feature = OrderedDict()
        feature['type'] = 'Feature'
        feature['properties'] = {'uid': uid, 'name': name}
        feature['geometry'] = geometry
        return feature

    @staticmethod
    def get_owner(obj):
        return obj.user.username


class ProviderTaskSerializer(serializers.ModelSerializer):
    formats = serializers.SlugRelatedField(
        many=True,
        queryset=ExportFormat.objects.all(),
        slug_field='slug',
        error_messages={'non_field_errors': _('Select an export format.')}
    )
    provider = serializers.CharField()

    class Meta:
        model = ProviderTask
        fields = ('provider', 'formats')

    @staticmethod
    def create(validated_data, **kwargs):
        from eventkit_cloud.api.views import get_models
        """Creates an export ProviderTask."""
        format_names = validated_data.pop("formats")
        format_models = get_models([formats for formats in format_names], ExportFormat, 'slug')
        provider_model = ExportProvider.objects.get(name=validated_data.get("provider"))
        provider_task = ProviderTask.objects.create(provider=provider_model)
        provider_task.formats.add(*format_models)
        provider_task.save()
        return provider_task

    @staticmethod
    def update(instance, validated_data, **kwargs):
        """Not implemented.
        :param **kwargs:
        """
        raise NotImplementedError

    @staticmethod
    def validate(data, **kwargs):
        """
        Validates the data submitted during ProviderTask creation.

        See api/validators.py for validation code.
        :param **kwargs:
        """
        return data


class JobSerializer(serializers.Serializer):
    """
    Return a full representation of an export Job.

    This is the core representation of the API.
    """

    provider_tasks = ProviderTaskSerializer(many=True)

    uid = serializers.UUIDField(read_only=True)
    url = serializers.HyperlinkedIdentityField(
        view_name='api:jobs-detail',
        lookup_field='uid'
    )
    name = serializers.CharField(
        max_length=100,
    )
    description = serializers.CharField(
        max_length=255,
    )
    event = serializers.CharField(
        max_length=100,
        allow_blank=True,
        required=False
    )
    created_at = serializers.DateTimeField(read_only=True)
    owner = serializers.SerializerMethodField(read_only=True)
    exports = serializers.SerializerMethodField()
    configurations = serializers.SerializerMethodField()
    published = serializers.BooleanField(required=False)
    feature_save = serializers.BooleanField(required=False)
    feature_pub = serializers.BooleanField(required=False)
    xmin = serializers.FloatField(
        max_value=180, min_value=-180, write_only=True,
        error_messages={
            'required': _('xmin is required.'),
            'invalid': _('invalid xmin value.'),
        }
    )
    ymin = serializers.FloatField(
        max_value=90, min_value=-90, write_only=True,
        error_messages={
            'required': _('ymin is required.'),
            'invalid': _('invalid ymin value.'),
        }
    )
    xmax = serializers.FloatField(
        max_value=180, min_value=-180, write_only=True,
        error_messages={
            'required': _('xmax is required.'),
            'invalid': _('invalid xmax value.'),
        }
    )
    ymax = serializers.FloatField(
        max_value=90, min_value=-90, write_only=True,
        error_messages={
            'required': _('ymax is required.'),
            'invalid': _('invalid ymax value.'),
        }
    )
    region = SimpleRegionSerializer(read_only=True)
    extent = serializers.SerializerMethodField(read_only=True)
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    tags = serializers.SerializerMethodField()
    include_zipfile = serializers.BooleanField(required=False, default=False)

    def get_zipfile_url(self, obj):
        request = self.context['request']
        if not obj.zipfile_url:
            return None

        return request.build_absolute_uri('../../downloads/' + obj.zipfile_url)

    @staticmethod
    def create(validated_data, **kwargs):
        """Creates an export Job.
        :param **kwargs:
        """
        return Job.objects.create(**validated_data)

    @staticmethod
    def update(instance, validated_data, **kwargs):
        """Not implemented as Jobs are cloned rather than updated.
        :param **kwargs:
        """
        raise NotImplementedError

    @staticmethod
    def validate(data, **kwargs):
        """
        Validates the data submitted during Job creation.

        See api/validators.py for validation code.
        """
        user = data['user']
        extents = validators.validate_bbox_params(data)
        the_geom = validators.validate_bbox(extents, user=user)
        data['the_geom'] = the_geom
        for _key in ['xmin', 'ymin', 'xmax', 'ymax', 'provider_tasks']:
            data.pop(_key)

        return data

    @staticmethod
    def get_extent(obj):
        """Return the export extent as a GeoJSON Feature."""
        uid = str(obj.uid)
        name = obj.name
        geom = obj.the_geom
        geometry = json.loads(GEOSGeometry(geom).geojson)
        feature = OrderedDict()
        feature['type'] = 'Feature'
        feature['properties'] = {'uid': uid, 'name': name}
        feature['geometry'] = geometry
        return feature

    def get_exports(self, obj):
        """Return the export formats selected for this export."""
        exports = []
        for provider_task in obj.provider_tasks.all():
            serializer = ExportFormatSerializer(provider_task.formats, many=True,
                                                context={'request': self.context['request']})
            exports.append({"provider": provider_task.provider.name, "formats": serializer.data})
        return exports

    def get_provider_tasks(self, obj):
        """Return the export formats selected for this export."""
        exports = []
        for provider_task in obj.provider_tasks.all():
            serializer = ProviderTaskSerializer(provider_task.formats, many=True,
                                                context={'request': self.context['request']})
            exports.append({provider_task.provider.name: serializer.data})
        return exports

    def get_providers(self, obj):
        """Return the export formats selected for this export."""
        providers = [provider_format for provider_format in obj.providers.all()]
        serializer = ExportProviderSerializer(providers, many=True, context={'request': self.context['request']})
        return serializer.data

    def get_configurations(self, obj):
        """Return the configurations selected for this export."""
        configs = obj.configs.all()
        serializer = SimpleExportConfigSerializer(configs, many=True,
                                                  context={'request': self.context['request']})
        return serializer.data

    @staticmethod
    def get_tags(obj):
        """Return the Tags selected for this export."""
        tags = obj.tags.all()
        serializer = TagSerializer(tags, many=True)
        return serializer.data

    @staticmethod
    def get_owner(obj):
        """Return the username for the owner of this export."""
        return obj.user.username
