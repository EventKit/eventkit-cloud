# -*- coding: utf-8 -*-
from __future__ import annotations

import copy
import json
import logging
import multiprocessing
import uuid
from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Type, Union, cast

from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db import models
from django.contrib.gis.geos import GeometryCollection, GEOSGeometry, MultiPolygon, Polygon
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.core.serializers import serialize
from django.db.models import Case, Q, QuerySet, Value, When
from django.utils import timezone

from eventkit_cloud import settings
from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.core.mapped_cache import MappedCache
from eventkit_cloud.core.models import (
    AttributeClass,
    CachedModelMixin,
    FileFieldMixin,
    GroupPermissionLevel,
    LowerCaseCharField,
    TimeStampedModelMixin,
    UIDMixin,
)
from eventkit_cloud.jobs.enumerations import GeospatialDataType, StyleType
from eventkit_cloud.jobs.fields import ConfigJSONField
from eventkit_cloud.utils.services import get_client
from eventkit_cloud.utils.services.check_result import CheckResult, get_status_result
from eventkit_cloud.utils.services.types import LayersDescription
from eventkit_cloud.utils.types.django_helpers import ListOrQuerySet

if TYPE_CHECKING:
    from eventkit_cloud.utils.services.base import GisClient

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


class MapImageSnapshot(FileFieldMixin, UIDMixin):
    """
    A MapImageSnapshot is an image snapshot capturing a map in a particular state or time.
    """

    class Meta:
        db_table = "MapImageSnapshot"

    def __str__(self):
        return "MapImageSnapshot ({}), {}".format(self.uid, self.filename)

    def clone(self):
        self.id = None
        self.uid = None
        self.save()

        return self


class DatamodelPreset(TimeStampedModelMixin):
    """
    Model provides admin interface to presets.
    These were previously provided by files like hdm_presets.xml / osm_presets.xml.
    """

    name = models.CharField(max_length=10)
    json_tags = models.JSONField(default=list)

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

    safe_kwargs = [
        "name",
        "slug",
        "description",
        "cmd",
    ]

    name = models.CharField(max_length=100)
    slug = LowerCaseCharField(max_length=20, unique=True, default="")
    description = models.CharField(max_length=255)
    options = models.JSONField(default=dict, null=True, blank=True)
    objects = models.Manager()
    supported_projections = models.ManyToManyField(Projection, related_name="supported_projections")

    class Meta:  # pragma: no cover
        managed = True
        db_table = "export_formats"

    def __str__(self):
        return "{0}".format(self.name)

    @classmethod
    def get_or_create(cls, **kwargs):
        blacklisted_keys = []
        created = False
        for _key in kwargs:
            if _key not in cls.safe_kwargs:
                blacklisted_keys.append(_key)
        for _key in blacklisted_keys:
            del kwargs[_key]
        try:
            format = cls.objects.get(slug=kwargs.get("slug").lower())
        except ObjectDoesNotExist:
            format = cls.objects.create(**kwargs)
            created = True
        return format, created

    def get_supported_projection_list(self) -> List[int]:
        supported_projections = self.supported_projections.all().values_list("srid", flat=True)
        return list(supported_projections)


