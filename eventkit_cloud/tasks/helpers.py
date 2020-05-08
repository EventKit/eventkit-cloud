import copy
from enum import Enum
import logging
from operator import itemgetter
import os
import pickle
import re
import requests
import signal
from time import sleep

from numpy import linspace
import yaml


from django.conf import settings
from django.core.cache import cache
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q

from eventkit_cloud.utils import auth_requests
from eventkit_cloud.utils.gdalutils import get_band_statistics
from eventkit_cloud.utils.generic import cd, get_file_paths  # NOQA

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.tasks.exceptions import FailedException
from eventkit_cloud.tasks.models import DataProviderTaskRecord
import urllib.parse

logger = logging.getLogger()


class Directory(Enum):
    ARCGIS = "arcgis"
    DATA = "data"
    TEMPLATES = "templates"


PREVIEW_TAIL = "preview.jpg"


def get_run_staging_dir(run_uid):
    """
    The run staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(run_uid))


def get_run_download_dir(run_uid):
    """
    The run download dir is where all files are stored after they are processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_DOWNLOAD_ROOT.rstrip("\/"), str(run_uid))


def get_run_download_url(run_uid):
    """
    A URL path to the run data
    :param run_uid: The unique identifier for the run data.
    :return: The url context. (e.g. /downloads/123e4567-e89b-12d3-a456-426655440000)
    """
    return "{0}/{1}".format(settings.EXPORT_MEDIA_ROOT.rstrip("\/"), str(run_uid))


def get_provider_staging_dir(run_uid, provider_slug):
    """
    The provider staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique id for the run.
    :param provider_slug: The unique value to store the directory for the provider data.
    :return: The path to the provider directory.
    """
    run_staging_dir = get_run_staging_dir(run_uid)
    return os.path.join(run_staging_dir, provider_slug)


def get_provider_staging_preview(run_uid, provider_slug):
    """
    The provider staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique id for the run.
    :param provider_slug: The unique value to store the directory for the provider data.
    :return: The path to the provider directory.
    """
    run_staging_dir = get_run_staging_dir(run_uid)
    return os.path.join(run_staging_dir, provider_slug, PREVIEW_TAIL)


def get_download_filename(name, time, ext, additional_descriptors=None):
    """
    This provides specific formatting for the names of the downloadable files.
    :param name: A name for the file, typically the job name.
    :param additional_descriptors: Additional descriptors, typically the provider slug or project name
    or any list of items.
    :param time:  A python datetime object.
    :param ext: The file extension (e.g. .gpkg)
    :return: The formatted file name (e.g. Boston-example-20180711.gpkg)
    """
    # Allow numbers or strings.
    if not isinstance(additional_descriptors, (list, tuple)):
        additional_descriptors = [str(additional_descriptors)]
    return "{0}-{1}-{2}{3}".format(name, "-".join(additional_descriptors), default_format_time(time), ext)


def get_archive_data_path(provider_slug=None, file_name=None):
    """
    Gets a datapath for the files to be placed in the zip file.
    :param provider_slug: An optional unique value to store files.
    :param file_name: The name of a file.
    :return:
    """
    file_path = Directory.DATA.value
    if provider_slug:
        file_path = os.path.join(file_path, provider_slug)
    if file_name:
        file_path = os.path.join(file_path, file_name)
    return file_path


def default_format_time(date_time):
    return date_time.strftime("%Y%m%d")


def normalize_name(name):
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", "", name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", "_", s)
    return s.lower()


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), "static", "tasks", "styles")
    files = get_file_paths(style_dir)
    arcgis_dir = os.path.join(os.path.dirname(__file__), "arcgis")
    files = get_file_paths(arcgis_dir, files)
    return files


