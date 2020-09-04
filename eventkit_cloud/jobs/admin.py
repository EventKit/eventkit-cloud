import json
import logging
import os

from django import forms
from django.contrib import admin
from django.contrib.gis.admin import OSMGeoAdmin
from django.utils.html import format_html
from django_celery_beat.models import IntervalSchedule, CrontabSchedule

from eventkit_cloud.jobs.forms import RegionForm
from eventkit_cloud.jobs.models import (
    ExportFormat,
    Projection,
    Job,
    DataProvider,
    DataProviderType,
    Region,
    DatamodelPreset,
    License,
    DataProviderStatus,
    DataProviderTask,
    JobPermission,
)
from eventkit_cloud.tasks.helpers import clean_config

logger = logging.getLogger(__name__)

admin.site.register(ExportFormat)
admin.site.register(Projection)
admin.site.register(DataProviderType)
admin.site.register(DatamodelPreset)
admin.site.register(License)
admin.site.register(DataProviderTask)


class JobAdmin(OSMGeoAdmin):
    """
    Admin model for editing Jobs in the admin interface.
    """

    search_fields = ["uid", "name", "user__username"]
    list_display = ["uid", "name", "user"]
    readonly_fields = ["user", "name", "description", "event"]
    exclude = [
        "the_geom",
        "the_geom_webmercator",
        "original_selection",
        "the_geog",
        "data_provider_tasks",
        "json_tags",
        "preset",
    ]


class ExportConfigAdmin(admin.ModelAdmin):
    """
    Admin model for editing export configurations in the admin interface.
    """

    search_fields = ["uid", "name", "user__username"]
    list_display = ["uid", "name", "user", "config_type", "published", "created_at"]


class DataProviderForm(forms.ModelForm):
    """
    Admin form for editing export providers in the admin interface.
    """

    class Meta:
        model = DataProvider
        fields = [
            "name",
            "slug",
            "label",
            "url",
            "preview_url",
            "service_copyright",
            "service_description",
            "layer",
            "export_provider_type",
            "max_selection",
            "level_from",
            "level_to",
            "config",
            "user",
            "license",
            "zip",
            "display",
            "attribute_class",
        ]

    def clean_config(self):
        config = self.cleaned_data.get("config")

        service_type = self.cleaned_data.get("export_provider_type").type_name

        if service_type in ["wms", "wmts", "tms", "arcgis-raster"]:
            from eventkit_cloud.utils.mapproxy import (
                MapproxyGeopackage,
                ConfigurationError,
            )

            service = MapproxyGeopackage(
                layer=self.cleaned_data.get("layer"),
                service_type=self.cleaned_data.get("export_provider_type"),
                config=config,
            )
            try:
                service.get_check_config()
            except ConfigurationError as e:
                raise forms.ValidationError(str(e))

        elif service_type in ["osm", "osm-generic"]:
            if not config:
                raise forms.ValidationError("Configuration is required for OSM data providers")
            from eventkit_cloud.feature_selection.feature_selection import FeatureSelection

            cleaned_config = clean_config(config)
            feature_selection = FeatureSelection(cleaned_config)
            feature_selection.valid
            if feature_selection.errors:
                raise forms.ValidationError("Invalid configuration: {0}".format(feature_selection.errors))

        return config


class DataProviderAdmin(admin.ModelAdmin):
    """
    Admin model for editing export providers in the admin interface.
    """

    form = DataProviderForm
    list_display = [
        "name",
        "slug",
        "label",
        "export_provider_type",
        "attribute_class",
        "license",
        "display",
    ]


# The reason for these empty classes is to remove IntervalSchedule and CrontabSchedule from the admin page. The easiest
# way to do this is to unregister them using admin.site.unregister, but that also means that you can't use the plus
# button to add new ones on lists displayed on admin pages of other models (in this case, PeriodicTask). Having the
# model be registered but hidden prevents that option from being removed.
class IntervalScheduleAdmin(admin.ModelAdmin):
    def get_model_perms(self, request):
        return {}


class CrontabScheduleAdmin(admin.ModelAdmin):
    def get_model_perms(self, request):
        return {}


admin.site.unregister(IntervalSchedule)
admin.site.unregister(CrontabSchedule)


class DataProviderStatusAdmin(admin.ModelAdmin):
    """
    Status information for Data Providers
    """

    def color_status(self, obj):
        if obj.status == "SUCCESS":
            return format_html(
                '<div style="width:100%%; height:100%%; background-color:rgba(0, 255, 0, 0.3);">%s</div>' % obj.status
            )
        elif obj.status.startswith("WARN"):
            return format_html(
                '<div style="width:100%%; height:100%%; background-color:rgba(255, 255, 0, 0.3);">%s</div>' % obj.status
            )
        return format_html(
            '<div style="width:100%%; height:100%%; background-color:rgba(255, 0, 0, 0.3);">%s</div>' % obj.status
        )

    color_status.short_description = "status"

    model = DataProviderStatus
    readonly_fields = (
        "status",
        "status_type",
        "message",
        "last_check_time",
        "related_provider",
    )
    list_display = (
        "color_status",
        "status_type",
        "message",
        "last_check_time",
        "related_provider",
    )
    list_filter = ("related_provider", "status", "status_type", "last_check_time")

    def has_add_permission(self, request, obj=None):
        return False


class RegionAdmin(admin.ModelAdmin):
    model = Region
    form = RegionForm
    list_display = ("uid", "name")

    with open(os.path.join(os.path.dirname(__file__), "examples/policies_example.json")) as json_file:
        policies_example = json.dumps(json.load(json_file))

    with open(os.path.join(os.path.dirname(__file__), "examples/justification_options_example.json")) as json_file:
        justification_options_example = json.dumps(json.load(json_file))

    fieldsets = (
        (None, {"fields": ["name", "bounding_box", "providers"]}),
        (
            None,
            {
                "fields": [
                    "policies",
                    "policy_title_text",
                    "policy_header_text",
                    "policy_footer_text",
                    "policy_cancel_text",
                    "policy_cancel_button_text",
                ],
                "description": "The policy field expects a JSON structure with a list of policy objects. "
                "Each policy object must contain a title and a description. See the example below."
                f"<br /> <br /> {policies_example}",
            },
        ),
        (
            None,
            {
                "fields": ["justification_options"],
                "description": "The justification options field expects a JSON structure with a "
                "list of option objects. Each option object must have an integer id, string name "
                "and boolean display. Options may also have suboptions. "
                "Suboptions can be of type text or dropdown.  See the example below."
                f"<br /> <br /> {justification_options_example}",
            },
        ),
    )


# register the new admin models
admin.site.register(IntervalSchedule, IntervalScheduleAdmin)
admin.site.register(CrontabSchedule, CrontabScheduleAdmin)
admin.site.register(Job, JobAdmin)
admin.site.register(DataProvider, DataProviderAdmin)
admin.site.register(DataProviderStatus, DataProviderStatusAdmin)
admin.site.register(Region, RegionAdmin)
admin.site.register(JobPermission)
