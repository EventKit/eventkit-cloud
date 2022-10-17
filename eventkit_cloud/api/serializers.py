"""
Provides serialization for API responses.

See `DRF serializer documentation  <http://www.django-rest-framework.org/api-guide/serializers/>`_
Used by the View classes api/views.py to serialize API responses as JSON or HTML.
See DEFAULT_RENDERER_CLASSES setting in core.settings.contrib for the enabled renderers.
"""
import json
import logging
import math

# -*- coding: utf-8 -*-
import pickle
from collections import OrderedDict
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from audit_logging.models import AuditEvent
from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import GEOSGeometry
from django.core.cache import cache
from django.db.models import QuerySet
from django.utils import timezone
from django.utils.translation import gettext as _
from notifications.models import Notification
from rest_framework import serializers
from rest_framework.reverse import reverse
from rest_framework.serializers import ValidationError
from rest_framework_gis import serializers as geo_serializers
from rest_framework_gis.fields import GeometrySerializerMethodField
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from eventkit_cloud.api import validators
from eventkit_cloud.api.utils import get_run_zip_file
from eventkit_cloud.core.models import GroupPermission, GroupPermissionLevel, attribute_class_filter
from eventkit_cloud.jobs.helpers import get_valid_regional_justification
from eventkit_cloud.jobs.models import (
    DatamodelPreset,
    DataProvider,
    DataProviderTask,
    ExportFormat,
    Job,
    JobPermission,
    License,
    Projection,
    ProxyFormat,
    Region,
    RegionalJustification,
    RegionalPolicy,
    RegionMask,
    Topic,
    UserJobActivity,
    UserLicense,
)
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.helpers import get_celery_queue_group
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportTaskException,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
)
from eventkit_cloud.tasks.views import generate_zipfile
from eventkit_cloud.user_requests.models import DataProviderRequest, SizeIncreaseRequest

# Get an instance of a logger
logger = logging.getLogger(__name__)


class ProviderTaskSerializer(serializers.ModelSerializer):
    formats = serializers.SlugRelatedField(
        many=True,
        queryset=ExportFormat.objects.all(),
        slug_field="slug",
        error_messages={"non_field_errors": _("Select an export format.")},
    )
    provider = serializers.CharField()

    class Meta:
        model = DataProviderTask
        fields = ("provider", "formats", "min_zoom", "max_zoom")

    def create(self, validated_data):
        """Creates an export DataProviderTask."""
        formats = validated_data.pop("formats")
        provider_slug = validated_data.get("provider")
        try:
            provider_model = DataProvider.objects.get(slug=provider_slug)
        except DataProvider.DoesNotExist:
            raise Exception(f"The DataProvider for {provider_slug} does not exist.")
        provider_task = DataProviderTask.objects.create(provider=provider_model)

        provider_task.formats.add(*formats)
        provider_task.min_zoom = validated_data.pop("min_zoom", None)
        provider_task.max_zoom = validated_data.pop("max_zoom", None)
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
        if self.context.get("no_license"):
            self.fields.pop("url")

    class Meta:
        model = FileProducingTaskResult
        fields = ("uid", "filename", "size", "url", "deleted")

    def get_url(self, obj):
        request = self.context["request"]
        return request.build_absolute_uri("/download?uid={}".format(obj.uid))

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
        fields = ("exception",)

    @staticmethod
    def get_exception(obj):
        # set a default (incase not found)
        exc_info = ["", "Exception info not found or unreadable."]
        try:
            exc_info = pickle.loads(obj.exception.encode()).exc_info
        except Exception as te:
            logger.error(str(te))

        return str(exc_info[1])


class ExportTaskRecordSerializer(serializers.ModelSerializer):
    """Serialize ExportTasks models."""

    result = serializers.SerializerMethodField()
    errors = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name="api:tasks-detail", lookup_field="uid")

    class Meta:
        model = ExportTaskRecord
        fields = (
            "uid",
            "url",
            "name",
            "status",
            "progress",
            "estimated_finish",
            "started_at",
            "finished_at",
            "duration",
            "result",
            "errors",
            "display",
            "hide_download",
        )

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
    provider = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    url = serializers.HyperlinkedIdentityField(view_name="api:provider_tasks-detail", lookup_field="uid")
    preview_url = serializers.SerializerMethodField()
    hidden = serializers.ReadOnlyField(default=False)

    def get_provider(self, obj):
        return DataProviderSerializer(obj.provider, context=self.context).data

    def get_tasks(self, obj):
        request = self.context["request"]
        if request.query_params.get("slim"):
            return ExportTaskListSerializer(obj.tasks, many=True, required=False, context=self.context).data
        else:
            return ExportTaskRecordSerializer(obj.tasks, many=True, required=False, context=self.context).data

    def get_preview_url(self, obj):

        preview = obj.preview
        if preview is not None:
            return preview.file.url
        else:
            return ""

    class Meta:
        model = DataProviderTaskRecord
        fields = (
            "uid",
            "url",
            "name",
            "provider",
            "started_at",
            "finished_at",
            "duration",
            "tasks",
            "status",
            "display",
            "slug",
            "estimated_size",
            "estimated_duration",
            "preview_url",
            "hidden",
        )


