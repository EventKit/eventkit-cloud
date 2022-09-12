import json
import os
import random
from sys import exc_info
import time

import django


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
django.setup()

from eventkit_cloud.auth.models import OAuth
from eventkit_cloud.tasks.models import *
from eventkit_cloud.jobs.models import *
from eventkit_cloud.jobs.enumerations import GeospatialDataType
from django.db import connection, reset_queries
from django.contrib.auth.models import Group, User
from eventkit_cloud.core.models import update_all_users_with_attribute_class

NAME_FIELD = "NAME"
GEOJSON_FILEPATH = os.path.join(os.path.dirname(__name__), "adhoc/cities.geojson")
if not os.path.exists(GEOJSON_FILEPATH):
    raise Exception(f"Could not find a geojson file at {GEOJSON_FILEPATH}")
PREFIX = "test-load-"
BATCH_SIZE = 200


def get_fptrs():
    # return FileProducingTaskResult.objects.filter(filename__contains=PREFIX)
    return FileProducingTaskResult.objects.filter(directory=PREFIX)


def get_user_downloads():
    return UserDownload.objects.filter(downloadable__in=get_fptrs())


def get_data_providers():
    return DataProvider.objects.prefetch_related("export_provider_type__supported_formats").filter(
        slug__contains=PREFIX)


def get_jobs():
    return Job.objects.filter(name__contains=PREFIX)


def get_runs():
    return ExportRun.objects.filter(job__name__contains=PREFIX)


def get_dptrs():
    return DataProviderTaskRecord.objects.filter(run__job__name__contains=PREFIX)


def get_etrs():
    return ExportTaskRecord.objects.filter(export_provider_task__run__job__name__contains=PREFIX)


def get_runs():
    return ExportRun.objects.filter(job__name__contains=PREFIX)


def get_users():
    return User.objects.filter(username__contains=PREFIX)


def get_topics():
    return Topic.objects.filter(slug__contains=PREFIX)


def get_attribute_classes():
    return AttributeClass.objects.filter(slug__contains=PREFIX)


def get_oauths(users):
    return OAuth.objects.filter(user__in=users)


def cleanup():
    logger.info("Removing old test data.")
    downloads = get_user_downloads()
    downloads._raw_delete(downloads.db)
    etrs = get_etrs()
    etrs._raw_delete(etrs.db)
    fptrs = get_fptrs()
    fptrs._raw_delete(fptrs.db)
    dtrs = get_dptrs()
    dtrs._raw_delete(dtrs.db)
    runs = get_runs()
    runs._raw_delete(runs.db)
    jobs = get_jobs()
    user_activity = UserJobActivity.objects.filter(job__in=jobs)
    user_activity._raw_delete(user_activity.db)
    jobs._raw_delete(jobs.db)
    topics = get_topics()
    # topics._raw_delete(topics.db)
    topics.delete()
    providers = get_data_providers()
    providers._raw_delete(providers.db)
    groups = Group.objects.filter(name__contains=PREFIX)
    groups._raw_delete(groups.db)
    attribute_classes = get_attribute_classes()
    # attribute_classes._raw_delete(attribute_classes.db)
    attribute_classes.delete()
    users = get_users()
    oauths = get_oauths(users)
    oauths._raw_delete(oauths.db)
    users._raw_delete(users.db)


def get_user_ids() -> list:
    return list(get_users().values_list('pk', flat=True))


def create_users(count):
    try:
        logger.info(f"Creating {count} Users")
        users = User.objects.bulk_create([
            User(username=f"{PREFIX}{count_value}",
                 email=f"user{count_value}@email.test", password='pass'
                 ) for count_value in range(count)
        ], batch_size=1000)

        users = OAuth.objects.bulk_create([
            OAuth(user=user, identification=f"{PREFIX}{count_value}",
                  commonname=f"{PREFIX}{count_value}", user_info={"group": f"{count%2}"})
            for count_value, user in enumerate(users)
        ], batch_size=1000)

    except Exception:
        logger.info("Failed to create all users.")


