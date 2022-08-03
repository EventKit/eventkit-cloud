import argparse
import json
import os

import yaml


def update_providers(file_path, skip_missing=False):
    print(f"Loading provider file {file_path}")
    model_map = {"jobs.license": License, "jobs.dataprovider": DataProvider, "core.attributeclass": AttributeClass}
    with open(file_path, "rb") as fixture_file:
        fixtures = json.load(fixture_file)
    if not fixtures:
        raise Exception(f"Could not open fixtures from {file_path}")
    fixtures_settings = clean_fixtures(fixtures, skip_missing=skip_missing)
    for fixture_settings in fixtures_settings:
        # Don't use update... calling save() will call signals which we need.
        model_name = fixture_settings.pop("model", None)
        model = model_map.get(model_name)
        if not model:
            print(f"No support to update {model_name}")
            continue
        instance, created = model.objects.get_or_create(slug=fixture_settings['slug'], defaults=fixture_settings)
        if created:
            print(f"Created {instance}")
        else:
            updated = False
            if hasattr(instance, "display"):
                instance_display = instance.display
                fixture_display = fixture_settings.get("display", False)
                print(f"setting display for {instance}: {instance_display} -> {fixture_display}")
                instance.display = fixture_display
                updated = True
            for attr, value in fixture_settings.items():
                if hasattr(instance, attr) and getattr(instance, attr) != value:
                    print(f"Changing {instance}: {attr}")
                    setattr(instance, attr, value)
                    updated = True
            if updated:
                instance.save()
                print(f"Updated {instance}  (display={getattr(instance, 'display', '')})")
            else:
                print(f"No changes for {instance} (display={getattr(instance, 'display', '')}).")


def clean_fixtures(fixtures, skip_missing=False):
    # Remove time fields and related tables, licenses will need to be added later.
    exclude = ['created_at', 'updated_at', 'uid', 'thumbnail', 'user', 'users']
    fixtures_settings = []
    for fixture in fixtures:
        new_fixture = {'model': fixture['model']}
        for field, value in fixture['fields'].items():
            if field not in exclude:
                if field == "config":
                    if not value:
                        value = dict()
                    elif isinstance(value, str):
                        value = yaml.safe_load(value)
                if value:
                    new_fixture[field] = value
            try:
                if field == "export_provider_type" and value:
                    new_fixture[field] = DataProviderType.objects.get(id=value)
                if field == "attribute_class" and value:
                    new_fixture[field] = AttributeClass.objects.get(id=value)
                if field == "license" and value:
                    new_fixture[field] = License.objects.get(id=value)

            except Exception:
                print(f"The ID: {value} for {field} does not exist.")
                if not skip_missing:
                    raise
                else:
                    new_fixture[field] = None

        fixtures_settings.append(new_fixture)
    return fixtures_settings


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    import django
    django.setup()
    from eventkit_cloud.jobs.models import DataProvider, DataProviderType, License
    from eventkit_cloud.core.models import AttributeClass

    parser = argparse.ArgumentParser(description='Load Fixtures for Data Providers.')

    parser.add_argument('file', help='The path to the fixture file')
    parser.add_argument('-s', '--skip', action='store_true', help='Skip missing foreign key relationships.')

    args = parser.parse_args()
    print("Updating providers...")
    update_providers(args.file, skip_missing=args.skip)