class FilteredDataProviderTaskRecordSerializer(serializers.ModelSerializer):

    hidden = serializers.ReadOnlyField(default=True)
    display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DataProviderTaskRecord
        fields = ("id", "uid", "hidden", "display")
        read_only_fields = ("id", "uid")

    def get_display(self, obj):
        return False


class DataProviderListSerializer(serializers.BaseSerializer):
    def to_representation(self, obj):
        return obj.uid


class ProjectionSerializer(serializers.ModelSerializer):
    """Return a representation of the ExportFormat model."""

    class Meta:
        model = Projection
        fields = ("uid", "srid", "name", "description")


class AuditEventSerializer(serializers.ModelSerializer):
    """Return a representation of the AuditEvent model."""

    class Meta:
        model = AuditEvent
        fields = "__all__"


class SimpleJobSerializer(serializers.Serializer):
    """Return a sub-set of Job model attributes."""

    def update(self, instance, validated_data):
        super(SimpleJobSerializer, self).update(instance, validated_data)

    uid = serializers.SerializerMethodField()
    name = serializers.CharField()
    event = serializers.CharField()
    description = serializers.CharField()
    url = serializers.HyperlinkedIdentityField(view_name="api:jobs-detail", lookup_field="uid")
    extent = serializers.SerializerMethodField()
    original_selection = serializers.SerializerMethodField(read_only=True)
    published = serializers.BooleanField()
    visibility = serializers.CharField()
    featured = serializers.BooleanField()
    formats = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField(read_only=True)
    relationship = serializers.SerializerMethodField(read_only=True)
    projections = ProjectionSerializer(many=True)

    @staticmethod
    def get_uid(obj):
        return obj.uid

    @staticmethod
    def get_extent(obj):
        return get_extent_geojson(obj)

    @staticmethod
    def get_original_selection(obj):
        return get_selection_dict(obj)

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions["value"] = obj.visibility
        return permissions

    def get_relationship(self, obj):
        request = self.context["request"]
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)

    def get_formats(self, obj):
        formats = []
        data_provider_tasks, filtered_data_provider_tasks = attribute_class_filter(
            obj.data_provider_tasks.all(), self.context["request"].user
        )
        for data_provider_task in data_provider_tasks:
            if hasattr(data_provider_task, "formats"):
                for format in data_provider_task.formats.all():
                    if format.slug not in formats:
                        formats.append(format.slug)
        return formats


def basic_license_list_serializer(license: Optional[License]):
    """Serialize Licenses."""
    if license:
        return {"slug": license.slug, "name": license.name, "text": license.text}


class LicenseSerializer(serializers.ModelSerializer):
    """Serialize Licenses."""

    class Meta:
        model = License
        fields = ("slug", "name", "text")


class TopicSerializer(serializers.ModelSerializer):
    """Serialize Topics."""

    class Meta:
        model = Topic
        fields = ("slug", "name", "uid", "topic_description")


class ExportRunSerializer(serializers.ModelSerializer):
    """Serialize ExportRun."""

    url = serializers.HyperlinkedIdentityField(view_name="api:runs-detail", lookup_field="uid")
    job = serializers.SerializerMethodField()  # nest the job details
    provider_task_list_status = serializers.SerializerMethodField()
    provider_tasks = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()
    zipfile = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = ExportRun
        fields = (
            "uid",
            "url",
            "created_at",
            "updated_at",
            "started_at",
            "finished_at",
            "duration",
            "user",
            "status",
            "job",
            "provider_task_list_status",
            "provider_tasks",
            "zipfile",
            "expiration",
            "deleted",
        )
        read_only_fields = ("created_at", "updated_at", "provider_task_list_status")

    @staticmethod
    def get_user(obj):
        return obj.user.username

    def get_provider_task_list_status(self, obj):
        request = self.context["request"]
        return get_provider_task_list_status(request.user, obj.data_provider_task_records.all())

    def get_provider_tasks(self, obj):
        if not obj.deleted:
            request = self.context["request"]
            data = []
            data_provider_tasks, filtered_data_provider_tasks = attribute_class_filter(
                obj.data_provider_task_records.all(), request.user
            )
            if data_provider_tasks.count() > 1:  # The will always be a run task.
                if request.query_params.get("slim"):
                    data = DataProviderListSerializer(data_provider_tasks, many=True, context=self.context).data
                else:
                    data = DataProviderTaskRecordSerializer(data_provider_tasks, many=True, context=self.context).data
            if filtered_data_provider_tasks:
                if request.query_params.get("slim"):
                    data += DataProviderListSerializer(
                        filtered_data_provider_tasks, many=True, context=self.context
                    ).data
                else:
                    data += FilteredDataProviderTaskRecordSerializer(
                        filtered_data_provider_tasks, many=True, context=self.context
                    ).data
            return data

    def get_zipfile(self, obj):
        request = self.context["request"]
        data_provider_task_records, filtered_data_provider_task_records = attribute_class_filter(
            obj.data_provider_task_records.exclude(slug="run"), request.user
        )

        if filtered_data_provider_task_records:
            data = None
        else:
            data = {"status": TaskState.PENDING.value}

        run_zip_file = get_run_zip_file(values=data_provider_task_records).first()
        if run_zip_file:
            data = RunZipFileSerializer(run_zip_file, context=self.context).data
        elif obj.status == TaskState.FAILED.value:
            data = {"status": TaskState.FAILED.value}

        return data

    def get_job(self, obj):
        data = SimpleJobSerializer(obj.job, context=self.context).data
        return data


