import copy
import glob
import json
import logging
import os
import pathlib
import pickle
import re
import signal
import tempfile
import time
import urllib.parse
import uuid
import xml.etree.ElementTree as ET
from concurrent import futures
from contextlib import contextmanager
from distutils import dir_util
from functools import reduce
from json import JSONDecodeError
from operator import itemgetter
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from xml.dom import minidom
from zipfile import ZipFile

import requests
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.core.cache import cache
from django.db import connection
from django.db.models import Q
from django.template.loader import render_to_string
from django.utils import timezone
from gdal_utils import convert, get_band_statistics, get_meta
from numpy import linspace
from requests import Response, Session

from eventkit_cloud.core.helpers import get_or_update_session, handle_auth
from eventkit_cloud.jobs.enumerations import GeospatialDataType, StyleType
from eventkit_cloud.jobs.models import StyleFile
from eventkit_cloud.tasks import DEFAULT_CACHE_EXPIRATION, set_cache_value
from eventkit_cloud.tasks.enumerations import UNSUPPORTED_CARTOGRAPHY_FORMATS, Directory
from eventkit_cloud.tasks.exceptions import FailedException
from eventkit_cloud.tasks.models import DataProviderTaskRecord, ExportRun, ExportRunFile, ExportTaskRecord
from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.utils.arcgis.arcgis_layer import ArcGISLayer
from eventkit_cloud.utils.generic import retry
from eventkit_cloud.utils.helpers import make_dirs
from eventkit_cloud.utils.mapproxy import get_chunked_bbox
from eventkit_cloud.utils.s3 import download_folder_from_s3
from eventkit_cloud.utils.types.django_helpers import ListOrQuerySet

CHUNK = 1024 * 1024 * 2  # 2MB chunks

logger = logging.getLogger(__name__)


