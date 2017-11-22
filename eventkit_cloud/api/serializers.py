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

from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry
from django.utils.translation import ugettext as _

from django.contrib.auth.models import User

from eventkit_cloud.jobs.models import (
    ExportFormat,
    DatamodelPreset,
    Job,
    Region,
    RegionMask,
    DataProvider,
    DataProviderTask,
    License,
    UserLicense
)
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTaskRecord,
    ExportTaskException,
    FileProducingTaskResult,
    DataProviderTaskRecord
)
from eventkit_cloud.utils.s3 import get_presigned_url
from rest_framework import serializers
from rest_framework_gis import serializers as geo_serializers
import validators


try:
    from collections import OrderedDict
# python 2.6
except ImportError:
    from ordereddict import OrderedDict

# Get an instance of a logger
logger = logging.getLogger(__name__)


class ProviderTaskSerializer(serializers.ModelSerializer):
    formats = serializers.SlugRelatedField(
        many=True,
        queryset=ExportFormat.objects.all(),
        slug_field='slug',
        error_messages={'non_field_errors': _('Select an export format.')}
    )
    provider = serializers.CharField()

    class Meta:
        model = DataProviderTask
        fields = ('provider', 'formats')

    @staticmethod
    def create(validated_data, **kwargs):
        from eventkit_cloud.api.views import get_models
        """Creates an export DataProviderTask."""
        format_names = validated_data.pop("formats")
        format_models = get_models([formats for formats in format_names], ExportFormat, 'slug')
        provider_model = DataProvider.objects.get(name=validated_data.get("provider"))
        provider_task = DataProviderTask.objects.create(provider=provider_model)
        provider_task.formats.add(*format_models)
        provider_task.save()
        return provider_task

    @staticmethod
    def update(instance, validated_data, **kwargs):
        """Not implemented.
        :param **kwargs:
        """
        raise NotImplementedError

    def validate(self, data, **kwargs):
        """
        Validates the data submitted during DataProviderTask creation.

        See api/validators.py for validation code.
        :param **kwargs:
        """
        # selection = validators.validate_licenses(self.context['request'].data, user=self.context['request'].user)
        return data


class ExportTaskResultSerializer(serializers.ModelSerializer):
    """Serialize FileProducingTaskResult models."""
    url = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()

    class Meta:
        model = FileProducingTaskResult
        fields = ('filename', 'size', 'url', 'deleted')

    def get_url(self, obj):
        request = self.context['request']
        if getattr(settings, 'USE_S3', False):
            return get_presigned_url(download_url=obj.download_url)
        else:
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
        exc_info = cPickle.loads(str(obj.exception)).exc_info

        return str(exc_info[1])

class ExportTaskRecordSerializer(serializers.ModelSerializer):
    """Serialize ExportTasks models."""
    result = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:tasks-detail',
        lookup_field='uid'
    )

    class Meta:
        model = ExportTaskRecord
        fields = (
            'uid', 'url', 'name', 'status', 'progress', 'estimated_finish', 'started_at', 'finished_at', 'duration',
            'result', 'errors', 'display')

    def get_result(self, obj):
        """Serialize the FileProducingTaskResult for this ExportTaskRecord."""
        try:
            result = obj.result
            serializer = ExportTaskResultSerializer(result, many=False, context=self.context)
            return serializer.data
        except FileProducingTaskResult.DoesNotExist:
            return None  # no result yet

    def get_errors(self, obj):
        """Serialize the ExportTaskExceptions for this ExportTaskRecord."""
        try:
            errors = obj.exceptions
            serializer = ExportTaskExceptionSerializer(errors, many=True, context=self.context)
            return serializer.data
        except ExportTaskException.DoesNotExist:
            return None


class DataProviderTaskRecordSerializer(serializers.ModelSerializer):
    tasks = ExportTaskRecordSerializer(many=True, required=False)
    url = serializers.HyperlinkedIdentityField(
        view_name='api:provider_tasks-detail',
        lookup_field='uid'
    )

    class Meta:
        model = DataProviderTaskRecord
        fields = ('uid', 'url', 'name', 'started_at', 'finished_at', 'duration', 'tasks', 'status', 'display', 'slug')

