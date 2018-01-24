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
from zipfile import ZipFile, ZIP_DEFLATED

from django.conf import settings
from django.contrib.gis.geos import Polygon

from django.core.cache import caches
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template, render_to_string
from django.utils import timezone
from celery import signature
from celery.result import AsyncResult
from celery.utils.log import get_task_logger
from enum import Enum
from ..feature_selection.feature_selection import FeatureSelection
from audit_logging.celery_support import UserDetailsBase
from ..ui.helpers import get_style_files, generate_qgs_style
from ..celery import app, TaskPriority
from ..utils import (
    kml, overpass, pbf, s3, shp, external_service, wfs, wcs, arcgis_feature_service, sqlite, geopackage, gdalutils
)
from ..utils.hotosm_geopackage import Geopackage
from ..utils.geopackage import add_file_metadata

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
        return [TaskStates.COMPLETED, TaskStates.INCOMPLETE, TaskStates.CANCELED, TaskStates.SUCCESS, TaskStates.FAILED]

    @staticmethod
    def get_incomplete_states():
        return [TaskStates.FAILED, TaskStates.INCOMPLETE, TaskStates.CANCELED]


# http://docs.celeryproject.org/en/latest/tutorials/task-cookbook.html
# https://github.com/celery/celery/issues/3270

class LockingTask(UserDetailsBase):
    """
    Base task with lock to prevent multiple execution of tasks with ETA.
    It happens with multiple workers for tasks with any delay (countdown, ETA). Its a bug
    https://github.com/celery/kombu/issues/337.
    You may override cache backend by setting `CELERY_TASK_LOCK_CACHE` in your Django settings file.

    This task can also be used to ensure that a task isn't running at the same time as another task by specifying,
    a lock_key in the task arguments.  If the lock_key is present but unavailable the task will be tried again later.
    """
    cache = caches[getattr(settings, 'CELERY_TASK_LOCK_CACHE', 'default')]
    lock_expiration = 60 * 60 * 12  # 12 Hours
    lock_key = None
    max_retries = None

    def get_lock_key(self):
        """
        Unique string for task as lock key
        """
        return 'TaskLock_%s_%s_%s' % (self.__class__.__name__, self.request.id, self.request.retries)

    def acquire_lock(self, lock_key=None, value="True"):
        """
        Set lock.
        :param lock_key: Location to store lock.
        :param value: Some value to store for audit.
        :return:
        """
        result = False
        lock_key = lock_key or self.get_lock_key()
        try:
            result = self.cache.add(lock_key, value, self.lock_expiration)
            # result = self.cache.add(str(self.lock_key), value, self.lock_expiration)
            logger.info('Acquiring {0} key: {1}'.format(lock_key, 'succeed' if result else 'failed'))
        finally:
            return result

    def __call__(self, *args, **kwargs):
        """
        Checking for lock existence then call otherwise re-queue
        """
        retry = False
        logger.debug("enter __call__ for {0}".format(self.request.id))

        lock_key = kwargs.get('locking_task_key')
        worker = kwargs.get('worker')
        task_settings = {
            'interval': 4, 'max_retries': 10, 'queue': worker, 'routing_key': worker,
            'priority': TaskPriority.TASK_RUNNER.value}

        if lock_key:
            self.lock_expiration = 5
            self.lock_key = lock_key
            retry = True
        else:
            self.lock_key = self.get_lock_key()

        if self.acquire_lock(lock_key=lock_key, value=self.request.id):
            logger.debug('Task {0} started.'.format(self.request.id))
            logger.debug("exit __call__ for {0}".format(self.request.id))
            return super(LockingTask, self).__call__(*args, **kwargs)
        else:
            if retry:
                logger.warn('Task {0} waiting for lock {1} to be free.'.format(self.request.id, lock_key))
                if worker:
                    self.apply_async(args=args, kwargs=kwargs)
                else:
                    self.delay(*args, **kwargs)
            else:
                logger.info('Task {0} skipped due to lock'.format(self.request.id))

    def after_return(self, *args, **kwargs):
        logger.debug('Task {0} releasing lock'.format(self.request.id))
        self.cache.delete(self.lock_key)
        super(LockingTask, self).after_return(*args, **kwargs)


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


