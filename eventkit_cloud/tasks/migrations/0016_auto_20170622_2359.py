# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-06-22 23:59
from __future__ import unicode_literals

from django.db import migrations

def populate_new_fields(apps, schema_editor):
    """ Populates the fields added in migration #14; ExportTask.new_result & FileProducingTaskResult.id
    """
    ExportTask = apps.get_model('tasks', 'ExportTask')
    FileProducingTaskResult = apps.get_model('tasks', 'FileProducingTaskResult')
    for et in ExportTask.objects.all():
        try:
            et.result.id = et.id
            et.result.save()
            et.new_result = et.result
            et.save()
        except FileProducingTaskResult.DoesNotExist:
            # If there's no result there's nothing to update, carry on
            pass

class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0015_auto_20170622_2358'),
    ]

    operations = [
        migrations.RunPython(populate_new_fields)
    ]
