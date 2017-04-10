# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json
import logging
import uuid

from django.contrib.auth.models import Group, User
from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon
from django.contrib.postgres.fields import ArrayField
from django.core.serializers import serialize
from django.db.models.fields import CharField
from django.db.models.signals import (
    post_delete,
    post_save,
)
from django.dispatch.dispatcher import receiver
from django.utils import timezone


logger = logging.getLogger(__name__)


# construct the upload path for export config files..


def get_upload_path(instance, *args):
    """
    Construct the path to where the uploaded config file is to be stored.
    """
    configtype = instance.config_type.lower()
    # sanitize the filename here..
    path = 'export/config/{0}/{1}'.format(configtype, instance.filename)
    logger.debug('Saving export config to /media/{0}'.format(path))
    return path


class LowerCaseCharField(CharField):
    """
    Defines a charfield which automatically converts all inputs to
    lowercase and saves.
    """

    def pre_save(self, model_instance, add):
        """
        Converts the string to lowercase before saving.
        """
        current_value = getattr(model_instance, self.attname)
        setattr(model_instance, self.attname, current_value.lower())
        return getattr(model_instance, self.attname)


class TimeStampedModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:  # pragma: no cover
        abstract = True


class ExportConfig(TimeStampedModelMixin):
    """
    Model for export configuration.
    """
    PRESET = 'PRESET'
    TRANSLATION = 'TRANSLATION'
    TRANSFORM = 'TRANSFORM'
    CONFIG_TYPES = (
        (PRESET, 'Preset'),
        (TRANSLATION, 'Translation'),
        (TRANSFORM, 'Transform')
    )
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, default='', db_index=True)
    user = models.ForeignKey(User, related_name='user')
    config_type = models.CharField(max_length=11, choices=CONFIG_TYPES, default=PRESET)
    filename = models.CharField(max_length=255)
    upload = models.FileField(max_length=255, upload_to=get_upload_path)
    content_type = models.CharField(max_length=30, editable=False)
    published = models.BooleanField(default=False)

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'export_configurations'


class ExportFormat(TimeStampedModelMixin):
    """
    Model for a ExportFormat.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    name = models.CharField(max_length=100)
    slug = LowerCaseCharField(max_length=20, unique=True, default='')
    description = models.CharField(max_length=255)
    cmd = models.TextField(max_length=1000)
    objects = models.Manager()

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'export_formats'

    def __str__(self):
        return '{0}'.format(self.name)

    def __unicode__(self,):
        return '{0}'.format(self.slug)


class ExportProviderType(TimeStampedModelMixin):
    """
    Model to hold types and supported exports for providers.
    """
    id = models.AutoField(primary_key=True, editable=False)
    type_name = models.CharField(verbose_name="Type Name", max_length=40, unique=True, default='')
    supported_formats = models.ManyToManyField(ExportFormat,
                                               verbose_name="Supported Export Formats",
                                               blank=True)

    def __str__(self):
        return '{0}'.format(self.type_name)

    def __unicode__(self,):
        return '{0}'.format(self.type_name)


class ExportProvider(TimeStampedModelMixin):
    """
    Model for a ExportProvider.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    name = models.CharField(verbose_name="Service Name", unique=True, max_length=100)
    slug = LowerCaseCharField(max_length=40, unique=True, default='')
    url = models.CharField(verbose_name="Service URL", max_length=1000, null=True, default='', blank=True)
    preview_url = models.CharField(verbose_name="Preview URL", max_length=1000, null=True, default='', blank=True,
                                   help_text="This url will be served to the front end for displaying in the map.")
    service_copyright = models.CharField(verbose_name="Copyright", max_length=2000, null=True, default='', blank=True,
                                   help_text="This information is used to display relevant copyright information.")
    service_description = models.CharField(verbose_name="Description", max_length=4000, null=True, default='', blank=True,
                                         help_text="This information is used to provide information about the service.")
    layer = models.CharField(verbose_name="Service Layer", max_length=100, null=True, blank=True)
    export_provider_type = models.ForeignKey(ExportProviderType, verbose_name="Service Type", null=True)
    level_from = models.IntegerField(verbose_name="Seed from level", default=0, null=True, blank=True,
                                     help_text="This determines the starting zoom level a tile export will seed from")
    level_to = models.IntegerField(verbose_name="Seed to level", default=10, null=True, blank=True,
                                   help_text="This determine what zoom level your tile export will seed to")
    config = models.TextField(default='', null=True, blank=True,
                              verbose_name="Configuration",
                              help_text="This is an optional field to put in additional configuration.")
    user = models.ForeignKey(User, related_name='+', null=True, default=None, blank=True)

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'export_provider'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.name.replace(' ', '_').lower()
            if len(self.slug) > 40:
                self.slug = self.slug[0:39]
        super(ExportProvider, self).save(*args, **kwargs)

    def __str__(self):
        return '{0}'.format(self.name)

    def __unicode__(self,):
        return '{0}'.format(self.name)


