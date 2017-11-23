from django.contrib import admin
from django import forms
from django.template import RequestContext
from django.conf.urls import url
from django.contrib import messages
from django.shortcuts import render_to_response
from django.contrib.gis.admin import OSMGeoAdmin
from django.contrib.gis.geos import GEOSGeometry
import logging

from .models import ExportFormat, ExportProfile, Job, Region, DataProvider, DataProviderType, \
    DataProviderTask, DatamodelPreset, License, UserLicense


logger = logging.getLogger(__name__)

admin.site.register(ExportFormat)
admin.site.register(ExportProfile)
admin.site.register(DataProviderType)
admin.site.register(DataProviderTask)
admin.site.register(DatamodelPreset)
admin.site.register(License)
admin.site.register(UserLicense)


class HOTRegionGeoAdmin(OSMGeoAdmin):
    """
    Admin model to allow Region editing in admin interface.

    Uses OSM for base layer in map in admin.
    """
    model = Region
    exclude = ['the_geom', 'the_geog']

    def save_model(self, request, obj, form, change):  # pragma no cover
        geom_merc = obj.the_geom_webmercator
        obj.the_geom = geom_merc.transform(ct=4326, clone=True)
        obj.the_geog = GEOSGeometry(obj.the_geom.wkt)
        obj.save()


class JobAdmin(OSMGeoAdmin):
    """
    Admin model for editing Jobs in the admin interface.
    """
    search_fields = ['uid', 'name', 'user__username', 'region__name']
    list_display = ['uid', 'name', 'user', 'region']
    exclude = ['the_geom', 'the_geog']
    actions = ['select_exports']

    update_template = 'admin/update_regions.html'
    update_complete_template = 'admin/update_complete.html'

    def select_exports(self, request):
        """
        Select exports to update.
        """
        selected = ','.join(request.POST.getlist(admin.ACTION_CHECKBOX_NAME))
        regions = Region.objects.all()

        # noinspection PyProtectedMember
        return render_to_response(self.update_template, {
            'regions': regions,
            'selected': selected,
            'opts': self.model._meta,
        }, context_instance=RequestContext(request))

    select_exports.short_description = "Assign a region to the selected exports"

    def update_exports(self, request):
        """
        Update selected exports.
        """
        selected = request.POST.get('selected', '')
        num_selected = len(selected.split(','))
        region_uid = request.POST.get('region', '')
        region = Region.objects.get(uid=region_uid)
        for selected_id in selected.split(','):
            export = Job.objects.get(id=selected_id)
            export.region = region
            export.save()

        messages.success(request, '{0} exports updated.'.format(num_selected))
        # noinspection PyProtectedMember
        return render_to_response(self.update_complete_template, {
            'num_selected': len(selected.split(',')),
            'region': region.name,
            'opts': self.model._meta,
        }, context_instance=RequestContext(request))

    def get_urls(self):
        urls = super(JobAdmin, self).get_urls()
        update_urls = [
            url(r'^select/$', self.admin_site.admin_view(self.select_exports)),
            url(r'^update/$', self.admin_site.admin_view(self.update_exports),
                name="update_regions"),
                         ]
        return update_urls + urls


class ExportConfigAdmin(admin.ModelAdmin):
    """
    Admin model for editing export configurations in the admin interface.
    """
    search_fields = ['uid', 'name', 'user__username']
    list_display = ['uid', 'name', 'user', 'config_type', 'published', 'created_at']


class DataProviderForm(forms.ModelForm):
    """
    Admin form for editing export providers in the admin interface.
    """
    class Meta:
        model = DataProvider
        fields = ['name',
                  'slug',
                  'url',
                  'preview_url',
                  'service_copyright',
                  'service_description',
                  'layer',
                  'export_provider_type',
                  'level_from',
                  'level_to',
                  'config',
                  'user',
                  'license',
                  'zip',
                  'display',
                  ]

    def clean_config(self):
        config = self.cleaned_data.get('config')
        if not config:
            return

        service_type = self.cleaned_data.get('export_provider_type').type_name

        if service_type in ['wms', 'wmts']:
            from ..utils.external_service import ExternalRasterServiceToGeopackage, \
                                                 ConfigurationError, SeedConfigurationError
            service = ExternalRasterServiceToGeopackage(layer=self.cleaned_data.get('layer'), service_type=self.cleaned_data.get('export_provider_type'), config=config)
            try:
                conf_dict, seed_configuration, mapproxy_configuration = service.get_check_config()
            except (ConfigurationError, SeedConfigurationError) as e:
                raise forms.ValidationError(e.message)

        elif service_type in ['osm', 'osm-generic']:
            from ..feature_selection.feature_selection import FeatureSelection
            try:
                f = FeatureSelection.example(config)
            except AssertionError:
                raise forms.ValidationError("Invalid configuration")

        return config


class DataProviderAdmin(admin.ModelAdmin):
    """
    Admin model for editing export providers in the admin interface.
    """
    form = DataProviderForm
    list_display = ['name', 'slug', 'export_provider_type', 'user', 'license', 'display']


# register the new admin models
admin.site.register(Region, HOTRegionGeoAdmin)
admin.site.register(Job, JobAdmin)
admin.site.register(DataProvider, DataProviderAdmin)