def create_license_file(provider_task):
    # checks a DataProviderTaskRecord's license file and adds it to the file list if it exists
    from eventkit_cloud.tasks.helpers import normalize_name

    data_provider_license = DataProvider.objects.get(slug=provider_task.slug).license

    # DataProviders are not required to have a license
    if data_provider_license is None:
        return

    license_file_path = os.path.join(
        get_provider_staging_dir(provider_task.run.uid, provider_task.slug),
        "{0}.txt".format(normalize_name(data_provider_license.name)),
    )

    with open(license_file_path, "wb") as license_file:
        license_file.write(data_provider_license.text.encode())

    return license_file_path


def generate_qgs_style(metadata):
    """
    Task to create QGIS project file with styles for osm.

    If a data_provider_task_record is provided a style file will be generated only for that, otherwise all of the
    data providers in the run will be added to the style file.
    :param metadata: A dict of metadata provided by get_metadata.
    :return: The path to the generated qgs file.
    """

    from eventkit_cloud.tasks.helpers import normalize_name

    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(metadata["run_uid"]))

    job_name = normalize_name(metadata["name"].lower())

    provider_details = [provider_detail for provider_slug, provider_detail in metadata["data_sources"].items()]

    if len(provider_details) == 1:
        style_file_name = "{0}-{1}-{2}.qgs".format(
            job_name, normalize_name(provider_details[0]["slug"]), default_format_time(timezone.now()),
        )
    else:
        style_file_name = "{0}-{1}.qgs".format(job_name, default_format_time(timezone.now()))

    style_file = os.path.join(stage_dir, style_file_name)

    with open(style_file, "wb") as open_file:
        open_file.write(
            render_to_string(
                "styles/Style.qgs",
                context={
                    "job_name": job_name,
                    "job_date_time": "{0}".format(timezone.now().strftime("%Y%m%d%H%M%S%f")[:-3]),
                    "provider_details": provider_details,
                    "bbox": metadata["bbox"],
                    "has_raster": metadata["has_raster"],
                    "has_elevation": metadata["has_elevation"],
                },
            ).encode()
        )
    return style_file


def get_human_readable_metadata_document(metadata):
    """

    :param metadata: A dictionary returned by get_metadata.
    :return: A filepath to a txt document.
    """
    from eventkit_cloud.tasks.helpers import normalize_name

    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(metadata["run_uid"]))

    metadata_file = os.path.join(stage_dir, "{0}_ReadMe.txt".format(normalize_name(metadata["name"])))

    with open(metadata_file, "wb") as open_file:
        open_file.write(
            render_to_string("styles/metadata.txt", context={"metadata": metadata})
            .replace("\r\n", "\n")
            .replace("\n", "\r\n")
            .encode()
        )
    return metadata_file


def get_last_update(url, type, cert_var=None):
    """
    A wrapper to get different timestamps.
    :param url: The url to get the timestamp
    :param type: The type of services (e.g. osm)
    :param cert_var: Optionally a slug if the service requires credentials.
    :return: The timestamp as a string.
    """
    if type == "osm":
        return get_osm_last_update(url, cert_var=cert_var)


def get_metadata_url(url, type):
    """
    A wrapper to get different timestamps.
    :param url: The url to get the timestamp
    :param type: The type of services (e.g. osm)
    :return: The timestamp as a string.
    """
    if type in ["wcs", "wms", "wmts"]:
        return "{0}?request=GetCapabilities".format(url.split("?")[0])
    else:
        return url


def get_osm_last_update(url, cert_var=None):
    """

    :param url: A path to the overpass api.
    :param cert_var: Optionally a slug if credentials are needed
    :return: The default timestamp as a string (2018-06-18T13:09:59Z)
    """
    try:
        timestamp_url = "{0}timestamp".format(url.rstrip("/").rstrip("interpreter"))
        response = auth_requests.get(timestamp_url, cert_var=cert_var)
        if response:
            return response.content.decode()
        raise Exception("Get OSM last update failed with {0}: {1}".format(response.status_code, response.content))
    except Exception as e:
        logger.warning(e)
        logger.warning("Could not get the timestamp from the overpass url.")
        return None