# ExportTaskRecord abstract base class and subclasses.
class ExportTask(LockingTask):
    """
    Abstract base class for export tasks.
    """

    # whether to abort the whole provider if this task fails.
    abort_on_error = False

    def __call__(self, *args, **kwargs):
        task_uid = kwargs.get('task_uid')

        try:
            from ..tasks.models import (FileProducingTaskResult, ExportTaskRecord)
            task = ExportTaskRecord.objects.get(uid=task_uid)

            try:
                task_state_result = args[0]
            except IndexError:
                task_state_result = None
            self.update_task_state(result=task_state_result, task_uid=task_uid)

            retval = super(ExportTask, self).__call__(*args, **kwargs)

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
            # If a task is skipped it will be successfully completed but it won't have a return value.  These tasks
            # should just return.
            if not retval:
                return
            # update the task
            finished = timezone.now()
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status]:
                logging.info('Task reported on success but was previously canceled ', format(task_uid))
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
            retval['status'] = TaskStates.SUCCESS.value
            return retval
        except CancelException as e:
            return {'status': TaskStates.CANCELED.value}
        except Exception as e:
            tb = traceback.format_exc()
            logger.error('Exception in the handler for {}:\n{}'.format(self.name, tb))
            from billiard.einfo import ExceptionInfo
            einfo = ExceptionInfo()
            result = self.task_failure(e, task_uid, args, kwargs, einfo)
            return result

    @transaction.atomic
    def task_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Update the failed task as follows:

            1. pull out the ExportTaskRecord
            2. update the task status and finish time
            3. create an export task exception
            4. save the export task with the task exception
            5. run export_task_error_handler if the run should be aborted
               - this is only for initial tasks on which subsequent export tasks depend
        """
        from ..tasks.models import ExportTaskRecord
        from ..tasks.models import ExportTaskException, DataProviderTaskRecord
        try:
            task = ExportTaskRecord.objects.get(uid=task_id)
            task.finished_at = timezone.now()
            task.save()
        except Exception:
            import traceback
            logger.error(traceback.format_exc())
            logger.error('Cannot update the status of ExportTaskRecord object: no such object has been created for '
                         'this task yet.')
        exception = cPickle.dumps(einfo)
        ete = ExportTaskException(task=task, exception=exception)
        ete.save()
        if task.status != TaskStates.CANCELED.value:
            task.status = TaskStates.FAILED.value
            task.save()
            logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
            if self.abort_on_error:
                export_provider_task = DataProviderTaskRecord.objects.get(tasks__uid=task_id)
                cancel_synchronous_task_chain(export_provider_task_uid=export_provider_task.uid)
                run = export_provider_task.run
                stage_dir = kwargs['stage_dir']
                export_task_error_handler(
                    run_uid=str(run.uid),
                    task_id=task_id,
                    stage_dir=stage_dir
                )
            return {'status': TaskStates.FAILED.value}
        return {'status': TaskStates.CANCELED.value}

    def update_task_state(self, result=None, task_status=TaskStates.RUNNING.value, task_uid=None):
        """
        Update the task state and celery task uid.
        Can use the celery uid for diagnostics.
        """
        result = result or {}
        started = timezone.now()
        from ..tasks.models import ExportTaskRecord
        try:
            task = ExportTaskRecord.objects.get(uid=task_uid)
            celery_uid = self.request.id
            task.celery_uid = celery_uid
            task.save()
            result = parse_result(result, 'status') or []
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status, result]:
                logging.info('canceling before run %s', celery_uid)
                task.status = TaskStates.CANCELED.value
                task.save()
                raise CancelException(task_name=task.export_provider_task.name)
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


class AbortOnErrorTask(ExportTask):
    abort_on_error = True


class FormatTask(ExportTask):
    """
    A class to manage tasks which are desired output from the user, and not merely associated files or metadata.
    """
    display = True


def osm_data_collection_pipeline(
        export_task_record_uid, stage_dir, job_name='no_job_name_specified',
        bbox=None, user_details=None, config=None):
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
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

    feature_selection = FeatureSelection.example(config)
    update_progress(export_task_record_uid, progress=75)

    geom = Polygon.from_bbox(bbox)
    g = Geopackage(pbf_filepath, geopackage_filepath, stage_dir, feature_selection, geom)
    g.run()

    # --- Add the Land Boundaries polygon layer
    database = settings.DATABASES['feature_data']
    in_dataset = 'PG:"dbname={name} host={host} user={user} password={password} port={port}"'.format(host=database['HOST'],
                                        user=database['USER'],
                                        password=database['PASSWORD'].replace('$', '\$'),
                                        port=database['PORT'],
                                        name=database['NAME'])

    gdalutils.clip_dataset(boundary=bbox, in_dataset=in_dataset, out_dataset=geopackage_filepath, table="land_polygons", fmt='gpkg')

    ret_geopackage_filepath = g.results[0].parts[0]
    assert(ret_geopackage_filepath == geopackage_filepath)
    update_progress(export_task_record_uid, progress=100)

    return geopackage_filepath


@app.task(name="OSM (.gpkg)", bind=True, base=FormatTask, abort_on_error=True)
def osm_data_collection_task(
        self, result=None, stage_dir=None, run_uid=None, provider_slug=None, task_uid=None,
        job_name='no_job_name_specified', bbox=None, user_details=None,
        config=None, *args, **kwargs):
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
    """
    from .models import ExportRun

    logger.debug("enter run for {0}".format(self.name))


    result = result or {}
    run = ExportRun.objects.get(uid=run_uid)

    if user_details is None:
        user_details = {'username': 'username not set in osm_data_collection_task'}

    gpkg_filepath = osm_data_collection_pipeline(
        task_uid, stage_dir, job_name=job_name, bbox=bbox, user_details=user_details,
        config=config
    )

    selection = parse_result(result, 'selection')
    if selection:
        logger.debug("Calling clip_dataset with boundary={}, in_dataset={}".format(selection, gpkg_filepath))
        gpkg_filepath = gdalutils.clip_dataset(boundary=selection, in_dataset=gpkg_filepath, fmt=None)

    result['result'] = gpkg_filepath
    result['geopackage'] = gpkg_filepath

    result = add_metadata_task(result=result, job_uid=run.job.uid, provider_slug=provider_slug)

    logger.debug("exit run for {0}".format(self.name))

    return result