class ExportRunGeoFeatureSerializer(ExportRunSerializer, GeoFeatureModelSerializer):
    run_geom = GeometrySerializerMethodField()
    bbox = GeometrySerializerMethodField()

    class Meta(ExportRunSerializer.Meta):
        geo_field = "run_geom"
        bbox_geo_field = "bbox"

    def get_run_geom(self, obj):
        return obj.job.the_geom

    def get_bbox(self, obj):
        return obj.job.the_geom.extent


class RunZipFileSerializer(serializers.ModelSerializer):

    data_provider_task_records = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    run = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()

    class Meta:
        model = RunZipFile
        fields = "__all__"

    def get_data_provider_task_records(self, obj):
        return DataProviderListSerializer(obj.data_provider_task_records, many=True, context=self.context).data

    def get_message(self, obj):
        if obj.finished_at:
            return "Completed"
        return obj.message

    def get_run(self, obj):
        if obj.run:
            return obj.run.uid
        return ""

    def get_status(self, obj):
        if obj.downloadable_file:
            try:
                return ExportTaskRecord.objects.get(result=obj.downloadable_file).status
            except ExportTaskRecord.DoesNotExist:
                logger.error(f"ExportTaskRecord does not exist for file: {obj.downloadable_file}")
        return obj.status

    def get_url(self, obj):
        request = self.context["request"]
        if obj.downloadable_file:
            return request.build_absolute_uri("/download?uid={}".format(obj.downloadable_file.uid))
        return ""

    def get_size(self, obj):
        if obj.downloadable_file:
            return obj.downloadable_file.size

    def create(self, validated_data, **kwargs):
        request = self.context["request"]
        data_provider_task_record_uids = request.data.get("data_provider_task_record_uids")
        queryset = get_run_zip_file(field="uid", values=data_provider_task_record_uids)
        # If there are no results, that means there's no zip file and we need to create one.
        if not queryset.exists():
            obj = RunZipFile.objects.create()
            obj.status = TaskState.PENDING.value
            data_provider_task_records = DataProviderTaskRecord.objects.filter(
                uid__in=data_provider_task_record_uids
            ).exclude(slug="run")
            obj.data_provider_task_records.set(data_provider_task_records)
            run_zip_task_chain = generate_zipfile(data_provider_task_record_uids, obj)
            celery_queue_group = get_celery_queue_group(run_uid=obj.run.uid)
            run_zip_task_chain.apply_async(queue=celery_queue_group, routing_key=celery_queue_group)
            return obj
        else:
            raise serializers.ValidationError("Duplicate Zip File already exists.")


class GroupPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupPermission
        fields = ("group", "user", "permission")


class JobPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPermission
        fields = ("job", "content_type", "object_id", "permission")


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()
    administrators = serializers.SerializerMethodField()
    restricted = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ("id", "name", "members", "administrators", "restricted")

    @staticmethod
    def get_restricted(instance):
        if hasattr(instance, "restricted"):
            return instance.restricted
        return False

    @staticmethod
    def get_group_permissions(instance):
        return GroupPermission.objects.filter(group=instance).prefetch_related("user", "group")

    def get_members(self, instance):
        qs = self.get_group_permissions(instance).filter(permission=GroupPermissionLevel.MEMBER.value)
        return [permission.user.username for permission in qs]

    def get_administrators(self, instance):
        qs = self.get_group_permissions(instance).filter(permission=GroupPermissionLevel.ADMIN.value)
        return [permission.user.username for permission in qs]

    @staticmethod
    def get_identification(instance):
        if hasattr(instance, "oauth"):
            return instance.oauth.identification
        else:
            return None


class GroupUserSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ("name", "members")

    def get_members(self, instance):
        request = self.context["request"]
        limit = 1000
        if request.query_params.get("limit"):
            limit = int(request.query_params.get("limit"))
        gp_admins = GroupPermission.objects.filter(group=instance).filter(permission=GroupPermissionLevel.ADMIN.value)[
            :limit
        ]
        admins = [gp.user for gp in gp_admins]
        members = []
        gp_members = (
            GroupPermission.objects.filter(group=instance)
            .filter(permission=GroupPermissionLevel.MEMBER.value)
            .exclude(user__in=admins)[: limit - gp_admins.count()]
        )
        for gp in gp_members:
            if gp.user not in admins:
                members.append(gp.user)

        return [self.user_representation(user, GroupPermissionLevel.ADMIN.value) for user in admins] + [
            self.user_representation(user, GroupPermissionLevel.MEMBER.value) for user in members
        ]

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

    class Meta:
        model = User
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
        )
        read_only_fields = (
            "username",
            "first_name",
            "last_name",
            "email",
        )