def create_groups(count):
    try:
        logger.info(f"Creating {count} Groups")
        Group.objects.bulk_create([
            Group(name=f"{PREFIX}{count_value}") for count_value in range(count)
        ], batch_size=1000)
    except Exception:
        logger.info("Failed to create all Groups.")


def batch_create(model, objects):
    # https://docs.djangoproject.com/en/4.0/ref/models/querysets/#bulk-create
    from itertools import islice
    counter = 0
    created_objects = []
    while True:
        batch = list(islice(objects, BATCH_SIZE))
        if not batch:
            break
        for object in model.objects.bulk_create(batch, BATCH_SIZE):
            created_objects += [object]
            yield object
        counter += len(batch)
        sys.stdout.write(f"\rCreated {counter} {str(model.__name__)}(s).")
        sys.stdout.flush()
    return created_objects


def get_random_geom(geojson_data):
    feature = random.choice(geojson_data['features'])
    geom = GEOSGeometry(json.dumps(feature['geometry']))
    geom = convert_polygon(geom)
    return feature['properties'][NAME_FIELD], geom


def get_job(geojson_data, user_ids):
    geom_name, geom = get_random_geom(geojson_data)
    the_geog = GEOSGeometry(geom)
    the_geom_webmercator = geom.transform(ct=3857, clone=True)
    return Job(name=f"{PREFIX}{geom_name}", description='Test description', user_id=random.choice(user_ids),
               the_geom=geom, the_geog=the_geog, the_geom_webmercator=the_geom_webmercator, json_tags=[])


def get_geojson_data(geojson_filepath):
    with open(geojson_filepath, 'rb') as geojson_file:
        return json.loads(geojson_file.read())


def create_runs(count):
    max_provider_per_run = 20
    data_providers = list(get_data_providers())
    if not data_providers:
        raise Exception("Can't create runs without test runs.")
    export_format_count = ExportFormat.objects.count()
    fptr_count = count * max_provider_per_run * export_format_count

    results = list(batch_create(FileProducingTaskResult,
                                (FileProducingTaskResult(filename=f"{PREFIX}-test.gpkg", directory=PREFIX, size=random.randint(10, 1000000) / 1000) for _ in range(fptr_count))))

    run_state = ["COMPLETED", "COMPLETED", "COMPLETED", "COMPLETED", "INCOMPLETE"]
    geojson_data = get_geojson_data(geojson_filepath=GEOJSON_FILEPATH)
    user_ids = get_user_ids()
    logger.info(f"Creating {count} jobs and runs.")
    jobs = batch_create(Job, (get_job(geojson_data, user_ids) for _ in range(count)))
    runs = batch_create(ExportRun, (ExportRun(job=job, user=job.user, status=random.choice(run_state)) for job in jobs))
    result_index = 0
    etr_count = 0
    for run in runs:
        dptrs = batch_create(DataProviderTaskRecord, (
            DataProviderTaskRecord(name=data_provider.name, provider=data_provider, display=True, run=run,
                                   status="COMPLETED") for data_provider in
            random.sample(data_providers, random.randint(1, min(len(data_providers), max_provider_per_run)))))
        for dptr in dptrs:
            etr = []
            for file_format in dptr.provider.export_provider_type.supported_formats.all():
                etr += [ExportTaskRecord(name=file_format.name,
                                         export_provider_task=dptr,
                                         display=True,
                                         status="SUCCESS",
                                         result=results[result_index])]
                result_index += 1
            etr_count += len(ExportTaskRecord.objects.bulk_create(etr, batch_size=BATCH_SIZE))
    logger.info("Cleaning up unused files.")
    empty_fptrs = get_fptrs().filter(export_task__isnull=True)
    empty_fptrs._raw_delete(empty_fptrs.db)
    logger.info(f"Created {etr_count} example files.")


