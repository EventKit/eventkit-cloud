# -*- coding: utf-8 -*-
import copy
import json
import logging
import os
import re
import shutil
import socket
import sqlite3
import time
import traceback
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Type, Union, cast
from urllib.parse import urlencode
from zipfile import ZIP_DEFLATED, ZipFile

from audit_logging.file_logging import logging_open
from billiard.einfo import ExceptionInfo
from billiard.exceptions import SoftTimeLimitExceeded
from celery import signature
from celery.result import AsyncResult
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template
from django.utils import timezone
from gdal_utils import convert

from eventkit_cloud.celery import TaskPriority, app
from eventkit_cloud.core.helpers import NotificationLevel, NotificationVerb, sendnotification
from eventkit_cloud.feature_selection.feature_selection import FeatureSelection
from eventkit_cloud.jobs.enumerations import GeospatialDataType
from eventkit_cloud.jobs.models import DataProvider, MapImageSnapshot, ProxyFormat, clean_config
from eventkit_cloud.tasks import set_cache_value
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.exceptions import AreaLimitExceededError, CancelException, DeleteException
from eventkit_cloud.tasks.helpers import (
    add_export_run_files_to_zip,
    check_cached_task_failures,
    download_concurrently,
    download_data,
    extract_metadata_files,
    find_in_zip,
    generate_qgs_style,
    get_arcgis_templates,
    get_celery_queue_group,
    get_data_package_manifest,
    get_export_filepath,
    get_export_task_record,
    get_geometry,
    get_human_readable_metadata_document,
    get_metadata,
    get_provider_staging_dir,
    get_run_staging_dir,
    get_style_files,
    pickle_exception,
    progressive_kill,
    split_bbox,
    update_progress,
)
from eventkit_cloud.tasks.metadata import metadata_tasks
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportTaskException,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
)
from eventkit_cloud.tasks.task_base import EventKitBaseTask
from eventkit_cloud.tasks.task_process import TaskProcess
from eventkit_cloud.tasks.util_tasks import enforce_run_limit, kill_worker
from eventkit_cloud.utils import auth_requests, geopackage, mapproxy, overpass, pbf, wcs
from eventkit_cloud.utils.generic import retry
from eventkit_cloud.utils.geopackage import get_tile_table_names
from eventkit_cloud.utils.helpers import make_dirs
from eventkit_cloud.utils.qgis_utils import convert_qgis_gpkg_to_kml
from eventkit_cloud.utils.rocket_chat import RocketChat
from eventkit_cloud.utils.services.ogcapi_process import OGCAPIProcess
from eventkit_cloud.utils.services.types import LayersDescription
from eventkit_cloud.utils.stats.eta_estimator import ETA

BLACKLISTED_ZIP_EXTS = [".ini", ".om5", ".osm", ".lck", ".pyc"]

# Get an instance of a logger
logger = get_task_logger(__name__)


