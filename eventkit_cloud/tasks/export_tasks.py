# -*- coding: utf-8 -*-
from __future__ import absolute_import

import cPickle
from collections import Sequence
import json
import logging
import os
import shutil
import socket
import traceback
from zipfile import ZipFile

from django.conf import settings
from django.contrib.gis.geos import Polygon
from django.contrib.gis.geos.geometry import GEOSGeometry
from django.core.cache import caches
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template, render_to_string
from django.utils import timezone
from celery import Task
from celery.result import AsyncResult
from celery.utils.log import get_task_logger
from enum import Enum
from ..feature_selection.feature_selection import FeatureSelection
from audit_logging.celery_support import UserDetailsBase
from ..celery import app, TaskPriority
from ..utils import (
    kml, osmconf, osmparse, overpass, pbf, s3, shp, thematic_gpkg,
    external_service, wfs, wcs, arcgis_feature_service, sqlite, geopackage
)
from ..utils.hotosm_geopackage import OSMConfig, Geopackage
from .exceptions import CancelException, DeleteException


BLACKLISTED_ZIP_EXTS = ['.pbf', '.ini', '.txt', '.om5', '.osm', '.lck']

# Get an instance of a logger
logger = get_task_logger(__name__)


class TaskStates(Enum):
    COMPLETED = "COMPLETED"  # Used for runs when all tasks were successful
    INCOMPLETE = "INCOMPLETE"  # Used for runs when one or more tasks were unsuccessful
    SUBMITTED = "SUBMITTED"  # Used for runs that have not been started
    PENDING = "PENDING"  # Used for tasks that have not been started
    RUNNING = "RUNNING"  # Used for tasks that have been started
    CANCELED = "CANCELED"  # Used for tasks that have been CANCELED by the user
    SUCCESS = "SUCCESS"  # Used for tasks that have successfully completed
    FAILED = "FAILED"  # Used for tasks that have failed (an exception other than CancelException was thrown
    # or a non-zero exit code was returned.)

    @staticmethod
    def get_finished_states():
        return [TaskStates.COMPLETED, TaskStates.INCOMPLETE, TaskStates.CANCELED, TaskStates.SUCCESS]

    @staticmethod
    def get_incomplete_states():
        return [TaskStates.FAILED, TaskStates.INCOMPLETE, TaskStates.CANCELED]


# http://docs.celeryproject.org/en/latest/tutorials/task-cookbook.html
# https://github.com/celery/celery/issues/3270


class LockingTask(UserDetailsBase):
    """
    Base task with lock to prevent multiple execution of tasks with ETA.
    It's happens with multiple workers for tasks with any delay (countdown, ETA).
    You may override cache backend by setting `CELERY_TASK_LOCK_CACHE` in your Django settings file
    """
    cache = caches[getattr(settings, 'CELERY_TASK_LOCK_CACHE', 'default')]
    lock_expiration = 60 * 60 * 12  # 12 Hours

    @property
    def lock_key(self):
        """
        Unique string for task as lock key
        """
        return 'TaskLock_%s_%s_%s' % (self.__class__.__name__, self.request.id, self.request.retries)

    def acquire_lock(self):
        """
        Set lock
        """
        result = self.cache.add(self.lock_key, True, self.lock_expiration)
        logger.debug('Acquiring {0} key: {1}'.format(self.lock_key, 'succeed' if result else 'failed'))
        return result

    def __call__(self, *args, **kwargs):
        """
        Checking for lock existence
        """
        if self.acquire_lock():
            logger.debug('Task {0} started.'.format(self.request.id))
            return super(LockingTask, self).__call__(*args, **kwargs)
        logger.info('Task {0} skipped due to lock'.format(self.request.id))


def make_file_downloadable(filepath, run_uid, provider_slug='', skip_copy=False, download_filename=None):
    """ Construct the filesystem location and url needed to download the file at filepath.
        Copy filepath to the filesystem location required for download.
        @provider_slug is specific to ExportTasks, not needed for FinalizeHookTasks
        @skip_copy: It looks like sometimes (At least for OverpassQuery) we don't want the file copied,
            generally can be ignored
        @return A url to reach filepath.
    """
    download_filesystem_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
    download_url_root = settings.EXPORT_MEDIA_ROOT
    run_dir = os.path.join(download_filesystem_root, run_uid)
    filename = os.path.basename(filepath)
    if download_filename is None:
        download_filename = filename

    if getattr(settings, "USE_S3", False):
        download_url = s3.upload_to_s3(
            run_uid,
            os.path.join(provider_slug, filename),
            download_filename
        )
    else:
        try:
            if not os.path.isdir(run_dir):
                os.makedirs(run_dir)
        except OSError as e:
            logger.info(e)

        download_url = os.path.join(download_url_root, run_uid, download_filename)

        download_filepath = os.path.join(download_filesystem_root, run_uid, download_filename)
        if not skip_copy:
            shutil.copy(filepath, download_filepath)

    return download_url