@app.task(name="Add Metadata", bind=True, base=UserDetailsBase, abort_on_error=False)
def add_metadata_task(self, result=None, job_uid=None, provider_slug=None, user_details=None, *args, **kwargs):
    """
    Task to create styles for osm.
    """
    from ..jobs.models import Job, DataProvider

    job = Job.objects.get(uid=job_uid)

    provider = DataProvider.objects.get(slug=provider_slug)
    result = result or {}
    input_gpkg = parse_result(result, 'geopackage')
    date_time = timezone.now()
    bbox = job.extents
    metadata_values = {"fileIdentifier": '{0}-{1}-{2}'.format(job.name, provider.slug, date_time.strftime("%Y%m%d")),
                       "abstract": job.description,
                       "title": job.name,
                       "westBoundLongitude": bbox[0],
                       "southBoundLatitude": bbox[1],
                       "eastBoundLongitude": bbox[2],
                       "northBoundLatitude": bbox[3],
                       "URL": provider.preview_url,
                       "applicationProfile": None,
                       "code": None,
                       "name": provider.name,
                       "description": provider.service_description,
                       "dateStamp": date_time.isoformat()
                       }

    metadata = render_to_string('data/geopackage_metadata.xml', context=metadata_values)

    add_file_metadata(input_gpkg, metadata)

    result['result'] = input_gpkg
    result['geopackage'] = input_gpkg
    return result


@app.task(name='ESRI Shapefile Format', bind=True, base=FormatTask)
def shp_export_task(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None,
                    *args, **kwargs):
    """
    Class defining SHP export function.
    """
    result = result or {}
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
def kml_export_task(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None,
                    *args, **kwargs):
    """
    Class defining KML export function.
    """
    result = result or {}

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
def sqlite_export_task(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
                       user_details=None, *args, **kwargs):
    """
    Class defining SQLITE export function.
    """
    result = result or {}

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


@app.task(name='Area of Interest (.geojson)', bind=True, base=ExportTask)
def output_selection_geojson_task(self, result=None, task_uid=None, selection=None, stage_dir=None, provider_slug=None,
                                  *args, **kwargs):
    """
    Class defining geopackage export function.
    """
    result = result or {}

    geojson_file = os.path.join(stage_dir,
                                "{0}_selection.geojson".format(provider_slug))
    if selection:
        # Test if json.
        json.loads(selection)
        from audit_logging.file_logging import logging_open
        user_details = kwargs.get('user_details')
        with logging_open(geojson_file, 'w', user_details=user_details) as open_file:
            open_file.write(selection)
        result['selection'] = geojson_file
        result['result'] = geojson_file

    return result


