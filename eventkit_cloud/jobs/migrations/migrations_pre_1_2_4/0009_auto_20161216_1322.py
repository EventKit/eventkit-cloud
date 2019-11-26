# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2016-12-16 13:22


import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0008_exportprovider_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exportprovider',
            name='user',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE,
                                    related_name='+', to=settings.AUTH_USER_MODEL),
        ),
    ]