# ExportTask abstract base class and subclasses.
class ExportTask(LockingTask):
    """
    Abstract base class for export tasks.
    """

    # whether to abort the whole run if this task fails.
    abort_on_error = False

    def on_success(self, retval, task_id, args, kwargs):
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
        # If a task is skipped it will be successfully completed but it won't have a return value.  These tasks should
        # just return.
        if not retval:
            return

        try:
            from ..tasks.models import (FileProducingTaskResult, ExportTask as ExportTaskModel)
            # update the task
            finished = timezone.now()
            task = ExportTaskModel.objects.get(celery_uid=task_id)
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status]:
                logging.info('Task reported on success but was previously canceled ', format(task_id))
                raise CancelException(task_name=task.export_provider_task.name, user_name=task.cancel_user.username)
            task.finished_at = finished
            task.progress = 100
            task.pid = -1
            # get the output
            output_url = retval['result']
            stat = os.stat(output_url)
            size = stat.st_size / 1024 / 1024.00
            # construct the download_path
            parts = output_url.split('/')
            filename = parts[-1]
            provider_slug = parts[-2]
            run_uid = parts[-3]
            name, ext = os.path.splitext(filename)
            download_filename = '{0}-{1}-{2}{3}'.format(
                name,
                provider_slug,
                finished.strftime('%Y%m%d'),
                ext
            )

            # construct the download url
            skip_copy = (task.name == 'OverpassQuery')
            download_url = make_file_downloadable(
                output_url, run_uid, provider_slug=provider_slug, skip_copy=skip_copy,
                download_filename=download_filename
            )

            # save the task and task result
            result = FileProducingTaskResult.objects.create(
                filename=filename,
                size=size,
                download_url=download_url
            )

            task.result = result
            task.status = TaskStates.SUCCESS.value
            task.save()
            super(ExportTask, self).on_success(retval, task_id, args, kwargs)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error('Exception in on_success handler for {}:\n{}'.format(self.name, tb))
            from billiard.einfo import ExceptionInfo
            einfo = ExceptionInfo()
            einfo.exception = e
            self.on_failure(e, task_id, args, kwargs, einfo)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Update the failed task as follows:

            1. pull out the ExportTask
            2. update the task status and finish time
            3. create an export task exception
            4. save the export task with the task exception
            5. run export_task_error_handler if the run should be aborted
               - this is only for initial tasks on which subsequent export tasks depend
        """
        from ..tasks.models import ExportTask as ExportTaskModel
        from ..tasks.models import ExportTaskException, ExportProviderTask
        task = ExportTaskModel.objects.get(celery_uid=task_id)
        task.finished_at = timezone.now()
        task.save()
        exception = cPickle.dumps(einfo)
        ete = ExportTaskException(task=task, exception=exception)
        ete.save()
        super(ExportTask, self).on_failure(exc, task_id, args, kwargs, einfo)
        if task.status != TaskStates.CANCELED.value:
            task.status = TaskStates.FAILED.value
            task.save()
            logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
            if self.abort_on_error:
                run = ExportProviderTask.objects.get(tasks__celery_uid=task_id).run
                # error_handler = export_task_error_handler()
                # run error handler
                stage_dir = kwargs['stage_dir']
                export_task_error_handler(
                    run_uid=str(run.uid),
                    task_id=task_id,
                    stage_dir=stage_dir
                )
            return {'state': TaskStates.CANCELED.value}

    def update_task_state(self, result={}, task_status=TaskStates.RUNNING.value, task_uid=None):
        """
        Update the task state and celery task uid.
        Can use the celery uid for diagnostics.
        """
        started = timezone.now()
        from ..tasks.models import ExportTask as ExportTaskModel
        try:
            task = ExportTaskModel.objects.get(uid=task_uid)
            celery_uid = self.request.id
            task.celery_uid = celery_uid
            task.save()
            result = parse_result(result, 'state') or []
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status, result]:
                logging.info('canceling before run %s', celery_uid)
                raise CancelException(task_name=task.export_provider_task.name, user_name=task.cancel_user.username)
            task.pid = os.getpid()
            task.status = task_status
            task.export_provider_task.status = TaskStates.RUNNING.value
            task.started_at = started
            task.save()
            task.export_provider_task.save()
            logger.debug('Updated task: {0} with uid: {1}'.format(task.name, task.uid))
        except DatabaseError as e:
            logger.error('Updating task {0} state throws: {1}'.format(task_uid, e))
            raise e


class FormatTask(ExportTask):
    """
    A class to manage tasks which are desired output from the user, and not merely associated files or metadata.
    """
    display = True


def osm_data_collection_pipeline(
        export_task_record_uid, stage_dir, osm_query_filters, job_name='no_job_name_specified',
        bbox=None, user_details=None, feature_selection_config=None):
    """ Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by
        export_provider_task_id.
        bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
        Valid values of feature_selection_config; thematic, simple
    """
    # --- Overpass Query
    op = overpass.Overpass(
        bbox=bbox, stage_dir=stage_dir,
        job_name=job_name, task_uid=export_task_record_uid,
        raw_data_filename='{}_query.osm'.format(job_name)
    )

    osm_data_filename = op.run_query(user_details=user_details, subtask_percentage=60)  # run the query

    # --- Convert Overpass result to PBF
    osm_filename = os.path.join(stage_dir, osm_data_filename)
    pbf_filename = os.path.join(stage_dir, '{}_query.pbf'.format(job_name))
    pbf_filepath = pbf.OSMToPBF(osm=osm_filename, pbffile=pbf_filename, task_uid=export_task_record_uid).convert()

    # --- Generate thematic gpkg from PBF
    geopackage_filepath = os.path.join(stage_dir, '{}.gpkg'.format(job_name))

    feature_selection = FeatureSelection.example(feature_selection_config)
    update_progress(export_task_record_uid, progress=75)

    geom = Polygon.from_bbox(bbox)
    g = Geopackage(pbf_filepath, geopackage_filepath, stage_dir, feature_selection, geom)
    g.run()
    ret_geopackage_filepath = g.results[0].parts[0]
    assert(ret_geopackage_filepath == geopackage_filepath)
    update_progress(export_task_record_uid, progress=100)

    return geopackage_filepath



@app.task(name="OSM Data Collection", bind=True, base=FormatTask)
def osm_data_collection_task(
        self, stage_dir, export_provider_task_id, worker='celery', osm_query_filters=None,
        job_name='no_job_name_specified', bbox=None, user_details=None,
        feature_selection_config=None):
    """ Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by
        export_provider_task_id.
        bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
        feature_selection_config: 'thematic' or 'simple'
    """
    from eventkit_cloud.tasks.models import ExportProviderTask
    from eventkit_cloud.tasks.task_runners import create_export_task_record
    export_provider_task = ExportProviderTask.objects.get(id=export_provider_task_id)
    etr = create_export_task_record(self.name, export_provider_task, worker, getattr(self, 'display', False))
    etr.celery_uid = self.request.id
    etr.save()

    if user_details is None:
        user_details = {'username': 'username not set in osm_data_collection_task'}

    gpkg_filepath = osm_data_collection_pipeline(
        etr.uid, stage_dir, osm_query_filters, job_name=job_name, bbox=bbox, user_details=user_details,
        feature_selection_config='thematic'
    )

    return {'result': gpkg_filepath}


@app.task(name="QGIS Project file (.qgs)", bind=True, base=FormatTask, abort_on_error=False)
def osm_create_styles_task(self, result={}, task_uid=None, stage_dir=None, job_name=None, provider_slug=None,
        provider_name=None, bbox=None, user_details=None
        ):
    """
    Task to create styles for osm.
    """
    self.update_task_state(result=result, task_uid=task_uid)
    input_gpkg = parse_result(result, 'geopackage')

    gpkg_file = '{}.gpkg'.format(job_name)
    style_file = os.path.join(stage_dir, '{0}-osm-{1}.qgs'.format(job_name,
                                                                  timezone.now().strftime("%Y%m%d")))

    from audit_logging.file_logging import logging_open
    with logging_open(style_file, 'w', user_details=user_details) as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'gpkg_filename': os.path.basename(gpkg_file),
                                                                      'layer_id_prefix': '{0}-osm-{1}'.format(job_name,
                                                                                                              timezone.now().strftime(
                                                                                                                  "%Y%m%d")),
                                                                      'layer_id_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'bbox': bbox,
                                                                      'provider_name': provider_name}))
    result['result'] = style_file
    result['geopackage'] = input_gpkg
    return result


# @app.task(name="OSM Data (.gpkg)", bind=True, base=FormatTask, abort_on_error=True)
# def osm_thematic_gpkg_export_task(
#         self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None):
#     """
#     Task to export thematic gpkg.
#     """
#     # This is just to make it easier to trace when user_details haven't been sent
#     if user_details is None:
#         user_details = {'username': 'unknown-osm_thematic_gpkg_export_task'}
#
#     from eventkit_cloud.tasks.models import ExportRun
#     self.update_task_state(result=result, task_uid=task_uid)
#     run = ExportRun.objects.get(uid=run_uid)
#     tags = run.job.categorised_tags
#     if os.path.isfile(os.path.join(stage_dir, '{0}.gpkg'.format(job_name))):
#         result['result'] = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
#         return result
#     # This allows the thematic task to be chained with the osm task taking the output as an input here.
#     input_gpkg = parse_result(result, 'geopackage')
#     try:
#         t2s = thematic_gpkg.ThematicGPKG(gpkg=input_gpkg, stage_dir=stage_dir, tags=tags, job_name=job_name,
#                                          task_uid=task_uid)
#         out = t2s.convert(user_details=user_details)
#         result['result'] = out
#         return result
#     except Exception as e:
#         logger.error('Raised exception in thematic gpkg task, %s', str(e))
#         raise Exception(e)  # hand off to celery..