@app.task(name='Geopackage Format', bind=True, base=FormatTask)
def geopackage_export_task(self, result={}, run_uid=None, task_uid=None,
        user_details=None, *args, **kwargs):

    """
    Class defining geopackage export function.
    """
    from .models import ExportRun, ExportTaskRecord

    result = result or {}
    run = ExportRun.objects.get(uid=run_uid)
    task = ExportTaskRecord.objects.get(uid=task_uid)

    selection = parse_result(result, 'selection')
    if selection:
        gpkg = parse_result(result, 'result')
        gdalutils.clip_dataset(boundary=selection, in_dataset=gpkg, fmt=None)

    add_metadata_task(result=result, job_uid=run.job.uid, provider_slug=task.export_provider_task.slug)
    gpkg = parse_result(result, 'result')
    gpkg = gdalutils.convert(dataset=gpkg, fmt='gpkg', task_uid=task_uid)

    result['result'] = gpkg
    result['geopackage'] = gpkg
    return result


@app.task(name='Geotiff Format (.tif)', bind=True, base=FormatTask)
def geotiff_export_task(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
                        user_details=None, *args, **kwargs):
    """
    Class defining geopackage export function.
    """
    from .models import ExportRun
    result = result or {}

    gtiff = parse_result(result, 'result')
    selection = parse_result(result, 'selection')
    if selection:
        gdalutils.clip_dataset(boundary=selection, in_dataset=gtiff, fmt=None)

    gtiff = gdalutils.convert(dataset=gtiff, fmt='gtiff', task_uid=task_uid)

    result['result'] = gtiff
    result['geotiff'] = gtiff
    return result


@app.task(name='Clip Export', bind=True, base=LockingTask)
def clip_export_task(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, user_details=None,
                     *args, **kwargs):
    """
    Clips a dataset to a vector cutline and returns a dataset of the same format.
    :param self:
    :param result:
    :param run_uid:
    :param task_uid:
    :param stage_dir:
    :param job_name:
    :param user_details:
    :return:
    """
    result = result or {}
    # self.update_task_state(result=result, task_uid=task_uid)

    dataset = parse_result(result, 'result')
    selection = parse_result(result, 'selection')
    if selection:
        dataset = gdalutils.clip_dataset(boundary=selection, in_dataset=dataset, fmt=None)

    result['result'] = dataset
    return result


@app.task(name='WFSExport', bind=True, base=ExportTask, abort_on_error=True)
def wfs_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None,
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None, user_details=None,
                    *args, **kwargs):
    """
    Class defining geopackage export for WFS service.
    """
    result = result or {}

    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = wfs.WFSToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url, name=name, layer=layer,
                            config=config, service_type=service_type, task_uid=task_uid)
        out = w2g.convert()
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in wfs export, %s', str(e))
        raise Exception(e)


@app.task(name='WCS Export', bind=True, base=ExportTask, abort_on_error=True)
def wcs_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None,
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None, user_details=None,
                    *args, **kwargs):
    """
    Class defining export for WCS services
    """
    result = result or {}
    out = os.path.join(stage_dir, '{0}.tif'.format(job_name))
    try:
        wcs_conv = wcs.WCSConverter(out=out, bbox=bbox, service_url=service_url, name=name, layer=layer,
                                    config=config, service_type=service_type, task_uid=task_uid, debug=True,
                                    fmt="gtiff")
        wcs_conv.convert()
        result['result'] = out
        result['geotiff'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in WCS service export: %s', str(e))
        raise Exception(e)


@app.task(name='ArcFeatureServiceExport', bind=True, base=FormatTask)
def arcgis_feature_service_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None,
                                       stage_dir=None, job_name=None, bbox=None, service_url=None, name=None,
                                       service_type=None, user_details=None,
                                       *args, **kwargs):
    """
    Class defining sqlite export for ArcFeatureService service.
    """
    result = result or {}
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = arcgis_feature_service.ArcGISFeatureServiceToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url,
                                                                name=name, layer=layer,
                                                                config=config, service_type=service_type,
                                                                task_uid=task_uid,
                                                                *args, **kwargs)
        out = w2g.convert()
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in arcgis feature service export, %s', str(e))
        raise Exception(e)