class Region(TimeStampedModelMixin):
    """
    Model for a HOT Export Region.
    """
    def __init__(self, *args, **kwargs):
        kwargs['the_geom'] = convert_polygon(kwargs.get('the_geom')) or ''
        kwargs['the_geom_webmercator'] = convert_polygon(kwargs.get('the_geom_webmercator')) or ''
        kwargs['the_geog'] = convert_polygon(kwargs.get('the_geog')) or ''
        super(Region, self).__init__(*args, **kwargs)

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, blank=True)
    the_geom = models.MultiPolygonField(verbose_name='HOT Export Region', srid=4326, default='')
    the_geom_webmercator = models.MultiPolygonField(verbose_name='Mercator extent for export region', srid=3857, default='')
    the_geog = models.MultiPolygonField(verbose_name='Geographic extent for export region', geography=True, default='')
    objects = models.GeoManager()

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'regions'

    def __str__(self):
        return '{0}'.format(self.name)

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        self.the_geog = GEOSGeometry(self.the_geom)
        self.the_geom_webmercator = self.the_geom.transform(ct=3857, clone=True)
        super(Region, self).save(*args, **kwargs)


class ProviderTask(models.Model):
    """
    Model for a set of tasks assigned to a provider for a job.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    provider = models.ForeignKey(ExportProvider, related_name='provider')
    formats = models.ManyToManyField(ExportFormat, related_name='formats')

    def __str__(self):
        return '{0} - {1}'.format(self.uid, self.provider)

    def __unicode__(self,):
        return '{0} - {1}'.format(self.uid, self.provider)


class Job(TimeStampedModelMixin):
    """
    Model for a Job.
    """
    def __init__(self, *args, **kwargs):
        kwargs['the_geom'] = convert_polygon(kwargs.get('the_geom')) or ''
        kwargs['the_geom_webmercator'] = convert_polygon(kwargs.get('the_geom_webmercator')) or ''
        kwargs['the_geog'] = convert_polygon(kwargs.get('the_geog')) or ''
        super(Job, self).__init__(*args, **kwargs)

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    user = models.ForeignKey(User, related_name='owner')
    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, db_index=True)
    event = models.CharField(max_length=100, db_index=True, default='', blank=True)
    region = models.ForeignKey(Region, null=True, on_delete=models.SET_NULL)
    provider_tasks = models.ManyToManyField(ProviderTask, related_name='provider_tasks')
    configs = models.ManyToManyField(ExportConfig, related_name='configs', blank=True)
    published = models.BooleanField(default=False, db_index=True)  # publish export
    feature_save = models.BooleanField(default=False, db_index=True)  # save feature selections
    feature_pub = models.BooleanField(default=False, db_index=True)  # publish feature selections
    the_geom = models.MultiPolygonField(verbose_name='Extent for export', srid=4326, default='')
    the_geom_webmercator = models.MultiPolygonField(verbose_name='Mercator extent for export', srid=3857, default='')
    the_geog = models.MultiPolygonField(verbose_name='Geographic extent for export', geography=True, default='')
    objects = models.GeoManager()
    include_zipfile = models.BooleanField(default=False)
    json_filters = models.TextField(default='{}')

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'jobs'

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        self.the_geog = GEOSGeometry(self.the_geom)
        self.the_geom_webmercator = self.the_geom.transform(ct=3857, clone=True)
        super(Job, self).save(*args, **kwargs)

    def __str__(self):
        return '{0}'.format(self.name)

    @property
    def overpass_extents(self,):
        """
        Return the export extents in order required by Overpass API.
        """
        extents = GEOSGeometry(self.the_geom).extent  # (w,s,e,n)
        # overpass needs extents in order (s,w,n,e)
        overpass_extents = '{0},{1},{2},{3}'.format(str(extents[1]), str(extents[0]),
                                                    str(extents[3]), str(extents[2]))
        return overpass_extents

    @property
    def extents(self,):
        return GEOSGeometry(self.the_geom).extent  # (w,s,e,n)

    @property
    def tag_dict(self,):
        """
        Return the unique set of Tag keys from this export
        with their associated geometry types.

        Used by Job.categorised_tags (below) to categorize tags
        according to their geometry types.
        """
        # get the unique keys from the tags for this export
        uniq_keys = list(self.tags.values('key').distinct('key'))
        tag_dict = {}  # mapping of tags to geom_types
        for entry in uniq_keys:
            key = entry['key']
            tag_dict['key'] = key
            geom_types = list(self.tags.filter(key=key).values('geom_types'))
            geom_type_list = []
            for geom_type in geom_types:
                geom_list = geom_type['geom_types']
                geom_type_list.extend([i for i in geom_list])
            tag_dict[key] = list(set(geom_type_list))  # get unique values for geomtypes
        return tag_dict

    @property
    def filters(self,):
        """
        Return key=value pairs for each tag in this export.

        Used in utils.overpass.filter to filter the export.
        """
        # Command-line key=value filters for osmfilter
        cl_filters = []
        # Dictionary of filters
        filter_dict = json.loads(self.json_filters)
        for key, value in filter_dict.items():
            kv = '{0}={1}'.format(key, value)
            cl_filters.append(kv)
        return cl_filters

    @property
    def categorised_tags(self,):
        """
        Return tags mapped according to their geometry types.
        """
        points = []
        lines = []
        polygons = []
        for tag in self.tag_dict:
            for geom in self.tag_dict[tag]:
                if geom == 'point':
                    points.append(tag)
                if geom == 'line':
                    lines.append(tag)
                if geom == 'polygon':
                    polygons.append(tag)
        return {'points': sorted(points), 'lines': sorted(lines), 'polygons': sorted(polygons)}

    @property
    def bounds_geojson(self,):
        return serialize('geojson', [self],
                         geometry_field='the_geom',
                         fields=('name', 'the_geom'))


class Tag(models.Model):
    """
    Model to hold Export tag selections.

    Holds the data model (osm | hdm | preset)
    and the geom_type mapping.
    """
    id = models.AutoField(primary_key=True, editable=False)
    name = models.CharField(max_length=100, blank=False, default='', db_index=True)
    key = models.CharField(max_length=50, blank=False, default='', db_index=True)
    value = models.CharField(max_length=50, blank=False, default='', db_index=True)
    job = models.ForeignKey(Job, related_name='tags')
    data_model = models.CharField(max_length=10, blank=False, default='', db_index=True)
    geom_types = ArrayField(models.CharField(max_length=10, blank=True, default=''), default=[])
    groups = ArrayField(models.CharField(max_length=100, blank=True, default=''), default=[])

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'tags'

    def __str__(self):  # pragma: no cover
        return '{0}:{1}'.format(self.key, self.value)


class RegionMask(models.Model):
    """
    Model to hold region mask.
    """
    def __init__(self, *args, **kwargs):
        kwargs['the_geom'] = convert_polygon(kwargs.get('the_geom')) or ''
        super(Region, self).__init__(*args, **kwargs)

    id = models.IntegerField(primary_key=True)
    the_geom = models.MultiPolygonField(verbose_name='Mask for export regions', srid=4326)

    class Meta:  # pragma: no cover
        managed = False
        db_table = 'region_mask'

    def save(self, *args, **kwargs):
        self.the_geom = convert_polygon(self.the_geom)
        super(RegionMask, self).save(*args, **kwargs)


class ExportProfile(models.Model):
    """
    Model to hold Group export profile.
    """
    name = models.CharField(max_length=100, blank=False, default='')
    group = models.OneToOneField(Group, related_name='export_profile')
    max_extent = models.IntegerField()

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'export_profiles'

    def __str__(self):
        return '{0}'.format(self.name)


@receiver(post_delete, sender=ExportConfig)
def exportconfig_delete_upload(sender, instance, **kwargs):
    """
    Delete the associated file when the export config is deleted.
    """
    instance.upload.delete(False)
    # remove config from related jobs
    exports = Job.objects.filter(configs__uid=instance.uid)
    for export in exports.all():
        export.configs.remove(instance)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    This method is executed whenever a User object is created.

    Adds the new user to DefaultExportExtentGroup.
    """
    if created:
        instance.groups.add(Group.objects.get(name='DefaultExportExtentGroup'))


def user_owns_job(user=None, job_uid=None):
    if not job_uid or not user:
        return False
    job = Job.objects.get(uid=job_uid)
    if job.user == user or job.published:
        return True
    else:
        return False


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