class UserSerializerFull(serializers.ModelSerializer):
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
            "username",
            "first_name",
            "last_name",
            "email",
            "last_login",
            "date_joined",
            "identification",
            "commonname",
        )
        read_only_fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "last_login",
            "date_joined",
        )

    @staticmethod
    def get_identification(instance):
        if hasattr(instance, "oauth"):
            return instance.oauth.identification
        else:
            return None

    @staticmethod
    def get_commonname(instance):
        if hasattr(instance, "oauth"):
            return instance.oauth.commonname
        else:
            return None


class UserDataSerializer(serializers.Serializer):
    """
    Return a GeoJSON representation of the user data.
    """

    user = serializers.SerializerMethodField()
    accepted_licenses = serializers.SerializerMethodField()
    accepted_policies = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()
    restricted = serializers.SerializerMethodField()

    class Meta:
        fields = ("user", "accepted_licenses")
        read_only_fields = ("user",)

    def get_accepted_licenses(self, instance):
        licenses: Dict[str, bool] = dict()
        request = self.context["request"]
        if request.user != instance:
            return licenses
        user_licenses = UserLicense.objects.filter(user=instance)
        for license in License.objects.all():
            licenses[license.slug] = user_licenses.filter(license=license).exists()
        return licenses

    def get_accepted_policies(self, instance):
        policies: Dict[str, bool] = dict()
        request = self.context["request"]
        if request.user != instance:
            return policies
        for policy in RegionalPolicy.objects.all().prefetch_related("justifications"):
            policies[str(policy.uid)] = get_valid_regional_justification(policy, instance) is not None
        return policies

    @staticmethod
    def get_restricted(instance):
        if hasattr(instance, "restricted"):
            return instance.restricted
        return False

    def get_user(self, instance):
        request = self.context["request"]
        if request.user.is_superuser or request.user == instance:
            return UserSerializerFull(instance).data
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
        group_ids = [
            perm.group.id for perm in GroupPermission.objects.filter(user=instance).filter(permission="MEMBER")
        ]
        return group_ids

    def update(self, instance, validated_data):
        if self.context.get("request").data.get("accepted_licenses"):
            for slug, selected in self.context.get("request").data.get("accepted_licenses").items():
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
        geo_field = "the_geom"
        fields = ("the_geom",)


class RegionSerializer(geo_serializers.GeoFeatureModelSerializer):
    """Serializer returning GeoJSON representation of Regions."""

    url = serializers.HyperlinkedIdentityField(view_name="api:regions-detail", lookup_field="uid")
    id = serializers.SerializerMethodField()

    class Meta:
        model = Region
        geo_field = "the_geom"
        fields = ("id", "uid", "name", "description", "url", "the_geom")

    @staticmethod
    def get_id(obj):
        return obj.uid


class SimpleRegionSerializer(serializers.ModelSerializer):
    """Serializer for returning Region model data without geometry."""

    url = serializers.HyperlinkedIdentityField(view_name="api:regions-detail", lookup_field="uid")

    class Meta:
        model = Region
        fields = ("uid", "name", "description", "url")


class RegionalPolicySerializer(serializers.Serializer):
    """Serializer for returning RegionalPolicy model data."""

    uid = serializers.SerializerMethodField()
    name = serializers.CharField()
    region = RegionSerializer(read_only=True)
    providers = serializers.SerializerMethodField()
    policies = serializers.JSONField()
    policy_title_text = serializers.CharField()
    policy_header_text = serializers.CharField()
    policy_footer_text = serializers.CharField()
    policy_cancel_text = serializers.CharField()
    policy_cancel_button_text = serializers.CharField()
    justification_options = serializers.JSONField()
    url = serializers.HyperlinkedIdentityField(view_name="api:regional_policies-detail", lookup_field="uid")

    class Meta:
        model = RegionalPolicy
        fields = "__all__"

    @staticmethod
    def get_uid(obj):
        return obj.uid

    @staticmethod
    def get_providers(obj):
        providers = []
        for provider in obj.providers.all():
            providers.append({"uid": provider.uid, "name": provider.name, "slug": provider.slug})
        return providers


class RegionalJustificationSerializer(serializers.ModelSerializer):
    """Serializer for creating and returning RegionalPolicyJustification model data."""

    uid = serializers.SerializerMethodField()
    justification_id = serializers.IntegerField()
    justification_name = serializers.CharField(required=False)
    justification_suboption_value = serializers.CharField(required=False)
    regional_policy = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = RegionalJustification
        fields = "__all__"

    @staticmethod
    def create(validated_data):
        justification_id = validated_data.get("justification_id")
        justification_suboption_value = validated_data.get("justification_suboption_value")
        regional_policy_uid = validated_data.get("regional_policy_uid")
        user = validated_data.get("user")

        try:
            regional_policy = RegionalPolicy.objects.get(uid=regional_policy_uid)
        except RegionalPolicy.DoesNotExist:
            raise Exception(f"The Regional Policy for UID {regional_policy_uid} does not exist.")

        regional_policy_options = regional_policy.justification_options

        # Now get the justification option based on the ID passed.
        selected_option = [
            regional_policy_option
            for regional_policy_option in regional_policy_options
            if regional_policy_option["id"] == justification_id
        ][0]

        selected_suboption = selected_option.get("suboption")
        if selected_suboption:
            if selected_suboption.get("type") == "dropdown":
                if justification_suboption_value not in selected_suboption["options"]:
                    raise ValidationError(code="invalid_suboption", detail="Invalid suboption selected.")
        else:
            if justification_suboption_value:
                raise ValidationError(
                    code="invalid_description",
                    detail="No suboption was available, so justification_suboption_value cannot be used.",
                )

        regional_justification = RegionalJustification.objects.create(
            justification_id=justification_id,
            justification_name=selected_option["name"],
            justification_suboption_value=justification_suboption_value,
            regional_policy=regional_policy,
            user=user,
        )

        for provider in regional_policy.providers.all():
            cache.delete(f"mapproxy-config-{user}-{provider.slug}")

        return regional_justification

    def validate(self, data):
        request = self.context["request"]
        data["regional_policy_uid"] = request.data["regional_policy_uid"]
        data["user"] = request.user
        return data

    @staticmethod
    def get_uid(obj):
        return obj.uid

    @staticmethod
    def get_regional_policy(obj):
        return obj.regional_policy.uid

    @staticmethod
    def get_user(obj):
        return obj.user.username