# ExportTaskRecord abstract base class and subclasses.
class ExportTask(EventKitBaseTask):
    """
    Abstract base class for export tasks.
    """

    # whether to abort the whole provider if this task fails.
    abort_on_error = False
    name = "ExportTask"
    display = True
    hide_download = True

    def __call__(self, *args, **kwargs) -> dict:
        task_uid = kwargs.get("task_uid")

        try:
            task = (
                ExportTaskRecord.objects.select_related("export_provider_task__run__job")
                .select_related("export_provider_task__provider")
                .get(uid=task_uid)
            )

            task.hide_download = self.hide_download

            check_cached_task_failures(task.name, task_uid)

            task.worker = socket.gethostname()
            task.save()

            run = task.export_provider_task.run
            run_dir = get_run_staging_dir(run.uid)

            run_task_record = run.data_provider_task_records.get(slug="run")

            # Returns the default only if the key does not exist in the dictionary.
            stage_dir = kwargs.get("stage_dir", get_provider_staging_dir(run_dir, run_task_record.slug))

            # Check for None because the above statement could return None.
            if stage_dir is None:
                stage_dir = get_provider_staging_dir(run_dir, run_task_record.slug)

            kwargs["stage_dir"] = stage_dir

            make_dirs(stage_dir)

            try:
                task_state_result = args[0].get("status")
            except (IndexError, TypeError):
                task_state_result = None

            self.update_task_state(task_uid=task_uid, task_status=task_state_result)

            if TaskState.CANCELED.value not in [
                task.status,
                task.export_provider_task.status,
                task.export_provider_task.run.status,
            ]:
                try:
                    self.update_task_state(task_uid=task_uid)
                    retval = super(ExportTask, self).__call__(*args, **kwargs)
                except SoftTimeLimitExceeded as e:
                    logger.error(e)
                    raise Exception("Task time limit exceeded. Try again or contact us.") from e

            """
            Update the successfully completed task as follows:

                1. update the time the task completed
                2. calculate the size of the output file
                3. calculate the download path of the export
                4. create the export download directory
                5. copy the export file to the download directory
                6. create the export task result
                7. update the export task status and save it
                """
            # If a task is skipped it will be successfully completed but it won't have a return value.
            # Something needs to be populated to notify the user and to skip the following steps.
            if not (retval and retval.get("result")):
                raise Exception("This task was skipped due to previous failures/cancellations.")

            try:
                add_metadata(task.export_provider_task.run.job, task.export_provider_task.provider, retval)
            except Exception:
                logger.error(traceback.format_exc())
                logger.error("Failed to add metadata.")

            # update the task
            if TaskState.CANCELED.value in [task.status, task.export_provider_task.status]:
                logging.info("Task reported on success but was previously canceled ", format(task_uid))
                username = None
                if task.cancel_user:
                    username = task.cancel_user.username
                raise CancelException(task_name=task.export_provider_task.name, user_name=username)

            task.progress = 100
            task.pid = -1
            # get the output
            file_path = retval["result"]

            # save the task and task result
            result = FileProducingTaskResult.objects.create(file=file_path)

            task.result = result
            task.status = TaskState.SUCCESS.value
            task.save()

            retval["status"] = TaskState.SUCCESS.value
            retval["file_producing_task_result_id"] = result.id
            return retval
        except CancelException:
            return {"status": TaskState.CANCELED.value}
        except Exception as e:
            tb = traceback.format_exc()
            logger.error("Exception in the handler for {}:\n{}".format(self.name, tb))
            from billiard.einfo import ExceptionInfo

            einfo = ExceptionInfo()
            return self.task_failure(e, task_uid, args, kwargs, einfo)

    @transaction.atomic
    def task_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Update the failed task as follows:

            1. pull out the ExportTaskRecord
            2. update the task status and finish time
            3. create an export task exception
            4. save the export task with the task exception
            5. run export_task_error_handler if the run should be aborted
        """
        # TODO: If there is a failure before the task was created this will fail to run.
        status = TaskState.FAILED.value
        try:
            export_task_record = ExportTaskRecord.objects.select_related("export_provider_task__run").get(uid=task_id)
            export_task_record.finished_at = timezone.now()
            export_task_record.save()
        except Exception:
            logger.error(traceback.format_exc())
            logger.error(
                "Cannot update the status of ExportTaskRecord object: no such object has been created for "
                "this task yet."
            )
            return {"status": status}
        ete = ExportTaskException(task=export_task_record, exception=pickle_exception(einfo))
        ete.save()
        if export_task_record.status == TaskState.CANCELED.value:
            status = TaskState.CANCELED.value
        export_task_record.status = status
        export_task_record.save()
        logger.debug("Task name: {0} failed, {1}".format(self.name, einfo))
        if self.abort_on_error:
            try:
                data_provider_task_record = export_task_record.export_provider_task
                fail_synchronous_task_chain(data_provider_task_record=data_provider_task_record)
                run = data_provider_task_record.run
                stage_dir = kwargs["stage_dir"]
                export_task_error_handler(run_uid=str(run.uid), task_id=task_id, stage_dir=stage_dir)
            except Exception:
                tb = traceback.format_exc()
                logger.error("Exception during handling of an error in {}:\n{}".format(self.name, tb))
        return {"status": status}

    def update_task_state(self, result=None, task_status=TaskState.RUNNING.value, task_uid=None):
        """
        Update the task state and celery task uid.
        Can use the celery uid for diagnostics.
        """
        result = result or {}

        try:
            task = ExportTaskRecord.objects.get(uid=task_uid)
            celery_uid = self.request.id
            if not celery_uid:
                raise Exception("Failed to save celery_UID")
            task.celery_uid = celery_uid
            task.save()
            result = parse_result(result, "status") or []
            if TaskState.CANCELED.value in [task.status, task.export_provider_task.status, result]:
                logging.info("canceling before run %s", celery_uid)
                task.status = TaskState.CANCELED.value
                task.save()
                raise CancelException(task_name=task.export_provider_task.name)
            # The parent ID is actually the process running in celery.
            task.pid = os.getppid()
            if task_status:
                task.status = task_status
                if TaskState[task_status] == TaskState.RUNNING:
                    task.export_provider_task.status = TaskState.RUNNING.value
                    task.export_provider_task.run.status = TaskState.RUNNING.value
            # Need to manually call to trigger method overrides.
            task.save()
            task.export_provider_task.save()
            task.export_provider_task.run.save()
            logger.debug("Updated task: {0} with uid: {1}".format(task.name, task.uid))
        except DatabaseError as e:
            logger.error("Updating task {0} state throws: {1}".format(task_uid, e))
            raise e


class AbortOnErrorTask(ExportTask):
    abort_on_error = True


class FormatTask(ExportTask):
    """
    A class to manage tasks which are desired output from the user, and not merely associated files or metadata.
    """

    name = "FormatTask"
    display = True
    hide_download = False


class ZipFileTask(FormatTask):
    def __call__(self, *args, **kwargs):
        run = ExportRun.objects.get(uid=kwargs["run_uid"])
        if kwargs["run_zip_file_uid"]:
            run_zip_file = RunZipFile.objects.get(uid=kwargs["run_zip_file_uid"])
            run_zip_file.run = run
        else:
            run_zip_file = RunZipFile.objects.create(run=run)
            kwargs["run_zip_file_uid"] = run_zip_file.uid

        retval = super(ZipFileTask, self).__call__(*args, **kwargs)

        if retval["status"] == "CANCELED":
            return retval

        if not kwargs["data_provider_task_record_uids"]:
            data_provider_task_record = DataProviderTaskRecord.objects.get(uid=kwargs["data_provider_task_record_uid"])
            data_provider_task_records = data_provider_task_record.run.data_provider_task_records.exclude(slug="run")
            data_provider_task_record_uids = [
                data_provider_task_record.uid for data_provider_task_record in data_provider_task_records
            ]
        else:
            data_provider_task_record_uids = kwargs["data_provider_task_record_uids"]

        if retval.get("file_producing_task_result_id"):
            data_provider_task_records = DataProviderTaskRecord.objects.filter(uid__in=data_provider_task_record_uids)
            downloadable_file = FileProducingTaskResult.objects.get(id=retval["file_producing_task_result_id"])
            run_zip_file.downloadable_file = downloadable_file
            run_zip_file.data_provider_task_records.set(data_provider_task_records)
            run_zip_file.finished_at = timezone.now()
            run_zip_file.message = "Completed"
            run_zip_file.save()
        return retval


@retry
def osm_data_collection_pipeline(
    export_task_record_uid,
    stage_dir,
    job_name="no_job_name_specified",
    url=None,
    slug=None,
    bbox=None,
    selection=None,
    user_details=None,
    config=None,
    eta=None,
    projection=4326,
    **kwargs,
) -> dict:
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
    """

    if config is None:
        logger.error("No configuration was provided for OSM export")
        raise RuntimeError("The configuration field is required for OSM data providers")

    pbf_file = config.get("pbf_file")

    if pbf_file:
        logger.info(f"Using PBF file: {pbf_file} instead of overpass.")
        pbf_filepath = pbf_file
    else:
        # Reasonable subtask_percentages we're determined by profiling code sections on a developer workstation
        # TODO: Biggest impact to improving ETA estimates reqs higher fidelity tracking of run_query and convert
        pool = ThreadPoolExecutor(max_workers=config.get("concurrency") or 4)
        tile_id = 0  # An arbitrary number to separate file names
        bboxes = [bbox]
        futures: list[Future] = []
        o5m_results = []

        @retry
        def get_osm_file(bbox, filename, **kw):  # noqa
            op = overpass.Overpass(
                bbox=bbox,
                stage_dir=stage_dir,
                slug=slug,
                url=url,
                job_name=job_name,
                task_uid=export_task_record_uid,
                raw_data_filename=filename,
                config=config,
            )
            return op.run_query(user_details=user_details, subtask_percentage=65, eta=eta)  # run the query

        while bboxes:
            tiled_bbox: list[float] = bboxes.pop()
            polygon = Polygon.from_bbox(tiled_bbox)
            polygon.srid = 4326
            polygon.transform(ct=3857)
            if (polygon.area / 1_000_000) > settings.OSM_MAX_REQUEST_SIZE:  # Compare sq_km
                bboxes.extend(split_bbox(tiled_bbox))
                continue
            tile_id += 1

            futures.append(
                pool.submit(
                    get_osm_file,
                    tiled_bbox,
                    f"{job_name}_{tile_id}_query.osm",
                    max_repeat=config.get("max_repeat"),
                    allowed_exceptions=[AreaLimitExceededError],
                )
            )
            if bboxes:
                continue
            for future in as_completed(futures):
                try:
                    osm_file = os.path.join(stage_dir, future.result())
                    # Convert the files to o5m files, since the .osm will take up too much space.
                    o5m_results.append(
                        pbf.OSMToPBF(
                            osm_files=[osm_file],
                            outfile=f"{os.path.splitext(osm_file)[0]}.o5m",
                            task_uid=export_task_record_uid,
                        ).convert()
                    )
                    os.remove(osm_file)
                except AreaLimitExceededError as ale:
                    if ale.bbox:
                        logger.info("Area limit was exceeded, requesting smaller areas for %s", ale.bbox)
                        bboxes.extend(split_bbox(ale.bbox))
                    else:
                        logger.error("An overpass limit was exceeded without a BBOX being returned. ")
                        raise
                    # Break out to let the rest of the bboxes work get queued.
                    break

        # --- Convert Overpass result to PBF
        logger.info("Converting osm files to PBF.")
        pbf_filename = os.path.join(stage_dir, f"{job_name}_query.pbf")
        pbf_filepath = pbf.OSMToPBF(
            osm_files=o5m_results, outfile=pbf_filename, task_uid=export_task_record_uid
        ).convert()

    # --- Generate thematic gpkg from PBF
    export_task_record = get_export_task_record(export_task_record_uid)
    gpkg_filepath = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    feature_selection = FeatureSelection.example(clean_config(config))

    update_progress(export_task_record_uid, progress=67, eta=eta, msg="Converting data to Geopackage")
    geom = get_geometry(bbox, selection)

    g = geopackage.Geopackage(
        pbf_filepath,
        gpkg_filepath,
        stage_dir,
        feature_selection,
        geom,
        export_task_record_uid=export_task_record_uid,
        projection=projection,
    )

    osm_gpkg = g.run(subtask_start=77, subtask_percentage=8, eta=eta)  # 77% to 85%
    if not osm_gpkg:
        cancel_export_provider_task.run(
            data_provider_task_uid=export_task_record.export_provider_task.uid,
            message="No OSM data was returned for the selected area.",
        )

    # --- Add the Land Boundaries polygon layer, this accounts for the majority of post-processing time
    update_progress(export_task_record_uid, 85.5, eta=eta, msg="Clipping data in Geopackage")

    database = settings.DATABASES["feature_data"]
    in_dataset = "PG:dbname={name} host={host} user={user} password={password} port={port}".format(
        host=database["HOST"],
        user=database["USER"],
        password=database["PASSWORD"].replace("$", "\$"),
        port=database["PORT"],
        name=database["NAME"],
    )

    task_process = TaskProcess()
    try:
        convert(
            boundary=selection,
            input_files=[in_dataset],
            output_file=gpkg_filepath,
            layers=["land_polygons"],
            driver="gpkg",
            is_raster=False,
            access_mode="append",
            projection=projection,
            layer_creation_options=["GEOMETRY_NAME=geom"],  # Needed for current styles (see note below).
            executor=task_process.start_process,
        )
    except Exception:
        logger.error("Could not load land data.")
    # TODO:  The arcgis templates as of version 1.9.0 rely on both OGC_FID and FID field existing.
    #  Just add the fid field if missing for now.
    with sqlite3.connect(gpkg_filepath) as conn:
        for column in ["fid", "ogc_fid"]:
            other_column = "ogc_fid" if column == "fid" else "fid"
            try:
                conn.execute(f"ALTER TABLE land_polygons ADD COLUMN {column} INTEGER NOT NULL DEFAULT (0);")
                conn.execute(f"UPDATE TABLE land_polygons SET {column} = {other_column};")
            except Exception as e:
                logger.error(e)
                # Column exists move on.
                pass

    ret_gpkg_filepath = g.results[0].parts[0]
    assert ret_gpkg_filepath == gpkg_filepath
    update_progress(
        export_task_record_uid,
        progress=100,
        eta=eta,
        msg="Completed OSM data collection pipeline",
    )
    result = {"pbf": pbf_filepath, "gpkg": gpkg_filepath}

    return result


