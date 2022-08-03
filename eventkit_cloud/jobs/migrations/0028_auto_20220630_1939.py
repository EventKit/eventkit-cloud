# Generated by Django 4.0.4 on 2022-06-30 19:39

from django.db import migrations
import yaml


class Migration(migrations.Migration):
    
    def convert_to_json(apps, schema_editor):
        DataProvider = apps.get_model('jobs', 'DataProvider')
        for data_provider in DataProvider.objects.all():
            config = yaml.load(data_provider.config, Loader=yaml.CLoader)
            if config:
                print(f"Adding config {type(config)}")
            data_provider.config_json = config or dict()
            data_provider.save()

    def convert_to_yaml(apps, schema_editor):
        DataProvider = apps.get_model('jobs', 'DataProvider')
        for data_provider in DataProvider.objects.all():
            if data_provider.config_json:
                data_provider.config = yaml.dump(data_provider.config_json, Dumper=yaml.CDumper)
                data_provider.save()
            
    dependencies = [
        ('jobs', '0027_dataprovider_config_json'),
    ]

    operations = [
        migrations.RunPython(convert_to_json, convert_to_yaml),
    ]

