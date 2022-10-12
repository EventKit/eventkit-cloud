import json
import logging
import os

import yaml
from django import forms
from django.contrib import admin, messages
from django.contrib.gis.admin import OSMGeoAdmin
from django.shortcuts import render
from django.urls import re_path
from django.utils.html import format_html
from django_celery_beat.models import CrontabSchedule, IntervalSchedule

from eventkit_cloud.jobs.fields import ConfigField
from eventkit_cloud.jobs.forms import RegionalPolicyForm, RegionForm
from eventkit_cloud.jobs.models import (
    DatamodelPreset,
    DataProvider,
    DataProviderStatus,
    DataProviderTask,
    DataProviderType,
    ExportFormat,
    Job,
    JobPermission,
    License,
    Projection,
    ProxyFormat,
    Region,
    RegionalJustification,
    RegionalPolicy,
    StyleFile,
    Topic,
    UserFavoriteProduct,
    clean_config,
)

logger = logging.getLogger(__name__)


class JobAdmin(OSMGeoAdmin):
    """
    Admin model for editing Jobs in the admin interface.
    """

    search_fields = ["uid", "name", "user__username", "region__name"]
    list_display = ["uid", "name", "user", "region"]
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
    actions = ["select_exports"]

    update_template = "admin/update_regions.html"
    update_complete_template = "admin/update_complete.html"

    def select_exports(self, request):
        """
        Select exports to update.
        """
        selected = ",".join(request.POST.getlist(admin.ACTION_CHECKBOX_NAME))  # type: ignore
        regions = Region.objects.all()

        # noinspection PyProtectedMember
        return render(
            request,
            self.update_template,
            {"regions": regions, "selected": selected, "opts": self.model._meta},
        )

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    select_exports.short_description = "Assign a region to the selected exports"  # type: ignore

    def update_exports(self, request):
        """
        Update selected exports.
        """
        selected = request.POST.get("selected", "")
        num_selected = len(selected.split(","))
        region_uid = request.POST.get("region", "")
        region = Region.objects.get(uid=region_uid)
        for selected_id in selected.split(","):
            export = Job.objects.get(id=selected_id)
            export.region = region
            export.save()

        messages.success(request, "{0} exports updated.".format(num_selected))
        # noinspection PyProtectedMember
        return render(
            request,
            self.update_complete_template,
            {"num_selected": len(selected.split(",")), "region": region.name, "opts": self.model._meta},
        )

    def get_urls(self):
        urls = super(JobAdmin, self).get_urls()
        update_urls = [
            re_path(r"^select/$", self.admin_site.admin_view(self.select_exports)),
            re_path(
                r"^update/$",
                self.admin_site.admin_view(self.update_exports),
                name="update_regions",
            ),
        ]
        return update_urls + urls


class ExportConfigAdmin(admin.ModelAdmin):
    """
    Admin model for editing export configurations in the admin interface.
    """

    search_fields = ["uid", "name", "user__username"]
    list_display = ["uid", "name", "user", "config_type", "published", "created_at"]


class ProxyFormatAdmin(admin.ModelAdmin):
    """
    Admin model for editing export configurations in the admin interface.
    """

    search_fields = ["data_provider__slug", "slug", "export_format__name"]
    list_display = ["data_provider", "slug", "export_format"]


class YAMLWidget(forms.widgets.Textarea):
    def format_value(self, value):
        try:
            value = yaml.dump(json.loads(value))
            return value
        except Exception as e:
            logger.warning("Error while formatting JSON: %s", e)
            return super(YAMLWidget, self).format_value(value)