class SimpleJobSerializer(serializers.Serializer):
    """Return a sub-set of Job model attributes."""

    def update(self, instance, validated_data):
        super(SimpleJobSerializer, self).update(instance, validated_data)

    uid = serializers.SerializerMethodField()
    name = serializers.CharField()
    event = serializers.CharField()
    description = serializers.CharField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:jobs-detail',
        lookup_field='uid'
    )
    extent = serializers.SerializerMethodField()
    original_selection = serializers.SerializerMethodField(read_only=True)
    # bounds = serializers.SerializerMethodField()
    published = serializers.BooleanField()
    featured = serializers.BooleanField()
    formats = serializers.SerializerMethodField('get_provider_tasks')

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

    @staticmethod
    def get_original_selection(obj):
        geom_collection = obj.original_selection
        if not geom_collection:
            return None
        feature_collection = OrderedDict()
        feature_collection['type'] = 'FeatureCollection'
        feature_collection['features'] = []
        for geom in geom_collection:
            geojson_geom = json.loads(geom.geojson)
            feature = OrderedDict()
            feature['type'] = 'Feature'
            feature['geometry'] = geojson_geom
            feature_collection['features'].append(feature)
        return feature_collection

    def get_provider_tasks(self, obj):
        return [format.name for format in obj.provider_tasks.first().formats.all()]


class LicenseSerializer(serializers.ModelSerializer):
    """Serialize Licenses."""

    class Meta:
        model = License
        fields = (
            'slug', 'name', 'text'
        )


class ExportRunSerializer(serializers.ModelSerializer):
    """Serialize ExportRun."""
    url = serializers.HyperlinkedIdentityField(
        view_name='api:runs-detail',
        lookup_field='uid'
    )
    job = SimpleJobSerializer()  # nest the job details
    provider_tasks = DataProviderTaskRecordSerializer(many=True)
    user = serializers.SerializerMethodField()
    zipfile_url = serializers.SerializerMethodField()
    expiration = serializers.SerializerMethodField

    class Meta:
        model = ExportRun
        fields = (
            'uid', 'url', 'created_at', 'updated_at', 'started_at', 'finished_at', 'duration', 'user',
            'status', 'job', 'provider_tasks', 'zipfile_url', 'expiration', 'deleted'
        )
        read_only_fields = ('created_at', 'updated_at')

    @staticmethod
    def get_user(obj):
        return obj.user.username

    def get_zipfile_url(self, obj):
        request = self.context['request']
        if not obj.zipfile_url:
            return None

        if obj.zipfile_url.startswith('http'):
            if getattr(settings, 'USE_S3', False):
                return get_presigned_url(download_url=obj.zipfile_url)
            else:
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


class UserSerializer(serializers.ModelSerializer):

    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.CharField()
    last_login = serializers.DateTimeField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    identification = serializers.SerializerMethodField()
    commonname = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'username', 'first_name', 'last_name', 'email', 'last_login', 'date_joined', 'identification', 'commonname'
        )
        read_only_fields = ('username', 'first_name', 'last_name', 'email', 'last_login', 'date_joined')

    @staticmethod
    def get_identification(instance):
        if hasattr(instance, 'oauth'):
            return instance.oauth.identification
        else:
            return None

    @staticmethod
    def get_commonname(instance):
        if hasattr(instance, 'oauth'):
            return instance.oauth.commonname
        else:
            return None


class UserDataSerializer(serializers.Serializer):
    """
        Return a GeoJSON representation of the user data.
        
    """
    user = serializers.SerializerMethodField()
    accepted_licenses = serializers.SerializerMethodField()

    class Meta:
        fields = (
            'user',
            'accepted_licenses'
        )
        read_only_fields = (
            'user',
        )

    @staticmethod
    def get_user(instance):
        return UserSerializer(instance).data

    @staticmethod
    def get_accepted_licenses(instance):
        licenses = dict()
        user_licenses = UserLicense.objects.filter(user=instance)
        for license in License.objects.all():
            if user_licenses.filter(license=license):
                licenses[license.slug] = True
            else:
                licenses[license.slug] = False
        return licenses

    def update(self, instance, validated_data):
        if self.context.get('request').data.get('accepted_licenses'):
            for slug, selected in self.context.get('request').data.get('accepted_licenses').iteritems():
                user_license = UserLicense.objects.filter(user=instance, license=License.objects.get(slug=slug))
                if user_license and not selected:
                    user_license.delete()
                if not user_license and selected:
                    UserLicense.objects.create(user=instance, license=License.objects.get(slug=slug))
        return instance

    def create(self, validated_data, **kwargs):
        raise NotImplementedError("UserData can only be updated using this interface.")


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


