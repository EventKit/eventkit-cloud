# Generated by Django 3.2.7 on 2021-12-07 05:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0019_auto_20211014_2210'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataprovider',
            name='data_type',
            field=models.CharField(blank=True, choices=[('vector', 'Vector'), ('raster', 'Raster'), ('elevation', 'Elevation'), ('mesh', 'Mesh'), ('point cloud', 'Point Cloud')], default='', help_text='The type of data provided (e.g. elevation, raster, vector)', max_length=15, null=True, verbose_name='Data Type'),
        ),
    ]