class DataProviderForm(forms.ModelForm):
    """
    Admin form for editing export providers in the admin interface.
    """

    config = ConfigField(widget=YAMLWidget)

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
            "data_type",
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
            "the_geom",
        ]

    def clean_config(self):
        print(self.cleaned_data)
        config = self.cleaned_data.get("config")

        service_type = self.cleaned_data.get("export_provider_type").type_name

        if service_type in ["wms", "wmts", "tms", "arcgis-raster"]:
            from eventkit_cloud.utils.mapproxy import ConfigurationError, MapproxyGeopackage

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

            feature_selection = FeatureSelection(clean_config(config))
            if feature_selection.errors:
                raise forms.ValidationError("Invalid configuration: {0}".format(feature_selection.errors))
        elif service_type in ["ogcapi-process"]:
            if not config:
                raise forms.ValidationError("Configuration is required for OGC API Process")
            cleaned_config = clean_config(config)
            assert isinstance(cleaned_config, dict)
            ogcapi_process = cleaned_config.get("ogcapi_process")
            if not ogcapi_process:
                raise forms.ValidationError("OGC API Process requires an ogcapi_process key with valid configuration")
            area = ogcapi_process.get("area")
            if not area:
                raise forms.ValidationError("OGC API Process requires an area key with a name and a type.")
            if not area.get("name"):
                raise forms.ValidationError("OGC API Process requires the name of the field to submit the area.")
            if area.get("type") not in ["geojson", "bbox", "wkt"]:
                raise forms.ValidationError("OGC API Process requires an area type of geojson, bbox, or wkt.")
            if not ogcapi_process.get("id"):
                raise forms.ValidationError("OGC API Process requires a process id.")

        return config


def make_display(modeladmin, request, queryset):
    queryset.update(display=True)


def make_hidden(modeladmin, request, queryset):
    queryset.update(display=False)


class DataProviderAdmin(admin.ModelAdmin):
    """
    Admin model for editing export providers in the admin interface.
    """

    form = DataProviderForm
    list_display = ["name", "slug", "label", "export_provider_type", "attribute_class", "license", "display"]
    search_fields = [
        "name",
        "slug",
        "data_type",
        "display",
        "attribute_class__name",
        "export_provider_type__type_name",
        "license__name",
    ]
    actions = [make_display, make_hidden]
    ordering = ["name"]


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

    # TODO: https://github.com/typeddjango/django-stubs/issues/151
    color_status.short_description = "status"  # type: ignore

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


def get_example_from_file(file_path: str):
    with open(os.path.join(os.path.dirname(__file__), file_path)) as json_file:
        return json.dumps(json.load(json_file))


class RegionAdmin(admin.ModelAdmin):
    model = Region
    list_display = ("uid", "name")
    form = RegionForm


class RegionalPolicyAdmin(admin.ModelAdmin):
    model = RegionalPolicy
    form = RegionalPolicyForm
    list_display = ("uid", "name", "region")

    fieldsets = (
        (None, {"fields": ["name", "region", "providers"]}),
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
                f"<br /> <br /> {get_example_from_file('examples/policies_example.json')}",
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
                f"<br /> <br /> {get_example_from_file('examples/justification_options_example.json')}",
            },
        ),
    )


class RegionalJustificationAdmin(admin.ModelAdmin):
    model = RegionalJustification
    list_display = ("uid", "justification_id", "justification_name", "regional_policy", "user")

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [field.name for field in obj._meta.get_fields()]
        return self.readonly_fields

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(ExportFormat)
admin.site.register(Projection)
admin.site.register(DataProviderType)
admin.site.register(DatamodelPreset)
admin.site.register(License)
admin.site.register(DataProviderTask)
admin.site.register(Topic)
admin.site.register(StyleFile)
admin.site.register(UserFavoriteProduct)
admin.site.register(IntervalSchedule, IntervalScheduleAdmin)
admin.site.register(CrontabSchedule, CrontabScheduleAdmin)
admin.site.register(Job, JobAdmin)
admin.site.register(ProxyFormat, ProxyFormatAdmin)
admin.site.register(DataProvider, DataProviderAdmin)
admin.site.register(DataProviderStatus, DataProviderStatusAdmin)
admin.site.register(Region, RegionAdmin)
admin.site.register(RegionalPolicy, RegionalPolicyAdmin)
admin.site.register(RegionalJustification, RegionalJustificationAdmin)
admin.site.register(JobPermission)