@app.task(name="Create OSM", bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def osm_data_collection_task(
    self,
    result=None,
    stage_dir=None,
    run_uid=None,
    provider_slug=None,
    overpass_url=None,
    task_uid=None,
    job_name="no_job_name_specified",
    bbox=None,
    user_details=None,
    config=None,
    projection=4326,
    *args,
    **kwargs,
):
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
    """
    logger.debug("enter run for {0}".format(self.name))
    debug_os = None

    try:
        # Uncomment debug_os to generate a simple CSV of the progress log that can be used to evaluate the accuracy
        # of ETA estimates
        # debug_os = open("{}_progress_log.csv".format(task_uid), 'w')
        eta = ETA(task_uid=task_uid, debug_os=debug_os)

        result = result or {}

        selection = parse_result(result, "selection")
        osm_results = osm_data_collection_pipeline(
            task_uid,
            stage_dir,
            slug=provider_slug,
            job_name=job_name,
            bbox=bbox,
            projection=projection,
            user_details=user_details,
            selection=selection,
            url=overpass_url,
            config=config,
            eta=eta,
        )

        result.update(osm_results)
        result["result"] = osm_results.get("gpkg")
        result["source"] = osm_results.get("gpkg")

        logger.debug("exit run for {0}".format(self.name))
    finally:
        if debug_os:
            debug_os.close()

    return result


def add_metadata(job, provider, retval):
    """
    Accepts a job, provider slug, and return value from a task and applies metadata to the relevant file.

    :param job:
    :param provider_slug:
    :param retval:
    :return:
    """
    result_file = retval.get("result", None)
    if result_file is None:
        return
    task = metadata_tasks.get(os.path.splitext(result_file)[1], None)
    if not provider:
        return
    if task is not None:
        task(filepath=result_file, job=job, provider=provider)


@app.task(name="ESRI Shapefile (.shp)", bind=True, base=FormatTask, acks_late=True)
def shp_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining SHP export function.
    """
    result = result or {}
    shp_in_dataset = parse_result(result, "source")

    export_task_record = get_export_task_record(task_uid)
    shp_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "shp")
    selection = parse_result(result, "selection")
    task_process = TaskProcess(task_uid=task_uid)
    shp = convert(
        driver="ESRI Shapefile",
        input_files=shp_in_dataset,
        output_file=shp_out_dataset,
        boundary=selection,
        projection=projection,
        skip_failures=True,  # Layer creations seems to fail, but still get created.
        executor=task_process.start_process,
    )

    result["driver"] = "ESRI Shapefile"
    result["result"] = shp
    return result


@app.task(name="Keyhole Markup Language (.kml)", bind=True, base=FormatTask, acks_late=True)
def kml_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining KML export function.
    """
    result = result or {}

    export_task_record = get_export_task_record(task_uid)
    kml_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "kml")

    dptr = DataProviderTaskRecord.objects.get(tasks__uid__exact=task_uid)
    metadata = get_metadata(data_provider_task_record_uids=[str(dptr.uid)], source_only=True)
    metadata["projections"] = [4326]

    try:
        import qgis  # noqa

        qgs_file = generate_qgs_style(metadata)
        qgis_file_path = list(qgs_file.keys())[0]
        kml = convert_qgis_gpkg_to_kml(qgis_file_path, kml_out_dataset, stage_dir=stage_dir)
    except ImportError:
        logger.info("QGIS is not installed, using gdal_utils.utils.gdal.convert.")
        kml_in_dataset = parse_result(result, "source")
        selection = parse_result(result, "selection")
        task_process = TaskProcess(task_uid=task_uid)
        kml = convert(
            driver="libkml",
            input_files=kml_in_dataset,
            output_file=kml_out_dataset,
            boundary=selection,
            projection=projection,
            executor=task_process.start_process,
        )

    result["driver"] = "libkml"
    result["file_extension"] = "kml"
    result["result"] = kml
    return result


@app.task(name="GPS Exchange (.gpx)", bind=True, base=FormatTask, acks_late=True)
def gpx_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining GPX export function.
    """
    result = result or {}
    # Need to use PBF instead of GPKG because gpkg uses multi-geometry types whereas gpx doesn't support multipoint
    input_file = parse_result(result, "pbf")
    if not input_file:
        input_file = parse_result(result, "gpkg")
    # Need to crop to selection since the PBF hasn't been clipped.
    selection = parse_result(result, "selection")
    export_task_record = get_export_task_record(task_uid)

    gpx_file = get_export_filepath(stage_dir, export_task_record, projection, "gpx")
    try:
        task_process = TaskProcess()
        out = convert(
            input_files=input_file,
            output_file=gpx_file,
            driver="GPX",
            dataset_creation_options=["GPX_USE_EXTENSIONS=YES"],
            creation_options=["-explodecollections"],
            boundary=selection,
            executor=task_process.start_process,
        )
        result["file_extension"] = "gpx"
        result["driver"] = "GPX"
        result["result"] = out
        result["gpx"] = out
        return result
    except Exception as e:
        logger.error("Raised exception in gpx export, %s", str(e))
        raise Exception(e)


@app.task(name="OSM PBF (.pbf)", bind=True, base=FormatTask, acks_late=True)
def pbf_export_task(
    self,
    result=None,
    **kwargs,
):
    """
    Function defining PBF export function, this format is already generated in the OSM step.  It just needs to be
    exposed and passed through.
    """
    result = result or {}
    logger.error("GETTING PBF FILE...")
    pbf_file = parse_result(result, "pbf")
    logger.error(pbf_file)
    try:
        result["file_extension"] = "pbf"
        result["driver"] = "OSM"
        result["result"] = pbf_file
        logger.error(f"Returning PBF RESULT: {result}")
        return result
    except Exception as e:
        logger.error("Raised exception in pbf export, %s", str(e))
        raise Exception(e)


@app.task(name="OGC API Process", bind=True, base=ExportTask, abort_on_error=True)
def ogcapi_process_export_task(
    self,
    result=None,
    config=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    projection=4326,
    session_token=None,
    export_format_slug=None,
    **kwargs,
):
    """
    Function defining OGC API Processes export.  This is called to create a dataset and then convert it to an eventkit
    supported dataset.
    """

    result = result or {}
    selection = parse_result(result, "selection")
    export_task_record = get_export_task_record(task_uid)
    output_file = None
    if export_task_record.export_provider_task.provider.data_type == GeospatialDataType.ELEVATION.value:
        output_file = get_export_filepath(stage_dir, export_task_record, projection, "tif")
        driver = "gtiff"
    elif export_task_record.export_provider_task.provider.data_type in [
        GeospatialDataType.MESH.value,
        GeospatialDataType.POINT_CLOUD.value,
    ]:
        # TODO support converting point cloud and mesh data
        driver = None
    else:
        output_file = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")
        driver = "gpkg"
    ogc_config = clean_config(config).get("ogcapi_process", dict())
    download_path = get_export_filepath(stage_dir, export_task_record, projection, "zip")

    # TODO: The download path might not be a zip, use the mediatype to determine the file format.
    download_path = get_ogcapi_data(
        config=config,
        task_uid=task_uid,
        stage_dir=stage_dir,
        bbox=bbox,
        service_url=service_url,
        session_token=session_token,
        export_format_slug=export_format_slug,
        selection=selection,
        download_path=download_path,
    )

    if not export_format_slug:
        # TODO: Its possible the data is not in a zip, this step should be optional depending on output.
        source_data = find_in_zip(
            zip_filepath=download_path,
            stage_dir=stage_dir,
            extension=ogc_config.get("output_file_ext"),
            extract=not bool(driver),
        )
        if driver and output_file:
            task_process = TaskProcess(task_uid=task_uid)
            out = convert(
                driver=driver,
                input_files=source_data,
                output_file=output_file,
                projection=projection,
                boundary=selection,
                executor=task_process.start_process,
            )
        else:
            out = source_data

        result["driver"] = driver
        result["file_extension"] = ogc_config.get("output_file_ext")
        result["ogcapi_process"] = download_path
        result["source"] = out  # Note 'source' is the root dataset (not native) used for the rest of the pipeline
        result[driver] = out

    result["result"] = download_path
    return result


@app.task(name="OGC API Process Data", bind=True, base=FormatTask, acks_late=True)
def ogc_result_task(
    self,
    result,
    task_uid=None,
    export_format_slug=None,
    stage_dir=None,
    projection=None,
    bbox=None,
    service_url=None,
    session_token=None,
    **kwargs,
):
    """
    A helper method to get additional download formats from an ogcapi endpoint that aren't being converted into other
    eventkit supported formats.
    """

    result = result or {}

    export_task_record = get_export_task_record(task_uid)
    selection = parse_result(result, "selection")
    data_provider: DataProvider = export_task_record.export_provider_task.provider
    client: OGCAPIProcess = cast(OGCAPIProcess, data_provider.get_service_client())
    ogcapi_config = client.process_config
    # check to see if file format that we're processing is the same one as the
    # primary task (ogcapi_process_export_task); if so, return data rather than downloading again
    if ogcapi_config:
        format_field, format_prop = OGCAPIProcess.get_format_field(ogcapi_config["inputs"])
        if format_field:
            export_format = ogcapi_config["inputs"][format_field]
        if format_prop:
            export_format = ogcapi_config["inputs"][format_field][format_prop]
        if export_format and export_format.lower() == export_format_slug.lower() and result.get("ogcapi_process"):
            result["result"] = result["ogcapi_process"]
            return result
        else:
            # Workaround for case-sensitivity in upsteam sources.
            proxy: ProxyFormat = ProxyFormat.objects.filter(
                identifier__contains=export_format_slug, data_provider=data_provider
            )
            export_format_slug = proxy.identifier or export_format_slug
    download_path = get_export_filepath(stage_dir, export_task_record, projection, "zip")

    download_path = get_ogcapi_data(
        config=data_provider.config,
        task_uid=task_uid,
        stage_dir=stage_dir,
        bbox=bbox,
        service_url=service_url,
        session_token=session_token,
        export_format_slug=export_format_slug,
        selection=selection,
        download_path=download_path,
    )

    result["result"] = download_path

    # source may be empty because primary task wasn't run
    if not result.get("source"):
        result["source"] = download_path

    logger.error(f"OGC DATA RESULT: {result}")

    return result