@app.task(name='Project file (.zip)', bind=True, base=FormatTask)
def zip_export_provider(self, result=None, job_name=None, export_provider_task_uid=None, run_uid=None, task_uid=None,
                        stage_dir=None, *args, **kwargs):
    from .models import DataProviderTaskRecord
    from .task_runners import normalize_name

    result = result or {}

    # To prepare for the zipfile task, the files need to be checked to ensure they weren't
    # deleted during cancellation.
    logger.debug("Running 'zip_export_provider' for {0}".format(job_name))
    include_files = []
    export_provider_task = DataProviderTaskRecord.objects.get(uid=export_provider_task_uid)
    if TaskStates[export_provider_task.status] not in TaskStates.get_incomplete_states():
        for export_task in export_provider_task.tasks.all():
            try:
                filename = export_task.result.filename
                export_task.display = False
            except Exception:
                logger.error("export_task: {0} did not have a result... skipping.".format(export_task.name))
                continue
            full_file_path = os.path.join(stage_dir, filename)
            if not os.path.isfile(full_file_path):
                logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                              export_task.name))
                continue
            include_files += [full_file_path]
            export_task.save()
    # Need to remove duplicates from the list because
    # some intermediate tasks produce files with the same name.
    # sorted while adding time allows comparisons in tests.
    include_files = sorted(list(set(include_files)))
    if include_files:
        qgs_style_file = generate_qgs_style(run_uid=run_uid, export_provider_task=export_provider_task)
        include_files += [qgs_style_file]
        logger.debug("Zipping files: {0}".format(include_files))
        zip_file = zip_file_task.run(run_uid=run_uid, include_files=include_files,
                                     file_name=os.path.join(stage_dir, "{0}.zip".format(normalize_name(job_name))),
                                     adhoc=True, static_files=get_style_files()).get('result')
    else:
        raise Exception("There are no files in this provider available to zip.")
    if not zip_file:
        raise Exception("A zipfile could not be created, please contact an administrator.")
    result['result'] = zip_file

    return result


@app.task(name='Area of Interest (.gpkg)', bind=True, base=ExportTask)
def bounds_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, provider_slug=None,
                       *args, **kwargs):
    """
    Class defining geopackage export function.
    """
    user_details = kwargs.get('user_details')
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-bounds_export_task'}

    from .models import ExportRun

    run = ExportRun.objects.get(uid=run_uid)

    result_gpkg = parse_result(result, 'geopackage')
    bounds = run.job.the_geom.geojson or run.job.bounds_geojson

    gpkg = os.path.join(stage_dir, '{0}_bounds.gpkg'.format(provider_slug))
    gpkg = geopackage.add_geojson_to_geopackage(
        geojson=bounds, gpkg=gpkg, layer_name='bounds', task_uid=task_uid, user_details=user_details
    )

    result['result'] = gpkg
    result['geopackage'] = result_gpkg
    return result


@app.task(name='Raster export (.gpkg)', bind=True, base=FormatTask, abort_on_error=True)
def external_raster_service_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None,
                                        stage_dir=None, job_name=None, bbox=None, service_url=None, level_from=None,
                                        level_to=None, name=None, service_type=None, *args, **kwargs):
    """
    Class defining geopackage export for external raster service.
    """

    from .models import ExportRun, ExportTaskRecord

    result = result or {}
    run = ExportRun.objects.get(uid=run_uid)
    task = ExportTaskRecord.objects.get(uid=task_uid)

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
        add_metadata_task(result=result, job_uid=run.job.uid, provider_slug=task.export_provider_task.slug)

        return result
    except Exception as e:
        logger.error('Raised exception in raster service export, %s', str(e))
        raise Exception(e)


@app.task(name='Pickup Run', bind=True)
def pick_up_run_task(self, result=None, run_uid=None, user_details=None, *args, **kwargs):
    """
    Generates a Celery task to assign a celery pipeline to a specific worker.
    """
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-pick_up_run_task'}

    from .models import ExportRun
    from .task_factory import TaskFactory

    try:
        worker = socket.gethostname()
        run = ExportRun.objects.get(uid=run_uid)
        run.worker = worker
        run.save()
        TaskFactory().parse_tasks(worker=worker, run_uid=run_uid, user_details=user_details)
    except Exception:
        run.status = TaskStates.FAILED.value
        run.save()


