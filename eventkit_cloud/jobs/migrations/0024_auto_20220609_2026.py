# Generated by Django 4.0.4 on 2022-06-09 20:26
import yaml
from django.db import migrations


class Migration(migrations.Migration):
    def update_layer_configuration(apps, schema_editor):  # NOQA
        DataProvider = apps.get_model('jobs', 'DataProvider')  # NOQA
        for data_provider in DataProvider.objects.all():
            if data_provider.config:
                config = yaml.safe_load(data_provider.config)
                if config.get("vector_layers"):
                    vector_layers = config['vector_layers']
                    layers = {}
                    for layer in vector_layers:
                        layers[layer['name']] = layer
                    config["vector_layers"] = layers
                    data_provider.config = yaml.dump(config)
                    data_provider.save()


    def rollback_layer_configuration(apps, schema_editor):  # NOQA
        DataProvider = apps.get_model('jobs', 'DataProvider')  # NOQA
        for data_provider in DataProvider.objects.all():
            if data_provider.config:
                config = yaml.safe_load(data_provider.config)
                if config.get("vector_layers"):
                    config["vector_layers"] = list(config['vector_layers'].values())
                    data_provider.config = yaml.dump(config)
                    data_provider.save()

    dependencies = [
        ('jobs', '0023_alter_dataprovider_license'),
    ]

    operations = [
        migrations.RunPython(update_layer_configuration, rollback_layer_configuration),
    ]
