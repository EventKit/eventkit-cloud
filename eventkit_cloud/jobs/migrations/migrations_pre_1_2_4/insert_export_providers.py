# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):
    def insert_export_providers(apps, schema_editor):
        pass

    dependencies = [
        ('jobs', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(insert_export_providers),
    ]
