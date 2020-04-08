from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.geos import GeometryCollection, Polygon, MultiPolygon

from eventkit_cloud.core.models import (
    TimeStampedModelMixin,
    UIDMixin,
)
from eventkit_cloud.jobs.models import DataProvider


class UserRequest(UIDMixin, TimeStampedModelMixin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("review", "In Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("completed", "Completed"),
    ]
    status = models.CharField(max_length=100, choices=STATUS_CHOICES, null=True, default="pending", blank=True)
    comment = models.TextField(verbose_name="Comment", null=True, default="", blank=True)


class DataProviderRequest(UserRequest):
    name = models.CharField(verbose_name="Service Name", max_length=100)
    url = models.CharField(verbose_name="Service URL", max_length=1000, null=True, default="", blank=True)
    service_description = models.TextField(verbose_name="Description", null=True, default="", blank=True)
    layer_names = models.TextField(verbose_name="Layer Names", null=True, default="", blank=True)


class AoiIncreaseRequest(UserRequest):
    def __init__(self, *args, **kwargs):
        kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        super(AoiIncreaseRequest, self).__init__(*args, **kwargs)

    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="requested_provider")
    the_geom = models.MultiPolygonField(verbose_name="Extent for export", srid=4326, default="")
    original_selection = models.GeometryCollectionField(
        verbose_name="The original map selection", srid=4326, default=GeometryCollection(), null=True, blank=True
    )
    requested_aoi_size = models.IntegerField(verbose_name="Requested AOI Size", null=True, blank=True)
    estimated_data_size = models.IntegerField(verbose_name="Estimated Data Size", null=True, blank=True)


def convert_polygon(geom=None):
    if geom and isinstance(geom, Polygon):
        return MultiPolygon(geom, srid=geom.srid)
    return geom
