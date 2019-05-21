"""
Provides serialization for API responses.

See `DRF serializer documentation  <http://www.django-rest-framework.org/api-guide/serializers/>`_
Used by the View classes api/views.py to serialize API responses as JSON or HTML.
See DEFAULT_RENDERER_CLASSES setting in core.settings.contrib for the enabled renderers.
"""
# -*- coding: utf-8 -*-
import pickle
import json
import logging

from django.contrib.auth.models import User, Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import GEOSGeometry
from django.utils.translation import ugettext as _
from notifications.models import Notification
from rest_framework import serializers
from rest_framework_gis import serializers as geo_serializers

from . import validators
from eventkit_cloud.core.models import GroupPermission, GroupPermissionLevel, JobPermission
from eventkit_cloud.jobs.models import (
    ExportFormat,
    DatamodelPreset,
    Job,
    Region,
    RegionMask,
    DataProvider,
    DataProviderTask,
    License,
    UserLicense,
    UserJobActivity)
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTaskRecord,
    ExportTaskException,
    FileProducingTaskResult,
    DataProviderTaskRecord,
    prefetch_export_runs
)

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
        formats = validated_data.pop("formats")
        provider_model = DataProvider.objects.get(name=validated_data.get("provider"))
        provider_task = DataProviderTask.objects.create(provider=provider_model)
        provider_task.formats.add(*formats)
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


class FileProducingTaskResultSerializer(serializers.ModelSerializer):
    """Serialize FileProducingTaskResult models."""
    url = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()
    uid = serializers.UUIDField(read_only=True)

    def __init__(self, *args, **kwargs):
        super(FileProducingTaskResultSerializer, self).__init__(*args, **kwargs)
        if self.context.get('no_license'):
            self.fields.pop('url')

    class Meta:
        model = FileProducingTaskResult
        fields = ('uid', 'filename', 'size', 'url', 'deleted')

    def get_url(self, obj):
        request = self.context['request']
        return request.build_absolute_uri('/download?uid={}'.format(obj.uid))

    @staticmethod
    def get_size(obj):
        size = ""
        if obj.size:
            size = "{0:.3f} MB".format(obj.size)
        return size


class ExportTaskExceptionSerializer(serializers.ModelSerializer):
    """Serialize ExportTaskExceptions."""
    exception = serializers.SerializerMethodField()

    class Meta:
        model = ExportTaskException
        fields = ('exception',)

    @staticmethod
    def get_exception(obj):
        # set a default (incase not found)
        exc_info = ["","Exception info not found or unreadable."]
        try:
            exc_info = pickle.loads(obj.exception.encode()).exc_info
        except Exception as te:
            logger.error(str(te))

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
            serializer = FileProducingTaskResultSerializer(result, many=False, context=self.context)
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

class ExportTaskListSerializer(serializers.BaseSerializer):
    def to_representation(self, obj):
        return obj.uid


class DataProviderTaskRecordSerializer(serializers.ModelSerializer):
    tasks = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(
        view_name='api:provider_tasks-detail',
        lookup_field='uid'
    )

    def get_tasks(self, obj):
        request = self.context['request']
        if request.query_params.get('slim'):
            return ExportTaskListSerializer(obj.tasks, many=True, required=False, context=self.context).data
        else:
            return ExportTaskRecordSerializer(obj.tasks, many=True, required=False, context=self.context).data

    class Meta:
        model = DataProviderTaskRecord
        fields = ('uid', 'url', 'name', 'started_at', 'finished_at', 'duration',
                  'tasks', 'status', 'display', 'slug', 'estimated_size')


