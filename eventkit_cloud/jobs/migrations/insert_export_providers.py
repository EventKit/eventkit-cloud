# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    def insert_export_providers(apps, schema_editor):

        ExportProvider = apps.get_model('jobs', 'ExportProvider')
        ExportProviderType = apps.get_model('jobs', 'ExportProviderType')
        ExportFormat = apps.get_model('jobs', 'ExportFormat')

        export_formats = ExportFormat.objects.filter(slug__in=['OBF',
                                                               'SHP',
                                                               'KML',
                                                               'SQLITE',
                                                               'GARMIN',
                                                               'THEMATIC',
                                                               'GPKG'])
        osm_type = ExportProviderType.objects.create(type_name='osm')
        for export_format in export_formats:
            osm_type.supported_formats.add(export_format.pk)
        osm_type.save()

        export_formats = ExportFormat.objects.filter(slug__in=['GPKG'])
        wms_type = ExportProviderType.objects.create(type_name='wms')
        for export_format in export_formats:
            wms_type.supported_formats.add(export_format.pk)
        wms_type.save()

        ExportProvider.objects.create(name='OpenStreetMap Data', slug='osm-vector', export_provider_type=osm_type)

        wmts_type = ExportProviderType.objects.create(type_name='wmts')
        for export_format in export_formats:
            wmts_type.supported_formats.add(export_format.pk)
        wmts_type.save()

    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(insert_export_providers),
    ]
