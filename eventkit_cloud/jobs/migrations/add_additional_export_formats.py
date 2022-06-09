# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):
    def insert_export_formats(apps, schema_editor):  # NOQA
        ExportFormat = apps.get_model("jobs", "ExportFormat")  # NOQA
        ExportFormat.objects.create(
            name="National Imagery Transmission Format",
            description="NITF Raster",
            slug="nitf",
        )
        ExportFormat.objects.create(
            name="Erdas Imagine HFA Format",
            description="Erdas Imagine HFA Raster",
            slug="hfa",
        )

    dependencies = [
        ("jobs", "0003_auto_20190801_0137"),
    ]

    operations = [
        migrations.RunPython(insert_export_formats),
    ]
