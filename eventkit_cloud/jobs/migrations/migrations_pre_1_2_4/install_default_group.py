# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):

    def insert_default_group(apps, schema_editor):  # NOQA
        """
        Set up the default group and group profile.
        """
        Group = apps.get_model('auth', 'Group')  # NOQA
        ExportProfile = apps.get_model('jobs', 'ExportProfile')  # NOQA
        group = Group.objects.create(name='DefaultExportExtentGroup')
        ExportProfile.objects.create(name='DefaultExportProfile', max_extent=2500000, group=group)

    dependencies = [
        ('jobs', 'install_region_mask'),
    ]

    operations = [
        migrations.RunPython(insert_default_group),
    ]