class ExportFormatSerializer(serializers.ModelSerializer):
    """Return a representation of the ExportFormat model."""

    url = serializers.HyperlinkedIdentityField(view_name="api:formats-detail", lookup_field="slug")
    supported_projections = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ExportFormat
        fields = ("uid", "url", "slug", "name", "description", "supported_projections")

    @staticmethod
    def get_supported_projections(obj):
        return obj.supported_projections.all().values("uid", "name", "srid", "description")


def filtered_basic_data_provider_serializer(
    data_providers: Union[DataProvider, List[DataProvider]], many=False, **kwargs
):

    if not data_providers:
        return []

    if not isinstance(data_providers, (list, QuerySet)):  # type: ignore
        data_providers = [data_providers]

    if not many and len(data_providers) > 1:
        raise Exception("Trying to serialize more than one providers without many=True.")

    serialized_data_providers = [
        {"id": data_provider.id, "uid": data_provider.uid, "hidden": True, "display": False}
        for data_provider in data_providers
    ]
    if not many:
        return serialized_data_providers[0]
    else:
        return serialized_data_providers


class FilteredDataProviderSerializer(serializers.ModelSerializer):

    hidden = serializers.ReadOnlyField(default=True)
    display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DataProvider
        fields = ("id", "uid", "hidden", "display")
        read_only_fields = ("id", "uid", "hidden", "display")

    def get_display(self, obj):
        return False


def basic_field_serializer(export_format, fields):
    return {field: getattr(export_format, field) and str(getattr(export_format, field)) for field in fields}


def basic_data_provider_serializer(
    data_provider: DataProvider,
    context: dict = None,
    proxy_formats: dict = None,
    include_geometry: bool = False,
    format_fields: List[str] = None,
    **kwargs,
):

    format_fields = format_fields or []

    request = context.get("request")

    def get_supported_formats(obj):
        export_formats = [
            basic_field_serializer(export_format, format_fields)
            for export_format in obj.export_provider_type.supported_formats.all()
        ]
        if proxy_formats:
            proxy_format_list = proxy_formats.get(obj.slug) or []
            export_formats += proxy_format_list
        export_formats = list({export_format["name"]: export_format for export_format in export_formats}.values())
        export_formats = sorted(export_formats, key=lambda i: i["name"])
        return export_formats

    def get_thumbnail_url(obj):
        thumbnail = obj.thumbnail
        if thumbnail is not None:
            return thumbnail.file.url
        return ""

    serialized_data_provider = {
        "id": data_provider.id,
        "uid": str(data_provider.uid),
        "name": data_provider.name,
        "slug": data_provider.slug,
        "label": data_provider.label,
        "preview_url": data_provider.preview_url,
        "service_copyright": data_provider.service_copyright,
        "service_description": data_provider.service_description,
        "type": data_provider.export_provider_type and data_provider.export_provider_type.type_name,
        "supported_formats": get_supported_formats(data_provider),
        "thumbnail_url": get_thumbnail_url(data_provider),
        "license": basic_license_list_serializer(data_provider.license),
        "metadata": data_provider.config and data_provider.metadata,
        "model_url": reverse("api:providers-detail", args=[data_provider.slug], request=request),
        "footprint_url": data_provider.footprint_url,
        "max_data_size": data_provider.get_max_data_size(request and request.user),
        "max_selection": data_provider.get_max_selection_size(request and request.user),
        "use_bbox": data_provider.export_provider_type and data_provider.export_provider_type.use_bbox,
        "hidden": False,
        "data_type": data_provider.data_type,
        "created_at": data_provider.created_at,
        "updated_at": data_provider.updated_at,
        "layer": data_provider.layer,
        "level_from": data_provider.level_from,
        "level_to": data_provider.level_to,
        "zip": data_provider.zip,
        "display": data_provider.display,
        "export_provider_type": data_provider.export_provider_type and data_provider.export_provider_type.id,
        "attribute_class": data_provider.attribute_class and data_provider.attribute_class.id,
    }
    if include_geometry:
        serialized_data_provider["the_geom"] = json.loads(data_provider.the_geom.geojson)

    serialized_data_provider["download_count"] = (
        getattr(data_provider, "download_count") if hasattr(data_provider, "download_count") else None
    )
    serialized_data_provider["latest_download"] = get_download_week(data_provider)
    serialized_data_provider["favorite"] = (
        getattr(data_provider, "favorite") if hasattr(data_provider, "favorite") else False
    )
    return serialized_data_provider


