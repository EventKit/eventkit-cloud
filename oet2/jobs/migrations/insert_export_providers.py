# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from ..models import ExportFormat


class Migration(migrations.Migration):

    def insert_export_providers(apps, schema_editor):
        ExportProvider = apps.get_model('jobs', 'ExportProvider')
        ExportProvider.objects.create(name='OpenStreetMap', type='osm')
        ExportProvider.objects.create(name='Active Fires 1 Month',
                                    url='http://neowms.sci.gsfc.nasa.gov/wms/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0',
                                    layer='MOD14A1_M_FIRE',
                                    type='wms')
    dependencies = [
        ('jobs', '0002_auto_20160824_1831'),
    ]

    operations = [
        migrations.RunPython(insert_export_providers),
    ]