class DataProviderType(TimeStampedModelMixin):
    """
    Model to hold types and supported exports for providers.
    """

    id = models.AutoField(primary_key=True, editable=False)
    type_name = models.CharField(verbose_name="Type Name", max_length=40, unique=True, default="")
    supported_formats = models.ManyToManyField(ExportFormat, verbose_name="Supported Export Formats", blank=True)
    use_bbox = models.BooleanField(verbose_name="Use bounding box to calculate area", default=False)

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
    config = ConfigJSONField(
        default=dict,
        blank=True,
        verbose_name="Configuration",
        help_text="""WMS, TMS, WMTS, and ArcGIS-Raster require a MapProxy YAML configuration
                              with a Sources key of imagery and a Service Layer name of imagery; the validator also
                              requires a layers section, but this isn't used.
                              OSM Services also require a YAML configuration.""",
    )
    DATA_TYPES = [
        (GeospatialDataType.VECTOR.value, ("Vector")),
        (GeospatialDataType.RASTER.value, ("Raster")),
        (GeospatialDataType.ELEVATION.value, ("Elevation")),
        (GeospatialDataType.MESH.value, ("Mesh")),
        (GeospatialDataType.POINT_CLOUD.value, ("Point Cloud")),
    ]
    data_type = models.CharField(
        choices=DATA_TYPES,
        max_length=20,
        verbose_name="Data Type",
        null=True,
        default="",
        blank=True,
        help_text="The type of data provided (e.g. elevation, raster, vector)",
    )
    user = models.ForeignKey(User, related_name="+", null=True, default=None, blank=True, on_delete=models.CASCADE)
    license = models.ForeignKey(
        License, related_name="data_providers", null=True, blank=True, default=None, on_delete=models.CASCADE
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
    attribute_class = models.ForeignKey(
        AttributeClass,
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        related_name="data_providers",
        help_text="The attribute class is used to limit users access to resources using this data provider.",
    )
    the_geom = models.MultiPolygonField(
        verbose_name="Covered Area",
        srid=4326,
        default="SRID=4326;MultiPolygon (((-180 -90,180 -90,180 90,-180 90,-180 -90)))",
    )

    class Meta:  # pragma: no cover

        managed = True
        db_table = "export_provider"

    # Check if config changed to updated geometry
    __config: dict = None
    __url: str = None
    __layer: str = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__config = self.config
        self.__url = self.url
        self.__layer = self.layer

    def update_geom(self):
        from eventkit_cloud.tasks.helpers import download_data
        from eventkit_cloud.ui.helpers import file_to_geojson

        geometry = None
        if self.config != self.__config:
            orig_extent_url = self.__config.get("extent_url")
            config = self.config or dict()
            extent_url = config.get("extent_url")
            if extent_url and extent_url != orig_extent_url:
                random_uuid = uuid.uuid4()
                session = get_or_update_session(**config)
                if not extent_url:
                    return
                output_file = download_data(task_uid=str(random_uuid), input_url=extent_url, session=session)
                geojson = file_to_geojson(output_file)
                geojson_geometry = geojson.get("geometry") or geojson.get("features", [{}])[0].get("geometry")
                geometry = GEOSGeometry(json.dumps(geojson_geometry), srid=4326)
        elif (self.url != self.__url) or (self.layer != self.__layer):
            try:
                client = self.get_service_client()
                geometry = client.download_geometry()
            except AttributeError as e:
                # TODO: This fails in tests.  How to handle failure to update geometry?
                logger.info(e, exc_info=True)
        if geometry:
            self.the_geom = convert_polygon(geometry)

    def get_service_client(self) -> GisClient:
        url = self.url
        if not self.url and "osm" in self.export_provider_type.type_name:
            logger.error("Use of settings.OVERPASS_API_URL is deprecated and will be removed in 1.13")
            url = settings.OVERPASS_API_URL
        Client = get_client(self.export_provider_type.type_name)
        config = None
        if self.config:
            config = self.config or dict()
        return Client(url, self.layer, aoi_geojson=None, slug=self.slug, config=config)

    def check_status(self, aoi_geojson: dict = None):
        try:
            client = self.get_service_client()
            response = client.check(aoi_geojson=aoi_geojson)

        except Exception as e:
            logger.error(e, exc_info=True)
            response = get_status_result(CheckResult.UNKNOWN_ERROR)
            logger.error(f"An exception occurred while checking the {self.name} provider.", exc_info=True)
            logger.info(f"Status of provider '{self.name}': {response}")

        return response

    def save(self, *args, **kwargs):
        # Something is closing the database connection which is raising an error.
        # Using a separate process allows the connection to be closed in separate process while leaving it open.
        proc = multiprocessing.dummy.Process(target=self.update_geom)
        proc.start()
        proc.join()

        if not self.slug:
            self.slug = self.name.replace(" ", "_").lower()
            if len(self.slug) > 40:
                self.slug = self.slug[0:39]
        cache.delete(f"base-config-{self.slug}")

        if self.export_provider_type and "ogcapi-process" in self.export_provider_type.type_name:
            self.update_export_formats()

        super(DataProvider, self).save(*args, **kwargs)

    def update_export_formats(self):
        # TODO: Refactor utils/ogc_apiprocess into services.
        from eventkit_cloud.utils.services.ogcapi_process import OGCAPIProcess

        client: OGCAPIProcess = cast(OGCAPIProcess, self.get_service_client())
        process_formats = client.get_process_formats()
        logger.info(f"Process_formats: {process_formats}")
        for process_format in process_formats:
            export_format, created = ExportFormat.get_or_create(**process_format)
            if created:
                # Use the value from process format which might be case sensitive,
                # TODO: will likley run into issues if two remote services use same spelling and are case sensitive.
                export_format.options = {"value": process_format.get("slug"), "providers": [self.slug], "proxy": True}
                export_format.supported_projections.add(Projection.objects.get(srid=4326))
            else:
                providers = export_format.options.get("providers")
                if providers:
                    providers = list(set(providers + [self.slug]))
                    export_format.options["providers"] = providers
                else:
                    export_format.options = {"value": export_format.slug, "providers": [self.slug], "proxy": True}
            export_format.save()

    def __str__(self):
        return "{0}".format(self.name)

    @property
    def metadata(self):
        from eventkit_cloud.utils.mapproxy import get_mapproxy_metadata_url

        try:
            url = self.config["sources"]["info"]["req"]["url"]
            type = self.config["sources"]["info"]["type"]
            if url and type:
                return {"url": get_mapproxy_metadata_url(self.slug), "type": type}
            return None
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def footprint_url(self):
        from eventkit_cloud.utils.mapproxy import get_mapproxy_footprint_url

        try:
            url = self.config["sources"]["footprint"]["req"]["url"]
            if url:
                return get_mapproxy_footprint_url(self.slug)
            return None
        except (AttributeError, KeyError, TypeError):
            return None

    @property
    def layers(self) -> LayersDescription:
        """
        Used to populate the list of vector layers, typically for contextual or styling information.
        :return: A list of layer names.
        """
        if self.data_type != GeospatialDataType.VECTOR.value:
            return {}
        if self.config:
            config = clean_config(self.config)
            # As of EK 1.9.0 only vectors support multiple layers in a single provider
            if self.export_provider_type.type_name in ["osm", "osm-generic"]:
                return config
            elif config.get("vector_layers"):
                return {layer.get("name"): layer for layer in config.get("vector_layers", {})}
        # Often layer names are configured using an index number but this number is not very
        # useful when using the data so fall back to the slug which should be more meaningful.
        if not self.layer:  # check for NoneType or empty string
            # TODO: support other service types
            if self.export_provider_type.type_name in ["arcgis-feature"]:
                return self.get_service_client().get_layers()
            else:
                return {self.slug: {"url": self.url, "name": self.slug}}
        try:
            int(self.layer)  # noqa
            return {
                self.slug: {"url": self.url, "name": self.slug}
            }  # self.layer is an integer, so use the slug for better context.
        except ValueError:
            return {
                self.layer: {"url": self.url, "name": self.layer}
            }  # If we got here, layer is not None or an integer so use that.

    def get_use_bbox(self):
        if self.export_provider_type is not None:
            return self.export_provider_type.use_bbox
        else:
            return False

    """
    Max datasize is the size in megabytes.
    """

    @property
    def max_data_size(self):
        return None if self.config is None else self.config.get("max_data_size", None)

    def get_max_data_size(self, user=None):

        if not user:
            return self.max_data_size

        # the usersizerule set is looped instead of using a queryset filter so that it can be prefetched.
        if user:
            user_size_rule = list(
                filter(lambda user_size_rule: user_size_rule.user == user, self.usersizerule_set.all())
            )
            if user_size_rule:
                return user_size_rule[0].max_data_size

        return self.max_data_size

    def get_max_selection_size(self, user=None):

        if not user:
            return self.max_selection

        # the usersizerule set is looped instead of using a queryset filter so that it can be prefetched.
        if user:
            user_size_rule = list(
                filter(lambda user_size_rule: user_size_rule.user == user, self.usersizerule_set.all())
            )
            if user_size_rule:
                return user_size_rule[0].max_selection_size

        return self.max_selection

    def get_data_type(self) -> str:
        """
        This is used to populate the run metadata with special types for OSM and NOME.
        This is used for custom cartography,
        and should be removed if custom cartography is made configurable.
        :param data_provider:
        :return:
        """
        if self.slug.lower() in ["nome", "osm"]:
            return self.slug.lower()
        else:
            return str(self.data_type)


class Topic(UIDMixin, TimeStampedModelMixin):
    """
    Model for a Topic
    """

    name = models.CharField(verbose_name="Topic Name", unique=True, max_length=100)
    slug = LowerCaseCharField(max_length=40, unique=True, default="")
    providers = models.ManyToManyField(DataProvider, related_name="topics")
    topic_description = models.TextField(
        verbose_name="Description",
        null=True,
        default="",
        blank=True,
        help_text="This information is used to provide information about the Topic.",
    )

    def __str__(self):
        return "{0}".format(self.name)


class UserFavoriteProduct(TimeStampedModelMixin):
    """
    Model for a user's favorite product.
    Save and delete have been overridden to interact with the cache
    """

    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="user_favorites")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="favorite_products")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "provider"], name="unique_user_favorite_provider"),
        ]

    def save(self, *args, **kwargs):
        user_cache = MappedCache(self.user.username)
        user_cache.delete_all()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        user_cache = MappedCache(self.user.username)
        user_cache.delete_all()
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.provider.slug}"