def get_download_week(data_provider) -> Optional[int]:
    if hasattr(data_provider, "latest_download") and isinstance(getattr(data_provider, "latest_download"), datetime):
        return math.floor((timezone.now() - getattr(data_provider, "latest_download")).days / 7)
    return None


def basic_data_provider_list_serializer(
    data_providers: List[DataProvider],
    context: dict = None,
    many: bool = False,
    include_geometry: bool = False,
    **kwargs,
):

    context = context or dict()
    if not data_providers:
        return [{}]

    if not isinstance(data_providers, (list, QuerySet)):  # type: ignore
        data_providers = [data_providers]

    if not many and len(data_providers) > 1:
        raise Exception("Trying to serialize more than one providers without many=True.")

    format_fields = ["uid", "name", "slug", "description"]

    proxy_formats: Dict[str, List[str]] = {}
    for proxy_format in ProxyFormat.objects.all():
        provider_slug = proxy_format.data_provider.slug
        for export_format in ExportFormat.objects.filter(proxyformat=proxy_format).values("options", *format_fields):
            export_format.pop("options")
            if proxy_formats.get(provider_slug):
                proxy_formats[provider_slug] += [export_format]
            else:
                proxy_formats[provider_slug] = [export_format]

    serialized_providers = [
        basic_data_provider_serializer(
            data_provider,
            context=context,
            format_fields=format_fields,
            proxy_formats=proxy_formats,
            include_geometry=include_geometry,
        )
        for data_provider in data_providers
    ]
    if not many:
        serialized_providers = serialized_providers[0]

    return serialized_providers


def basic_geojson_serializer(serialized_object: dict, geometry_field: str, *args, **kwargs):
    return {
        "id": serialized_object.pop(id, None),
        "type": "Feature",
        "geometry": serialized_object.pop(geometry_field, None),
        "bbox": None,  # TODO: Add bbox?
        "properties": serialized_object,
    }


def basic_geojson_list_serializer(serialized_objects: List[dict], geometry_field: str, many=False, *args, **kwargs):
    if not isinstance(serialized_objects, (list, QuerySet)):  # type: ignore
        serialized_objects = [serialized_objects]

    if not many and len(serialized_objects) > 1:
        raise Exception("Trying to serialize more than one providers without many=True.")

    if many:
        return {
            "type": "FeatureCollection",
            "features": [basic_geojson_serializer(feature, geometry_field) for feature in serialized_objects],
        }
    else:
        return basic_geojson_serializer(serialized_objects[0], geometry_field)


class DataProviderSerializer(serializers.ModelSerializer):
    model_url = serializers.HyperlinkedIdentityField(view_name="api:providers-detail", lookup_field="slug")
    type = serializers.SerializerMethodField(read_only=True)
    supported_formats = serializers.SerializerMethodField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField(read_only=True)
    license = LicenseSerializer(required=False)
    metadata = serializers.SerializerMethodField(read_only=True)
    footprint_url = serializers.SerializerMethodField(read_only=True)
    max_data_size = serializers.SerializerMethodField(read_only=True)
    max_selection = serializers.SerializerMethodField(read_only=True)
    use_bbox = serializers.SerializerMethodField(read_only=True)
    hidden = serializers.ReadOnlyField(default=False)
    data_type = serializers.ReadOnlyField(default=False)
    download_count = serializers.SerializerMethodField(read_only=True)
    latest_download = serializers.SerializerMethodField(read_only=True)
    favorite = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = DataProvider
        extra_kwargs = {
            "url": {"write_only": True},
            "user": {"write_only": True},
            "config": {"write_only": True},
        }
        read_only_fields = ("uid",)
        exclude = ("thumbnail", "the_geom")

    @staticmethod
    def create(validated_data, **kwargs):
        # try to get existing export Provider
        url = validated_data.get("url")
        user = validated_data.get("user")
        license_data = validated_data.pop("license", None)
        if license_data:
            License.objects.create(**license_data)

        ep = DataProvider.objects.filter(url=url, user=user).first()
        if not ep:
            ep = DataProvider.objects.create(**validated_data)
        return ep

    @staticmethod
    def get_type(obj):
        return obj.export_provider_type.type_name

    def get_supported_formats(self, obj):
        fields = ["uid", "name", "slug", "description"]
        proxy_format: ProxyFormat = ProxyFormat.objects.filter(data_provider=obj).first()
        export_formats = obj.export_provider_type.supported_formats.all().values(*fields) | ExportFormat.objects.filter(
            proxyformat=proxy_format
        ).values(*fields)
        return export_formats.distinct()

    def get_thumbnail_url(self, obj):

        thumbnail = obj.thumbnail
        if thumbnail is not None:
            return thumbnail.file.url
        return ""

    @staticmethod
    def get_metadata(obj):
        return obj.metadata

    @staticmethod
    def get_footprint_url(obj):
        return obj.footprint_url

    def get_max_data_size(self, obj):
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        return obj.get_max_data_size(user)

    def get_max_selection(self, obj):
        user = None
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            user = request.user
        return obj.get_max_selection_size(user)

    def get_use_bbox(self, obj):
        return obj.get_use_bbox()

    def get_download_count(self, obj):
        return obj.download_count if hasattr(obj, "download_count") else None

    def get_latest_download(self, obj):
        return obj.latest_download if hasattr(obj, "latest_download") else None

    def get_favorite(self, obj):
        return obj.favorite if hasattr(obj, "favorite") else False


