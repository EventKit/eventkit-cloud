# Generated by Django 2.0.9 on 2018-12-31 18:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataprovidertaskrecord",
            name="estimated_size",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