#This could be improved by using Redis or Memcached to help manage state.
@app.task(name='Wait For Providers', base=LockingTask)
def wait_for_providers_task(result=None, apply_args=None, run_uid=None, callback_task=None, *args, **kwargs):
    from .models import ExportRun

    if isinstance(callback_task, dict):
        callback_task = signature(callback_task)

    run = ExportRun.objects.filter(uid=run_uid).first()
    if run:
        if all(TaskStates[provider_task.status] in TaskStates.get_finished_states() for provider_task in run.provider_tasks.all()):
            callback_task.apply_async(**apply_args)
        else:
            logger.error("Waiting for other tasks to finish.")
    else:
        raise Exception("A run could not be found for uid {0}".format(run_uid))


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
                provider_slug = os.path.split(file_path)[-2]
                size = os.path.getsize(file_path)
                url = make_file_downloadable(file_path, run_uid, provider_slug=provider_slug)

                result = FileProducingTaskResult.objects.create(filename=filename, size=size, download_url=url)
                task_record = FinalizeRunHookTaskRecord.objects.get(celery_uid=self.request.id)
                task_record.result = result
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
def example_finalize_run_hook_task(self, new_zip_filepaths=[], run_uid=None, *args, **kwargs):
    """ Just a placeholder hook task that doesn't do anything except create a new file to collect from the chain
        It's included in.
    """
    staging_root = settings.EXPORT_STAGING_ROOT

    f1_name = 'non_downloadable_file_not_included_in_zip'
    # If this were a real task, you'd do something with a file at f1_path now.
    # It won't be saved to the database for display to user or included in the zip file.

    # The path to this file is returned, so it will be duplicated to the download directory, it's location
    #    stored in the database, and passed along the finalize run task chain for inclusion in the run's zip.
    f2_name = 'downloadable_file_to_be_included_in_zip'
    f2_stage_path = os.path.join(staging_root, str(run_uid), f2_name)
    with open(f2_stage_path, 'w+') as f2:
        f2.write('hi')

    created_files = [f2_stage_path]

    logger.debug('example_finalize_run_hook_task.  Created files: {}, new_zip_filepaths: {}, run_uid: {}' \
                 .format(created_files, new_zip_filepaths, run_uid))

    return created_files


@app.task(name='Prepare Export Zip', base=FinalizeRunHookTask)
def prepare_for_export_zip_task(result=None, extra_files=None, run_uid=None, *args, **kwargs):
    from eventkit_cloud.tasks.models import ExportRun
    run = ExportRun.objects.get(uid=run_uid)

    # To prepare for the zipfile task, the files need to be checked to ensure they weren't
    # deleted during cancellation.
    include_files = list([])

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
                # Exclude zip files created by zip_export_provider
                if full_file_path.endswith(".zip") == False:
                    include_files += [full_file_path]

    if include_files:
        # No need to add QGIS file if there aren't any files to be zipped.
        qgs_style_file = generate_qgs_style(run_uid=run_uid)
        include_files += [qgs_style_file]
        # Need to remove duplicates from the list because
        # some intermediate tasks produce files with the same name.
        # and add the static resources
        include_files = set(include_files)

    return include_files


@app.task(name='Finalize Export Provider Task', base=UserDetailsBase)
def finalize_export_provider_task(result=None, export_provider_task_uid=None,
                                  status=None, *args, **kwargs):
    """
    Finalizes provider task.

    Cleans up staging directory.
    Updates export provider status.
    """

    from eventkit_cloud.tasks.models import DataProviderTaskRecord
    # if the status was a success, we can assume all the ExportTasks succeeded. if not, we need to parse ExportTasks to
    # mark tasks not run yet as cancelled.
    result_status = parse_result(result, 'status')

    with transaction.atomic():

        export_provider_task = DataProviderTaskRecord.objects.get(uid=export_provider_task_uid)
        if TaskStates[result_status] != TaskStates.SUCCESS:
            export_provider_task.status = TaskStates.INCOMPLETE.value
        else:
            export_provider_task.status = TaskStates.COMPLETED.value

        export_provider_task.finished_at = timezone.now()
        export_provider_task.save()

    return result