@app.task(name="SQLITE Format", bind=True, base=FormatTask, acks_late=True)
def sqlite_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining SQLITE export function.
    """
    result = result or {}
    sqlite_in_dataset = parse_result(result, "source")

    export_task_record = get_export_task_record(task_uid)
    sqlite_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "sqlite")
    selection = parse_result(result, "selection")

    task_process = TaskProcess(task_uid=task_uid)
    sqlite = convert(
        driver="SQLite",
        input_files=sqlite_in_dataset,
        output_file=sqlite_out_dataset,
        boundary=selection,
        projection=projection,
        executor=task_process.start_process,
    )

    result["driver"] = "SQLite"
    result["result"] = sqlite
    return result


@app.task(name="Create Area of Interest", bind=True, base=ExportTask, acks_late=True)
def output_selection_geojson_task(
    self,
    result=None,
    task_uid=None,
    selection=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function creating the aoi geojson.
    """
    result = result or {}
    export_task_record = get_export_task_record(task_uid)
    geojson_file = get_export_filepath(stage_dir, export_task_record, projection, "geojson")

    if selection:
        # Test if json.
        json.loads(selection)

        user_details = kwargs.get("user_details")
        with logging_open(geojson_file, "w", user_details=user_details) as open_file:
            open_file.write(selection)
        result["selection"] = geojson_file
        result["result"] = geojson_file

    return result


@app.task(name="Geopackage (.gpkg)", bind=True, base=FormatTask, acks_late=True)
def geopackage_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export function.
    """
    result = result or {}
    gpkg = parse_result(result, "gpkg")
    if not gpkg:
        gpkg_in_dataset = parse_result(result, "source")

        export_task_record = get_export_task_record(task_uid)
        gpkg_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")
        selection = parse_result(result, "selection")

        # This assumes that the source dataset has already been "clipped".  Since most things are tiles or selected
        # based on area it doesn't make sense to run this again.  If that isn't true this may need to be updated.
        if os.path.splitext(gpkg_in_dataset)[1] == ".gpkg":
            os.rename(gpkg_in_dataset, gpkg_out_dataset)
            gpkg = gpkg_out_dataset
        else:
            task_process = TaskProcess()
            gpkg = convert(
                driver="gpkg",
                input_files=gpkg_in_dataset,
                output_file=gpkg_out_dataset,
                boundary=selection,
                projection=projection,
                executor=task_process.start_process,
            )

    result["driver"] = "gpkg"
    result["result"] = gpkg
    result["gpkg"] = gpkg
    return result


@app.task(name="MBtiles (.mbtiles)", bind=True, base=FormatTask, acks_late=True)
def mbtiles_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=3857,  # MBTiles only support 3857
    **kwargs,
):
    """
    Function defining mbtiles export function.
    """

    if projection != 3857:
        raise Exception("MBTiles only supports 3857.")
    result = result or {}

    export_task_record = get_export_task_record(task_uid)

    source_dataset = parse_result(result, "source")

    mbtiles_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "mbtiles")
    selection = parse_result(result, "selection")
    logger.error(f"Converting {source_dataset} to {mbtiles_out_dataset}")

    task_process = TaskProcess(task_uid=task_uid)
    mbtiles = convert(
        driver="MBTiles",
        input_files=source_dataset,
        output_file=mbtiles_out_dataset,
        boundary=selection,
        projection=projection,
        use_translate=True,
        executor=task_process.start_process,
    )

    result["driver"] = "MBTiles"
    result["result"] = mbtiles
    return result


@app.task(name="Geotiff (.tif)", bind=True, base=FormatTask, acks_late=True)
def geotiff_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    config=None,
    **kwargs,
):
    """
    Function defining geopackage export function.
    """
    result = result or {}
    gtiff_out_dataset = parse_result(result, "gtiff")
    if not gtiff_out_dataset:
        gtiff_in_dataset = parse_result(result, "source")
        export_task_record = get_export_task_record(task_uid)
        gtiff_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "tif")
        selection = parse_result(result, "selection")

        warp_params, translate_params = get_creation_options(config, "gtiff")

        if "tif" in os.path.splitext(gtiff_in_dataset)[1]:
            gtiff_in_dataset = f"GTIFF_RAW:{gtiff_in_dataset}"

        task_process = TaskProcess(task_uid=task_uid)
        gtiff_out_dataset = convert(
            driver="gtiff",
            input_files=gtiff_in_dataset,
            output_file=gtiff_out_dataset,
            boundary=selection,
            warp_params=warp_params,
            translate_params=translate_params,
            executor=task_process.start_process,
            projection=projection,
            is_raster=True,
        )

    result["file_extension"] = "tif"
    result["driver"] = "gtiff"
    result["result"] = gtiff_out_dataset
    result["gtiff"] = gtiff_out_dataset

    return result


@app.task(name="National Imagery Transmission Format (.nitf)", bind=True, base=FormatTask, acks_late=True)
def nitf_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining nitf export function.
    """
    result = result or {}

    nitf_in_dataset = parse_result(result, "source")
    export_task_record = get_export_task_record(task_uid)
    nitf_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "nitf")
    if projection != 4326:
        raise Exception("NITF only supports 4236.")
    creation_options = ["ICORDS=G"]
    task_process = TaskProcess(task_uid=task_uid)
    nitf = convert(
        driver="nitf",
        input_files=nitf_in_dataset,
        output_file=nitf_out_dataset,
        creation_options=creation_options,
        executor=task_process.start_process,
        projection=4326,
    )

    result["driver"] = "nitf"
    result["result"] = nitf
    result["nitf"] = nitf
    return result


