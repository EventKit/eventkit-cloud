# -*- coding: utf-8 -*-
# Generated by Django 1.10.6 on 2017-05-10 19:25


from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0014_auto_20170427_1504'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='UserLicenses',
            new_name='UserLicense',
        ),
    ]