@app.task(name='Zip File Task', bind=False, base=UserDetailsBase)
def zip_file_task(include_files, run_uid=None, file_name=None, adhoc=False, static_files=None, *args, **kwargs):
    """
    rolls up runs into a zip file
    """
    from eventkit_cloud.tasks.models import ExportRun as ExportRunModel
    from .task_runners import normalize_name
    from django import db

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
            normalize_name(name),
            normalize_name(project),
            "eventkit",
            date,
            'zip'
        )

    zip_st_filepath = os.path.join(st_filepath, zip_filename)
    zip_dl_filepath = os.path.join(dl_filepath, zip_filename)
    with ZipFile(zip_st_filepath, 'a', compression=ZIP_DEFLATED, allowZip64=True) as zipfile:
        if static_files:
            for absolute_file_path, relative_file_path in static_files.iteritems():
                zipfile.write(
                    absolute_file_path,
                    arcname=relative_file_path
                )
        for filepath in files:
            name, ext = os.path.splitext(filepath)
            provider_slug, name = os.path.split(name)
            provider_slug = os.path.split(provider_slug)[1]

            if filepath.endswith(".qgs"):
                # put the style file in the root of the zip
                filename = '{0}{1}'.format(
                    name,
                    ext
                    )
            else:
                # Put the files into directories based on their provider_slug
                # prepend with `data`
                filename = 'data/{0}/{1}-{0}-{2}{3}'.format(
                    provider_slug,
                    name,
                    date,
                    ext
                    )

            zipfile.write(
                filepath,
                arcname=filename
            )

    # This is stupid but the whole zip setup needs to be updated, this should be just helper code, and this stuff should
    # be handled as an ExportTaskRecord.

    if not adhoc:
        run_uid = str(run_uid)
        if getattr(settings, "USE_S3", False):
            zipfile_url = s3.upload_to_s3(run_uid, zip_st_filepath, zip_filename)
        else:
            if zip_st_filepath != zip_dl_filepath:
                shutil.copy(zip_st_filepath, zip_dl_filepath)
            zipfile_url = os.path.join(run_uid, zip_filename)

        #Update Connection
        db.close_old_connections()
        run.refresh_from_db()

        run.zipfile_url = zipfile_url

        try:
            run.save()
        except Exception as e:
            logger.error(e)

    result = {'result': zip_st_filepath}
    return result


class FinalizeRunBase(LockingTask):

    name = 'Finalize Export Run'

    def run(self, result=None, run_uid=None, stage_dir=None):
        """
         Finalizes export run.

        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
        """
        from eventkit_cloud.tasks.models import ExportRun
        result = result or {}

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
        super(FinalizeRunBase, self).after_return(status, retval, task_id, args, kwargs, einfo)
        stage_dir = None if retval is None else retval.get('stage_dir')
        try:
            if stage_dir and os.path.isdir(stage_dir):
                shutil.rmtree(stage_dir)
        except IOError or OSError:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))


# There's a celery bug with callbacks that use bind=True.  If altering this task do not use Bind.
# @see: https://github.com/celery/celery/issues/3723
@app.task(name='Finalize Run Task', base=FinalizeRunBase)
def finalize_run_task(result=None, run_uid=None, stage_dir=None, apply_args=None, *args, **kwargs):
    """
             Finalizes export run.

            Cleans up staging directory.
            Updates run with finish time.
            Emails user notification.
            """
    from eventkit_cloud.tasks.models import ExportRun
    result = result or {}

    run = ExportRun.objects.get(uid=run_uid)
    if run.job.include_zipfile and not run.zipfile_url:
        logger.error("THE ZIPFILE IS MISSING FROM RUN {0}".format(run.uid))
    run.status = TaskStates.COMPLETED.value
    provider_tasks = run.provider_tasks.all()

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


@app.task(name='Export Task Error Handler', bind=True)
def export_task_error_handler(self, result=None, run_uid=None, task_id=None, stage_dir=None, *args, **kwargs):
    """
    Handles un-recoverable errors in export tasks.
    """
    from eventkit_cloud.tasks.models import ExportRun
    result = result or {}

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


def cancel_synchronous_task_chain(export_provider_task_uid=None):
    from ..tasks.models import DataProviderTaskRecord
    export_provider_task = DataProviderTaskRecord.objects.filter(uid=export_provider_task_uid).first()
    for export_task in export_provider_task.tasks.all():
        if TaskStates[export_task.status] == TaskStates.PENDING.value:
            export_task.status = TaskStates.CANCELED.value
            export_task.save()
            kill_task.apply_async(
                kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue="{0}.cancel".format(export_task.worker),
                priority=TaskPriority.CANCEL.value,
                routing_key="{0}.cancel".format(export_task.worker))