@app.task(name="Erdas Imagine HFA (.img)", bind=True, base=FormatTask, acks_late=True)
def hfa_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining Erdas Imagine HFA (.img) export function.
    """
    result = result or {}
    hfa_in_dataset = parse_result(result, "source")
    export_task_record = get_export_task_record(task_uid)
    hfa_out_dataset = get_export_filepath(stage_dir, export_task_record, projection, "img")
    task_process = TaskProcess(task_uid=task_uid)
    hfa = convert(
        driver="hfa",
        input_files=hfa_in_dataset,
        output_file=hfa_out_dataset,
        projection=projection,
        executor=task_process.start_process,
    )

    result["file_extension"] = "img"
    result["driver"] = "hfa"
    result["result"] = hfa
    result["hfa"] = hfa
    return result


@app.task(name="Reprojection Task", bind=True, base=FormatTask, acks_late=True)
def reprojection_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    job_name=None,
    projection=None,
    config=None,
    layer=None,
    **kwargs,
):
    """
    Function defining a task that will reproject all file formats to the chosen projections.
    """
    result = result or {}
    driver = parse_result(result, "driver")
    selection = parse_result(result, "selection")

    if parse_result(result, "file_extension"):
        file_extension = parse_result(result, "file_extension")
    else:
        file_extension = driver

    in_dataset = parse_result(result, "source")
    export_task_record = get_export_task_record(task_uid)
    out_dataset = get_export_filepath(stage_dir, export_task_record, projection, file_extension)

    warp_params, translate_params = get_creation_options(config, driver)

    # This logic is only valid IFF this method only allows 4326 which is True as of 1.9.0.
    # This needs to be updated to compare the input and output if over source projections are allowed.
    if not projection or "4326" in str(projection):
        logger.info(f"Skipping projection and renaming {in_dataset} to {out_dataset}")
        os.rename(in_dataset, out_dataset)
        reprojection = out_dataset
    else:
        # If you are updating this see the note above about source projection.
        dptr: DataProviderTaskRecord = DataProviderTaskRecord.objects.select_related("run__job").get(
            tasks__uid__exact=task_uid
        )
        metadata = get_metadata(data_provider_task_record_uids=[str(dptr.uid)], source_only=True)
        provider_slug = export_task_record.export_provider_task.provider.slug
        data_type = metadata["data_sources"][provider_slug].get("type")

        if "tif" in os.path.splitext(in_dataset)[1]:
            in_dataset = f"GTIFF_RAW:{in_dataset}"

        if (
            "gpkg" in os.path.splitext(in_dataset)[1]
            and driver == "gpkg"
            and data_type == GeospatialDataType.RASTER.value
        ):
            # Use MapProxy instead of GDAL so all the pyramids/zoom levels of the source are preserved.

            level_from = metadata["data_sources"][provider_slug].get("level_from")
            level_to = metadata["data_sources"][provider_slug].get("level_to")
            layer = get_tile_table_names(in_dataset)[0]
            mp = mapproxy.MapproxyGeopackage(
                gpkgfile=out_dataset,
                service_url=out_dataset,
                name=job_name,
                config=config,
                bbox=dptr.run.job.extents,
                layer=layer,
                level_from=level_from,
                level_to=level_to,
                task_uid=task_uid,
                selection=selection,
                projection=projection,
                input_gpkg=in_dataset,
            )
            reprojection = mp.convert()

        else:
            task_process = TaskProcess(task_uid=task_uid)
            reprojection = convert(
                driver=driver,
                input_files=in_dataset,
                output_file=out_dataset,
                projection=projection,
                boundary=selection,
                warp_params=warp_params,
                translate_params=translate_params,
                executor=task_process.start_process,
            )

    result["result"] = reprojection

    return result


@app.task(name="Create WFS Export", bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def wfs_export_task(
    self,
    result=None,
    layer=None,
    config=dict(),
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    name=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export for WFS service.
    """
    result = result or {}
    export_task_record = get_export_task_record(task_uid)

    gpkg = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    configuration = config
    if configuration.get("layers"):
        configuration.pop("layers")  # Remove raster layers to prevent download conflict, needs refactor.
    vector_layer_data: LayersDescription = export_task_record.export_provider_task.provider.layers
    layers = {}
    out = None
    for layer_name, layer in vector_layer_data.items():
        path = get_export_filepath(stage_dir, export_task_record, f"{layer_name}-{projection}", "gpkg")
        url = get_wfs_query_url(name, layer["url"], layer_name, projection)
        layers[layer_name] = {
            "task_uid": task_uid,
            "url": url,
            "path": path,
            "base_path": os.path.dirname(path),
            "bbox": bbox,
            "layer_name": layer_name,
            "projection": 4326,
            "level": layer.get("level", 15),
        }

    download_concurrently(list(layers.values()), **configuration)

    for layer_name, layer in layers.items():
        if not os.path.exists(layer["path"]):
            continue
        task_process = TaskProcess(task_uid=task_uid)
        out = convert(
            driver="gpkg",
            input_files=layer.get("path"),
            output_file=gpkg,
            projection=projection,
            boundary=bbox,
            layer_name=layer_name,
            access_mode="append",
            executor=task_process.start_process,
        )
    if not out:
        raise Exception("WFS export produced no files.")
    result["driver"] = "gpkg"
    result["result"] = out
    result["source"] = out
    result["gpkg"] = out

    # Check for geopackage contents; gdal wfs driver fails silently
    if not geopackage.check_content_exists(out):
        logger.warning("Empty response: Unknown layer name '{}' or invalid AOI bounds".format(layer))

    return result


def get_wfs_query_url(
    name: str, service_url: str = None, layer: str = None, projection: int = None, bbox: list = None
) -> str:
    """
    Function generates WFS query URL
    """

    # Strip out query string parameters that might conflict
    service_url = re.sub(r"(?i)(?<=[?&])(version|service|request|typename|srsname)=.*?(&|$)", "", service_url)

    query_params = {
        "SERVICE": "WFS",
        "VERSION": "1.0.0",
        "REQUEST": "GetFeature",
        "TYPENAME": layer,
        "SRSNAME": f"EPSG:{projection}",
        "BBOX": str(bbox).strip("[]"),
    }
    if bbox is None:
        query_params["BBOX"] = "BBOX_PLACEHOLDER"

    query_str = urlencode(query_params, safe=":")

    if "?" in service_url:
        if "&" != service_url[-1]:
            service_url += "&"
        service_url += query_str
    else:
        service_url += "?" + query_str

    url = service_url
    cred = auth_requests.get_cred(cred_var=name, url=url)

    if cred:
        user, pw = cred
        if not re.search(r"(?<=://)[a-zA-Z0-9\-._~]+:[a-zA-Z0-9\-._~]+(?=@)", url):
            url = re.sub(r"(?<=://)", "%s:%s@" % (user, pw), url)

    return url