class DataProviderListSerializer(serializers.BaseSerializer):
    def to_representation(self, obj):
        return obj.uid


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
    visibility = serializers.CharField()
    featured = serializers.BooleanField()
    formats = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField(read_only=True)
    relationship = serializers.SerializerMethodField(read_only=True)

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

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions['value'] = obj.visibility
        return permissions

    def get_relationship(self, obj):
        request = self.context['request']
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)


    @staticmethod
    def get_formats(obj):
        # Since formats are the same for all provider_tasks (1.1.0) just grab anyone and print them.
        provider_task = obj.provider_tasks.first()
        formats = []
        if hasattr(provider_task, "formats"):
            formats = [format.name for format in obj.provider_tasks.first().formats.all()]
        return formats


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
    job = serializers.SerializerMethodField()  # nest the job details
    provider_tasks = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    zipfile_url = serializers.SerializerMethodField()
    expiration = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    started_at = serializers.SerializerMethodField()
    finished_at = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    expiration = serializers.SerializerMethodField()

    class Meta:
        model = ExportRun
        fields = (
            'uid', 'url', 'created_at', 'updated_at', 'started_at', 'finished_at', 'duration', 'user',
            'status', 'job', 'provider_tasks', 'zipfile_url', 'expiration', 'deleted'
        )
        read_only_fields = ('created_at', 'updated_at')

    @staticmethod
    def get_user(obj):
        if not obj.deleted:
            return obj.user.username

    def get_provider_tasks(self, obj):
        if not obj.deleted:
            request = self.context['request']
            if request.query_params.get('slim'):
                return DataProviderListSerializer(obj.provider_tasks, many=True, context=self.context).data
            else:
                return DataProviderTaskRecordSerializer(obj.provider_tasks, many=True, context=self.context).data

    def get_zipfile_url(self, obj):
        request = self.context['request']
        if obj.provider_tasks.filter(name='run'):
            task_downloadable = obj.provider_tasks.get(name='run').tasks.filter(name__icontains='zip')[0].result
            if task_downloadable:
                return request.build_absolute_uri('/download?uid={}'.format(task_downloadable.uid))
        return ""

    def get_created_at(self, obj):
        if not obj.deleted:
            return obj.created_at

    def get_started_at(self, obj):
        if not obj.deleted:
            return obj.started_at

    def get_finished_at(self, obj):
        if not obj.deleted:
            return obj.finished_at

    def get_duration(self, obj):
        if not obj.deleted:
            return obj.duration

    def get_status(self, obj):
        if not obj.deleted:
            return obj.status

    def get_job(self, obj):
        data = SimpleJobSerializer(obj.job, context=self.context).data
        if not obj.deleted:
            return data
        else:
            return {'uid': data['uid'], 'name': data['name']}

    def get_expiration(self, obj):
        if not obj.deleted:
            return obj.expiration


class GroupPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupPermission
        fields = ('group', 'user', 'permission')


class JobPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPermission
        fields = ('job', 'content_type', 'object_id', 'permission')


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    administrators = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('id', 'name', 'members', 'administrators')

    @staticmethod
    def get_group_permissions(instance):
        return GroupPermission.objects.filter(group=instance).prefetch_related('user', 'group')

    def get_members(self, instance):
        qs = self.get_group_permissions(instance).filter(permission=GroupPermissionLevel.MEMBER.value)
        return [permission.user.username for permission in qs]

    def get_administrators(self, instance):
        qs = self.get_group_permissions(instance).filter(permission=GroupPermissionLevel.ADMIN.value)
        return [permission.user.username for permission in qs]

    @staticmethod
    def get_identification(instance):
        if hasattr(instance, 'oauth'):
            return instance.oauth.identification
        else:
            return None

class GroupUserSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('name', 'members')

    def get_members(self, instance):
        request = self.context['request']
        limit = 1000
        if request.query_params.get('limit'):
            limit = int(request.query_params.get('limit'))
        gp_admins = GroupPermission.objects.filter(group=instance)\
            .filter(permission=GroupPermissionLevel.ADMIN.value)[:limit]
        admins = [gp.user for gp in gp_admins]
        members = []
        gp_members = GroupPermission.objects.filter(group=instance)\
            .filter(permission=GroupPermissionLevel.MEMBER.value).exclude(user__in=admins)[:limit - gp_admins.count()]
        for gp in gp_members:
            if gp.user not in admins:
                members.append(gp.user)

        return [self.user_representation(user, GroupPermissionLevel.ADMIN.value) for user in admins]\
               + [self.user_representation(user, GroupPermissionLevel.MEMBER.value) for user in members]

    @staticmethod
    def user_representation(user, permission_lvl):
        return dict(
            username=user.username,
            last_name=user.last_name,
            first_name=user.first_name,
            email=user.email,
            permission=permission_lvl,
        )


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
    groups = serializers.SerializerMethodField()

    class Meta:
        fields = (
            'user',
            'accepted_licenses'
        )
        read_only_fields = (
            'user',
        )

    def get_accepted_licenses(self, instance):
        licenses = dict()
        request = self.context['request']
        if request.user != instance:
            return licenses
        user_licenses = UserLicense.objects.filter(user=instance)
        for license in License.objects.all():
            if user_licenses.filter(license=license):
                licenses[license.slug] = True
            else:
                licenses[license.slug] = False
        return licenses


    @staticmethod
    def get_user(instance):
        return UserSerializer(instance).data

    @staticmethod
    def get_user_accepted_licenses(instance):
        licenses = dict()
        user_licenses = UserLicense.objects.filter(user=instance)
        for license in License.objects.all():
            if user_licenses.filter(license=license):
                licenses[license.slug] = True
            else:
                licenses[license.slug] = False
        return licenses

    @staticmethod
    def get_groups(instance):
        group_ids = [perm.group.id for perm in
                     GroupPermission.objects.filter(user=instance).filter(permission="MEMBER")]
        return group_ids

    def update(self, instance, validated_data):
        if self.context.get('request').data.get('accepted_licenses'):
            for slug, selected in self.context.get('request').data.get('accepted_licenses').items():
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
    visibility = serializers.CharField()
    featured = serializers.BooleanField()
    permissions = serializers.SerializerMethodField(read_only=True)
    relationship = serializers.SerializerMethodField(read_only=True)

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

    def get_relationship(self, obj):
        request = self.context['request']
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions['value'] = obj.visibility
        return permissions


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
    permissions = serializers.SerializerMethodField(read_only=True)
    relationship = serializers.SerializerMethodField(read_only=True)
    exports = serializers.SerializerMethodField()
    preset = serializers.PrimaryKeyRelatedField(queryset=DatamodelPreset.objects.all(), required=False)
    published = serializers.BooleanField(required=False)
    visibility = serializers.CharField(required=False)
    featured = serializers.BooleanField(required=False)
    region = SimpleRegionSerializer(read_only=True)
    extent = serializers.SerializerMethodField(read_only=True)
    original_selection = serializers.SerializerMethodField(read_only=True)
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )
    tags = serializers.SerializerMethodField()
    include_zipfile = serializers.BooleanField(required=False, default=False)

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

    def get_relationship(self, obj):
        request = self.context['request']
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions['value'] = obj.visibility
        return permissions


