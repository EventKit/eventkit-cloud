import argparse
import json
import os

import yaml


def update_providers(file_path, skip_missing=False):
    print(f"Loading provider file {file_path}")

    with open(file_path, "rb") as fixture_file:
        fixtures = json.load(fixture_file)
    if not fixtures:
        raise Exception(f"Could not open fixtures from {file_path}")

    fixtures_settings = clean_fixtures(fixtures, skip_missing=skip_missing)

    # Bin fixtures by model type
    binned_fixtures = {}
    for model_type in model_map.keys():
        fixtures_of_type = [fixture for fixture in fixtures_settings if fixture['model'] == model_type]
        binned_fixtures[model_type] = fixtures_of_type

    for type_to_create in model_creation_order:
        fixtures_to_create = binned_fixtures[type_to_create]
        for fixture in fixtures_to_create:
            # Don't use update... calling save() will call signals which we need.
            model_name = fixture.pop("model", None)
            model = model_map.get(model_name)
            if not model:
                print(f"No support to update {model_name}")
                continue

            # If we have FK attrs we need to link those to actual objects before we save
            model_fk_settings = model_fk_map.get(model_name)

            fk_tuples = None
            if model_fk_settings:
                fk_tuples = extract_fk_objects(fixture, model_fk_settings)

            model_key = model_key_map.get(model_name)

            instance, created = model.objects.get_or_create(**{model_key: fixture[model_key]}, defaults=fixture)

            if created:
                print(f"Created {instance}")
            else:
                updated = False
                if hasattr(instance, "display"):
                    instance_display = instance.display
                    fixture_display = fixture.get("display", False)
                    print(f"setting display for {instance}: {instance_display} -> {fixture_display}")
                    instance.display = fixture_display
                    updated = True

                for attr, value in fixture.items():
                    if hasattr(instance, attr) and getattr(instance, attr) != value:
                        print(f"Changing {instance}: {attr}")
                        setattr(instance, attr, value)
                        updated = True

                if updated:
                    instance.save()
                    print(f"Updated {instance}  (display={getattr(instance, 'display', '')})")
                else:
                    print(f"No changes for {instance} (display={getattr(instance, 'display', '')}).")

            if fk_tuples:
                apply_fk_to_instance(instance, fk_tuples)


def apply_fk_to_instance(instance, fk_tuples):
    for attr, value in fk_tuples:
        if isinstance(value, list):
            update_attr = getattr(instance, attr)
            update_attr.set(value)
        else:
            setattr(instance, attr, value)
    instance.save()


def fixture_pk_to_key(fixtures, model_name, pk_search, key_attr):
    fixtures_of_type = [fixture for fixture in fixtures if fixture['model'] == model_name]
    fixture_with_pk = [fixture for fixture in fixtures_of_type if fixture["pk"] == pk_search]
    if len(fixture_with_pk) > 0:
        found_fixture = fixture_with_pk.pop()
        return found_fixture['fields'][key_attr]

    return None


def clean_fixtures(fixtures, skip_missing=False):
    # Remove time fields and related tables, licenses will need to be added later.
    exclude = ['created_at', 'updated_at', 'uid', 'thumbnail', 'user', "groups"]
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
                    new_fixture[field] = fixture_pk_to_key(fixtures, "core.attributeclass", value, "slug")
                if field == "license" and value:
                    new_fixture[field] = fixture_pk_to_key(fixtures, "jobs.license", value, "slug")
                if field == "providers" and value:
                    new_fixture[field] = [fixture_pk_to_key(fixtures, "jobs.dataprovider", provider_pk, "slug") for
                                          provider_pk in value]
                if field == "region" and value:
                    new_fixture[field] = fixture_pk_to_key(fixtures, "jobs.region", value, "name")
                if field == "users" and value:
                    users_values = [
                        getattr(try_get_existing_user(user_pk), "username", None) or fixture_pk_to_key(fixtures, "auth.user", user_pk,
                                                                                                       "username") for user_pk in value]
                    new_fixture[field] = users_values
            except Exception:
                print(f"The ID: {value} for {field} does not exist.")
                if not skip_missing:
                    raise
                else:
                    new_fixture[field] = None

        fixtures_settings.append(new_fixture)
    return fixtures_settings


def try_get_existing_user(user_pk):
    try:
        existing_user = User.objects.get(id=user_pk)
    except ObjectDoesNotExist:
        existing_user = None
    return existing_user

def get_object_by_key(model, key_attr, key):
    return model.objects.get(**{key_attr: key})


def extract_fk_objects(fixture, fk_attrs):
    if fk_attrs is None:
        return None

    fk_attr_items = fk_attrs.items()
    fk_tuples = []
    for attr, model in fk_attr_items:
        if attr not in fixture:
            continue

        django_model = model_map.get(model)
        key_attr = model_key_map.get(model)
        if isinstance(fixture[attr], list):
            fk_tuples.append((attr, [get_object_by_key(django_model, key_attr, key_value) for key_value in fixture[attr]]))
        else:
            if attr != "region":
                fk_tuples.append((attr, get_object_by_key(django_model, key_attr, fixture[attr])))
            else:
                fixture[attr] = get_object_by_key(django_model, key_attr, fixture[attr])

        if attr != "region":
            fixture.pop(attr, None)

    return fk_tuples


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    import django

    django.setup()
    from django.core.exceptions import ObjectDoesNotExist
    from eventkit_cloud.jobs.models import DataProvider, DataProviderType, License, Topic, Region, RegionalPolicy
    from eventkit_cloud.core.models import AttributeClass
    from django.contrib.auth.models import User

    model_map = {"jobs.license": License,
                 "jobs.dataprovider": DataProvider,
                 "core.attributeclass": AttributeClass,
                 "jobs.regionalpolicy": RegionalPolicy,
                 "jobs.region": Region,
                 "jobs.topic": Topic,
                 "auth.user": User}

    # Because of how some models reference others if we have certain fixtures in file they will need to be created first
    model_creation_order = ["auth.user", "jobs.license", "core.attributeclass", "jobs.dataprovider", "jobs.region",
                            "jobs.regionalpolicy",
                            "jobs.topic"]

    model_fk_map = {
        "jobs.dataprovider": {"license": "jobs.license", "attribute_class": "core.attributeclass"},
        "core.attributeclass": {"users": "auth.user"},
        "jobs.regionalpolicy": {"region": "jobs.region", "providers": "jobs.dataprovider"},
        "jobs.topic": {"providers": "jobs.dataprovider"}
    }

    model_key_map = {
        "auth.user": "username",
        "jobs.dataprovider": "slug",
        "jobs.region": "name",
        "jobs.regionalpolicy": "name",
        "jobs.topic": "slug",
        "jobs.license": "slug",
        "core.attributeclass": "slug"
    }

    parser = argparse.ArgumentParser(description='Load Fixtures for Data Providers.')

    parser.add_argument('file', help='The path to the fixture file')
    parser.add_argument('-s', '--skip', action='store_true', help='Skip missing foreign key relationships.')

    args = parser.parse_args()
    print("Updating providers...")
    update_providers(args.file, skip_missing=args.skip)
