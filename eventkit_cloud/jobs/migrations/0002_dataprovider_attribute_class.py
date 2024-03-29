# Generated by Django 2.2.5 on 2020-08-03 10:37

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_auto_20200803_1037'),
        ('jobs', '0001_dataprovider_label'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataprovider',
            name='attribute_class',
            field=models.ForeignKey(blank=True, help_text='The attribute class is used to limit users access to resources using this data provider.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='data_providers', to='core.AttributeClass'),
        ),
    ]
