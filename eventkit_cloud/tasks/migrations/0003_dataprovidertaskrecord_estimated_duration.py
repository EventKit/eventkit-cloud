# Generated by Django 2.2.1 on 2019-06-12 02:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0002_dataprovidertaskrecord_estimated_size"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataprovidertaskrecord",
            name="estimated_duration",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
