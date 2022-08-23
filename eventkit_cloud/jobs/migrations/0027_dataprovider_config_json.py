# Generated by Django 4.0.4 on 2022-06-30 19:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0026_stylefile'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataprovider',
            name='config_json',
            field=models.JSONField(blank=True, default={}, help_text="WMS, TMS, WMTS, and ArcGIS-Raster require a MapProxy YAML configuration\n                              with a Sources key of imagery and a Service Layer name of imagery; the validator also\n                              requires a layers section, but this isn't used.\n                              OSM Services also require a YAML configuration.", null=True, verbose_name='Configuration'),
        ),
    ]