def progressive_kill(pid):
    """
    Tries to kill first with TERM and then with KILL.
    :param pid: The process ID to kill
    :return: None.
    """
    try:
        logger.info("Trying to kill pid {0} with SIGTERM.".format(pid))
        os.kill(pid, signal.SIGTERM)
        sleep(5)

        logger.info("Trying to kill pid {0} with SIGKILL.".format(pid))
        os.kill(pid, signal.SIGKILL)
        sleep(1)

    except OSError:
        logger.info("{0} PID no longer exists.".format(pid))


def pickle_exception(exception):
    return pickle.dumps(exception, 0).decode()


def get_metadata(data_provider_task_uid):
    """
    A object to hold metadata about the run for the sake of being passed to various scripts for the creation of
    style files or metadata documents for within the datapack.

    This also creates a license file which is considered a part of the metadata and adds it to the "include_files"
    :param data_provider_task_uid: A Provider task uid string for either the run task which will add all of the provider
    tasks for the run or for a single data provider task.
    :return: A dict containing the run metadata.

    Example:
    {
    "aoi": "GEOJSON representing the selected AOI."
    "bbox": [
        w, s, e, n
    ],
    "data_sources": {
        "osm": {
            "copyright": None,
            "description": "OpenStreetMap vector data provided in a custom thematic schema. \r\n\t\r\n\tData is
            grouped into separate tables (e.g. water, roads...).",
            "files": [{"file_path": "data/osm/test-osm-20181101.gpkg",
                       "file_ext": ".gpkg",
                       "full_file_path": "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269
                       /osm/test.gpkg",
                       "band_stats":
                       "ramp_shader_steps":}]
            "last_update": "2018-10-29T04:35:02Z\n",
            "metadata": "https://overpass-server.com/overpass/interpreter",
            "name": "OpenStreetMap Data (Themes)",
            "slug": "osm",
            "type": "osm",
            "uid": "0d08ddf6-35c1-464f-b271-75f6911c3f78"
        }
    },
    "date": "20181101",
    "description": "Test",
    "has_elevation": False,
    "has_raster": True,
    "include_files": [
        "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/test.gpkg",
        "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/osm_selection.geojson"
    ],
    "name": "test",
    "project": "Test",
    "projections": [4326, 3857]
    "run_uid": "7fadf34e-58f9-4bb8-ab57-adc1015c4269",
    "url": "http://cloud.eventkit.test/status/2010025c-6d61-4a0b-8d5d-ff9c657259eb"
    }
    """

    from eventkit_cloud.tasks.enumerations import TaskStates
    from eventkit_cloud.tasks.export_tasks import create_zip_task

    data_provider_task = DataProviderTaskRecord.objects.get(uid=data_provider_task_uid)

    run = data_provider_task.run

    projections = []
    for projection in run.job.projections.all():
        projections.append(projection.srid)

    if data_provider_task.name == "run":
        provider_tasks = run.provider_tasks.filter(~Q(name="run"))
    else:
        provider_tasks = [data_provider_task]

    # To prepare for the zipfile task, the files need to be checked to ensure they weren't
    # deleted during cancellation.
    include_files = list([])

    # A dict is used here to ensure that just one file per provider is added,
    # this should be updated when multiple formats are supported.
    metadata = {
        "name": normalize_name(run.job.name),
        "url": "{0}/status/{1}".format(getattr(settings, "SITE_URL"), str(run.job.uid)),
        "description": run.job.description,
        "project": run.job.event,
        "projections": projections,
        "date": timezone.now().strftime("%Y%m%d"),
        "run_uid": str(run.uid),
        "data_sources": {},
        "bbox": run.job.extents,
        "aoi": run.job.bounds_geojson,
        "has_raster": False,
        "has_elevation": False,
    }
    for provider_task in provider_tasks:
        data_provider = DataProvider.objects.get(slug=provider_task.slug)
        provider_type = data_provider.export_provider_type.type_name

        provider_staging_dir = get_provider_staging_dir(run.uid, provider_task.slug)
        conf = yaml.safe_load(data_provider.config) or dict()
        cert_var = conf.get("cert_var", data_provider.slug)
        metadata["data_sources"][provider_task.slug] = {
            "uid": str(provider_task.uid),
            "slug": provider_task.slug,
            "name": provider_task.name,
            "files": [],
            "type": get_data_type_from_provider(provider_task.slug),
            "description": str(data_provider.service_description).replace("\r\n", "\n").replace("\n", "\r\n\t"),
            "last_update": get_last_update(data_provider.url, provider_type, cert_var=cert_var),
            "metadata": get_metadata_url(data_provider.url, provider_type),
            "copyright": data_provider.service_copyright,
        }
        if metadata["data_sources"][provider_task.slug].get("type") == "raster":
            metadata["has_raster"] = True
        if metadata["data_sources"][provider_task.slug].get("type") == "elevation":
            metadata["has_elevation"] = True

        if provider_task.preview is not None:
            include_files += [get_provider_staging_preview(run.uid, provider_task.slug)]

        for export_task in provider_task.tasks.all():
            if TaskStates[export_task.status] in TaskStates.get_incomplete_states():
                continue

            try:
                filename = export_task.result.filename
            except Exception:
                continue
            full_file_path = os.path.join(provider_staging_dir, filename)
            current_files = metadata["data_sources"][provider_task.slug]["files"]

            if full_file_path not in map(itemgetter("full_file_path"), current_files):
                file_ext = os.path.splitext(filename)[1]
                # Only include files relavant to the user that we can actually add to the carto.
                if export_task.display and ("project file" not in export_task.name.lower()):
                    download_filename = get_download_filename(
                        os.path.splitext(os.path.basename(filename))[0],
                        timezone.now(),
                        file_ext,
                        additional_descriptors=provider_task.slug,
                    )
                    filepath = get_archive_data_path(provider_task.slug, download_filename)

                    file_data = {
                        "file_path": filepath,
                        "full_file_path": full_file_path,
                        "file_ext": file_ext,
                    }
                    if metadata["data_sources"][provider_task.slug].get("type") == "elevation":
                        # Get statistics to update ranges in template.
                        band_stats = get_band_statistics(full_file_path)
                        logger.info("Band Stats {0}: {1}".format(full_file_path, band_stats))
                        file_data["band_stats"] = band_stats
                        # Calculate the value for each elevation step (of 16)
                        try:
                            steps = linspace(band_stats[0], band_stats[1], num=16)
                            file_data["ramp_shader_steps"] = list(map(int, steps))
                        except TypeError:
                            file_data["ramp_shader_steps"] = None

                    metadata["data_sources"][provider_task.slug]["files"] += [file_data]

            if not os.path.isfile(full_file_path):
                logger.error("Could not find file {0} for export {1}.".format(full_file_path, export_task.name))
                continue
            # Exclude zip files created by zip_export_provider
            if not (full_file_path.endswith(".zip") and export_task.name == create_zip_task.name):
                include_files += [full_file_path]

        # add the license for this provider if there are other files already
        license_file = create_license_file(provider_task)
        if license_file:
            include_files += [license_file]

        metadata["include_files"] = include_files

    return metadata