class StyleFile(TimeStampedModelMixin, FileFieldMixin):
    """
    Model for Style File
    """

    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="styles")
    STYLE_TYPES = [
        (StyleType.ARCGIS.value, "ArcGIS Layer"),
        (StyleType.QGIS.value, "QGIS Layer"),
        (StyleType.MAPBOX.value, "Mapbox"),
        (StyleType.SLD.value, "SLD"),
        (StyleType.KML.value, "KML"),
    ]
    style_type = models.CharField(
        choices=STYLE_TYPES,
        max_length=20,
        verbose_name="Style Type",
        null=True,
        default="",
        blank=True,
        help_text="The type of style provided (e.g. arcgis, qgis, mapbox)",
    )

    def __str__(self):
        return f"{self.style_type}"


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
        if not args:  # Fixture loading happens with args, so don't do this if that.
            kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
            kwargs["the_geom_webmercator"] = convert_polygon(kwargs.get("the_geom_webmercator")) or ""
            kwargs["the_geog"] = convert_polygon(kwargs.get("the_geog")) or ""
        super(Region, self).__init__(*args, **kwargs)

    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, blank=True)

    the_geom = models.MultiPolygonField(verbose_name="Geometry", srid=4326, default="")
    the_geom_webmercator = models.MultiPolygonField(
        verbose_name="Mercator extent for export region", srid=3857, default=""
    )
    the_geog = models.MultiPolygonField(verbose_name="Geographic extent for export region", geography=True, default="")
    properties = models.JSONField(default=dict)

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


