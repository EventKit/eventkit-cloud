# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from ..models import ExportFormat


class Migration(migrations.Migration):

    def insert_export_formats(apps, schema_editor):
        ExportFormat = apps.get_model('jobs', 'ExportFormat')
        ExportFormat.objects.create(name='Geopackage', description='GeoPackage',
                                    slug='gpkg')
        ExportFormat.objects.create(name='ESRI Shapefile Format', description='Esri Shapefile (OSM Schema)',
                                    slug='shp')
        ExportFormat.objects.create(name='KML Format', description='Google Earth KMZ',
                                    slug='kml')
        ExportFormat.objects.create(name='SQLITE Format', description='SQlite SQL',
                                    slug='sqlite')


    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(insert_export_formats),
    ]
