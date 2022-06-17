from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.geos import MultiPolygon, Polygon

from eventkit_cloud.core.models import TimeStampedModelMixin, UIDMixin
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


class SizeIncreaseRequest(UserRequest):
    def __init__(self, *args, **kwargs):
        if not args:  # Fixture loading happens with args, so don't do this if that.
            kwargs["the_geom"] = convert_polygon(kwargs.get("the_geom")) or ""
        super(SizeIncreaseRequest, self).__init__(*args, **kwargs)

    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE, related_name="requested_provider")
    the_geom = models.MultiPolygonField(verbose_name="Extent for export", srid=4326, default="")
    requested_aoi_size = models.IntegerField(verbose_name="Requested AOI Size", null=True, blank=True)
    requested_data_size = models.IntegerField(verbose_name="Requested Data Size", null=True, blank=True)


class SizeRule(models.Model):
    """
    Based model that represents a collection of custom values
    """

    max_data_size = models.DecimalField(
        verbose_name="Max data size",
        default=100,
        max_digits=12,
        decimal_places=3,
        help_text="This is the maximum data size in MB that can be exported "
        "from this provider in a single DataPack.",
    )
    max_selection_size = models.DecimalField(
        verbose_name="Max AOI selection size",
        default=100,
        max_digits=12,
        decimal_places=3,
        help_text="This is the maximum area in square kilometers that can be exported "
        "from this provider in a single DataPack. This rule is generally superseded by data size.",
    )
    provider = models.ForeignKey(DataProvider, on_delete=models.CASCADE)

    class Meta:
        abstract = True


class UserSizeRule(SizeRule):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        indexes = [models.Index(fields=["user", "provider"])]
        constraints = [
            models.UniqueConstraint(fields=["provider", "user"], name="unique_user_size_rule_per_provider"),
        ]

    def __str__(self):
        return f"{self.provider.slug} rules for {self.user.username}"


def convert_polygon(geom=None):
    if geom and isinstance(geom, Polygon):
        return MultiPolygon(geom, srid=geom.srid)
    return geom