def get_arcgis_metadata(metadata):
    """
    A way to add or remove information which will be used by the arcgis script.
    :param metadata: A metadata dict returned from get_metadata
    :return: A metadata dict to be provided within the datapack.
    """
    arcgis_metadata = copy.deepcopy(metadata)

    # remove files which reference the server directories.
    arcgis_metadata.pop("include_files")
    for data_source, data_source_values in arcgis_metadata["data_sources"].items():
        for file_details in data_source_values["files"]:
            file_details.pop("full_file_path", "")

    return arcgis_metadata


def get_data_type_from_provider(provider_slug: str) -> str:
    data_types = {
        "wms": "raster",
        "tms": "raster",
        "wmts": "raster",
        "wcs": "elevation",
        "wfs": "vector",
        "osm": "osm",
        "osm-generic": "vector",
        "arcgis-feature": "vector",
        "arcgis-raster": "raster",
    }
    data_provider = DataProvider.objects.get(slug=provider_slug)
    type_name = data_provider.export_provider_type.type_name
    type_mapped = data_types.get(type_name)
    if data_provider.slug.lower() == "nome":
        type_mapped = "nome"
    return type_mapped


def get_all_rabbitmq_objects(api_url: str, rabbit_class: str) -> list:
    """
    :param api_url: The http api url including authentication values.
    :param rabbit_class: The type of rabbitmq class (i.e. queues or exchanges) as a string.
    :return: An array of dicts with the desired objects.
    """
    url = f"{api_url.rstrip('/')}/{rabbit_class}"
    params = {"page": 1, "page_size": 100, "pagination": True}
    response = None
    try:
        logger.info(f"Getting all {rabbit_class}")
        response = requests.get(url, params=params).json()
        rabbit_objects = response["items"]
        pages = response.get("page_count", 0)
        for page in range(2, pages + 1):
            logger.info(f"Getting page: {page} of {pages} for {rabbit_class}")
            params["page"] = page
            response = requests.get(url, params=params)
            if response.ok:
                rabbit_objects += response.json()["items"]
            else:
                raise Exception(f"Failed to fetch {rabbit_class}")
        return rabbit_objects
    except Exception as e:
        if response:
            logger.error(response.content.decode())
        logger.error(e)
        raise e


