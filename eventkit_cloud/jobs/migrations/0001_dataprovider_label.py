# Generated by Django 2.2.5 on 2020-05-04 15:15

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "add_map_image_snapshot"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataprovider",
            name="label",
            field=models.CharField(
                blank=True, max_length=100, null=True, verbose_name="Label"
            ),
        ),
    ]
