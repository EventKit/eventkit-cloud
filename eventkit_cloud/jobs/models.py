# -*- coding: utf-8 -*-


import json
import logging
import uuid
import yaml

from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import (
    GEOSGeometry,
    GeometryCollection,
    Polygon,
    MultiPolygon,
)
from django.contrib.postgres.fields.jsonb import JSONField
from django.core.serializers import serialize
from django.contrib.gis.db import models
from django.core.cache import cache
from django.utils import timezone
from enum import Enum
from django.db.models import Q


from eventkit_cloud.core.models import CachedModelMixin, DownloadableMixin, TimeStampedModelMixin, UIDMixin, \
    AttributeClass, logger, GroupPermissionLevel, LowerCaseCharField
from eventkit_cloud.utils.mapproxy import get_mapproxy_metadata_url, get_mapproxy_footprint_url

logger = logging.getLogger(__name__)


# construct the upload path for export config files..
def get_upload_path(instance, *args):
    """
    Construct the path to where the uploaded config file is to be stored.
    """
    configtype = instance.config_type.lower()
    # sanitize the filename here..
    path = "export/config/{0}/{1}".format(configtype, instance.filename)
    logger.debug("Saving export config to /media/{0}".format(path))
    return path


class MapImageSnapshot(DownloadableMixin, UIDMixin):
    """
    A MapImageSnapshot is an image snapshot capturing a map in a particular state or time.
    """

    class Meta:
        db_table = "MapImageSnapshot"

    def __str__(self):
        return "MapImageSnapshot ({}), {}".format(self.uid, self.filename)


class DatamodelPreset(TimeStampedModelMixin):
    """
    Model provides admin interface to presets.
    These were previously provided by files like hdm_presets.xml / osm_presets.xml.
    """

    name = models.CharField(max_length=10)
    json_tags = JSONField(default=list)

    class Meta:
        db_table = "datamodel_preset"

    def __str__(self):
        return self.name

    def to_dict(self):
        return {"name": self.name, "json_tags": self.json_tags}


class License(TimeStampedModelMixin):
    """
    Model to hold license information to be used with DataProviders.
    """

    slug = LowerCaseCharField(max_length=40, unique=True, default="")
    name = models.CharField(max_length=100, db_index=True)
    text = models.TextField(default="")

    def __str__(self):
        return "{0}".format(self.name)