class DataProviderSerializer(serializers.ModelSerializer):
    model_url = serializers.HyperlinkedIdentityField(
        view_name='api:providers-detail',
        lookup_field='slug'
    )
    type = serializers.SerializerMethodField(read_only=True)
    license = LicenseSerializer(required=False)

    class Meta:
        model = DataProvider
        extra_kwargs = {'url': {'write_only': True}, 'user': {'write_only': True}, 'config': {'write_only': True}}
        read_only_fields = ('uid',)
        fields = '__all__'

    @staticmethod
    def create(validated_data, **kwargs):
        # try to get existing export Provider
        url = validated_data.get('url')
        user = validated_data.get('user')
        license_data = validated_data.pop('license', None)
        if license_data:
            License.objects.create(**license_data)

        ep = DataProvider.objects.filter(url=url, user=user).first()
        if not ep:
            ep = DataProvider.objects.create(**validated_data)
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
    original_selection = serializers.SerializerMethodField(read_only=True)
    region = SimpleRegionSerializer(read_only=True)
    published = serializers.BooleanField()
    featured  = serializers.BooleanField()


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
    def get_original_selection(obj):
        geom_collection = obj.original_selection
        if not geom_collection:
            return None
        feature_collection = OrderedDict()
        feature_collection['type'] = 'FeatureCollection'
        feature_collection['features'] = []
        for geom in geom_collection:
            geojson_geom = json.loads(geom.geojson)
            feature = OrderedDict()
            feature['type'] = 'Feature'
            feature['geometry'] = geojson_geom
            feature_collection['features'].append(feature)
        return feature_collection

    @staticmethod
    def get_owner(obj):
        return obj.user.username


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
    updated_at = serializers.DateTimeField(read_only=True)
    owner = serializers.SerializerMethodField(read_only=True)
    exports = serializers.SerializerMethodField()
    preset = serializers.PrimaryKeyRelatedField(queryset=DatamodelPreset.objects.all(), required=False)
    published = serializers.BooleanField(required=False)
    featured = serializers.BooleanField(required=False)
    region = SimpleRegionSerializer(read_only=True)
    extent = serializers.SerializerMethodField(read_only=True)
    original_selection = serializers.SerializerMethodField(read_only=True)
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

    def validate(self, data, **kwargs):
        """
        Validates the data submitted during Job creation.

        See api/validators.py for validation code.
        """
        user = data['user']
        selection = validators.validate_selection(self.context['request'].data, user=user)
        data['the_geom'] = selection
        original_selection = validators.validate_original_selection(self.context['request'].data)
        data['original_selection'] = original_selection
        data.pop('provider_tasks')

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

    @staticmethod
    def get_original_selection(obj):
        geom_collection = obj.original_selection
        if not geom_collection:
            return None
        feature_collection = OrderedDict()
        feature_collection['type'] = 'FeatureCollection'
        feature_collection['features'] = []
        for geom in geom_collection:
            geojson_geom = json.loads(geom.geojson)
            feature = OrderedDict()
            feature['type'] = 'Feature'
            feature['geometry'] = geojson_geom
            feature_collection['features'].append(feature)
        return feature_collection

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
        serializer = DataProviderSerializer(providers, many=True, context={'request': self.context['request']})
        return serializer.data

    @staticmethod
    def get_tags(obj):
        """Return the Tags selected for this export."""
        return obj.json_tags

    @staticmethod
    def get_owner(obj):
        """Return the username for the owner of this export."""
        return obj.user.username