class UserJobActivitySerializer(serializers.ModelSerializer):
    last_export_run = serializers.SerializerMethodField()

    class Meta:
        model = UserJobActivity
        fields = ('last_export_run', 'type', 'created_at')

    def get_last_export_run(self, obj):
        if obj.job.last_export_run:
            serializer = ExportRunSerializer(obj.job.last_export_run, context={'request': self.context['request']})
            return serializer.data
        else:
            return None


class GenericNotificationRelatedSerializer(serializers.BaseSerializer):

    def to_representation(self, referenced_object):
        if isinstance(referenced_object, User):
            serializer = UserSerializer(referenced_object)
        elif isinstance(referenced_object, Job):
            serializer = NotificationJobSerializer(referenced_object, context={'request': self.context['request']})
        elif isinstance(referenced_object, ExportRun):
            serializer = NotificationRunSerializer(referenced_object, context={'request': self.context['request']})
        elif isinstance(referenced_object, Group):
            serializer = GroupSerializer(referenced_object)
        return serializer.data


class NotificationSerializer(serializers.ModelSerializer):

    actor = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    action_object = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('unread', 'deleted', 'level', 'verb', 'description', 'id', 'timestamp',
                  'recipient_id', 'actor', 'target', 'action_object')

    def get_related_object(self, obj, related_type=None):
        if not related_type:
            return None
        type_id = getattr(obj, '{}_content_type_id'.format(related_type))
        if type_id:
            return {'type': str(ContentType.objects.get(id=type_id).model),
                    'id': getattr(obj, '{0}_object_id'.format(related_type)),
                    'details': GenericNotificationRelatedSerializer(getattr(obj, related_type),
                                                                    context={'request': self.context['request']}).data}

    def get_actor(self, obj):
        return self.get_related_object(obj, 'actor')

    def get_target(self, obj):
        return self.get_related_object(obj, 'target')

    def get_action_object(self, obj):
        return self.get_related_object(obj, 'action_object')

class NotificationJobSerializer(serializers.Serializer):
    """Return a slimmed down representation of a Job model."""

    def update(self, instance, validated_data):
        super(NotificationJobSerializer, self).update(instance, validated_data)

    uid = serializers.SerializerMethodField()
    name = serializers.CharField()
    event = serializers.CharField()
    description = serializers.CharField()
    published = serializers.BooleanField()
    visibility = serializers.CharField()
    featured = serializers.BooleanField()

    @staticmethod
    def get_uid(obj):
        return obj.uid

class NotificationRunSerializer(serializers.ModelSerializer):
    """Return a slimmed down representation of a ExportRun model."""
    job = serializers.SerializerMethodField()  # nest the job details
    user = serializers.SerializerMethodField()
    expiration = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    started_at = serializers.SerializerMethodField()
    finished_at = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    expiration = serializers.SerializerMethodField()

    class Meta:
        model = ExportRun

        fields = (
            'uid', 'created_at', 'updated_at', 'started_at', 'finished_at', 'duration', 'user',
            'status', 'job', 'expiration', 'deleted'
        )
        read_only_fields = ('created_at', 'updated_at')

    @staticmethod
    def get_user(obj):
        if not obj.deleted:
            return obj.user.username

    def get_created_at(self, obj):
        if not obj.deleted:
            return obj.created_at

    def get_started_at(self, obj):
        if not obj.deleted:
            return obj.started_at

    def get_finished_at(self, obj):
        if not obj.deleted:
            return obj.finished_at

    def get_duration(self, obj):
        if not obj.deleted:
            return obj.duration

    def get_status(self, obj):
        if not obj.deleted:
            return obj.status

    def get_job(self, obj):
        data = NotificationJobSerializer(obj.job, context=self.context).data
        if not obj.deleted:
            return data
        else:
            return {'uid': data['uid'], 'name': data['name']}

    def get_expiration(self, obj):
        if not obj.deleted:
            return obj.expiration