class DataProviderGeoFeatureSerializer(DataProviderSerializer, GeoFeatureModelSerializer):
    data_provider_geom = GeometrySerializerMethodField()
    bbox = GeometrySerializerMethodField()

    class Meta(DataProviderSerializer.Meta):
        geo_field = "data_provider_geom"
        bbox_geo_field = "bbox"

    def get_data_provider_geom(self, obj):
        return obj.the_geom

    def get_bbox(self, obj):
        return obj.the_geom.extent


class FilteredDataProviderGeoFeatureSerializer(FilteredDataProviderSerializer, GeoFeatureModelSerializer):
    """
    Used to mixin geojson views.
    """

    data_provider_geom = GeometrySerializerMethodField()
    bbox = GeometrySerializerMethodField()

    class Meta(DataProviderSerializer.Meta):
        geo_field = "data_provider_geom"
        bbox_geo_field = "bbox"

    def get_data_provider_geom(self, obj):
        return None

    def get_bbox(self, obj):
        return []


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
    url = serializers.HyperlinkedIdentityField(view_name="api:jobs-detail", lookup_field="uid")
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
        return get_extent_geojson(obj)

    @staticmethod
    def get_original_selection(obj):
        return get_selection_dict(obj)

    @staticmethod
    def get_owner(obj):
        return obj.user.username

    def get_relationship(self, obj):
        request = self.context["request"]
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions["value"] = obj.visibility
        return permissions


class JobSerializer(serializers.Serializer):
    """
    Return a full representation of an export Job.

    This is the core representation of the API.
    """

    provider_tasks = serializers.SerializerMethodField()
    provider_task_list_status = serializers.SerializerMethodField()
    uid = serializers.UUIDField(read_only=True)
    url = serializers.HyperlinkedIdentityField(view_name="api:jobs-detail", lookup_field="uid")
    name = serializers.CharField(
        max_length=100,
    )
    description = serializers.CharField(
        max_length=255,
    )
    event = serializers.CharField(max_length=100, allow_blank=True, required=False)
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
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
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
        user = data["user"]
        selection = validators.validate_selection(self.context["request"].data, user=user)
        data["the_geom"] = selection
        original_selection = validators.validate_original_selection(self.context["request"].data)
        data["original_selection"] = original_selection
        data.pop("provider_tasks", None)

        return data

    @staticmethod
    def get_extent(obj):
        return get_extent_geojson(obj)

    @staticmethod
    def get_original_selection(obj):
        return get_selection_dict(obj)

    def get_exports(self, obj):
        """Return the export formats selected for this export."""
        exports = []
        data_provider_tasks, filtered_tasks = attribute_class_filter(
            obj.data_provider_tasks.all(), self.context["request"].user
        )
        for data_provider_task in data_provider_tasks:
            serializer = ExportFormatSerializer(
                data_provider_task.formats,
                many=True,
                context={"request": self.context["request"]},
            )
            exports.append({"provider": data_provider_task.provider.name, "formats": serializer.data})
        for data_provider_task in filtered_tasks:
            exports.append({"provider": data_provider_task.uid})
        return exports

    def get_provider_task_list_status(self, obj):
        request = self.context["request"]
        return get_provider_task_list_status(request.user, obj.data_provider_tasks.all())

    def get_provider_tasks(self, obj):
        """Return the export formats selected for this export."""
        exports = []
        data_provider_tasks, filtered_data_provider_tasks = attribute_class_filter(
            obj.data_provider_tasks.all(), self.context["request"].user
        )
        for data_provider_task in data_provider_tasks:
            if hasattr(data_provider_task, "formats"):
                serializer = ProviderTaskSerializer(data_provider_task, context={"request": self.context["request"]})
                if hasattr(data_provider_task, "provider"):
                    exports.append(serializer.data)
        return exports

    def get_providers(self, obj):
        """Return the export formats selected for this export."""
        providers_query_set, filtered_providers_query_set = attribute_class_filter(
            obj.providers.all(), self.context["request"].user
        )
        providers = [provider_format for provider_format in providers_query_set]
        provider_serializer = DataProviderSerializer(providers, many=True, context={"request": self.context["request"]})
        filtered_providers = [provider_format for provider_format in filtered_providers_query_set]
        filtered_providers_serializer = FilteredDataProviderSerializer(
            filtered_providers, many=True, context={"request": self.context["request"]}
        )
        return provider_serializer.data + filtered_providers_serializer.data

    @staticmethod
    def get_tags(obj):
        """Return the Tags selected for this export."""
        return obj.json_tags

    @staticmethod
    def get_owner(obj):
        """Return the username for the owner of this export."""
        return obj.user.username

    def get_relationship(self, obj):
        request = self.context["request"]
        user = request.user
        return JobPermission.get_user_permissions(user, obj.uid)

    @staticmethod
    def get_permissions(obj):
        permissions = JobPermission.jobpermissions(obj)
        permissions["value"] = obj.visibility
        return permissions