@app.task(name='Cancel Export Provider Task', base=LockingTask)
def cancel_export_provider_task(result=None, export_provider_task_uid=None, canceling_username=None, delete=False,
                                error=False, *args, **kwargs):
    """
    Cancels an DataProviderTaskRecord and terminates each subtasks execution.
    Checks if all DataProviderTasks for the Run grouping them have finished & updates the Run's status.
    """

    #There is enough over use of this class (i.e. for errors, deletions, canceling) the reason is because it had all
    #the working logic for stopping future jobs, but that can probably be abstracted a bit, and then let the caller
    # manage the task state (i.e. the task should be FAILED or CANCELED).
    from ..tasks.models import DataProviderTaskRecord, ExportTaskException
    from ..tasks.exceptions import CancelException
    from billiard.einfo import ExceptionInfo
    from django.contrib.auth.models import User

    result = result or {}

    export_provider_task = DataProviderTaskRecord.objects.filter(uid=export_provider_task_uid).first()
    canceling_user = User.objects.filter(username=canceling_username).first()

    if not export_provider_task:
        result['result'] = False
        return result

    export_tasks = export_provider_task.tasks.all()

    # Loop through both the tasks in the DataProviderTaskRecord model, as well as the Task Chain in celery
    for export_task in export_tasks.filter(~Q(status=TaskStates.CANCELED.value) | ~Q(status=TaskStates.FAILED.value)):
        if delete:
            exception_class = DeleteException
        else:
            exception_class = CancelException
        if TaskStates[export_task.status] not in TaskStates.get_finished_states():
            export_task.status = TaskStates.CANCELED.value
            if canceling_user:
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
        if error:
            export_provider_task.status = TaskStates.FAILED.value
        else:
            export_provider_task.status = TaskStates.CANCELED.value
    export_provider_task.save()

    #if error:
    #    finalize_export_provider_task(
    #        result={'status': TaskStates.INCOMPLETE.value}, export_provider_task_uid=export_provider_task_uid,
    #        status=TaskStates.INCOMPLETE.value
    #    )
    #else:
    #    finalize_export_provider_task(
    #        result={'status': TaskStates.INCOMPLETE.value}, export_provider_task_uid=export_provider_task_uid,
    #        status=TaskStates.CANCELED.value
    #    )

    return result


@app.task(name='Cancel Run', base=UserDetailsBase)
def cancel_run(result=None, export_run_uid=None, canceling_username=None, delete=False, *args, **kwargs):
    from ..tasks.models import ExportRun

    result = result or {}

    export_run = ExportRun.objects.filter(uid=export_run_uid).first()

    if not export_run:
        result['result'] = False
        return result

    for export_provider_task in export_run.provider_tasks.all():
        cancel_export_provider_task(export_provider_task_uid=export_provider_task.uid,
                                    canceling_username=canceling_username, delete=delete,
                                    locking_task_key="cancel_export_provider_task-{0}".format(export_provider_task.uid))
    result['result'] = True
    return result


@app.task(name='Kill Task', base=LockingTask)
def kill_task(result=None, task_pid=None, celery_uid=None, *args, **kwargs):
    """
    Asks a worker to kill a task.
    """

    import os, signal
    import celery
    result = result or {}

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
    Updates the progress of the ExportTaskRecord from the given task_uid.
    :param task_uid: A uid to reference the ExportTaskRecord.
    :param subtask_percentage: is the percentage of the task referenced by task_uid the caller takes up.
    :return: A function which can be called to update the progress on an ExportTaskRecord.
    """
    if task_uid is None:
        return

    from ..tasks.models import ExportTaskRecord
    from django.db import connection

    if not estimated_finish and not progress:
        return

    absolute_progress = progress * (subtask_percentage / 100.0)
    if absolute_progress > 100:
        absolute_progress = 100

    # We need to close the existing connection because the logger could be using a forked process which,
    # will be invalid and throw an error.
    connection.close()

    export_task = ExportTaskRecord.objects.get(uid=task_uid)
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


def get_function(function):
    from importlib import import_module

    module, function_name = function.rsplit('.', 1)

    module_object = import_module(module)
    function_object = getattr(module_object, function_name)

    return function_object