def get_run_staging_dir(run_uid):
    """
    The run staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(run_uid))


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


def default_format_time(date_time):
    return date_time.strftime("%Y%m%d")


def normalize_name(name):
    if not name:
        return
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", "", name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", "_", s)
    return s.lower()


def get_export_task_record(export_task_record_uid: str) -> ExportTaskRecord:
    """
    Gets the ExportTaskRecord and related models used for export_tasks from the ExportTaskRecord.
    :param export_task_record_uid: The UID of an ExportTaskRecord.
    :return provider_slug: The associated provider_slug value.
    """
    return ExportTaskRecord.objects.select_related(
        "export_provider_task__provider", "export_provider_task__run__job"
    ).get(uid=export_task_record_uid)


def get_default_projection(supported_projections: List[int], selected_projections: List[int]) -> Optional[int]:
    """
    Gets a default projection of either 4326 or the first supported projection.
    """
    if 4326 in supported_projections and 4326 in selected_projections:
        return 4326
    for supported_projection in supported_projections:
        if supported_projection in selected_projections:
            return supported_projection
    return None


def get_export_filepath(
    stage_dir: str, export_task_record: ExportTaskRecord, descriptor: Optional[Union[int, str]], extension: str
):
    """
    Gets a filepath for an export.
    :param stage_dir: The staging directory to place files in while they process.
    :param export_task_record: The name of the job being processed.
    :param descriptor: A projection (or other description) as an int or string referencing an EPSG code
    (e.g. 4326 = EPSG:4326)
    :param extension: The file extension for the filename.
    """
    provider = export_task_record.export_provider_task.provider if export_task_record else None
    descriptors = "-".join(
        filter(
            None,
            [
                normalize_name(export_task_record.export_provider_task.run.job.name) if export_task_record else None,
                str(descriptor) if descriptor else None,
                provider.slug if provider else None,
                normalize_name(export_task_record.export_provider_task.run.job.event) if export_task_record else None,
                default_format_time(time),
                "eventkit",
                normalize_name(provider.label) if provider else None,
            ],
        )
    )
    if extension == "shp":
        filepath = os.path.join(stage_dir, f"{descriptors}_{extension}")
    else:
        filepath = os.path.join(stage_dir, f"{descriptors}.{extension}")

    return filepath


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), "static", "tasks", "styles")
    return get_file_paths(style_dir)


def generate_qgs_style(metadata, skip_formats=UNSUPPORTED_CARTOGRAPHY_FORMATS) -> Dict[str, str]:
    """
    Task to create QGIS project file with styles for osm.

    If a data_provider_task_record is provided a style file will be generated only for that, otherwise all of the
    data providers in the run will be added to the style file.
    :param metadata: A dict of metadata provided by get_metadata.
    :return: The path to the generated qgs file.
    """

    from eventkit_cloud.tasks.helpers import normalize_name

    cleaned_metadata = remove_formats(metadata, formats=UNSUPPORTED_CARTOGRAPHY_FORMATS)

    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(cleaned_metadata["run_uid"]))

    job_name = normalize_name(cleaned_metadata["name"].lower())

    provider_details = [provider_detail for provider_slug, provider_detail in cleaned_metadata["data_sources"].items()]

    if len(provider_details) == 1:
        style_file_name = "{0}-{1}-{2}.qgs".format(
            job_name,
            normalize_name(provider_details[0]["slug"]),
            default_format_time(timezone.now()),
        )
    else:
        style_file_name = "{0}-{1}.qgs".format(job_name, default_format_time(timezone.now()))

    style_file = os.path.join(stage_dir, style_file_name)

    context = {
        "job_name": job_name,
        "job_date_time": "{0}".format(timezone.now().strftime("%Y%m%d%H%M%S%f")[:-3]),
        "provider_details": provider_details,
        "bbox": metadata["bbox"],
        "has_raster": metadata["has_raster"],
        "has_elevation": metadata["has_elevation"],
        "has_vector": metadata["has_vector"],
    }

    with open(style_file, "wb") as open_file:
        open_file.write(
            render_to_string(
                "styles/Style.qgs",
                context=context,
            ).encode()
        )
    return {style_file: f"{job_name}.qgs"}


def get_arcgis_templates(metadata: dict) -> dict:
    """
    Gets the arcgis template file and if possible uses provided metadata to update the file.
    :param metadata: A dict of metadata provided by get_metadata.
    :return: A dict with the absolute path to the file and a relative path to desired location in the datapack.
    """
    cleaned_metadata = remove_formats(metadata, formats=UNSUPPORTED_CARTOGRAPHY_FORMATS)
    files = {}
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(cleaned_metadata["run_uid"]), Directory.ARCGIS.value)
    if not os.path.dirname(stage_dir):
        os.makedirs(stage_dir)

    with cd(os.path.join(os.path.dirname(__file__), "../utils/arcgis/templates")):
        for dirpath, _, arcgis_template_files in os.walk("./"):
            if not os.path.isdir(stage_dir):
                os.mkdir(stage_dir)
            for arcgis_template_file in arcgis_template_files:
                basename = os.path.basename(arcgis_template_file)
                template_file = os.path.join(stage_dir, basename)
                if os.path.splitext(basename)[-1] in [".lyrx"]:
                    with open(arcgis_template_file, "rb") as open_file:
                        template = json.load(open_file)
                    update_arcgis_json_extents(template, metadata["bbox"])
                    with open(template_file, "w") as open_file:
                        json.dump(template, open_file)
                    files[template_file] = os.path.join(
                        dirpath, Directory.ARCGIS.value, Directory.TEMPLATES.value, arcgis_template_file
                    )
                else:
                    if basename in ["create_mxd.py", "ReadMe.txt"]:
                        files[os.path.abspath(os.path.join(dirpath, arcgis_template_file))] = os.path.join(
                            Directory.ARCGIS.value, "{0}".format(basename)
                        )
                    # This bit is needed because its easier to test and reference the file with a standard extension.
                    elif basename in ["create_aprx.py"]:
                        files[os.path.abspath(os.path.join(dirpath, arcgis_template_file))] = os.path.join(
                            Directory.ARCGIS.value, "{0}.pyt".format(os.path.splitext(basename)[0])
                        )
                    else:
                        # Put the support files in the correct directory.
                        files[os.path.abspath(os.path.join(dirpath, arcgis_template_file))] = os.path.join(
                            Directory.ARCGIS.value, Directory.TEMPLATES.value, "{0}".format(basename)
                        )
    arcgis_metadata_file = os.path.join(stage_dir, "metadata.json")
    arcgis_metadata = get_arcgis_metadata(metadata)

    # Add layer files
    logger.error("Searching for layer_path")

    with open(arcgis_metadata_file, "w") as open_md_file:
        json.dump(arcgis_metadata, open_md_file)
    files[os.path.abspath(arcgis_metadata_file)] = os.path.join(Directory.ARCGIS.value, "metadata.json")

    return files


def update_arcgis_json_extents(document, bbox):
    extent = {
        "xmin": bbox[0],
        "ymin": bbox[1],
        "xmax": bbox[2],
        "ymax": bbox[3],
        "spatialReference": {"wkid": 4326, "latestWkid": 4326},
    }
    layer_definitions = document["layerDefinitions"]
    for layer_definition in layer_definitions:
        if layer_definition.get("featureTable"):
            layer_definition["featureTable"]["dataConnection"]["extent"] = extent
    return document


def remove_formats(metadata: dict, formats: List[str] = UNSUPPORTED_CARTOGRAPHY_FORMATS):
    """
    Used to remove formats from the metadata especially so that they don't show up in the cartography.
    :param data_sources: A dict of metadata provided by get_metadata.
    :param formats: A list of unsupported file extensions (i.e. .gpx)
    :return: The path to the generated qgs file.
    """
    # Create a new dict to not alter the input data.
    if metadata is None:
        metadata = {}
    cleaned_metadata = copy.deepcopy(metadata)
    for slug, data_source in cleaned_metadata.get("data_sources", {}).items():
        cleaned_metadata["data_sources"][slug] = data_source
        cleaned_files = []
        for file_info in cleaned_metadata["data_sources"][slug].get("files"):
            # Add all files that aren't in the remove list.
            if file_info.get("file_ext") not in formats:
                cleaned_files.append(file_info)
        cleaned_metadata["data_sources"][slug]["files"] = cleaned_files
    return cleaned_metadata


def get_human_readable_metadata_document(metadata) -> Dict[str, str]:
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
    return {metadata_file: "metadata.txt"}


def get_last_update(url, type, cert_info=None):
    """
    A wrapper to get different timestamps.
    :param url: The url to get the timestamp
    :param type: The type of services (e.g. osm)
    :param cert_info: Optionally a dict containing cert path and pass
    :return: The timestamp as a string.
    """
    if type == "osm":
        return get_osm_last_update(url, cert_info=cert_info)


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


def get_osm_last_update(url, **kwargs):
    """
    :param url: A path to the overpass api.
    :param cert_info: Optionally cert info if needed
    :return: The default timestamp as a string (2018-06-18T13:09:59Z)
    """
    try:
        timestamp_url = "{0}timestamp".format(url.rstrip("/").rstrip("interpreter"))
        session = get_or_update_session(**kwargs)
        response = session.get(timestamp_url)
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
        logger.info("Trying to terminate pid {0} with SIGTERM.".format(pid))
        os.kill(pid, signal.SIGTERM)
        time.sleep(5)

        logger.info("Trying to kill pid {0} with SIGKILL.".format(pid))
        os.kill(pid, signal.SIGKILL)
        time.sleep(1)

    except OSError:
        logger.info("{0} PID no longer exists.".format(pid))


def pickle_exception(exception):
    return pickle.dumps(exception, 0).decode()


def get_metadata(data_provider_task_record_uids: List[str], source_only=False) -> Dict[str, Any]:
    """
    A object to hold metadata about the run for the sake of being passed to various scripts for the creation of
    style files or metadata documents for within the datapack.

    This also creates a license file which is considered a part of the metadata and adds it to the "include_files"
    :param source_only: If enabled only the first task for the data_provider_task_record will be included in the
    metadata.  This is useful for generating style files for a single layer instead of redundant layers for each file.
    :param data_provider_task_record_uids: A list of Provider task uid string for either the run task which will add
    all of the provider tasks for the run or for a single data provider task.
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
            "uid": "0d08ddf6-35c1-464f-b271-75f6911c3f78",
            "layers": ["layer1", "layer2"]
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
    "url": "http://host.docker.internal/status/2010025c-6d61-4a0b-8d5d-ff9c657259eb"
    }
    """

    from eventkit_cloud.tasks.enumerations import TaskState
    from eventkit_cloud.tasks.export_tasks import create_zip_task

    data_provider_task_records = (
        DataProviderTaskRecord.objects.select_related("run__job")
        .prefetch_related("run__job__projections")
        .prefetch_related("provider")
        .filter(uid__in=data_provider_task_record_uids)
    )
    run = data_provider_task_records.first().run

    projections = []
    for _projection in run.job.projections.all():
        projections.append(_projection.srid)

    # To prepare for the zipfile task, the files need to be checked to ensure they weren't
    # deleted during cancellation.
    include_files = {}

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
        "has_raster": False,  # TODO: These are used for style groupings and seem frivolous.
        "has_elevation": False,
        "has_vector": False,
    }
    for data_provider_task_record in data_provider_task_records:
        data_provider = data_provider_task_record.provider
        provider_type = data_provider.export_provider_type.type_name
        conf = data_provider.config or dict()
        cert_info = conf.get("cert_info", None)
        metadata["data_sources"][data_provider_task_record.provider.slug] = {
            "uid": str(data_provider_task_record.uid),
            "slug": data_provider_task_record.provider.slug,
            "name": data_provider_task_record.name,
            "files": [],
            "type": data_provider_task_record.provider.get_data_type(),
            "description": str(data_provider.service_description).replace("\r\n", "\n").replace("\n", "\r\n\t"),
            "last_update": get_last_update(data_provider.url, provider_type, cert_info=cert_info),
            "metadata": get_metadata_url(data_provider.url, provider_type),
            "copyright": data_provider.service_copyright,
            "layers": list(data_provider.layers.keys()),
            "level_from": data_provider.level_from,
            "level_to": data_provider.level_to,
        }
        if (
            metadata["data_sources"][data_provider_task_record.provider.slug].get("type")
            == GeospatialDataType.RASTER.value
        ):
            metadata["has_raster"] = True
        if (
            metadata["data_sources"][data_provider_task_record.provider.slug].get("type")
            == GeospatialDataType.ELEVATION.value
        ):
            metadata["has_elevation"] = True
        if metadata["data_sources"][data_provider_task_record.provider.slug].get("type") in [
            GeospatialDataType.VECTOR.value,
            "osm",
            "nome",
        ]:  # TODO: handle osm generically like vector layers
            metadata["has_vector"] = True

        if data_provider_task_record.preview is not None:
            include_files[
                data_provider_task_record.preview.get_file_path(staging=True)
            ] = data_provider_task_record.preview.get_file_path(archive=True)

        # Only include tasks with a specific projection in the metadata.
        # TODO: Refactor to make explicit which files are included in map documents.
        query = reduce(lambda q, value: q | Q(name__icontains=value), projections, Q())
        export_tasks_query = data_provider_task_record.tasks.filter(query)
        if source_only:
            export_tasks: ListOrQuerySet[ExportTaskRecord] = [export_tasks_query.first()]
        else:
            export_tasks = export_tasks_query
        for export_task in export_tasks:

            if TaskState[export_task.status] in TaskState.get_incomplete_states():
                continue

            try:
                staging_filepath = export_task.result.get_file_path(staging=True)
                archive_filepath = export_task.result.get_file_path(archive=True)
            except Exception:
                continue

            current_files = metadata["data_sources"][data_provider_task_record.provider.slug]["files"]

            if staging_filepath not in map(itemgetter("full_file_path"), current_files):
                # Only include files relevant to the user that we can actually add to the carto.
                if export_task.display and ("project file" not in export_task.name.lower()):
                    pattern = re.compile(".*EPSG:(?P<projection>3857|4326).*$")
                    matches = pattern.match(export_task.name)
                    projection = "4326"
                    if matches:
                        projection = pattern.match(export_task.name).groupdict().get("projection")
                    file_data = {
                        "file_path": archive_filepath,
                        "full_file_path": staging_filepath,
                        "file_ext": os.path.splitext(staging_filepath)[1],
                        "projection": projection,
                    }
                    if (
                        metadata["data_sources"][data_provider_task_record.provider.slug].get("type")
                        == GeospatialDataType.ELEVATION.value
                    ):
                        # Get statistics to update ranges in template.
                        try:
                            band_stats = get_band_statistics(staging_filepath)
                            logger.info("Band Stats {0}: {1}".format(staging_filepath, band_stats))
                            file_data["band_stats"] = band_stats
                            # Calculate the value for each elevation step (of 16)
                            try:
                                steps = linspace(band_stats[0], band_stats[1], num=16)
                                file_data["ramp_shader_steps"] = list(map(int, steps))
                            except TypeError:
                                file_data["ramp_shader_steps"] = None
                        except Exception:
                            # TODO: Allow file paths for vszip or extract zip data.
                            file_data["ramp_shader_steps"] = None

                    metadata["data_sources"][data_provider_task_record.provider.slug]["files"] += [file_data]

            if not os.path.isfile(staging_filepath):
                logger.error("Could not find file {0} for export {1}.".format(staging_filepath, export_task.name))
                logger.error(f"Contents of directory: {os.listdir(os.path.dirname(staging_filepath))}")
                continue
            # Exclude zip files created by zip_export_provider
            if not export_task.name == create_zip_task.name:
                include_files[staging_filepath] = archive_filepath

        # add the license for this provider if there are other files already
        if include_files:
            try:
                include_files.update(create_license_file(data_provider_task_record))
                try:
                    # TODO: organize this better, maybe a standard layer file in the TaskBuilder.
                    if provider_type == "arcgis-feature":
                        include_files.update(create_arcgis_layer_file(data_provider_task_record, metadata))
                except Exception:
                    logger.error("Failed to create arcgis layer.", exc_info=True)
            except FileNotFoundError:
                # This fails if run at beginning of run.
                pass

        metadata["include_files"] = include_files
    return metadata


def create_arcgis_layer_file(data_provider_task_record: DataProviderTaskRecord, metadata: dict) -> dict[str, str]:
    file_info = metadata["data_sources"][data_provider_task_record.provider.slug]["files"][0]
    layer_filepath_stage = str(
        pathlib.Path(file_info["full_file_path"]).parent.joinpath(f"{data_provider_task_record.provider.slug}.lyrx")
    )
    layer_filepath_archive = str(
        pathlib.Path(file_info["file_path"]).parent.joinpath(f"{data_provider_task_record.provider.slug}.lyrx")
    )

    metadata["data_sources"][data_provider_task_record.provider.slug]["layer_file"] = layer_filepath_archive
    doc = None
    try:
        style_file = data_provider_task_record.provider.styles.get(style_type=StyleType.ARCGIS.value)
        style_info = json.loads(style_file.file.read())
        doc = update_style_file_path(style_info, os.path.basename(file_info["file_path"]))
    except (StyleFile.DoesNotExist, FileNotFoundError):
        logger.info("No style file for %s", data_provider_task_record.provider.name)
    except (TypeError, json.decoder.JSONDecodeError):
        logger.info(
            "Could not properly read or decode style file %s",
        )
    if not doc:
        service_capabilities = data_provider_task_record.provider.get_service_client().get_capabilities()
        arcgis_layer = ArcGISLayer(
            data_provider_task_record.provider.slug, service_capabilities, os.path.basename(file_info["file_path"])
        )
        try:
            doc = arcgis_layer.get_cim_layer_document()
        except Exception:
            logger.info(service_capabilities)
            raise

    with open(layer_filepath_stage, "w") as layer_file:
        layer_file.write(json.dumps(doc))
    return {layer_filepath_stage: layer_filepath_archive}


def update_style_file_path(style_info, file_path):
    wcs = "AUTHENTICATION_MODE=OSA;DATABASE=" + file_path
    try:
        for layer in style_info["layerDefinitions"]:
            if layer["type"] in ["CIMFeatureLayer"]:
                layer["featureTable"]["dataConnection"]["workspaceConnectionString"] = wcs
        return style_info
    except ValueError:
        return


def get_arcgis_metadata(metadata):
    """
    A way to add or remove information which will be used by the arcgis script.
    :param metadata: A metadata dict returned from get_metadata
    :return: A metadata dict to be provided within the datapack.
    """
    arcgis_metadata = remove_formats(metadata, formats=UNSUPPORTED_CARTOGRAPHY_FORMATS)

    # remove files which reference the server directories.
    arcgis_metadata.pop("include_files")
    for data_source, data_source_values in arcgis_metadata["data_sources"].items():
        for file_details in data_source_values["files"]:
            file_details.pop("full_file_path", "")

    return arcgis_metadata


def get_all_rabbitmq_objects(api_url: str, rabbit_class: str) -> dict:
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
        response = requests.get(url, params=params)
        objects_page = response.json()
        rabbit_objects = objects_page.get("items")
        pages = objects_page.get("page_count", 0)
        for page in range(2, pages + 1):
            logger.info(f"Getting page: {page} of {pages} for {rabbit_class}")
            params["page"] = page
            response = requests.get(url, params=params)
            if response.ok:
                rabbit_objects += response.json()["items"]
            else:
                raise Exception(f"Failed to fetch {rabbit_class}")
        return list_to_dict(rabbit_objects, "name")
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
                    logger.info(f"Could not remove {rabbit_class} {object_name}: {res.content}")  # type: ignore
            else:
                logger.info(f"Cannot remove {rabbit_class}: {rabbit_object}")
                if consumers:
                    logger.info(f"There are {consumers} consumers")
                if messages:
                    logger.info(f"There are {messages} messages")


def get_message_count(queue_name: str, message_type: str = "messages") -> int:
    """
    :param queue_name: The queue that you want to check messages for.
    :param message_type: The type of message you want.  e.g. messages or messages_ready
    :return: An integer count of pending messages.
    """
    broker_api_url = settings.CELERY_BROKER_API_URL
    queue_class = "queues"

    for queue in get_all_rabbitmq_objects(broker_api_url, queue_class):
        if queue.get("name") == queue_name:
            try:
                return queue.get(message_type, 0)
            except Exception as e:
                logger.info(e)

    logger.info(f"Cannot find queue named {queue_name}, returning 0 messages.")
    return 0


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


def add_export_run_files_to_zip(zipfile, run_zip_file):
    """
    Add additional files stored in ExportRunFile objects to a zipfile.
    """
    if not os.path.exists(settings.EXPORT_RUN_FILES):
        os.makedirs(settings.EXPORT_RUN_FILES)

    export_run_files = ExportRunFile.objects.all()
    for export_run_file in export_run_files:
        run_zip_file.message = f"Adding {export_run_file.file.name} to zip archive."
        export_run_file_path = os.path.join(settings.EXPORT_RUN_FILES, export_run_file.file.name)

        request = requests.get(export_run_file.file.url)
        with open(export_run_file_path, "wb+") as file:
            file.write(request.content)

        extra_directory = export_run_file.directory or ""
        if export_run_file.provider:
            arcname = os.path.join("data", export_run_file.provider.slug, extra_directory, export_run_file.file.name)
            zipfile.write(export_run_file_path, arcname=arcname)
        else:
            arcname = os.path.join(extra_directory, export_run_file.file.name)
            zipfile.write(export_run_file_path, arcname)


def get_data_package_manifest(metadata: dict, ignore_files: list) -> str:
    """
    Uses a metadata to generate a manifest file.

    <MissionPackageManifest version="2">
       <Configuration>
          <Parameter name="uid" value="<UID>"/>
          <Parameter name="name" value="<Name>"/>
       </Configuration>
       <Contents>
          <Content ignore="false" zipEntry="<file_path>">
             <Parameter name="contentType" value="External Native Data"/>
          </Content>
       </Contents>
    </MissionPackageManifest>

    :param metadata: A dict of run contents.
    :param ignore_files: A list of files to ignore.
    :return: File path to manifest file.
    """
    from eventkit_cloud.tasks.helpers import normalize_name

    # Placeholder to add unsupported formats.
    cleaned_metadata = remove_formats(metadata, formats=[])

    if cleaned_metadata:
        run_uid = cleaned_metadata.get("run_uid")
        job_name = normalize_name(cleaned_metadata["name"].lower())
    else:
        run_uid = uuid.uuid4()
        job_name = "DataPack"

    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    root = ET.Element("MissionPackageManifest", attrib={"version": "2"})

    # Set up configuration
    configuration = ET.SubElement(root, "Configuration")
    ET.SubElement(configuration, "Parameter", attrib={"name": "uid", "value": run_uid})
    # use the first 30 characters from the name
    ET.SubElement(configuration, "Parameter", attrib={"name": "name", "value": job_name[:30]})

    # Add contents
    contents = ET.SubElement(root, "Contents")
    for data_source_slug, data_source_info in cleaned_metadata.get("data_sources", {}).items():
        data_source_type = data_source_info["type"]
        for data_file in data_source_info["files"]:
            file_path = os.path.relpath(data_file["file_path"])
            content = ET.SubElement(contents, "Content", attrib={"ignore": "false", "zipEntry": file_path})
            if data_source_type == GeospatialDataType.RASTER.value:
                # Let application know that this is raster data.
                ET.SubElement(content, "Parameter", attrib={"name": "contentType", "value": "External Native Data"})
    # Ignore contents
    for data_file in ignore_files:
        file_path = os.path.relpath(data_file)
        ET.SubElement(contents, "Content", attrib={"ignore": "true", "zipEntry": file_path})

    ET.SubElement(contents, "Content", attrib={"ignore": "false", "zipEntry": os.path.join("manifest", "manifest.xml")})

    # Pretty print using xml dom
    manifest_file = os.path.join(stage_dir, "manifest.xml")
    manifest = minidom.parseString(ET.tostring(root)).toprettyxml(indent="   ")

    # Strip the header (and newline) that minidom forces.  Consider lxml in future.
    manifest = "\n".join(manifest.split("\n")[1:-1])

    if not os.path.isdir(os.path.dirname(manifest_file)):
        os.makedirs(os.path.dirname(manifest_file))

    with open(manifest_file, "w") as open_file:
        open_file.write(manifest)
    return manifest_file


def merge_chunks(
    output_file,
    layer_name,
    task_uid: str,
    bbox: list,
    stage_dir: str,
    base_url: str,
    task_points=100,
    feature_data=False,
    level=15,
    distinct_field=None,
    session=None,
    dst_srs: int = 4326,
    service_description: dict = None,
    *args,
    **kwargs,
):
    session = get_or_update_session(session=session, *args, **kwargs)
    # mypy complains when keyword arguments are passed alongside a **kwargs
    # it believes that session could be getting passed in twice (it could, but shouldn't)
    chunks = download_chunks(
        task_uid,
        bbox,
        stage_dir,
        base_url,
        task_points,
        feature_data,
        layer_name=layer_name,
        level=level,
        session=session,
        service_description=service_description,
        *args,
        **kwargs,
    )  # type: ignore
    task_process = TaskProcess(task_uid=task_uid)
    try:
        out = convert(
            # boundary=bbox,
            input_files=chunks,
            output_file=output_file,
            layer_name=layer_name,
            driver="gpkg",
            dst_srs=dst_srs,
            # Access_mode:
            #   Append will fail silently if layer doesn't exist.
            #   Update will fail if layer DOES exist, since this request should be for a new layer,
            #   update should be fine.
            access_mode="append",
            distinct_field=distinct_field,
            executor=task_process.start_process,
        )
        return out
    except Exception:
        logger.error("Failed to convert %s in merge_chunks", chunks, exc_info=True)


def download_chunks_concurrently(layer, task_points, feature_data, *args, **kwargs):
    # Session is not threadsafe https://github.com/psf/requests/issues/2766.
    # We can create a new session and this should be ok to use, but will require more overhead.
    logger.debug("download_chunks_concurrently using *args %s and **kwargs %s", args, kwargs)
    session = get_or_update_session(*args, **kwargs)
    base_path = layer.get("base_path")
    if not os.path.exists(base_path):
        os.mkdir(base_path)
    merge_chunks(
        output_file=layer.get("path"),
        layer_name=layer.get("layer_name"),
        src_srs=layer.get("src_srs"),
        task_uid=layer.get("task_uid"),
        bbox=layer.get("bbox"),
        stage_dir=base_path,
        base_url=layer.get("url"),
        cert_info=layer.get("cert_info"),
        task_points=task_points,
        feature_data=feature_data,
        level=layer.get("level"),
        distinct_field=layer.get("distinct_field"),
        service_description=layer.get("service_description"),
        session=session,
    )


def download_concurrently(layers: list, concurrency=None, feature_data=False, *args, **kwargs):
    """
    Function concurrently downloads data from a given list URLs and download paths.
    """

    try:
        executor = futures.ThreadPoolExecutor(max_workers=concurrency)

        # Get the total number of task points to compare against current progress.
        task_points = len(layers) * 100

        futures_list = [
            # mypy thinks that this incorrectly passes layer, task_points, feature_data twice
            executor.submit(
                download_chunks_concurrently,
                layer=layer,
                task_points=task_points,
                feature_data=feature_data,
                *args,
                **kwargs,
            )  # type: ignore
            for layer in layers
        ]
        futures.wait(futures_list)

        # result() is called for all futures so that any exception raised within is propagated to the caller.
        [ftr.result() for ftr in futures_list]

    except Exception as e:
        logger.error(f"Unable to execute concurrent downloads: {e}")
        raise e

    return layers


def get_zoom_level_from_scale(scale: Optional[int], limit: int = 20) -> int:
    zoom_level_scale: float = 559082264
    zoom_level: int = 0
    if not scale:
        return 10
    while zoom_level_scale > scale:
        zoom_level_scale = zoom_level_scale / 2
        zoom_level += 1
        if zoom_level == limit:
            break
    return zoom_level


def parse_arcgis_feature_response(file_path: str) -> dict:
    with open(file_path) as f:
        try:
            json_response = json.loads(f.read())
        except JSONDecodeError:
            logger.error("Unable to read JSON from file")
            logger.info("The file contents are:")
            logger.info(f.read())
            raise

        if json_response.get("error"):
            logger.error(json_response)
            raise Exception("The service did not receive a valid response.")

        for field_name in ["features", "fields"]:
            if field_name not in json_response:
                # If no features are returned it would be good to let user know, but failing and retrying here
                # doesn't seem to be the best approach.
                # Without features and fields gdal will blow up.
                json_response[field_name] = []
    return json_response


@retry
def download_arcgis_feature_data(
    task_uid: str,
    input_url: str,
    out_file: str,
    task_points: int = 100,
    session: Session = None,
    service_description: dict = None,
    *args,
    **kwargs,
):
    # This function is necessary because ArcGIS servers often either
    # respond with a 200 status code but also return an error message in the response body,
    # or redirect to a parent URL if a resource is not found.

    logger.debug("Downloading feature data for %s", task_uid)
    if not session:
        session = get_or_update_session(session, *args, **kwargs)
    service_description = service_description or dict()
    pagination = service_description.get("advancedQueryCapabilities", {}).get("supportsPagination", False)
    result_record_count = service_description.get("maxRecordCount", 1000)
    json_response = None
    try:
        count_response = session.get(f"{input_url}&returnCountOnly=true").json()
        total_expected_features = count_response.get("count")
        if total_expected_features and int(total_expected_features):
            logger.info("Downloading %s features", total_expected_features)
        else:
            logger.info("Skipping request no features.")
            # Need to create and return a response template, so that the tables appear and don't cause "missing"
            # sources in the client software.
            json_response = {
                "displayFieldName": service_description.get("displayField") or "NAME",
                "fields": service_description.get("fields") or [],
                "fieldAliases": {
                    field.get("alias"): field.get("name") for field in service_description.get("fields") or {}
                },
                "spatialReference": {"wkid": (service_description.get("sourceSpatialReference") or {}).get("wkid")},
                "geometryType": service_description.get("geometryType"),
                "features": [],
            }
        if pagination and total_expected_features:
            result_offset = 0
            exceeded_transfer_limit: bool = True
            while exceeded_transfer_limit:
                url_parts: dict = urllib.parse.urlparse(input_url)._asdict()
                query = urllib.parse.parse_qs(url_parts["query"])
                query.update({"resultOffset": [result_offset], "resultRecordCount": [result_record_count]})
                url_parts["query"] = urllib.parse.urlencode(query, doseq=True)
                input_url = urllib.parse.ParseResult(**url_parts).geturl()

                with tempfile.NamedTemporaryFile(mode="w+b") as arcgis_response_file:
                    download_data(
                        task_uid, input_url, arcgis_response_file.name, session=session, task_points=task_points
                    )
                    feature_response = parse_arcgis_feature_response(arcgis_response_file.name)
                    if not json_response:
                        json_response = copy.deepcopy(feature_response)

                    json_response["features"].extend(feature_response["features"])
                    result_offset = result_offset + result_record_count
                    exceeded_transfer_limit = bool(feature_response.get("exceededTransferLimit"))
        if not json_response:
            download_data(task_uid, input_url, out_file, session=session, task_points=task_points)
            json_response = parse_arcgis_feature_response(out_file)
        with open(out_file, "w") as f:
            json.dump(json_response, f)
    except Exception as e:
        if json_response:
            logger.info(json_response)
        logger.error(f"Feature data download error: {e}")
        raise e
    #  Use prefix to disambiguate drivers, https://gdal.org/drivers/vector/esrijson.html#datasource
    esri_json_file = f"ESRIJSON:{out_file}"
    return esri_json_file


def download_chunks(
    task_uid: str,
    bbox: list[float],
    stage_dir: str,
    base_url: str,
    task_points=100,
    feature_data=False,
    layer_name=None,
    level=15,
    size=None,
    session=None,
    service_description=None,
    *args,
    **kwargs,
):
    tile_bboxes = get_chunked_bbox(bbox, size=size, level=level)
    chunks = []
    for _index, _tile_bbox in enumerate(tile_bboxes):
        # Replace bbox placeholder here, allowing for the bbox as either a list or tuple
        url = base_url.replace("BBOX_PLACEHOLDER", urllib.parse.quote(str([*_tile_bbox]).strip("[]")))
        if layer_name:
            base_name = f"{layer_name}-chunk-{_index}.json"
        outfile = os.path.join(stage_dir, base_name)
        download_function = download_arcgis_feature_data if feature_data else download_data
        downloaded_file = download_function(
            task_uid,
            url,
            outfile,
            task_points=(task_points * len(tile_bboxes)),
            service_description=service_description,
            session=session,
            *args,
            **kwargs,
        )
        if downloaded_file:
            chunks.append(downloaded_file)
    return chunks


def get_file_name_from_response(response: Response) -> str:
    """
    Creates an arbitary file name from a content-type for example content-type: 'application/json; charset=UTF-8'
    would return, 'download.json'.
    """
    filename = "download"
    logger.error(f"Response Headers:{response.headers.get('content-type', '')}")
    mimetype = response.headers.get("content-type", "").split(";")
    if mimetype:
        ext = mimetype[0].split("/")
        if ext:
            filename = f"{filename}.{ext[1]}"
    return filename


@retry
@handle_auth
def download_data(task_uid: str, input_url: str, out_file: str = None, session=None, task_points=100, *args, **kwargs):
    """
    Function for downloading data, optionally using a certificate.
    """

    response = None
    try:
        session = get_or_update_session(session=session, *args, **kwargs)
        response = session.get(input_url, stream=True)
        response.raise_for_status()

    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to get data from: {input_url}")
        if response:
            logger.error(response.status_code)
            logger.error(response.content)
        raise Exception("Failed to download data.") from e

    from audit_logging.file_logging import logging_open

    try:
        total_size = int(response.headers.get("content-length"))
    except (ValueError, TypeError):
        if response.content:
            total_size = len(response.content)
        else:
            raise Exception("Request failed to return any data.")

    try:
        if out_file:
            content_type = response.headers.get("content-type")
            if Path(out_file).suffix.replace(".", "") not in content_type:
                raise Exception("The returned data is not in the expected format.")
        else:
            out_file = os.path.join(get_run_staging_dir(task_uid), get_file_name_from_response(response))
            make_dirs(os.path.dirname(out_file))
    except Exception:
        logger.error("Unable to verify data type.")

    written_size = 0
    update_interval = total_size / 100
    start_points = cache.get_or_set(get_task_progress_cache_key(task_uid), 0, timeout=DEFAULT_CACHE_EXPIRATION)
    start_percent = (start_points / task_points) * 100

    logger.debug("Saving data to: %s", out_file)
    with logging_open(out_file, "wb") as file_:
        for chunk in response.iter_content(CHUNK):
            file_.write(chunk)
            written_size += CHUNK

            last_update = cache.get_or_set(get_last_update_cache_key(task_uid), 0)
            last_update += CHUNK
            cache.set(get_last_update_cache_key(task_uid), last_update, timeout=DEFAULT_CACHE_EXPIRATION)

            if last_update > update_interval:
                updated_points = int((last_update / total_size) * 100) if last_update < total_size else 100
                cache.incr(get_task_progress_cache_key(task_uid), updated_points)

                progress_points = cache.get(get_task_progress_cache_key(task_uid))
                progress = progress_points / task_points * 100 if progress_points < task_points else 100
                update_progress(task_uid, progress, subtask_percentage=100 / task_points, subtask_start=start_percent)

                cache.set(get_last_update_cache_key(task_uid), 0, timeout=DEFAULT_CACHE_EXPIRATION)

    if not os.path.isfile(out_file):
        raise Exception("Nothing was returned from the vector feature service.")

    return out_file


def get_task_points_cache_key(task_uid: str):
    return f"{task_uid}_task_points"


def get_task_progress_cache_key(task_uid: str):
    return f"{task_uid}_progress"


def get_last_update_cache_key(task_uid: str):
    return f"{task_uid}_mb_since_update"


def find_in_zip(
    zip_filepath: str,
    stage_dir: str,
    extension: str = None,
    archive_extension: str = "zip",
    matched_files: Optional[list] = None,
    extract: bool = False,
):
    """
    Function finds files within archives and returns their vsi path.
    """
    matched_files = matched_files or []
    with ZipFile(zip_filepath) as zip_file:
        files_in_zip = zip_file.namelist()
        extension = (extension or "").lower()
        for filepath in files_in_zip:
            file_path = Path(filepath)
            if extension and extension in file_path.suffix.lower() and file_path not in matched_files:
                if extract:
                    output_dest = Path(stage_dir).joinpath(file_path.name)
                    zip_file.extract(member=filepath, path=stage_dir)
                    os.rename(Path(stage_dir).joinpath(file_path), output_dest)
                    matched_files += [str(output_dest)]
                else:
                    matched_files += [f"/vsizip/{zip_filepath}/{filepath}"]
            elif not extension and file_path.suffix:
                file = f"/vsizip/{zip_filepath}/{filepath}"
                meta = get_meta(file)
                srs = meta["srs"] or None
                if srs:
                    matched_files += [file]

            if archive_extension in file_path.suffix:
                nested = Path(f"{stage_dir}/{filepath}")
                nested.parent.mkdir(parents=True, exist_ok=True)
                with open(nested, "wb") as f:
                    f.write(zip_file.read(filepath))
                matched_files += [
                    find_in_zip(str(nested.absolute()), stage_dir, extension=extension, matched_files=matched_files)
                ]

        return matched_files


def extract_metadata_files(zip_filepath: str, destination: str, extensions: list = None):
    """
    Function extract metadata files from archives.
    The function will look for any files that match the extensions that were provided,
    and will extract those files into a metadata directory.
    """
    metadata_extensions = extensions or [".md", ".txt", ".doc", ".docx", ".csv", ".xls", ".xlsx"]
    zip_file = ZipFile(zip_filepath)
    files_in_zip = zip_file.namelist()

    metadata_dir = Path(f"{destination}/metadata/")
    metadata_dir.mkdir(parents=True, exist_ok=True)

    for filepath in files_in_zip:
        file_path = Path(filepath)

        if file_path.suffix in metadata_extensions:
            zip_file.extract(filepath, path=metadata_dir)

    return str(metadata_dir)


def get_celery_queue_group(run_uid=None, worker=None):
    # IF CELERY_GROUP_NAME is specifically set then that makes most sense to use it.
    if getattr(settings, "CELERY_GROUP_NAME"):
        return getattr(settings, "CELERY_GROUP_NAME")
    if getattr(settings, "CELERY_SCALE_BY_RUN"):
        if not run_uid:
            logger.warning("Attempted to get a celery_queue_group for scaling by run without a run uid.")
        else:
            # Celery group names have to be strings, make sure we always return the UID as a string.
            return str(run_uid)
    # If scaling by run we need to keep tasks for a specific run organized together.
    if not worker:
        raise Exception(
            "Attempted to get a group name without setting CELERY_GROUP_NAME "
            "using a RUN_UID or passing a worker explicitly."
        )
    return worker


def get_geometry(bbox: list, selection: str = None) -> GEOSGeometry:
    geom = GEOSGeometry(Polygon.from_bbox(bbox))
    if selection:
        try:
            with open(selection, "r") as geojson:
                geom = GEOSGeometry(geojson.read())
        except Exception as e:
            logger.error(e)
    return geom


def update_progress(
    task_uid,
    progress=None,
    subtask_percentage=100.0,
    subtask_start=0,
    estimated_finish=None,
    eta=None,
    msg=None,
):
    """
    Updates the progress of the ExportTaskRecord from the given task_uid.
    :param task_uid: A uid to reference the ExportTaskRecord.
    :param progress: The percent of completion for the task or subtask [0-100]
    :param subtask_percentage: is the percentage of the task referenced by task_uid the caller takes up. [0-100]
    :param subtask_start: is the beginning of where this subtask's percentage block beings [0-100]
                          (e.g. when subtask_percentage=0.0 the absolute_progress=subtask_start)
    :param estimated_finish: The datetime of when the entire task is expected to finish, overrides eta estimator
    :param eta: The ETA estimator for this task will be used to automatically determine estimated_finish
    :param msg: Message describing the current activity of the task
    """
    if task_uid is None:
        return

    if not progress and not estimated_finish:
        return

    subtask_percentage = subtask_percentage or 100.0
    subtask_start = subtask_start or 0

    if progress is not None:
        subtask_progress = min(progress, 100.0)
        absolute_progress = min(subtask_start + subtask_progress * (subtask_percentage / 100.0), 100.0)

    # We need to close the existing connection because the logger could be using a forked process which
    # will be invalid and throw an error.
    connection.close()

    if absolute_progress:
        set_cache_value(
            uid=task_uid,
            attribute="progress",
            model_name="ExportTaskRecord",
            value=absolute_progress,
        )
        if eta is not None:
            eta.update(absolute_progress / 100.0, dbg_msg=msg)  # convert to [0-1.0]

    if estimated_finish:
        set_cache_value(
            uid=task_uid,
            attribute="estimated_finish",
            model_name="ExportTaskRecord",
            value=estimated_finish,
        )
    elif eta is not None:
        # Use the updated ETA estimator to determine an estimated_finish
        set_cache_value(
            uid=task_uid,
            attribute="estimated_finish",
            model_name="ExportTaskRecord",
            value=eta.eta_datetime(),
        )


def create_license_file(data_provider_task_record: DataProviderTaskRecord) -> Dict[str, str]:
    # checks a DataProviderTaskRecord's license file and adds it to the file list if it exists
    data_provider_license = data_provider_task_record.provider.license

    # DataProviders are not required to have a license
    if data_provider_license is None:
        return {}

    stage_path = Path(data_provider_task_record.tasks.first().result.get_file_path(staging=True)).parent
    archive_path = Path(data_provider_task_record.tasks.first().result.get_file_path(archive=True)).parent

    stage_license_path = stage_path.joinpath("{0}.txt".format(normalize_name(data_provider_license.name)))
    archive_license_path = archive_path.joinpath("{0}.txt".format(normalize_name(data_provider_license.name)))

    with open(stage_license_path, "wb") as license_file:
        license_file.write(data_provider_license.text.encode())

    return {str(stage_license_path): str(archive_license_path)}


def download_run_directory(old_run: ExportRun, new_run: ExportRun):
    old_run_dir = get_run_staging_dir(old_run.uid)
    new_run_dir = get_run_staging_dir(new_run.uid)
    cache_key = str(new_run.uid)

    if not os.path.exists(new_run_dir):
        os.mkdir(new_run_dir)

    # Download the data from previous exports so we can rezip.
    if cache.add(cache_key, True, DEFAULT_CACHE_EXPIRATION):
        logger.info(f"Downloading run data {old_run.uid} -> {new_run.uid}")
        try:
            # TODO: Switch to copytree when migrating to 3.8 after dirs_exist_ok is added.
            dir_util.copy_tree(old_run_dir, new_run_dir)
        except Exception:
            logger.error(
                f"Could not copy run data from staging directory {old_run_dir} it might have already been removed."
            )
        download_folder_from_s3(str(old_run.uid), output_dir=new_run_dir)
        # TODO: Use ignore on copytree when switching to shutil in python 3.8.
        delete_files = glob.glob(os.path.join(new_run_dir, "run/*.zip"))
        for delete_file in delete_files:
            os.unlink(delete_file)
        cache.delete(cache_key)
    return new_run_dir


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def list_to_dict(list_to_convert: dict, key_name: str):
    """
    USed to convert a list of dictionaries to a dictionary using some common properties (i.e. name)
    Careful as data will be lost for duplicate entries, this assumes the list is a "set".
    :param list_to_convert: A list of dictionaries
    :param key_name: A value from each dict to use as the key.
    :return: A dictionary.
    """
    converted_dict = dict()
    if list_to_convert:
        for item in list_to_convert:
            converted_dict[item[key_name]] = item
    return converted_dict


def get_file_paths(directory):
    """
    Gets file paths with absolute file paths for copying the files and a relative file path for
    where the file should be located in the datapack relative to the directory.
    """
    paths = {}
    with cd(directory):
        for dirpath, _, filenames in os.walk("./"):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths


def split_bbox(bbox: list[float]) -> list[list[float]]:
    bboxes: list[list[float]] = []
    mid_x = ((bbox[2] - bbox[0]) / 2) + bbox[0]
    mid_y = ((bbox[3] - bbox[1]) / 2) + bbox[1]
    bboxes.append([bbox[0], bbox[1], mid_x, mid_y])
    bboxes.append([bbox[0], mid_y, mid_x, bbox[3]])
    bboxes.append([mid_x, mid_y, bbox[2], bbox[3]])
    bboxes.append([mid_x, bbox[1], bbox[2], mid_y])
    return bboxes