class RegionalPolicy(UIDMixin, TimeStampedModelMixin):
    name = models.CharField(max_length=255)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name="policies")
    providers = models.ManyToManyField(DataProvider, related_name="regional_policies")
    policies = models.JSONField()
    policy_title_text = models.CharField(max_length=255)
    policy_header_text = models.TextField(null=True, blank=True)
    policy_footer_text = models.TextField(null=True, blank=True)
    policy_cancel_text = models.CharField(max_length=255, null=True, blank=True)
    policy_cancel_button_text = models.CharField(max_length=255)
    justification_options = models.JSONField()

    class Meta:
        verbose_name_plural = "Regional Policies"

    def __str__(self):
        return self.name


class RegionalJustification(UIDMixin, TimeStampedModelMixin):
    """
    Model that stores regional justification selections made by users.
    """

    justification_id = models.IntegerField()
    justification_name = models.CharField(max_length=255)
    justification_suboption_value = models.TextField(null=True, blank=True)
    regional_policy = models.ForeignKey(RegionalPolicy, on_delete=models.CASCADE, related_name="justifications")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="justification_user")

    def __str__(self):
        return str(self.uid)


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
        if not args:  # Fixture loading happens with args, so don't do this if that.
            kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
            kwargs["the_geom_webmercator"] = convert_polygon(kwargs.get("the_geom_webmercator")) or ""
            kwargs["the_geog"] = convert_polygon(kwargs.get("the_geog")) or ""
        super().__init__(*args, **kwargs)

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name="owner")
    name = models.CharField(max_length=100, db_index=True)
    description = models.CharField(max_length=1000, db_index=True)
    event = models.CharField(max_length=100, db_index=True, default="", blank=True)
    region = models.ForeignKey(Region, null=True, blank=True, on_delete=models.CASCADE)
    preset = models.ForeignKey(DatamodelPreset, on_delete=models.CASCADE, null=True, blank=True)
    published = models.BooleanField(default=False, db_index=True)  # publish export
    visibility = models.CharField(max_length=10, choices=visibility_choices, default=VisibilityState.PRIVATE.value)
    featured = models.BooleanField(default=False, db_index=True)  # datapack is featured

    the_geom = models.MultiPolygonField(verbose_name="Extent for export", srid=4326, default="")
    the_geom_webmercator = models.MultiPolygonField(verbose_name="Mercator extent for export", srid=3857, default="")
    the_geog = models.MultiPolygonField(verbose_name="Geographic extent for export", geography=True, default="")
    original_selection = models.GeometryCollectionField(
        verbose_name="The original map selection", srid=4326, default=GeometryCollection, null=True, blank=True
    )

    include_zipfile = models.BooleanField(default=False)
    json_tags = models.JSONField(default=dict)
    last_export_run = models.ForeignKey(
        "tasks.ExportRun", on_delete=models.DO_NOTHING, null=True, related_name="last_export_run"
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
    def overpass_extents(self):
        """
        Return the export extents in order required by Overpass API.
        """
        extents = GEOSGeometry(self.the_geom).extent  # (w,s,e,n)
        # overpass needs extents in order (s,w,n,e)
        overpass_extents = "{0},{1},{2},{3}".format(str(extents[1]), str(extents[0]), str(extents[3]), str(extents[2]))
        return overpass_extents

    @property
    def extents(self):
        return GEOSGeometry(self.the_geom).extent  # (w,s,e,n)

    @property
    def filters(self):
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
    def categorised_tags(self):
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
    def bounds_geojson(self):
        return serialize("geojson", [self], geometry_field="the_geom", fields=("name", "the_geom"))

    @property
    def attribute_classes(self):
        providers = [provider_task.provider for provider_task in self.data_provider_tasks.all()]
        return AttributeClass.objects.filter(data_providers__in=providers).distinct()

    def get_last_run(self):
        return self.runs.last()


class DataProviderTask(models.Model):
    """
    Model for a set of tasks assigned to a provider for a job.
    """

    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)
    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="data_provider")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, null=True, related_name="data_provider_tasks")
    formats = models.ManyToManyField(ExportFormat, related_name="formats")
    min_zoom = models.IntegerField(blank=True, null=True)
    max_zoom = models.IntegerField(blank=True, null=True)

    def __str__(self):
        return "{0} - {1}".format(str(self.uid), self.provider)


