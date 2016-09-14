# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', 'insert_export_providers'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exportprovider',
            name='url',
            field=models.CharField(default='', max_length=1000, null=True, verbose_name='Service URL', blank=True),
        ),
    ]
