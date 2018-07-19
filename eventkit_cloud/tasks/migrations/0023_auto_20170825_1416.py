# -*- coding: utf-8 -*-
# Generated by Django 1.10.7 on 2017-08-25 14:16


from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0022_auto_20170802_1234'),
    ]

    operations = [
        migrations.AlterField(
            model_name='exportprovidertask',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='exportrun',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='exporttask',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AlterField(
            model_name='finalizerunhooktaskrecord',
            name='uid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
