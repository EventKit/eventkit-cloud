# Generated by Django 4.0.4 on 2022-09-20 15:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0034_userfavoriteproduct_unique_user_favorite_provider'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataprovider',
            name='config',
            field=models.JSONField(blank=True, default=dict, help_text="WMS, TMS, WMTS, and ArcGIS-Raster require a MapProxy YAML configuration\n                              with a Sources key of imagery and a Service Layer name of imagery; the validator also\n                              requires a layers section, but this isn't used.\n                              OSM Services also require a YAML configuration.", verbose_name='Configuration'),
        ),
    ]
