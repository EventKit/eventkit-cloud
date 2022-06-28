# Generated by Django 2.2.3 on 2019-08-01 01:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "install_default_group"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataprovidertask",
            name="max_zoom",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="dataprovidertask",
            name="min_zoom",
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