@app.task(name='ESRI Shapefile Format', bind=True, base=FormatTask)
def shp_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None):
    """
    Class defining SHP export function.
    """
    self.update_task_state(result=result, task_uid=task_uid)
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    shapefile = os.path.join(stage_dir, '{0}_shp'.format(job_name))

    try:
        s2s = shp.GPKGToShp(gpkg=gpkg, shapefile=shapefile, task_uid=task_uid)
        out = s2s.convert()
        result['result'] = out
        result['geopackage'] = gpkg
        return result
    except Exception as e:
        logger.error('Exception while converting {} -> {}: {}'.format(gpkg, shapefile, str(e)))
        raise


@app.task(name='KML Format', bind=True, base=FormatTask)
def kml_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None):
    """
    Class defining KML export function.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    kmlfile = os.path.join(stage_dir, '{0}.kml'.format(job_name))
    try:
        s2k = kml.GPKGToKml(gpkg=gpkg, kmlfile=kmlfile, task_uid=task_uid)
        out = s2k.convert()
        result['result'] = out
        result['geopackage'] = gpkg
        return result
    except Exception as e:
        logger.error('Raised exception in kml export, %s', str(e))
        raise Exception(e)


@app.task(name='SQLITE Format', bind=True, base=FormatTask)
def sqlite_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None):
    """
    Class defining SQLITE export function.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    sqlitefile = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
    try:
        s2g = sqlite.GPKGToSQLite(gpkg=gpkg, sqlitefile=sqlitefile, task_uid=task_uid)
        out = s2g.convert()
        result['result'] = out
        result['geopackage'] = gpkg
        return result
    except Exception as e:
        logger.error('Raised exception in sqlite export, %s', str(e))
        raise Exception(e)


