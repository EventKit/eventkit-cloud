# Generated by Django 4.0.4 on 2022-10-12 19:50

from django.db import migrations
import eventkit_cloud.core.models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0037_alter_proxyformat_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='proxyformat',
            name='slug',
            field=eventkit_cloud.core.models.LowerCaseCharField(default='', max_length=20),
        ),
    ]