class UserJobActivitySerializer(serializers.ModelSerializer):
    last_export_run = serializers.SerializerMethodField()

    class Meta:
        model = UserJobActivity
        fields = ("last_export_run", "type", "created_at")

    def get_last_export_run(self, obj):
        if obj.job.last_export_run:
            serializer = ExportRunSerializer(obj.job.last_export_run, context={"request": self.context["request"]})
            return serializer.data
        else:
            return None


class GenericNotificationRelatedSerializer(serializers.BaseSerializer):
    def to_representation(self, referenced_object):
        if isinstance(referenced_object, User):
            serializer = UserSerializer(referenced_object)
        elif isinstance(referenced_object, Job):
            serializer = NotificationJobSerializer(referenced_object, context={"request": self.context["request"]})
        elif isinstance(referenced_object, ExportRun):
            serializer = NotificationRunSerializer(referenced_object, context={"request": self.context["request"]})
        elif isinstance(referenced_object, Group):
            serializer = GroupSerializer(referenced_object)
        return serializer.data


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()
    action_object = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = (
            "unread",
            "deleted",
            "level",
            "verb",
            "description",
            "id",
            "timestamp",
            "recipient_id",
            "actor",
            "target",
            "action_object",
        )

    def get_related_object(self, obj, related_type=None):
        if not related_type:
            return None
        type_id = getattr(obj, "{}_content_type_id".format(related_type))
        if type_id:
            return {
                "type": str(ContentType.objects.get(id=type_id).model),
                "id": getattr(obj, "{0}_object_id".format(related_type)),
                "details": GenericNotificationRelatedSerializer(
                    getattr(obj, related_type),
                    context={"request": self.context["request"]},
                ).data,
            }

    def get_actor(self, obj):
        return self.get_related_object(obj, "actor")

    def get_target(self, obj):
        return self.get_related_object(obj, "target")

    def get_action_object(self, obj):
        return self.get_related_object(obj, "action_object")


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
            "uid",
            "created_at",
            "updated_at",
            "started_at",
            "finished_at",
            "duration",
            "user",
            "status",
            "job",
            "expiration",
            "deleted",
        )
        read_only_fields = ("created_at", "updated_at")

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
            return {"uid": data["uid"], "name": data["name"]}

    def get_expiration(self, obj):
        if not obj.deleted:
            return obj.expiration


class DataProviderRequestSerializer(serializers.ModelSerializer):

    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = DataProviderRequest
        fields = "__all__"


class SizeIncreaseRequestSerializer(serializers.ModelSerializer):

    extent = serializers.SerializerMethodField(read_only=True)
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = SizeIncreaseRequest
        fields = "__all__"

    @staticmethod
    def create(validated_data, **kwargs):
        """Creates an export Job.
        :param **kwargs:
        """
        return SizeIncreaseRequest.objects.create(**validated_data)

    def validate(self, data, **kwargs):
        """
        Validates the data submitted during Job creation.

        See api/validators.py for validation code.
        """
        user = data["user"]
        selection = validators.validate_selection(self.context["request"].data, user=user)
        data["the_geom"] = selection

        return data

    @staticmethod
    def get_extent(obj):
        return get_extent_geojson(obj)


def get_extent_geojson(obj):
    """Return the export extent as a GeoJSON Feature."""
    uid = str(obj.uid)
    if hasattr(obj, "name"):
        name = obj.name
    else:
        name = ""
    geom = obj.the_geom
    geometry = json.loads(GEOSGeometry(geom).geojson)
    feature: OrderedDict[str, Any] = OrderedDict()
    feature["type"] = "Feature"
    feature["properties"] = {"uid": uid, "name": name}
    feature["geometry"] = geometry
    return feature


def get_selection_dict(obj):
    """Return the selection as a feature collection dictionary."""
    geom_collection = obj.original_selection
    if not geom_collection:
        return None
    feature_collection: OrderedDict[str, Any] = OrderedDict()

    features = []
    for geom in geom_collection:
        geojson_geom = json.loads(geom.geojson)
        feature = OrderedDict()
        feature["type"] = "Feature"
        feature["geometry"] = geojson_geom
        features.append(feature)
    feature_collection["features"] = features
    feature_collection["type"] = "FeatureCollection"
    return feature_collection


def get_provider_task_list_status(user, data_provider_task_records):
    if data_provider_task_records and isinstance(data_provider_task_records.first(), DataProviderTaskRecord):
        data_provider_task_records = data_provider_task_records.exclude(slug="run")
    data_provider_task_records, filtered_provider_tasks = attribute_class_filter(data_provider_task_records, user)
    if not data_provider_task_records:
        return "EMPTY"
    if not filtered_provider_tasks:
        return "COMPLETE"
    return "PARTIAL"
