import argparse
import json
import os


def update_providers(file_path, skip_missing=False):
    print(f"Loading provider file {file_path}")
    with open(file_path, "rb") as fixture_file:
        fixtures = json.load(fixture_file)
    if not fixtures:
        raise Exception(f"Could not open fixtures from {file_path}")
    providers_settings = clean_fixtures(fixtures, skip_missing=skip_missing)
    for provider_settings in providers_settings:
        # Don't use update... calling save() will call signals which we need.
        data_provider, created = DataProvider.objects.get_or_create(slug=provider_settings['slug'], defaults=provider_settings)
        if created:
            print(f"Created {data_provider}")
        else:
            for attr, value in provider_settings.items():
                setattr(data_provider, attr, value)
            data_provider.save()
            print(f"Updated {data_provider}")


def clean_fixtures(fixtures, skip_missing=False):
    # Remove time fields and related tables, licenses will need to be added later.
    exclude = ['created_at', 'updated_at', 'uid', 'thumbnail', 'user']
    providers_settings = []
    for fixture in fixtures:
        new_fixture = {}
        for field, value in fixture['fields'].items():
            if field not in exclude:
                if value:
                    new_fixture[field] = value
            try:
                if field == "export_provider_type" and value:
                    new_fixture[field] = DataProviderType.objects.get(id=value)
                if field == "attribute_class" and value:
                    new_fixture[field] = AttributeClass.objects.get(id=value)
                if field == "license" and value:
                    new_fixture[field] = AttributeClass.objects.get(id=value)
            except Exception:
                print(f"The ID: {value} for {field} does not exist.")
                if not skip_missing:
                    raise
                else:
                    new_fixture[field] = None

        providers_settings.append(new_fixture)
    return providers_settings


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    import django
    django.setup()
    from eventkit_cloud.core.models import AttributeClass
    from eventkit_cloud.jobs.models import DataProvider, DataProviderType

    parser = argparse.ArgumentParser(description='Load Fixtures for Data Providers.')

    parser.add_argument('file', help='The path to the fixture file')
    parser.add_argument('-s', '--skip', action='store_true', help='Skip missing foreign key relationships.')

    args = parser.parse_args()
    print("Updating providers...")
    update_providers(args.file, skip_missing=args.skip)
