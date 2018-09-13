# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):
    def insert_export_formats(apps, schema_editor):  # NOQA
        ExportFormat = apps.get_model('jobs', 'ExportFormat')  # NOQA
        ExportFormat.objects.create(name='Geopackage', description='GeoPackage', slug='gpkg')
        ExportFormat.objects.create(name='ESRI Shapefile Format', description='Esri Shapefile (OSM Schema)',
                                    slug='shp')
        ExportFormat.objects.create(name='KML Format', description='Google Earth KMZ', slug='kml')
        ExportFormat.objects.create(name='SQLITE Format', description='SQlite SQL', slug='sqlite')
        ExportFormat.objects.create(name='GeoTIFF Format', description="GeoTIFF Raster", slug='gtiff')

    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(insert_export_formats),
    ]
