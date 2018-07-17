# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-08-25 14:16


from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0020_merge_20170803_1430'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exportformat',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='job',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='region',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