class UserLicense(TimeStampedModelMixin):
    """
    Model to hold which licenses a User acknowledges.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    license = models.ForeignKey(License, on_delete=models.CASCADE)

    def __str__(self):
        return "{0}: {1}".format(self.user.username, self.license.name)


class Projection(UIDMixin, TimeStampedModelMixin):
    """
    Model for a Projection.
    """

    name = models.CharField(max_length=100)
    srid = models.IntegerField(unique=True)
    description = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return "{0}".format(self.name)


class ExportFormat(UIDMixin, TimeStampedModelMixin):
    """
    Model for a ExportFormat.
    """

    name = models.CharField(max_length=100)
    slug = LowerCaseCharField(max_length=20, unique=True, default="")
    description = models.CharField(max_length=255)
    cmd = models.TextField(max_length=1000)
    objects = models.Manager()
    supported_projections = models.ManyToManyField(Projection, related_name="supported_projections")

    class Meta:  # pragma: no cover
        managed = True
        db_table = "export_formats"

    def __str__(self):
        return "{0}".format(self.name)


class DataProviderType(TimeStampedModelMixin):
    """
    Model to hold types and supported exports for providers.
    """

    id = models.AutoField(primary_key=True, editable=False)
    type_name = models.CharField(verbose_name="Type Name", max_length=40, unique=True, default="")
    supported_formats = models.ManyToManyField(ExportFormat, verbose_name="Supported Export Formats", blank=True)

    def __str__(self):
        return "{0}".format(self.type_name)


class DataProvider(UIDMixin, TimeStampedModelMixin, CachedModelMixin):
    """
    Model for a DataProvider.
    """

    name = models.CharField(verbose_name="Service Name", unique=True, max_length=100)

    slug = LowerCaseCharField(max_length=40, unique=True, default="")
    label = models.CharField(verbose_name="Label", max_length=100, null=True, blank=True)
    url = models.CharField(
        verbose_name="Service URL",
        max_length=1000,
        null=True,
        default="",
        blank=True,
        help_text="The SERVICE_URL is used as the endpoint for WFS, OSM, and WCS services. It is "
        "also used to check availability for all OGC services. If you are adding a TMS "
        "service, please provide a link to a single tile, but with the coordinate numbers "
        "replaced by {z}, {y}, and {x}. Example: https://tiles.your-geospatial-site.com/"
        "tiles/default/{z}/{y}/{x}.png",
    )
    preview_url = models.CharField(
        verbose_name="Preview URL",
        max_length=1000,
        null=True,
        default="",
        blank=True,
        help_text="This url will be served to the front end for displaying in the map.",
    )
    service_copyright = models.CharField(
        verbose_name="Copyright",
        max_length=2000,
        null=True,
        default="",
        blank=True,
        help_text="This information is used to display relevant copyright information.",
    )
    service_description = models.TextField(
        verbose_name="Description",
        null=True,
        default="",
        blank=True,
        help_text="This information is used to provide information about the service.",
    )
    layer = models.CharField(verbose_name="Service Layer", max_length=100, null=True, blank=True)
    export_provider_type = models.ForeignKey(
        DataProviderType, verbose_name="Service Type", null=True, on_delete=models.CASCADE
    )
    max_selection = models.DecimalField(
        verbose_name="Max selection area",
        default=250,
        max_digits=12,
        decimal_places=3,
        help_text="This is the maximum area in square kilometers that can be exported "
        "from this provider in a single DataPack.",
    )
    level_from = models.IntegerField(
        verbose_name="Seed from level",
        default=0,
        null=True,
        blank=True,
        help_text="This determines the starting zoom level the tile export will seed from.",
    )
    level_to = models.IntegerField(
        verbose_name="Seed to level",
        default=10,
        null=True,
        blank=True,
        help_text="This determines the highest zoom level the tile export will seed to.",
    )
    config = models.TextField(
        default="",
        null=True,
        blank=True,
        verbose_name="Configuration",
        help_text="""WMS, TMS, WMTS, and ArcGIS-Raster require a MapProxy YAML configuration
                              with a Sources key of imagery and a Service Layer name of imagery; the validator also
                              requires a layers section, but this isn't used.
                              OSM Services also require a YAML configuration.""",
    )
    user = models.ForeignKey(User, related_name="+", null=True, default=None, blank=True, on_delete=models.CASCADE)
    license = models.ForeignKey(
        License, related_name="+", null=True, blank=True, default=None, on_delete=models.CASCADE
    )

    zip = models.BooleanField(default=False)
    display = models.BooleanField(default=False)
    thumbnail = models.ForeignKey(
        MapImageSnapshot,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        help_text="A thumbnail image generated to give a high level" " preview of what a provider's data looks like.",
    )
    attribute_class = models.ForeignKey(AttributeClass, blank=True, null=True, on_delete=models.SET_NULL,
                                        help_text="The attribute class is used to limit users access to resources using this data provider.")

    class Meta:  # pragma: no cover
        managed = True
        db_table = "export_provider"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.name.replace(" ", "_").lower()
            if len(self.slug) > 40:
                self.slug = self.slug[0:39]

        cache.delete(f"base-config-{self.slug}")
        super(DataProvider, self).save(*args, **kwargs)

    def __str__(self):
        return "{0}".format(self.name)

    @property
    def metadata(self):
        if not self.config:
            return None
        config = yaml.load(self.config)
        url = config.get("sources", {}).get("info", {}).get("req", {}).get("url")
        type = config.get("sources", {}).get("info", {}).get("type")
        if url:
            return {"url": get_mapproxy_metadata_url(self.slug), "type": type}

    @property
    def footprint_url(self):
        if not self.config:
            return None
        config = yaml.load(self.config)

        url = config.get("sources", {}).get("footprint", {}).get("req", {}).get("url")
        if url:
            return get_mapproxy_footprint_url(self.slug)

    """
    Max datasize is the size in megabytes.
    """

    @property
    def max_data_size(self):
        config = yaml.load(self.config)
        return None if config is None else config.get("max_data_size", None)

    def get_max_data_size(self, user=None):
        from eventkit_cloud.user_requests.models import UserSizeRule

        if user is None:
            return self.max_data_size

        try:
            user_rule = UserSizeRule.objects.get(provider=self, user=user)
            return user_rule.max_data_size
        except UserSizeRule.DoesNotExist:
            return self.max_data_size

    def get_max_selection_size(self, user=None):
        from eventkit_cloud.user_requests.models import UserSizeRule

        if user is None:
            return self.max_selection

        try:
            user_rule = UserSizeRule.objects.get(provider=self, user=user)
            return user_rule.max_selection_size
        except UserSizeRule.DoesNotExist:
            return self.max_selection



class DataProviderStatus(UIDMixin, TimeStampedModelMixin):
    """
    Model that remembers the last recorded status of a data provider.
    """

    status = models.CharField(max_length=10, blank=True)
    status_type = models.CharField(max_length=25, blank=True)
    message = models.CharField(max_length=150, blank=True)
    last_check_time = models.DateTimeField(null=True)
    related_provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="data_provider_status")

    class Meta:
        verbose_name_plural = "data provider statuses"
        ordering = ["-last_check_time"]


class Region(UIDMixin, TimeStampedModelMixin):
    """
    Model for a HOT Export Region.
    """

    def __init__(self, *args, **kwargs):
        kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        kwargs["the_geom_webmercator"] = convert_polygon(kwargs.get("the_geom_webmercator")) or ""
        kwargs["the_geog"] = convert_polygon(kwargs.get("the_geog")) or ""
        super(Region, self).__init__(*args, **kwargs)

    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, blank=True)

    the_geom = models.MultiPolygonField(verbose_name="HOT Export Region", srid=4326, default="")
    the_geom_webmercator = models.MultiPolygonField(
        verbose_name="Mercator extent for export region", srid=3857, default=""
    )
    the_geog = models.MultiPolygonField(verbose_name="Geographic extent for export region", geography=True, default="")

    class Meta:  # pragma: no cover
        managed = True
        db_table = "regions"

    def __str__(self):
        return "{0}".format(self.name)

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        self.the_geog = GEOSGeometry(self.the_geom)
        self.the_geom_webmercator = self.the_geom.transform(ct=3857, clone=True)
        super(Region, self).save(*args, **kwargs)


class DataProviderTask(models.Model):
    """
    Model for a set of tasks assigned to a provider for a job.
    """

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="provider")
    formats = models.ManyToManyField(ExportFormat, related_name="formats")
    min_zoom = models.IntegerField(blank=True, null=True)
    max_zoom = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return "{0} - {1}".format(str(self.uid), self.provider)


class VisibilityState(Enum):
    PRIVATE = "PRIVATE"
    PUBLIC = "PUBLIC"
    SHARED = "SHARED"


class Job(UIDMixin, TimeStampedModelMixin):
    """
    Model for a Job.
    """

    # the "choices" setting for the django admin page drop down list requires a type that can be indexed
    visibility_choices = []
    for value in VisibilityState:
        visibility_choices.append((value.value, value.value))

    def __init__(self, *args, **kwargs):
        kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        kwargs["the_geom_webmercator"] = convert_polygon(kwargs.get("the_geom_webmercator")) or ""
        kwargs["the_geog"] = convert_polygon(kwargs.get("the_geog")) or ""
        super(Job, self).__init__(*args, **kwargs)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="owner")
    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, db_index=True)
    event = models.CharField(max_length=100, db_index=True, default="", blank=True)
    region = models.ForeignKey(Region, null=True, blank=True, on_delete=models.CASCADE)
    provider_tasks = models.ManyToManyField(DataProviderTask, related_name="provider_tasks")
    preset = models.ForeignKey(DatamodelPreset, on_delete=models.CASCADE, null=True, blank=True)
    published = models.BooleanField(default=False, db_index=True)  # publish export
    visibility = models.CharField(max_length=10, choices=visibility_choices, default=VisibilityState.PRIVATE.value)
    featured = models.BooleanField(default=False, db_index=True)  # datapack is featured

    the_geom = models.MultiPolygonField(verbose_name="Extent for export", srid=4326, default="")
    the_geom_webmercator = models.MultiPolygonField(verbose_name="Mercator extent for export", srid=3857, default="")
    the_geog = models.MultiPolygonField(verbose_name="Geographic extent for export", geography=True, default="")
    original_selection = models.GeometryCollectionField(
        verbose_name="The original map selection", srid=4326, default=GeometryCollection(), null=True, blank=True
    )
    include_zipfile = models.BooleanField(default=False)
    json_tags = JSONField(default=dict)
    last_export_run = models.ForeignKey(
        "tasks.ExportRun", on_delete=models.CASCADE, null=True, related_name="last_export_run"
    )
    projections = models.ManyToManyField(Projection, related_name="projections")

    class Meta:  # pragma: no cover
        managed = True
        db_table = "jobs"

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        self.the_geog = GEOSGeometry(self.the_geom)
        self.the_geom_webmercator = self.the_geom.transform(ct=3857, clone=True)
        super(Job, self).save(*args, **kwargs)

    def __str__(self):
        return "{0}".format(self.name)

    @property
    def overpass_extents(self,):
        """
        Return the export extents in order required by Overpass API.
        """
        extents = GEOSGeometry(self.the_geom).extent  # (w,s,e,n)
        # overpass needs extents in order (s,w,n,e)
        overpass_extents = "{0},{1},{2},{3}".format(str(extents[1]), str(extents[0]), str(extents[3]), str(extents[2]))
        return overpass_extents

    @property
    def extents(self,):
        return GEOSGeometry(self.the_geom).extent  # (w,s,e,n)

    @property
    def filters(self,):
        """
        Return key=value pairs for each tag in this export.

        Used in utils.overpass.filter to filter the export.
        """
        # Command-line key=value filters for osmfilter
        filters = []
        for tag in self.json_tags:
            kv = "{0}={1}".format(tag["key"], tag["value"])
            filters.append(kv)
        return filters

    @property
    def categorised_tags(self,):
        """
        Return tags mapped according to their geometry types.
        """
        points = set()
        lines = set()
        polygons = set()
        for tag in self.json_tags:
            if "point" in tag["geom"]:
                points.add(tag["key"])
            if "line" in tag["geom"]:
                lines.add(tag["key"])
            if "polygon" in tag["geom"]:
                polygons.add(tag["key"])
        return {
            "points": sorted(list(points)),
            "lines": sorted(list(lines)),
            "polygons": sorted(list(polygons)),
        }

    @property
    def bounds_geojson(self,):
        return serialize("geojson", [self], geometry_field="the_geom", fields=("name", "the_geom"))

    @property
    def attribute_classes(self):
        providers = [provider_task.provider for provider_task in self.provider_tasks.all()]
        return AttributeClass.objects.filter(dataprovider__in=providers).distinct()


class RegionMask(models.Model):
    """
    Model to hold region mask.
    """

    def __init__(self, *args, **kwargs):
        kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        super(Region, self).__init__(*args, **kwargs)

    id = models.IntegerField(primary_key=True)
    the_geom = models.MultiPolygonField(verbose_name="Mask for export regions", srid=4326)

    class Meta:  # pragma: no cover
        managed = False
        db_table = "region_mask"

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        super(RegionMask, self).save(*args, **kwargs)


class ExportProfile(models.Model):
    """
    Model to hold Group export profile.
    """

    name = models.CharField(max_length=100, blank=False, default="")
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name="export_profile")
    max_extent = models.IntegerField()

    class Meta:  # pragma: no cover
        managed = True
        db_table = "export_profiles"

    def __str__(self):
        return "{0}".format(self.name)


class UserJobActivity(models.Model):
    CREATED = "created"
    VIEWED = "viewed"
    UPDATED = "updated"
    DELETED = "deleted"

    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, null=True, on_delete=models.CASCADE)
    type = models.CharField(max_length=100, blank=False)
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    def __str__(self):
        return "%s %s %s %s" % (self.user, self.job, self.type, self.created_at)


def convert_polygon(geom=None):
    if geom and isinstance(geom, Polygon):
        return MultiPolygon(geom, srid=geom.srid)
    return geom


def bbox_to_geojson(bbox=None):
    """
    :param bbox: A list [xmin, ymin, xmax, ymax]
    :returns: A geojson of the bbox.
    """
    bbox = Polygon.from_bbox(bbox)
    geometry = json.loads(GEOSGeometry(bbox, srid=4326).geojson)
    return {"type": "Feature", "geometry": geometry}


class JobPermission(TimeStampedModelMixin):

    """
    Model associates users or groups with jobs
    """

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="permissions")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")
    permission = models.CharField(choices=[("NONE", "None"), ("READ", "Read"), ("ADMIN", "Admin")], max_length=10)

    @staticmethod
    def jobpermissions(job):
        permissions = {"groups": {}, "members": {}}

        for jp in JobPermission.objects.filter(job=job):
            if jp.content_type == ContentType.objects.get_for_model(User):
                try:
                    user = User.objects.get(pk=jp.object_id)
                    permissions["members"][user.username] = jp.permission
                except User.DoesNotExist as e:
                    logger.error(e)
                    logger.error(
                        "The user id: {jp.object_id} is associated with the job: {job}, but the user doesn't exist."
                    )
            else:
                try:
                    group = Group.objects.get(pk=jp.object_id)
                    permissions["groups"][group.name] = jp.permission
                except Group.DoesNotExist as e:
                    logger.error(e)
                    logger.error(
                        "The user id: {jp.object_id} is associated with the job: {job}, but the user doesn't exist."
                    )
        return permissions

    @staticmethod
    def userjobs(user, level, include_groups=True):

        # super users can do anything to any job
        jobs = Job.objects.all()
        if user.is_superuser:
            return jobs

        # Get jobs for groups that the user belongs to
        if include_groups:
            groups = Group.objects.filter(group_permissions__user=user)
            group_query = [
                Q(permissions__content_type=ContentType.objects.get_for_model(Group)),
                Q(permissions__object_id__in=groups),
            ]
            if level != JobPermissionLevel.READ.value:
                group_query.append(Q(permissions__permission=level))

        # get all the jobs this user has been explicitly assigned to
        user_query = [
            Q(permissions__content_type=ContentType.objects.get_for_model(User)),
            Q(permissions__object_id=user.id),
        ]
        if level != JobPermissionLevel.READ.value:
            user_query.append(Q(permissions__permission=level))

        return jobs.filter(Q(*user_query) | Q(*group_query))

    @staticmethod
    def groupjobs(group, level):
        # get all the jobs for which this group has the given permission level
        query = [
            Q(permissions__content_type=ContentType.objects.get_for_model(Group)),
            Q(permissions__object_id=group.id),
        ]
        if level != JobPermissionLevel.READ.value:
            query.append(Q(permissions__permission=level))

        return Job.objects.filter(*query)

    @staticmethod
    def get_user_permissions(user, job_id):
        """
        Check what level of permission a user has to a job.
        :param user: User obj in question
        :param job_id: Id of the job for which we want the user's permission level
        :return: None, READ, or ADMIN depending on what level of permission the user has to the job
        """
        permission = None

        # All of the permission objects for the job in question.
        jps = JobPermission.objects.filter(job__uid=job_id)

        try:
            # Check if the user has explicit permissions to the job.
            user_permission = jps.filter(content_type=ContentType.objects.get_for_model(User)).get(object_id=user.pk)
        except JobPermission.DoesNotExist:
            user_permission = None

        if user_permission:
            permission = user_permission.permission

        if permission == JobPermissionLevel.ADMIN.value:
            # If the users has ADMIN permission we can return.
            # If the user does NOT HAVE ADMIN permission we will need to check the groups for implicit ADMIN.
            return JobPermissionLevel.ADMIN.value

        # Get all the ADMIN level group permissions for the user
        users_groups = Group.objects.filter(
            group_permissions__user=user, group_permissions__permission=GroupPermissionLevel.ADMIN.value
        )

        # Check if any of the groups the user is an admin of have group-admin permission to the job.
        jp_group_admin = (
            jps.filter(content_type=ContentType.objects.get_for_model(Group))
            .filter(object_id__in=users_groups)
            .filter(permission=JobPermissionLevel.ADMIN.value)
        )

        # If any of the groups the user is an admin of have admin-group permission
        #  we know that the user has implicit ADMIN permission to the job.
        if jp_group_admin.count() > 0:
            return JobPermissionLevel.ADMIN.value

        # If the user already has explict READ permissions we can return without checking for implicit READ via groups.
        if permission:
            return JobPermissionLevel.READ.value

        # Get all the group permissions for groups the user is in.
        users_groups = Group.objects.filter(group_permissions__user=user)

        # Check if any of the groups the user is in have group-read permission to the job.
        jp_group_member = (
            jps.filter(content_type=ContentType.objects.get_for_model(Group))
            .filter(object_id__in=users_groups)
            .filter(permission=JobPermissionLevel.READ.value)
        )

        # If any of the groups the user is in have READ permissions we can return.
        if jp_group_member.count() > 0:
            return JobPermissionLevel.READ.value

        # If user does not have any explicit or implicit permission to the job we return none.
        return ""

    def __str__(self):
        return "{0} - {1}: {2}: {3}".format(self.content_type, self.object_id, self.job, self.permission)

    def __unicode__(self):
        return "{0} - {1}: {2}: {3}".format(self.content_type, self.object_id, self.job, self.permission)


def remove_permissions(model, id):
    JobPermission.objects.filter(content_type=ContentType.objects.get_for_model(model), object_id=id).delete()


class JobPermissionLevel(Enum):
    NONE = "NONE"
    READ = "READ"
    ADMIN = "ADMIN"