@app.task(name="Create WCS Export", bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def wcs_export_task(
    self,
    result=None,
    layer=None,
    config=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    name=None,
    user_details=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining export for WCS services
    """
    result = result or {}

    export_task_record = get_export_task_record(task_uid)
    out = get_export_filepath(stage_dir, export_task_record, projection, "tif")

    eta = ETA(task_uid=task_uid)
    task = ExportTaskRecord.objects.get(uid=task_uid)

    try:
        wcs_conv = wcs.WCSConverter(
            config=config,
            out=out,
            bbox=bbox,
            service_url=service_url,
            layer=layer,
            debug=True,
            name=name,
            task_uid=task_uid,
            fmt="gtiff",
            slug=task.export_provider_task.provider.slug,
            user_details=user_details,
            eta=eta,
        )
        out = wcs_conv.convert()

        result["result"] = out
        result["source"] = out

        return result
    except Exception as e:
        logger.error("Raised exception in WCS service export: %s", str(e))
        raise Exception(e)


@app.task(name="Create ArcGIS FeatureService Export", bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def arcgis_feature_service_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export for ArcFeatureService service.
    """
    result = result or {}
    export_task_record = get_export_task_record(task_uid)
    selection = parse_result(result, "selection")

    gpkg = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    data_provider = export_task_record.export_provider_task.provider
    configuration = copy.deepcopy(data_provider.config)
    if configuration.get("layers"):
        configuration.pop("layers")  # Remove raster layers to prevent download conflict, needs refactor.
    layers: LayersDescription = {}
    vector_layer_data = data_provider.layers
    out = gpkg
    for layer_name, layer in vector_layer_data.items():
        # TODO: using wrong signature for filepath, however pipeline counts on projection-provider_slug.ext.
        path = get_export_filepath(stage_dir, export_task_record, f"{layer.get('name')}-{projection}", "gpkg")
        url = get_arcgis_query_url(layer.get("url"))
        layers[layer_name] = {
            "task_uid": task_uid,
            "url": url,
            "path": path,
            "base_path": os.path.dirname(path),
            "bbox": bbox,
            "projection": 4326,
            "layer_name": layer_name,
            "level": layer.get("level", 15),
            "distinct_field": layer.get("distinct_field", "OBJECTID"),
        }

    try:
        download_concurrently(layers=list(layers.values()), feature_data=True, **configuration)
    except Exception as e:
        logger.error(f"ArcGIS provider download error: {e}")
        raise e
    for layer_name, layer in layers.items():
        if not os.path.exists(layer["path"]):
            continue
        task_process = TaskProcess(task_uid=task_uid)
        out = convert(
            driver="gpkg",
            input_files=layer.get("path"),
            output_file=gpkg,
            boundary=selection,
            projection=projection,
            layer_name=layer_name,
            access_mode="append",
            executor=task_process.start_process,
        )

    if not geopackage.check_content_exists(out):
        raise Exception("The service returned no data for the selected area.")

    result["driver"] = "gpkg"
    result["result"] = out
    result["source"] = out
    result["gpkg"] = out

    return result


def get_arcgis_query_url(service_url: str, bbox: list = None) -> str:
    """
    Function generates ArcGIS query URL
    """

    try:
        # remove any url query so we can add our own
        service_url = service_url.split("/query?")[0]
    except ValueError:
        # if no url query we can just check for trailing slash and move on
        service_url = service_url.rstrip("/\\")
    finally:
        query_params = {
            "where": "objectid=objectid",
            "outfields": "*",
            "f": "json",
            "geometry": str(bbox).strip("[]"),
        }
        if bbox is None:
            query_params["geometry"] = "BBOX_PLACEHOLDER"
        query_str = urlencode(query_params, safe="=*")
        query_url = f"{service_url}/query?{query_str}"

    return query_url


@app.task(name="Create Vector File Export", bind=True, base=ExportTask, abort_on_error=True)
def vector_file_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export for geospatial vector file service.
    """
    result = result or {}
    export_task_record = get_export_task_record(task_uid)

    gpkg = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    download_data(task_uid, service_url, gpkg)

    task_process = TaskProcess(task_uid=task_uid)
    out = convert(
        driver="gpkg",
        input_files=gpkg,
        output_file=gpkg,
        projection=projection,
        layer_name=list(export_task_record.export_provider_task.provider.layers.keys())[0],
        boundary=bbox,
        is_raster=False,
        executor=task_process.start_process,
    )

    result["driver"] = "gpkg"
    result["result"] = out
    result["source"] = out
    result["gpkg"] = out

    return result


@app.task(name="Create Raster File Export", bind=True, base=ExportTask, abort_on_error=True)
def raster_file_export_task(
    self,
    result=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export for geospatial raster file service.
    """
    result = result or {}
    export_task_record = get_export_task_record(task_uid)

    gpkg = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    download_data(task_uid, service_url, gpkg)

    task_process = TaskProcess(task_uid=task_uid)
    out = convert(
        driver="gpkg",
        input_files=gpkg,
        output_file=gpkg,
        projection=projection,
        boundary=bbox,
        is_raster=True,
        executor=task_process.start_process,
    )

    result["driver"] = "gpkg"
    result["result"] = out
    result["source"] = out
    result["gpkg"] = out

    return result


@app.task(name="Create Bounds Export", bind=True, base=ExportTask)
def bounds_export_task(
    self, result={}, run_uid=None, task_uid=None, stage_dir=None, provider_slug=None, projection=4326, **kwargs
):
    """
    Function defining geopackage export function.
    """
    user_details = kwargs.get("user_details")

    run = ExportRun.objects.get(uid=run_uid)

    result_gpkg = parse_result(result, "source")
    bounds = run.job.the_geom.geojson or run.job.bounds_geojson

    gpkg = os.path.join(stage_dir, "{0}-{1}_bounds.gpkg".format(provider_slug, projection))
    gpkg = geopackage.add_geojson_to_geopackage(
        geojson=bounds, gpkg=gpkg, layer_name="bounds", task_uid=task_uid, user_details=user_details
    )

    result["result"] = gpkg
    result["source"] = result_gpkg
    return result


@app.task(name="Create Raster Export", bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def mapproxy_export_task(
    self,
    result=None,
    layer=None,
    config=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    level_from=None,
    level_to=None,
    name=None,
    service_type=None,
    projection=4326,
    **kwargs,
):
    """
    Function defining geopackage export for external raster service.
    """
    result = result or {}
    selection = parse_result(result, "selection")

    export_task_record = get_export_task_record(task_uid)
    gpkgfile = get_export_filepath(stage_dir, export_task_record, projection, "gpkg")

    try:
        w2g = mapproxy.MapproxyGeopackage(
            gpkgfile=gpkgfile,
            bbox=bbox,
            service_url=service_url,
            name=name,
            layer=layer,
            config=config,
            level_from=level_from,
            level_to=level_to,
            service_type=service_type,
            task_uid=task_uid,
            selection=selection,
            projection=projection,
        )
        gpkg = w2g.convert()
        result["driver"] = "gpkg"
        result["result"] = gpkg
        result["source"] = gpkg

        return result
    except Exception as e:
        logger.error(f"Raised exception in raster service export, {e}")
        raise e


@app.task(name="Pickup Run", bind=True, acks_late=True)
def pick_up_run_task(
    self,
    run_uid=None,
    user_details=None,
    run_zip_file_slug_sets=None,
    session_token=None,
    **kwargs,
):
    """
    Generates a Celery task to assign a celery pipeline to a specific worker.
    """
    from eventkit_cloud.tasks.task_factory import TaskFactory

    worker = socket.gethostname()
    queue_group = get_celery_queue_group(run_uid=run_uid, worker=worker)

    run = ExportRun.objects.get(uid=run_uid)
    started_providers = run.data_provider_task_records.exclude(status=TaskState.PENDING.value)
    try:
        # If a data source is retried we will need to download the data. For the to work the calling process needs to be
        # on same disk as the process running the rest of the
        # job (i.e. the run worker needs to be calling pick_up_run_task)
        if TaskState[run.status] == TaskState.SUBMITTED and started_providers:
            run.download_data()

        TaskFactory().parse_tasks(
            worker=worker,
            run_uid=run_uid,
            user_details=user_details,
            run_zip_file_slug_sets=run_zip_file_slug_sets,
            session_token=session_token,
            queue_group=queue_group,
        )
        run.worker = worker
        run.save()
    except Exception as e:
        run.status = TaskState.FAILED.value
        for data_provider_task_record in run.data_provider_task_records.all():
            if TaskState[data_provider_task_record.status] not in TaskState.get_finished_states():
                for export_task_record in data_provider_task_record.tasks.all():
                    if TaskState[export_task_record.status] not in TaskState.get_finished_states():
                        export_task_record.status = TaskState.FAILED.value
                        export_task_record.save()
                data_provider_task_record.save()
        run.save()
        logger.error(str(e))
        export_task_error_handler(run_uid=run_uid)
        raise e


def wait_for_run(run_uid: str = None) -> None:
    """
    :param run_uid: The uid of the run to wait on.
    :return: None
    """
    run = ExportRun.objects.get(uid=run_uid)
    if run.status:
        while (
            TaskState[run.status] not in TaskState.get_finished_states()
            and TaskState[run.status] not in TaskState.get_incomplete_states()
        ):
            time.sleep(10)
            run.refresh_from_db()


# This could be improved by using Redis or Memcached to help manage state.
@app.task(name="Wait For Providers", base=EventKitBaseTask, acks_late=True)
def wait_for_providers_task(result=None, apply_args=None, run_uid=None, callback_task=None, *args, **kwargs):
    if isinstance(callback_task, dict):
        callback_task = signature(callback_task)

    run = ExportRun.objects.filter(uid=run_uid).first()
    if run:
        provider_tasks = run.data_provider_task_records.filter(~Q(slug="run"))
        if all(TaskState[provider_task.status] in TaskState.get_finished_states() for provider_task in provider_tasks):
            callback_task.apply_async(**apply_args)
        else:
            logger.warning(f"The run: {run_uid} is Waiting for other tasks to finish.")
    else:
        raise Exception("A run could not be found for uid {0}".format(run_uid))


@app.task(name="Project File (.zip)", base=ZipFileTask, acks_late=True)
def create_zip_task(
    result: dict = None,
    task_uid: str = None,
    data_provider_task_record_uid: List[str] = None,
    data_provider_task_record_uids: List[str] = None,
    run_zip_file_uid=None,
    **kwargs,
):
    """
    :param result: The celery task result value, it should be a dict with the current state.
    :param data_provider_task_record_uid: A data provider task record UID to zip.
    :param data_provider_task_record_uids: A list of data provider task record UIDs to zip.
    :param run_zip_file_uid: The UUID of the zip file.
    :return: The run files, or a single zip file if data_provider_task_record_uid is passed.
    """

    if not result:
        result = {}

    export_task_record = get_export_task_record(task_uid)

    if not data_provider_task_record_uids:
        data_provider_task_record = DataProviderTaskRecord.objects.get(uid=data_provider_task_record_uid)
        data_provider_task_records = data_provider_task_record.run.data_provider_task_records.exclude(slug="run")
        data_provider_task_record_uids = [
            str(data_provider_task_record.uid) for data_provider_task_record in data_provider_task_records
        ]

    if len(data_provider_task_record_uids) > 1:
        data_provider_task_record_slug = "run"
    elif len(data_provider_task_record_uids) == 1:
        data_provider_task_record_slug = (
            DataProviderTaskRecord.objects.select_related("provider")
            .get(uid=data_provider_task_record_uids[0])
            .provider.slug
        )

    metadata = get_metadata(data_provider_task_record_uids)
    include_files = metadata.get("include_files", None)

    if include_files:
        # No need to add meta files if there aren't any files to be zipped.
        meta_files = generate_qgs_style(metadata)
        meta_files.update(get_human_readable_metadata_document(metadata))

        ogc_metadata_dir = os.path.join(
            get_run_staging_dir(metadata["run_uid"]), data_provider_task_record_slug, "metadata"
        )

        # TODO: make sure files are placed in the '../metadata' directory.
        if os.path.isdir(ogc_metadata_dir):
            path = Path(ogc_metadata_dir)
            for file in path.rglob("*"):
                relative_metadata_path = Path(file).relative_to(
                    get_run_staging_dir(metadata["run_uid"]), data_provider_task_record_slug
                )
                meta_files[str(file)] = str(
                    Path("data", data_provider_task_record_slug, "metadata", relative_metadata_path)
                )

        meta_files.update(get_style_files())
        meta_files.update(get_arcgis_templates(metadata))
        include_files.update(meta_files)
        zip_file_name = get_export_filepath(get_run_staging_dir(metadata["run_uid"]), export_task_record, "", "zip")
        result["result"] = zip_files(
            files=include_files,
            run_zip_file_uid=run_zip_file_uid,
            meta_files=meta_files,
            file_path=zip_file_name,
            metadata=metadata,
        )
    else:
        raise Exception("Could not create a zip file because there were not files to include.")
    return result


@app.task(name="Finalize Export Provider Task", base=EventKitBaseTask, acks_late=True)
def finalize_export_provider_task(result=None, data_provider_task_uid=None, status=None, *args, **kwargs):
    """
    Finalizes provider task.

    Cleans up staging directory.
    Updates export provider status.
    """

    # if the status was a success, we can assume all the ExportTasks succeeded. if not, we need to parse ExportTasks to
    # mark tasks not run yet as canceled.

    result_status = parse_result(result, "status")

    with transaction.atomic():
        data_provider_task_record = DataProviderTaskRecord.objects.prefetch_related("tasks").get(
            uid=data_provider_task_uid
        )
        has_failures = any(
            [
                export_task_record.status == TaskState.FAILED.value
                for export_task_record in data_provider_task_record.tasks.all()
            ]
        )
        if TaskState[result_status] == TaskState.CANCELED:
            # This makes the assumption that users can't cancel individual tasks.  Therefore if any of them failed then
            # it is likely that the rest of the tasks were force canceled since they depend on the task that failed.
            if has_failures:
                data_provider_task_record.status = TaskState.INCOMPLETE.value
            else:
                data_provider_task_record.status = TaskState.CANCELED.value
        else:
            if has_failures:
                data_provider_task_record.status = TaskState.INCOMPLETE.value
            else:
                data_provider_task_record.status = TaskState.COMPLETED.value
        data_provider_task_record.save()

    return result


@retry
def zip_files(files, run_zip_file_uid, meta_files={}, file_path=None, metadata=None, *args, **kwargs):
    """
    Contains the organization for the files within the archive.
    :param files: A list of files to be included.
    :param run_zip_file_uid: The UUID of the zip file.
    :param file_path: The name for the archive.
    :param static_files: Files that are in the same location for every datapack (i.e. templates and metadata files).
    :param metadata: A dict of user requested file information.
    :return: The zipfile path.
    """

    if not files:
        raise Exception("zip_file_task called with no include_files. Zip file task will be canceled.")

    if not file_path:
        raise Exception("zip_file_task called with no file path. Zip file task will be canceled.")

    run_zip_file = RunZipFile.objects.get(uid=run_zip_file_uid)

    cleaned_files = {}
    for stage_path, archive_path in files.items():
        if Path(stage_path).suffix not in BLACKLISTED_ZIP_EXTS:
            cleaned_files[Path(stage_path)] = Path(archive_path)

    logger.debug("Opening the zipfile.")
    with ZipFile(file_path, "a", compression=ZIP_DEFLATED, allowZip64=True) as zipfile:
        for absolute_file_path, relative_file_path in cleaned_files.items():
            if "__pycache__" in str(absolute_file_path):
                continue
            if absolute_file_path.name == "__init__.py":
                continue
            zipfile.write(str(absolute_file_path), arcname=str(relative_file_path))

        manifest_file = get_data_package_manifest(metadata=metadata, ignore_files=list(meta_files.values()))
        zipfile.write(manifest_file, arcname=os.path.join("MANIFEST", os.path.basename(manifest_file)))
        add_export_run_files_to_zip(zipfile, run_zip_file)

        if zipfile.testzip():
            raise Exception("The zipped file was corrupted.")

    return file_path


class FinalizeRunBase(EventKitBaseTask):
    name = "Finalize Export Run"

    def run(self, result=None, run_uid=None, stage_dir=None):
        """
         Finalizes export run.

        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
        """
        result = result or {}

        run = ExportRun.objects.get(uid=run_uid)
        run.status = TaskState.COMPLETED.value
        notification_level = NotificationLevel.SUCCESS.value
        verb = NotificationVerb.RUN_COMPLETED.value
        provider_tasks = run.data_provider_task_records.all()

        # Complicated Celery chain from TaskFactory.parse_tasks() is incorrectly running pieces in parallel;
        #    this waits until all provider tasks have finished before continuing.
        if any(getattr(TaskState, task.status, None) == TaskState.PENDING for task in provider_tasks):
            finalize_run_task.retry(
                result=result, run_uid=run_uid, stage_dir=stage_dir, interval_start=4, interval_max=10
            )

        # mark run as incomplete if any tasks fail
        if any(getattr(TaskState, task.status, None) in TaskState.get_incomplete_states() for task in provider_tasks):
            run.status = TaskState.INCOMPLETE.value
            notification_level = NotificationLevel.WARNING.value
            verb = NotificationVerb.RUN_FAILED.value
        if all(getattr(TaskState, task.status, None) == TaskState.CANCELED for task in provider_tasks):
            run.status = TaskState.CANCELED.value
            notification_level = NotificationLevel.WARNING.value
            verb = NotificationVerb.RUN_CANCELED.value
        run.save()

        # sendnotification to user via django notifications
        sendnotification(run, run.job.user, verb, None, None, notification_level, run.status)

        # send notification email to user
        site_url = settings.SITE_URL.rstrip("/")
        url = "{0}/status/{1}".format(site_url, run.job.uid)
        addr = run.user.email
        if run.status == TaskState.CANCELED.value:
            subject = "Your Eventkit Data Pack was CANCELED."
        else:
            subject = "Your Eventkit Data Pack is ready."
        to = [addr]
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Eventkit Team <eventkit.team@gmail.com>")
        ctx = {"url": url, "status": run.status, "job_name": run.job.name}

        text = get_template("email/email.txt").render(ctx)
        html = get_template("email/email.html").render(ctx)
        try:
            msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
            msg.attach_alternative(html, "text/html")
            msg.send()
        except Exception as e:
            logger.error("Encountered an error when sending status email: {}".format(e))

        result["stage_dir"] = stage_dir
        return result

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        super(FinalizeRunBase, self).after_return(status, retval, task_id, args, kwargs, einfo)
        stage_dir = None if retval is None else retval.get("stage_dir")
        try:
            if stage_dir and os.path.isdir(stage_dir):
                if not os.getenv("KEEP_STAGE", False):
                    shutil.rmtree(stage_dir)
            if getattr(settings, "CELERY_SCALE_BY_RUN"):
                queue_name = None if retval is None else retval.get("run_uid")
                if queue_name:
                    kill_worker(task_name=queue_name)
        except IOError or OSError:
            logger.error("Error removing {0} during export finalize".format(stage_dir))


# There's a celery bug with callbacks that use bind=True.  If altering this task do not use Bind.
# @see: https://github.com/celery/celery/issues/3723
@app.task(name="Finalize Run Task", base=FinalizeRunBase)
def finalize_run_task(result=None, run_uid=None, stage_dir=None):
    """
     Finalizes export run.

    Cleans up staging directory.
    Updates run with finish time.
    Emails user notification.
    """
    result = result or {}

    run: ExportRun = ExportRun.objects.prefetch_related("data_provider_task_records").get(uid=run_uid)
    run.status = TaskState.COMPLETED.value
    verb = NotificationVerb.RUN_COMPLETED.value
    notification_level = NotificationLevel.SUCCESS.value
    data_provider_task_records = run.data_provider_task_records.all()
    # mark run as incomplete if any tasks fail
    if any(
        getattr(TaskState, task.status, None) in TaskState.get_incomplete_states()
        for task in data_provider_task_records
    ):
        run.status = TaskState.INCOMPLETE.value
        notification_level = NotificationLevel.WARNING.value
        verb = NotificationVerb.RUN_FAILED.value
    if all(getattr(TaskState, task.status, None) == TaskState.CANCELED for task in data_provider_task_records):
        run.status = TaskState.CANCELED.value
        verb = NotificationVerb.RUN_CANCELED.value
        notification_level = NotificationLevel.WARNING.value
    run.save()

    # sendnotification to user via django notifications

    sendnotification(run, run.job.user, verb, None, None, notification_level, run.status)

    # send notification email to user
    site_url = settings.SITE_URL.rstrip("/")
    url = "{0}/status/{1}".format(site_url, run.job.uid)
    addr = run.user.email
    if run.status == TaskState.CANCELED.value:
        subject = "Your Eventkit Data Pack was CANCELED."
    else:
        subject = "Your Eventkit Data Pack is ready."
    to = [addr]
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL")
    ctx = {"url": url, "status": run.status, "job_name": run.job.name}

    text = get_template("email/email.txt").render(ctx)
    html = get_template("email/email.html").render(ctx)
    try:
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()
    except Exception as e:
        logger.error("Encountered an error when sending status email: {}".format(e))

    try:
        enforce_run_limit(run.job)
    except Exception as e:
        logger.error(e)
        logger.error("Could not enforce run limit.")

    result["run_uid"] = run_uid
    result["stage_dir"] = stage_dir
    return result


@app.task(name="Export Task Error Handler", bind=True, base=EventKitBaseTask)
def export_task_error_handler(self, result=None, run_uid=None, task_id=None, stage_dir=None, *args, **kwargs):
    """
    Handles un-recoverable errors in export tasks.
    """
    result = result or {}
    try:
        run = ExportRun.objects.get(uid=run_uid)
        try:
            if stage_dir is not None and os.path.isdir(stage_dir):
                if not os.getenv("KEEP_STAGE", False):
                    shutil.rmtree(stage_dir)
        except IOError:
            logger.error("Error removing {0} during export finalize".format(stage_dir))

        site_url = settings.SITE_URL
        url = "{0}/status/{1}".format(site_url.rstrip("/"), run.job.uid)
        addr = run.user.email
        subject = "Your Eventkit Data Pack has a failure."
        # email user and administrator
        to = [addr, settings.TASK_ERROR_EMAIL]
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Eventkit Team <eventkit.team@gmail.com>")
        ctx = {"url": url, "task_id": task_id, "job_name": run.job.name}
        text = get_template("email/error_email.txt").render(ctx)
        html = get_template("email/error_email.html").render(ctx)
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()

        # Send failed DataPack notifications to specific channel(s) or user(s) if enabled.
        rocketchat_notifications = settings.ROCKETCHAT_NOTIFICATIONS
        if rocketchat_notifications:
            if "channels" not in rocketchat_notifications:
                logger.error("Rocket Chat configuration missing or malformed.")
            channels = rocketchat_notifications["channels"]
            message = f"@here: A DataPack has failed during processing. {ctx['url']}"

            client = RocketChat(**rocketchat_notifications)
            for channel in channels:
                client.post_message(channel, message)
    except Exception as e:
        logger.exception(e)
    return result


def fail_synchronous_task_chain(data_provider_task_record=None):
    for export_task in data_provider_task_record.tasks.all():
        if TaskState[export_task.status] == TaskState.PENDING:
            export_task.status = TaskState.CANCELED.value
            export_task.save()
            kill_task.apply_async(
                kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue="{0}.priority".format(export_task.worker),
                priority=TaskPriority.CANCEL.value,
                routing_key="{0}.priority".format(export_task.worker),
            )


@app.task(name="Create preview", base=EventKitBaseTask, acks_late=True, reject_on_worker_lost=True)
def create_datapack_preview(result=None, task_uid=None, stage_dir=None, **kwargs):
    """
    Attempts to add a MapImageSnapshot (Preview Image) to a provider task.
    """
    result = result or {}
    try:
        from eventkit_cloud.utils.image_snapshot import fit_to_area, get_wmts_snapshot_image

        data_provider_task_record = (
            DataProviderTaskRecord.objects.select_related("run__job", "provider")
            .prefetch_related("tasks")
            .get(uid=task_uid)
        )

        filepath = get_export_filepath(stage_dir, data_provider_task_record.tasks.first(), "preview", "jpg")
        make_dirs(os.path.dirname(filepath))
        preview = get_wmts_snapshot_image(
            data_provider_task_record.provider.preview_url, bbox=data_provider_task_record.run.job.extents
        )
        fit_to_area(preview)
        preview.save(filepath)
        data_provider_task_record.preview = MapImageSnapshot.objects.create(file=str(filepath))
        data_provider_task_record.save()

        result["preview"] = filepath
        result["result"] = filepath

    except Exception as e:
        logger.exception(e)
    return result


@app.task(name="Cancel Export Provider Task", base=EventKitBaseTask)
def cancel_export_provider_task(
    result=None,
    data_provider_task_uid=None,
    canceling_username=None,
    delete=False,
    error=False,
    message=None,
):
    """
    Cancels an DataProviderTaskRecord and terminates each subtasks execution.
    Checks if all DataProviderTasks for the Run grouping them have finished & updates the Run's status.
    """

    # There is enough over use of this class (i.e. for errors, deletions, canceling) the reason is because it had all
    # the working logic for stopping future jobs, but that can probably be abstracted a bit, and then let the caller
    # manage the task state (i.e. the task should be FAILED or CANCELED).
    result = result or {}
    data_provider_task_record = DataProviderTaskRecord.objects.get(uid=data_provider_task_uid)

    # There might not be a canceling user...
    try:
        canceling_user = User.objects.get(username=canceling_username)
    except ObjectDoesNotExist:
        canceling_user = None

    export_tasks = data_provider_task_record.tasks.all()

    # Loop through both the tasks in the DataProviderTaskRecord model, as well as the Task Chain in celery
    for export_task in export_tasks.all():
        if delete:
            exception_class: Union[Type[CancelException], Type[DeleteException]] = DeleteException
        else:
            exception_class = CancelException
        if TaskState[export_task.status] not in TaskState.get_finished_states():
            export_task.status = TaskState.CANCELED.value
            if canceling_user:
                export_task.cancel_user = canceling_user
            export_task.save()
        # This part is to populate the UI with the cancel message.  If a different mechanism is incorporated
        # to pass task information to the users, then it may make sense to replace this.
        try:
            raise exception_class(message=message, task_name=data_provider_task_record.name, user_name=canceling_user)
        except exception_class as ce:
            einfo = ExceptionInfo()
            einfo.exception = ce
            ExportTaskException.objects.create(task=export_task, exception=pickle_exception(einfo))

        # Remove the ExportTaskResult, which will clean up the files.
        task_result = export_task.result
        if task_result:
            task_result.soft_delete()

        if int(export_task.pid) > 0 and export_task.worker:
            run_uid = data_provider_task_record.run.uid
            queue = f"{get_celery_queue_group(run_uid=run_uid, worker=export_task.worker)}.priority"
            logger.error("Canceling queue: %s", queue)
            kill_task.apply_async(
                kwargs={"result": result, "task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue=queue,
                priority=TaskPriority.CANCEL.value,
                routing_key=queue,
            )

        # Add canceled to the cache so processes can check in to see if they should abort.
        set_cache_value(
            uid=export_task.uid, attribute="status", model_name="ExportTaskRecord", value=TaskState.CANCELED.value
        )

    if TaskState[data_provider_task_record.status] not in TaskState.get_finished_states():
        if error:
            data_provider_task_record.status = TaskState.FAILED.value
        else:
            data_provider_task_record.status = TaskState.CANCELED.value
    data_provider_task_record.save()

    return result


@app.task(name="Cancel Run", base=EventKitBaseTask)
def cancel_run(result=None, export_run_uid=None, canceling_username=None, delete=False):
    result = result or {}

    export_run = ExportRun.objects.get(uid=export_run_uid)

    for export_provider_task in export_run.data_provider_task_records.all():
        cancel_export_provider_task(
            data_provider_task_uid=export_provider_task.uid,
            canceling_username=canceling_username,
            delete=delete,
        )
    result["result"] = True
    return result


@app.task(name="Kill Task", base=EventKitBaseTask)
def kill_task(result=None, task_pid=None, celery_uid=None):
    """
    Asks a worker to kill a task.
    """
    import celery

    result = result or {}

    if celery_uid:
        try:
            # Ensure the task is still running otherwise the wrong process will be killed
            if AsyncResult(str(celery_uid), app=app).state == celery.states.STARTED:
                # If the task finished prior to receiving this kill message it could throw an OSError.
                logger.info("Attempting to kill {0}".format(task_pid))
                # Don't kill tasks with default pid.
                if int(task_pid) > 0:
                    progressive_kill(task_pid)
            else:
                logger.info(
                    "The celery_uid {0} has the status of {1}.".format(
                        celery_uid, AsyncResult(celery_uid, app=app).state
                    )
                )
        except OSError:
            logger.info("{0} PID does not exist.".format(task_pid))
    return result


def parse_result(task_result, key=""):
    """
    Used to parse the celery result for a specific value.
    :param task_result: A str, dict, or list.
    :param key: A key to search dicts for
    :return: The value at the desired key or the original task result if not in a list or dict.
    """
    if not task_result:
        return None
    if isinstance(task_result, list):
        for result in task_result:
            if result.get(key):
                return result.get(key)
    elif isinstance(task_result, dict):
        return task_result.get(key)


def get_function(function):
    from importlib import import_module

    module, function_name = function.rsplit(".", 1)

    module_object = import_module(module)
    function_object = getattr(module_object, function_name)

    return function_object


def get_creation_options(config: dict, driver: str):
    """
    Gets a list of options for a specific format or returns None.
    :param config: The configuration for a datasource.
    :param driver: The file format to look for specific creation options.
    :return: A tuple of None or the first value is list of warp creation options, and
     the second value is a list of translate create options."""
    if config:
        conf = config or dict()
        params = conf.get("formats", {}).get(driver, {})
        return params.get("warp_params"), params.get("translate_params")
    return None, None


def get_ogcapi_data(
    config=None,
    task_uid=None,
    stage_dir=None,
    bbox=None,
    service_url=None,
    session_token=None,
    export_format_slug=None,
    selection=None,
    download_path=None,
):
    if download_path is None:
        raise Exception("A download path is required to download ogcapi data.")

    export_task_record = get_export_task_record(task_uid)

    geom: GEOSGeometry = get_geometry(bbox, selection)

    try:
        client: OGCAPIProcess = cast(
            OGCAPIProcess, export_task_record.export_provider_task.provider.get_service_client()
        )
        client.create_job(geom, file_format=export_format_slug)
        update_progress(task_uid, progress=25, subtask_percentage=50)
        download_url = client.get_job_results()
        if not download_url:
            raise Exception("Invalid response from OGC API server")
    except Exception as e:
        raise Exception(f"Error creating OGC API Process job:{e}")

    update_progress(task_uid, progress=50, subtask_percentage=50)

    process_session = client.get_process_session(download_url)
    download_path = download_data(task_uid, download_url, download_path, session=process_session)
    extract_metadata_files(download_path, stage_dir)

    return download_path