class RegionMask(models.Model):
    """
    Model to hold region mask.
    """

    def __init__(self, *args, **kwargs):
        if not args:  # Fixture loading happens with args, so don't do this if that.
            kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        super().__init__(*args, **kwargs)

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


def remove_permissions(model, id):
    JobPermission.objects.filter(content_type=ContentType.objects.get_for_model(model), object_id=id).delete()


class JobPermissionLevel(Enum):
    NONE = "NONE"
    READ = "READ"
    ADMIN = "ADMIN"


class JobPermission(TimeStampedModelMixin):
    """
    Model associates users or groups with jobs
    """

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="permissions")
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField(db_index=True)
    content_object = GenericForeignKey("content_type", "object_id")
    permission = models.CharField(choices=[("READ", "Read"), ("ADMIN", "Admin")], max_length=10)

    # A user should only have one type of permission per job.
    class Meta:
        db_table = "jobpermission"
        constraints = [
            models.UniqueConstraint(
                fields=["job", "content_type", "object_id", "permission"], name="unique_object_permission_per_job"
            ),
        ]

    @staticmethod
    def get_orderable_queryset_for_job(job: Job, model: Union[Type[User], Type[Group]]) -> QuerySet:
        admin: ListOrQuerySet
        shared: ListOrQuerySet
        unshared: ListOrQuerySet
        admin = shared = unshared = []
        if job:
            job_permissions = job.permissions.prefetch_related("content_object").filter(
                content_type=ContentType.objects.get_for_model(model)
            )
            admin_ids = []
            shared_ids = []
            for job_permission in job_permissions:
                if job_permission.permission == JobPermissionLevel.ADMIN.value:
                    admin_ids += [job_permission.content_object.id]
                else:
                    shared_ids += [job_permission.content_object.id]
            admin_queryset = model.objects.filter(pk__in=admin_ids)
            shared_queryset = model.objects.filter(pk__in=shared_ids)
            total = admin_ids + shared_ids
            unshared_queryset = model.objects.exclude(pk__in=total)
            queryset = (
                cast(QuerySet, admin_queryset) | cast(QuerySet, shared_queryset) | cast(QuerySet, unshared_queryset)
            )
        else:
            queryset = model.objects.all()
        # https://docs.djangoproject.com/en/3.0/ref/models/conditional-expressions/#case
        queryset = queryset.annotate(
            admin_shared=Case(
                When(id__in=admin, then=Value(0)),
                When(id__in=shared, then=Value(1)),
                When(id__in=unshared, then=Value(2)),
                default=Value(2),
                output_field=models.IntegerField(),
            )
        ).annotate(
            shared=Case(
                When(id__in=admin, then=Value(0)),
                When(id__in=shared, then=Value(0)),
                When(id__in=unshared, then=Value(1)),
                default=Value(1),
                output_field=models.IntegerField(),
            )
        )
        return queryset

    @staticmethod
    def jobpermissions(job: Job) -> dict:
        permissions: Dict[str, Dict] = {"groups": {}, "members": {}}
        for jp in job.permissions.prefetch_related("content_object"):
            if isinstance(jp.content_object, User):
                permissions["members"][jp.content_object.username] = jp.permission
            else:
                permissions["groups"][jp.content_object.name] = jp.permission
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

        # If not requesting Admin level permission (i.e. to make admin changes), then also include public datasets.
        public_query = Q()
        if level == JobPermissionLevel.READ.value:
            public_query = Q(visibility=VisibilityState.PUBLIC.value)

        return jobs.filter(Q(*user_query) | Q(*group_query) | public_query)

    @staticmethod
    def groupjobs(group, level):
        # get all the jobs for which this group has the given permission level
        query = [
            Q(permissions__content_type=ContentType.objects.get_for_model(Group)),
            Q(permissions__object_id=group.id),
        ]
        if level != JobPermissionLevel.READ.value:
            query.append(Q(permissions__permission=level))

        # If not requesting Admin level permission (i.e. to make admin changes), then also include public datasets.
        public_query = Q()
        if level == JobPermissionLevel.READ.value:
            public_query = Q(visibility=VisibilityState.PUBLIC.value)

        return Job.objects.filter(Q(*query) | public_query)

    @staticmethod
    def get_user_permissions(user, job_uid):
        """
        Check what level of permission a user has to a job.
        :param user: User obj in question
        :param job_uid: Id of the job for which we want the user's permission level
        :return: None, READ, or ADMIN depending on what level of permission the user has to the job
        """
        permission = None

        # All of the permission objects for the job in question.
        jps = JobPermission.objects.filter(job__uid=job_uid)

        try:
            # Check if the user has explicit permissions to the job.
            user_permission = jps.get(content_type=ContentType.objects.get_for_model(User), object_id=user.pk)
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


def delete(self, *args, **kwargs):
    for job_permission in JobPermission.objects.filter(object_id=self.pk):
        job_permission.content_type = ContentType.objects.get_for_model(User)
        job_permission.object_id = job_permission.job.user.pk
        job_permission.save()

    super(Group, self).delete(*args, **kwargs)


# https://github.com/python/mypy/issues/2427
Group.delete = delete  # type: ignore


def clean_config(config: dict) -> dict:
    """
    Used to remove adhoc service related values from the configuration.
    :param config: A yaml structured string.
    :return: A yaml as a dict.
    """
    service_keys = [
        "cert_info",
        "cert_cred",
        "concurrency",
        "max_repeat",
        "overpass_query",
        "max_data_size",
        "pbf_file",
        "tile_size",
    ]

    conf = copy.deepcopy(config)

    for service_key in service_keys:
        conf.pop(service_key, None)

    return conf
