# -*- coding: utf-8 -*-
# Generated by Django 1.9 on 2017-01-13 17:04


from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0009_merge'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exporttaskresult',
            name='download_url',
            field=models.URLField(max_length=254, verbose_name='URL to export task result output.'),
        ),
    ]