def get_random_time(start, end):
    time_format = '%Y-%m-%d'  # Example 2022-01-31
    start_time = time.mktime(time.strptime(start, time_format))
    end_time = time.mktime(time.strptime(end, time_format))
    random_time = start_time + (random.random() * (end_time - start_time))
    return time.strftime(time_format, time.localtime(random_time))


def create_data_providers(count):
    data_types = [gdt.value for gdt in list(GeospatialDataType)]
    try:
        logger.info(f"Creating {count} DataProviders.")
        created_data_providers = []
        for provider in batch_create(DataProvider,
                                      (DataProvider(name=f"Product {i}", slug=f"{PREFIX}{i}", data_type=random.choice(data_types),
                                                    export_provider_type_id=1, display=True) for i in range(count))):
            created_data_providers += [provider]
        logger.info(f"Returning {created_data_providers} DataProviders.")
        return created_data_providers

    except Exception as e:
        logger.error(e, exc_info=True)


def create_downloads():
    user_ids = get_user_ids()
    # A number of users downloading from a datapack
    user_count = 10
    if not user_count:
        raise Exception(f"Can't create downloads without test users already created.")
    fptr_ids = list(get_fptrs().values_list("pk", flat=True))
    try:
        logger.info(f"Creating downloads associated with {len(fptr_ids)} task results.")
        for downloads in batch_create(UserDownload, (UserDownload(user_id=user_id, downloadable_id=fptr_id,
                                                                  downloaded_at=get_random_time("2000-01-01", "2022-07-22")) for fptr_id
                                                     in fptr_ids for user_id in random.sample(user_ids, random.randint(0, user_count)))):
            pass

    except Exception as e:
        logger.error(e)
    logger.info("Downloads created.")


def create_attribute_classes(count: int):
    try:
        logger.info(f"Creating {count} AttributeClass")
        for count_value in range(count):
            attrib = AttributeClass.objects.create(name=f"AttributeClass-{count_value}", slug=f"{PREFIX}-AttributeClass-{count_value}", complex=[f"{count_value%2}", "==", "group"])
            # attrib.save()
            logger.info(f"Updating users with attribute classes {attrib}")
            update_all_users_with_attribute_class(attrib)
    except Exception:
        logger.error("Failed to create all AttributeClass.", exc_info=True)


def divide_chunks(items: list, chunk_size: int):
    logger.info(f"Breaking up {items} into {chunk_size} chunk(s)")
    # looping till length items
    size = chunk_size or 1
    for i in range(0, len(items), size):
        out = items[i:i + size]
        logger.info(out)
        yield out


def create_topics(providers: list, count: int):
    logger.info(f"Setting topics with {providers}")
    for index, provider_chunk in enumerate(divide_chunks(providers, int(len(providers) / count))):
        topic = Topic.objects.create(name=f"Topic-{index}", slug=f"{PREFIX}-Topic-{index}", 
                                     topic_description=f"example description for {index}")
        logger.info(f"Setting {topic} with {provider_chunk}")
        topic.providers.set(provider_chunk)
        topic.save()


def create_test_data():
    reset_queries()
    count = 500  # A random number of products.
    create_users(count * 10)  # Random assumption that an average of 10 users came for each different product.
    create_attribute_classes(4)
    create_groups(int(count / 10))  # Every 100 users makes a group.
    providers = create_data_providers(count)
    create_topics(list(providers), 5)
    create_runs(count * 10)  # Random assumption that every user will make 10 exports on average.
    create_downloads()
    logger.info(f"Query count: {len(connection.queries)}")


if __name__ == "__main__":
    """
    To run this script you need a geojson file which you can define at the top of the script
    From an EK image run
    """
    import sys

    if "cleanup" in sys.argv:
        cleanup()
    else:
        cleanup()
        create_test_data()