@app.task(name='Geopackage Format', bind=True, base=FormatTask)
def geopackage_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
        user_details=None):
    """
    Class defining geopackage export function.
    """
    from .models import ExportRun

    self.update_task_state(result=result, task_uid=task_uid)
    selection = parse_result(result, 'selection')
    gpkg = parse_result(result, 'result')
    if selection:
        gpkg = geopackage.clip_geopackage(geojson_file=selection, gpkg=gpkg, task_uid=task_uid)
    result['result'] = gpkg
    result['geopackage'] = gpkg
    return result


@app.task(name='WFSExport', bind=True, base=ExportTask)
def wfs_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None,
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None, user_details=None):
    """
    Class defining geopackage export for WFS service.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = wfs.WFSToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url, name=name, layer=layer,
                            config=config, service_type=service_type, task_uid=task_uid)
        out = w2g.convert()
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in external service export, %s', str(e))
        raise Exception(e)

@app.task(name='WCSExport', bind=True, base=ExportTask)
def wcs_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None,
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None, user_details=None):
    """
    Class defining export for WCS services
    """
    self.update_task_state(result=result, task_uid=task_uid)
    out = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        wcs2gpkg = wcs.WCStoGPKG(out=out, bbox=bbox, service_url=service_url, name=name, layer=layer,
                                 config=config, service_type=service_type, task_uid=task_uid, debug=True)
        wcs2gpkg.convert()
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in WCS service export: %s', str(e))
        raise Exception(e)


@app.task(name='ArcFeatureServiceExport', bind=True, base=FormatTask)
def arcgis_feature_service_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None,
                                       stage_dir=None, job_name=None, bbox=None, service_url=None, name=None,
                                       service_type=None, user_details=None):
    """
    Class defining sqlite export for ArcFeatureService service.
    """
    self.update_task_state(result=result, task_uid=task_uid)
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = arcgis_feature_service.ArcGISFeatureServiceToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url,
                                                                name=name, layer=layer,
                                                                config=config, service_type=service_type,
                                                                task_uid=task_uid)
        out = w2g.convert()
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in external service export, %s', str(e))
        raise Exception(e)


@app.task(name='Project file (.zip)', bind=True, base=FormatTask)
def zip_export_provider(self, result={}, job_name=None, export_provider_task_uid=None, run_uid=None, task_uid=None, stage_dir=None,
                        *args, **kwargs):
    from .models import ExportProviderTask
    from .task_runners import normalize_job_name

    self.update_task_state(result=result, task_uid=task_uid)

    # To prepare for the zipfile task, the files need to be checked to ensure they weren't
    # deleted during cancellation.
    logger.debug("Running 'zip_export_provider' for {0}".format(job_name))
    include_files = []
    export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)
    if TaskStates[export_provider_task.status] not in TaskStates.get_incomplete_states():
        for export_task in export_provider_task.tasks.all():
            try:
                filename = export_task.result.filename
            except Exception:
                logger.error("export_task: {0} did not have a result... skipping.".format(export_task.name))
                continue
            full_file_path = os.path.join(stage_dir, filename)
            if not os.path.isfile(full_file_path):
                logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                              export_task.name))
                continue
            include_files += [full_file_path]
    # Need to remove duplicates from the list because
    # some intermediate tasks produce files with the same name.
    # sorted while adding time allows comparisons in tests.
    include_files = sorted(list(set(include_files)))
    if include_files:
        logger.debug("Zipping files: {0}".format(include_files))
        zip_file = zip_file_task.run(run_uid=run_uid, include_files=include_files,
                                     file_name=os.path.join(stage_dir, "{0}.zip".format(normalize_job_name(job_name))), adhoc=True).get('result')
    else:
        raise Exception("There are no files in this provider available to zip.")
    if not zip_file:
        raise Exception("A zipfile could not be created, please contact an administrator.")
    result['result'] = zip_file
    return result


@app.task(name='Raster export (.gpkg)', bind=True, base=FormatTask)
def external_raster_service_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None,
                                        stage_dir=None, job_name=None, bbox=None, service_url=None, level_from=None,
                                        level_to=None, name=None, service_type=None, *args, **kwargs):
    """
    Class defining geopackage export for external raster service.
    """
    logger.info('Doing nothing in external_raster_service_export_task ({})'.format(self.name))
    from .models import ExportRun

    self.update_task_state(result=result, task_uid=task_uid)

    selection = parse_result(result, 'selection')
    gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = external_service.ExternalRasterServiceToGeopackage(gpkgfile=gpkgfile, bbox=bbox,
                                                                 service_url=service_url, name=name, layer=layer,
                                                                 config=config, level_from=level_from,
                                                                 level_to=level_to, service_type=service_type,
                                                                 task_uid=task_uid, selection=selection)
        gpkg = w2g.convert()
        result['result'] = gpkg
        result['geopackage'] = gpkg
        return result
    except Exception as e:
        logger.error('Raised exception in external service export, %s', str(e))
        raise Exception(e)


@app.task(name='Pickup Run', bind=True)
def pick_up_run_task(self, result={}, run_uid=None, user_details=None):
    """
    Generates a Celery task to assign a celery pipeline to a specific worker.
    """
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-pick_up_run_task'}

    from .models import ExportRun
    from .task_factory import TaskFactory

    worker = socket.gethostname()
    run = ExportRun.objects.get(uid=run_uid)
    run.worker = worker
    run.save()
    TaskFactory().parse_tasks(worker=worker, run_uid=run_uid, user_details=user_details)


@app.task(name='Clean Up Failure Task', base=UserDetailsBase)
def clean_up_failure_task(result={}, export_provider_task_uids=[], run_uid=None, run_dir=None, worker=None, *args, **kwargs):
    """
    Used to close tasks in a failed chain.

    If a task fails or is canceled, it all of the uid will be passed here and the failed object will be found and propagated,
    to the subsequent tasks in the chain. Additionally they will be finalized to ensure that the run finishes.
    """

    from eventkit_cloud.tasks.models import ExportProviderTask, ExportTaskException
    from billiard.einfo import ExceptionInfo

    task_status = None
    incomplete_export_provider_task = None
    for export_provider_task_uid in export_provider_task_uids:
        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)
        for export_task in export_provider_task.tasks.all():
            if TaskStates[export_task.status] in TaskStates.get_incomplete_states():
                if not task_status:
                    task_status = export_task.status
                    incomplete_export_provider_task = export_provider_task.name
            else:
                if task_status:
                    export_task.status = task_status
                    try:
                        raise CancelException(message="{0} could not complete because it depends on {1}".format(
                            export_provider_task.name, incomplete_export_provider_task))
                    except CancelException as ce:
                        einfo = ExceptionInfo()
                        einfo.exception = ce
                        ExportTaskException.objects.create(task=export_task, exception=cPickle.dumps(einfo))
                    export_task.save()

        finalize_export_provider_task.si(
            run_uid=run_uid,
            export_provider_task_uid=export_provider_task_uid,
            worker=worker
        ).set(queue=worker, routing_key=worker).apply_async(
            interval=1,
            max_retries=10,
            queue=worker,
            routing_key=worker,
            priority=TaskPriority.FINALIZE_PROVIDER.value)
    return result


def include_zipfile(run_uid=None, provider_tasks=[], extra_files=[]):
    """ Collects all export provider result files, combines them with @extra_files,
        and runs a zip_file_task with the resulting set of files.
    """
    from eventkit_cloud.tasks.models import ExportRun
    run = ExportRun.objects.get(uid=run_uid)

    if run.job.include_zipfile:
        # To prepare for the zipfile task, the files need to be checked to ensure they weren't
        # deleted during cancellation.
        include_files = []

        for export_provider_task in provider_tasks:
            if TaskStates[export_provider_task.status] not in TaskStates.get_incomplete_states():
                for export_task in export_provider_task.tasks.all():
                    try:
                        filename = export_task.result.filename
                    except Exception:
                        continue
                    full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                  export_provider_task.slug, filename)
                    if not os.path.isfile(full_file_path):
                        logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                                      export_task.name))
                        continue
                    include_files += [full_file_path]
        # Need to remove duplicates from the list because
        # some intermediate tasks produce files with the same name.
        include_files.extend(extra_files)
        include_files = list(set(include_files))
        if include_files:
            zip_file_task.run(run_uid=run_uid, include_files=include_files)
        else:
            logger.warn('No files to zip for run_uid/provider_tasks: {}/{}'.format(run_uid, provider_tasks))


class FinalizeRunHookTask(LockingTask):
    """ Base for tasks which execute after all export provider tasks have completed, but before finalize_run_task.
        - Ensures the task state is recorded when the task is started and after it has completed.
        - Combines new_zip_filepaths list from the previous FinalizeRunHookTask in a chain with the new
          filepaths returned from this task so they can all be passed to prepare_for_export_zip_task later in the chain.
        @params:
          new_zip_filepaths is a list of new files the previous FinalizeRunHookTask created in the export directory.
          kwarg 'run_uid' is the value of ExportRun.uid for the ExportRun which is being finalized.
        @see create_finalize_run_task_collection
        @returns: list of any new files created that should be included in the ExportRun's zip & available for
            download.  These should be located in the download directory; see example_finalize_run_hook_task
            for details.
    """

    def __call__(self, new_zip_filepaths=None, run_uid=None):
        """ Override execution so tasks derived from this aren't responsible for concatenating files
            from previous tasks to their return value.
        """
        if new_zip_filepaths is None:
            new_zip_filepaths = []

        if not isinstance(new_zip_filepaths, Sequence):
            msg = 'new_zip_filepaths is not a sequence, got: {}'.format(new_zip_filepaths)
            logger.error(msg)
            raise Exception(msg)

        self.run_uid = run_uid
        if run_uid is None:
            raise ValueError('"run_uid" is a required kwarg for tasks subclassed from FinalizeRunHookTask')

        self.record_task_state()

        # Ensure that the staging and download directories for the run this task is associated with exist
        try:
            os.makedirs(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), run_uid))
        except OSError:
            pass  # Already exists

        try:
            os.makedirs(os.path.join(settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/'), run_uid))
        except OSError:
            pass  # Already exists

        task_files = super(FinalizeRunHookTask, self).__call__(new_zip_filepaths, run_uid=run_uid)
        # task_files could be None
        task_files = task_files or []

        self.save_files_produced(task_files, run_uid)
        new_zip_filepaths.extend(task_files)
        return new_zip_filepaths

    def save_files_produced(self, new_files, run_uid):
        if len(new_files) > 0:
            from eventkit_cloud.tasks.models import FileProducingTaskResult, FinalizeRunHookTaskRecord

            for file_path in new_files:
                filename = os.path.split(file_path)[-1]
                size = os.path.getsize(file_path)
                url = make_file_downloadable(file_path, run_uid)

                fptr = FileProducingTaskResult.objects.create(filename=filename, size=size, download_url=url)
                task_record = FinalizeRunHookTaskRecord.objects.get(celery_uid=self.request.id)
                task_record.result = fptr
                task_record.save()

    def record_task_state(self, started_at=None, finished_at=None, testing_run_uid=None):
        """ When testing-only param testing_run_uid is set, this value will be used if self.run_uid is not set
        """
        run_uid = getattr(self, 'run_uid', None) or testing_run_uid
        if run_uid is None:
            msg = 'ExportRun uid is {}, unable to record task state.'.format(self.run_uid)
            logger.error(msg)
            raise TypeError(msg)

        from eventkit_cloud.tasks.models import FinalizeRunHookTaskRecord
        from eventkit_cloud.tasks.models import ExportRun

        export_run = ExportRun.objects.get(uid=run_uid)
        worker_name = self.request.hostname
        status = AsyncResult(self.request.id).status
        tr, _ = FinalizeRunHookTaskRecord.objects.get_or_create(
            run=export_run, celery_uid=self.request.id, task_name=self.name,
            status=status, pid=os.getpid(), worker=worker_name
        )

        if started_at or finished_at:
            if started_at:
                tr.started_at = started_at
            if finished_at:
                tr.finished_at = finished_at
            tr.save()

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        self.record_task_state(finished_at=timezone.now())
        super(FinalizeRunHookTask, self).after_return(status, retval, task_id, args, kwargs, einfo)


@app.task(name='Do Some Example Thing', base=FinalizeRunHookTask, bind=True)
def example_finalize_run_hook_task(self, new_zip_filepaths=[], run_uid=None):
    """ Just a placeholder hook task that doesn't do anything except create a new file to collect from the chain
        It's included in.
    """
    staging_root = settings.EXPORT_STAGING_ROOT

    f1_name = 'non_downloadable_file_not_included_in_zip'
    f1_path = os.path.join(staging_root, str(run_uid), f1_name)
    # If this were a real task, you'd do something with a file at f1_path now.
    # It won't be saved to the database for display to user or included in the zip file.

    # The path to this file is returned, so it will be duplicated to the download directory, it's location
    #    stored in the database, and passed along the finalize run task chain for inclusion in the run's zip.
    f2_name = 'downloadable_file_to_be_included_in_zip'
    f2_stage_path = os.path.join(staging_root, str(run_uid), f2_name)
    with open(f2_stage_path, 'w+') as f2:
        f2.write('hi')

    created_files = [f2_stage_path]

    logger.debug('example_finalize_run_hook_task.  Created files: {}, new_zip_filepaths: {}, run_uid: {}'\
                 .format(created_files, new_zip_filepaths, run_uid))

    return created_files


@app.task(name='Prepare Export Zip', base=FinalizeRunHookTask)
def prepare_for_export_zip_task(extra_files, run_uid=None):
    from eventkit_cloud.tasks.models import ExportRun
    run = ExportRun.objects.get(uid=run_uid)

    if run.job.include_zipfile:
        # To prepare for the zipfile task, the files need to be checked to ensure they weren't
        # deleted during cancellation.
        include_files = list(extra_files)

        provider_tasks = run.provider_tasks.all()

        for provider_task in provider_tasks:
            if TaskStates[provider_task.status] not in TaskStates.get_incomplete_states():
                for export_task in provider_task.tasks.all():
                    try:
                        filename = export_task.result.filename
                    except Exception:
                        continue
                    full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                  provider_task.slug, filename)
                    if not os.path.isfile(full_file_path):
                        logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                                      export_task.name))
                        continue
                    include_files += [full_file_path]
        # Need to remove duplicates from the list because
        # some intermediate tasks produce files with the same name.
        include_files = set(include_files)
        if include_files:
            zip_file_task.run(run_uid=run_uid, include_files=include_files)
        else:
            logger.warn('No files to zip for run_uid: {}'.format(run_uid))


@app.task(name='Finalize Export Provider Task', base=LockingTask)
def finalize_export_provider_task(result={}, run_uid=None, export_provider_task_uid=None, run_dir=None, worker=None, *args, **kwargs):
    """
    Finalizes provider task.

    Cleans up staging directory.
    Updates export provider status.
    """
    from eventkit_cloud.tasks.models import ExportProviderTask

    with transaction.atomic():
        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)

        if export_provider_task.status != TaskStates.CANCELED.value:
            export_provider_task.status = TaskStates.COMPLETED.value
            export_provider_task.save()

        # mark run as incomplete if any tasks fail
        export_tasks = export_provider_task.tasks.all()

        if (TaskStates[export_provider_task.status] != TaskStates.CANCELED) and any(
                        TaskStates[task.status] in TaskStates.get_incomplete_states() for task in export_tasks):
            export_provider_task.status = TaskStates.INCOMPLETE.value
            export_provider_task.save()

    result['finalize_status'] = export_provider_task.status
    return result


@app.task(name='Zip File Task', bind=False, base=UserDetailsBase)
def zip_file_task(include_files, run_uid=None, file_name=None, adhoc=False):
    """
    rolls up runs into a zip file
    """
    from eventkit_cloud.tasks.models import ExportRun as ExportRunModel
    download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
    staging_root = settings.EXPORT_STAGING_ROOT.rstrip('\/')

    dl_filepath = os.path.join(download_root, str(run_uid))
    st_filepath = os.path.join(staging_root, str(run_uid))

    files = []
    if not include_files:
        logger.warn("zip_file_task called with no include_files.")
        return {'result': None}
    files += [filename for filename in include_files if os.path.splitext(filename)[-1] not in BLACKLISTED_ZIP_EXTS]

    run = ExportRunModel.objects.get(uid=run_uid)

    name = run.job.name
    project = run.job.event
    date = timezone.now().strftime('%Y%m%d')
    # XXX: name-project-eventkit-yyyymmdd.zip
    if file_name:
        zip_filename = file_name
    else:
        zip_filename = "{0}-{1}-{2}-{3}.{4}".format(
            name,
            project,
            "eventkit",
            date,
            'zip'
        )

    zip_st_filepath = os.path.join(st_filepath, zip_filename)
    zip_dl_filepath = os.path.join(dl_filepath, zip_filename)
    with ZipFile(zip_st_filepath, 'w', allowZip64=True) as zipfile:
        for filepath in files:
            name, ext = os.path.splitext(filepath)
            provider_slug, name = os.path.split(name)
            provider_slug = os.path.split(provider_slug)[1]

            filename = '{0}-{1}-{2}{3}'.format(
                name,
                provider_slug,
                date,
                ext
            )
            zipfile.write(
                filepath,
                arcname=filename
            )

    # This is stupid but the whole zip setup needs to be updated, this should be just helper code, and this stuff should
    # be handled as an ExportTask.

    if not adhoc:
        run_uid = str(run_uid)
        if getattr(settings, "USE_S3", False):

            # TODO open up a stream directly to the s3 file so no local
            #      persistence is required
            zipfile_url = s3.upload_to_s3(run_uid, zip_filename, zip_filename)
            os.remove(zip_st_filepath)
        else:
            if zip_st_filepath != zip_dl_filepath:
                shutil.copy(zip_st_filepath, zip_dl_filepath)
            zipfile_url = os.path.join(run_uid, zip_filename)

        run.zipfile_url = zipfile_url
        run.save()

    result = {'result': zip_st_filepath}
    return result


class FinalizeRunTask(LockingTask):
    name = 'Finalize Export Run'

    def run(self, result={}, run_uid=None, stage_dir=None):
        """
         Finalizes export run.
    
        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
        """
        from eventkit_cloud.tasks.models import ExportRun

        run = ExportRun.objects.get(uid=run_uid)
        if run.job.include_zipfile and not run.zipfile_url:
            logger.error("THE ZIPFILE IS MISSING FROM RUN {0}".format(run.uid))
        run.status = TaskStates.COMPLETED.value
        provider_tasks = run.provider_tasks.all()

        # Complicated Celery chain from TaskFactory.parse_tasks() is incorrectly running pieces in parallel;
        #    this waits until all provider tasks have finished before continuing.
        if any(getattr(TaskStates, task.status, None) == TaskStates.PENDING for task in provider_tasks):
            finalize_run_task.retry(
                result=result, run_uid=run_uid, stage_dir=stage_dir, interval_start=4, interval_max=10
            )

        # mark run as incomplete if any tasks fail
        if any(getattr(TaskStates, task.status, None) in TaskStates.get_incomplete_states() for task in provider_tasks):
            run.status = TaskStates.INCOMPLETE.value
        if all(getattr(TaskStates, task.status, None) == TaskStates.CANCELED for task in provider_tasks):
            run.status = TaskStates.CANCELED.value
        finished = timezone.now()
        run.finished_at = finished
        run.save()

        # send notification email to user
        hostname = settings.HOSTNAME
        url = 'http://{0}/exports/{1}'.format(hostname, run.job.uid)
        addr = run.user.email
        if run.status == TaskStates.CANCELED.value:
            subject = "Your Eventkit Data Pack was CANCELED."
        else:
            subject = "Your Eventkit Data Pack is ready."
        to = [addr]
        from_email = getattr(
            settings,
            'DEFAULT_FROM_EMAIL',
            'Eventkit Team <eventkit.team@gmail.com>'
        )
        ctx = {'url': url, 'status': run.status}

        text = get_template('email/email.txt').render(ctx)
        html = get_template('email/email.html').render(ctx)
        try:
            msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
            msg.attach_alternative(html, "text/html")
            msg.send()
        except Exception as e:
            logger.error("Encountered an error when sending status email: {}".format(e))

        result['stage_dir'] = stage_dir
        return result

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        super(FinalizeRunTask, self).after_return(status, retval, task_id, args, kwargs, einfo)
        stage_dir = None if retval is None else retval.get('stage_dir')
        try:
            if stage_dir:
                shutil.rmtree(stage_dir)
        except IOError or OSError:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))

finalize_run_task = FinalizeRunTask()
app.tasks.register(finalize_run_task)


# There's a celery bug with callbacks that use bind=True.  This task wraps an invocation of finalize_run_task
# without bind=True for use as an errback. @see: https://github.com/celery/celery/issues/3723
@app.task(name='Finalize Run as ErrBack')
def finalize_run_task_as_errback(run_uid=None, stage_dir=None):
    finalize_run_task.s({}, run_uid=run_uid, stage_dir=stage_dir).apply_async()


@app.task(name='Export Task Error Handler', bind=True, base=LockingTask)
def export_task_error_handler(self, result={}, run_uid=None, task_id=None, stage_dir=None):
    """
    Handles un-recoverable errors in export tasks.
    """
    from eventkit_cloud.tasks.models import ExportRun
    run = ExportRun.objects.get(uid=run_uid)
    try:
        if os.path.isdir(stage_dir):
            # DON'T leave the stage_dir in place for debugging
            shutil.rmtree(stage_dir)
    except IOError:
        logger.error('Error removing {0} during export finalize'.format(stage_dir))

    site_url = settings.SITE_URL
    url = '{0}/status/{1}'.format(site_url.rstrip('/'), run.job.uid)
    addr = run.user.email
    subject = "Your Eventkit Data Pack has a failure."
    # email user and administrator
    to = [addr, settings.TASK_ERROR_EMAIL]
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Eventkit Team <eventkit.team@gmail.com>')
    ctx = {
        'url': url,
        'task_id': task_id,
        'job_name': run.job.name
    }
    text = get_template('email/error_email.txt').render(ctx)
    html = get_template('email/error_email.html').render(ctx)
    msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
    msg.attach_alternative(html, "text/html")
    msg.send()
    return result


@app.task(name='Cancel Export Provider Task', base=LockingTask)
def cancel_export_provider_task(result={}, export_provider_task_uid=None, canceling_user=None, delete=False):
    """
    Cancels an ExportProviderTask and terminates each subtasks execution.
    Checks if all ExportProviderTasks for the Run grouping them have finished & updates the Run's status.
    """
    from ..tasks.models import ExportProviderTask, ExportTaskException, FileProducingTaskResult
    from ..tasks.exceptions import CancelException
    from billiard.einfo import ExceptionInfo
    from datetime import datetime, timedelta

    export_provider_task = ExportProviderTask.objects.filter(uid=export_provider_task_uid).first()

    if not export_provider_task:
        result['result'] = False
        return result

    export_tasks = export_provider_task.tasks.all()

    # Loop through both the tasks in the ExportProviderTask model, as well as the Task Chain in celery
    for export_task in export_tasks.filter(~Q(status=TaskStates.CANCELED.value)):
        if delete:
            exception_class = DeleteException
        else:
            exception_class = CancelException
        if TaskStates[export_task.status] not in TaskStates.get_finished_states():
            export_task.status = TaskStates.CANCELED.value
            export_task.cancel_user = canceling_user
            export_task.save()
        # This part is to populate the UI with the cancel message.  If a different mechanism is incorporated
        # to pass task information to the users, then it may make sense to replace this.
        try:
            raise exception_class(task_name=export_provider_task.name, user_name=canceling_user)
        except exception_class as ce:
            einfo = ExceptionInfo()
            einfo.exception = ce
            ExportTaskException.objects.create(task=export_task, exception=cPickle.dumps(einfo))

        # Remove the ExportTaskResult, which will clean up the files.
        task_result = export_task.result
        if task_result:
            task_result.soft_delete()

        if export_task.pid > 0 and export_task.worker:
            kill_task.apply_async(
                kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue="{0}.cancel".format(export_task.worker),
                priority=TaskPriority.CANCEL.value,
                routing_key="{0}.cancel".format(export_task.worker))

    if TaskStates[export_provider_task.status] not in TaskStates.get_finished_states():
        export_provider_task.status = TaskStates.CANCELED.value
    export_provider_task.save()

    # Because the task is revoked the follow on is never run... if using revoke this is required, if using kill,
    # this can probably be removed as the task will simply fail and the follow on task from the task_factory will
    # pick up the task.
    run_uid = export_provider_task.run.uid
    worker = export_provider_task.tasks.first().worker
    # Because we don't care about the files in a canceled task the stage dir can be the run dir,
    # which will be cleaned up in final steps.
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run_uid))

    finalize_export_provider_task.si(
        run_uid=run_uid,
        stage_dir=stage_dir,
        export_provider_task_uid=export_provider_task_uid,
        worker=worker
    ).set(queue=worker, routing_key=worker).apply_async(
        interval=1,
        max_retries=10,
        expires=datetime.now() + timedelta(days=2),
        priority=TaskPriority.FINALIZE_PROVIDER.value,
        routing_key=worker,
        queue=worker
    )
    return result


@app.task(name='Cancel Run', base=LockingTask)
def cancel_run(result={}, export_run_uid=None, canceling_user=None, revoke=None, delete=False):
    from ..tasks.models import ExportRun

    export_run = ExportRun.objects.filter(uid=export_run_uid).first()

    if not export_run:
        result['result'] = False
        return result

    for export_provider_task in export_run.provider_tasks.all():
        # Note that a user object `canceling_user` can't be serialized if using apply_async or delay query user after call.
        cancel_export_provider_task.run(export_provider_task_uid=export_provider_task.uid,
                                        canceling_user=canceling_user,
                                        delete=delete)
    result['result'] = True
    return result


@app.task(name='Kill Task', base=LockingTask)
def kill_task(result={}, task_pid=None, celery_uid=None):
    """
    Asks a worker to kill a task.
    """

    import os, signal
    import celery

    if task_pid:
        # Don't kill tasks with default pid.
        if task_pid <= 0:
            return
        try:
            # Ensure the task is still running otherwise the wrong process will be killed
            if AsyncResult(celery_uid, app=app).state == celery.states.STARTED:
                # If the task finished prior to receiving this kill message it could throw an OSError.
                os.kill(task_pid, signal.SIGTERM)
        except OSError:
            logger.info("{0} PID does not exist.")
    return result


def update_progress(task_uid, progress=None, subtask_percentage=100.0, estimated_finish=None):
    """
    Updates the progress of the ExportTask from the given task_uid.
    :param task_uid: A uid to reference the ExportTask.
    :param subtask_percentage: is the percentage of the task referenced by task_uid the caller takes up.
    :return: A function which can be called to update the progress on an ExportTask.
    """
    if task_uid is None:
        return

    from ..tasks.models import ExportTask
    from django.db import connection

    if not estimated_finish and not progress:
        return

    absolute_progress = progress * (subtask_percentage / 100.0)
    if absolute_progress > 100:
        absolute_progress = 100

    # We need to close the existing connection because the logger could be using a forked process which,
    # will be invalid and throw an error.
    connection.close()

    export_task = ExportTask.objects.get(uid=task_uid)
    if absolute_progress:
        export_task.progress = absolute_progress
    if estimated_finish:
        export_task.estimated_finish = estimated_finish
    export_task.save()


def parse_result(task_result, key=''):
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
