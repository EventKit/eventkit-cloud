# Generated by Django 3.2.7 on 2022-03-22 16:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0021_auto_20211214_1546"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="jobpermission",
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name="jobpermission",
            constraint=models.UniqueConstraint(
                fields=("job", "content_type", "object_id", "permission"),
                name="unique_object_permission_per_job",
            ),
        ),
    ]
