# Generated by Django 3.2.7 on 2022-04-12 19:13

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0022_auto_20220322_1653'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dataprovider',
            name='license',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='data_providers', to='jobs.license'),
        ),
    ]