def delete_rabbit_objects(api_url: str, rabbit_classes: list = ["queues"], force: bool = False) -> None:

    api_url = api_url.rstrip("/")
    for rabbit_class in rabbit_classes:
        for rabbit_object in get_all_rabbitmq_objects(api_url, rabbit_class):
            object_name = urllib.parse.quote(rabbit_object.get("name"), safe="")
            vhost = urllib.parse.quote(rabbit_object.get("vhost"), safe="")
            # Exchanges don't have consumers or messages, so deleting exchanges is always done.
            consumers = rabbit_object.get("consumers")
            messages = rabbit_object.get("messages")
            if not (messages or consumers) or force:
                object_url = f"{api_url}/{rabbit_class}/{vhost}/{object_name}"
                res = requests.delete(object_url)
                if res.ok:
                    logger.info(f"Removed {rabbit_class}: {object_name}")
                else:
                    logger.info(f"Could not remove {rabbit_class} {object_name}: {res.content}")
            else:
                logger.info(f"Cannot remove {rabbit_class}: {rabbit_object}")
                if consumers:
                    logger.info(f"There are {consumers} consumers")
                if messages:
                    logger.info(f"There are {messages} messages")


def get_message_count(queue_name: str) -> int:
    """
    :param queue_name: The queue that you want to check messages for.
    :return: An integer count of pending messages.
    """
    broker_api_url = getattr(settings, "BROKER_API_URL")
    queue_class = "queues"

    for queue in get_all_rabbitmq_objects(broker_api_url, queue_class):
        if queue.get("name") == queue_name:
            try:
                return queue.get("messages", 0)
            except Exception as e:
                logger.info(e)

    logger.info(f"Cannot find queue named {queue_name}, returning 0 messages.")
    return 0


def clean_config(config):
    """
    Used to remove adhoc service related values from the configuration.
    :param config: A yaml structured string.
    :return:
    """
    service_keys = ["cert_var", "cert_cred", "concurrency", "max_repeat", "overpass_query", "max_data_size"]

    conf = yaml.safe_load(config) or dict()

    for service_key in service_keys:
        conf.pop(service_key, None)

    return yaml.dump(conf)


def check_cached_task_failures(task_name, task_uid):
    """
    Used to check how many times this task has already attempted to run.
    If the task continues to fail, this will fire an exception to be
    handled by the task.
    """
    cache_key = f"{task_uid}-task-attempts"
    task_attempts = cache.get_or_set(cache_key, 0)
    task_attempts += 1
    cache.set(cache_key, task_attempts)
    if task_attempts > settings.MAX_TASK_ATTEMPTS:
        raise FailedException(task_name=task_name)
