# Generated by Django 3.2.7 on 2021-10-04 15:09

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0016_region_properties'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataprovider',
            name='the_geom',
            field=django.contrib.gis.db.models.fields.MultiPolygonField(blank=True, default=None, null=True, srid=4326, verbose_name='Covered Area'),
        ),
        migrations.AlterField(
            model_name='region',
            name='the_geom',
            field=django.contrib.gis.db.models.fields.MultiPolygonField(default='', srid=4326, verbose_name='Geometry'),
        ),
    ]
