# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-06-24 09:59
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('tasks', '0011_auto_20170607_0047'),
    ]

    operations = [
        migrations.AddField(
            model_name='exportrun',
            name='delete_user',
            field=models.ForeignKey(blank=True, editable=False, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='exportrun',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='exporttaskresult',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
    ]
