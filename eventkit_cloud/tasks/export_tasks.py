# -*- coding: utf-8 -*-

import json
import logging
import os
import re
import shutil
import socket
import traceback
from zipfile import ZipFile, ZIP_DEFLATED

from audit_logging.celery_support import UserDetailsBase
from celery import signature
from celery.result import AsyncResult
from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.gis.geos import Polygon
from django.core.cache import caches
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template, render_to_string
from django.utils import timezone

from eventkit_cloud.celery import app, TaskPriority
from eventkit_cloud.core.helpers import sendnotification, NotificationVerb, NotificationLevel
from eventkit_cloud.feature_selection.feature_selection import FeatureSelection
from eventkit_cloud.tasks.enumerations import TaskStates
from eventkit_cloud.tasks.exceptions import CancelException, DeleteException
from eventkit_cloud.tasks.helpers import normalize_name, get_archive_data_path, get_run_download_url, \
    get_download_filename, get_run_staging_dir, get_provider_staging_dir, get_run_download_dir, Directory, \
    default_format_time, progressive_kill, get_style_files, generate_qgs_style, create_license_file, \
    get_human_readable_metadata_document, pickle_exception, get_data_type_from_provider, get_arcgis_metadata
from eventkit_cloud.utils.auth_requests import get_cred
from eventkit_cloud.utils import (
    overpass, pbf, s3, mapproxy, wcs, geopackage, gdalutils
)
from eventkit_cloud.utils.ogr import OGR
from eventkit_cloud.utils.stats.eta_estimator import ETA


BLACKLISTED_ZIP_EXTS = ['.ini', '.om5', '.osm', '.lck', '.pyc']

# Get an instance of a logger
logger = get_task_logger(__name__)


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
            'priority': TaskPriority.RUN_TASK.value}

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


def make_file_downloadable(filepath, run_uid, provider_slug=None, skip_copy=False, download_filename=None,
                           size=None, direct=False):
    """ Construct the filesystem location and url needed to download the file at filepath.
        Copy filepath to the filesystem location required for download.
        @provider_slug is specific to ExportTasks, not needed for FinalizeHookTasks
        @skip_copy: It looks like sometimes (At least for OverpassQuery) we don't want the file copied,
            generally can be ignored
        @direct: If true, return the direct download URL and skip the Downloadable tracking step
        @return A url to reach filepath.
    """

    staging_dir = get_run_staging_dir(run_uid)
    if provider_slug:
        staging_dir = get_provider_staging_dir(run_uid, provider_slug)
    run_download_dir = get_run_download_dir(run_uid)
    run_download_url = get_run_download_url(run_uid)

    filename = os.path.basename(filepath)
    if download_filename is None:
        download_filename = filename

    if getattr(settings, "USE_S3", False):
        download_url = s3.upload_to_s3(
            run_uid,
            os.path.join(staging_dir, filename),
            download_filename,
        )
    else:
        make_dirs(run_download_dir)

        download_url = os.path.join(run_download_url, download_filename)

        download_filepath = os.path.join(run_download_dir, download_filename)
        if not skip_copy:
            shutil.copy(filepath, download_filepath)

    return download_url


# ExportTaskRecord abstract base class and subclasses.
class ExportTask(UserDetailsBase):
    """
    Abstract base class for export tasks.
    """

    # whether to abort the whole provider if this task fails.
    abort_on_error = False

    def __call__(self, *args, **kwargs):

        from eventkit_cloud.tasks.models import FileProducingTaskResult, ExportTaskRecord
        task_uid = kwargs.get('task_uid')

        try:
            task = ExportTaskRecord.objects.get(uid=task_uid)

            try:
                task_state_result = args[0]
            except IndexError:
                task_state_result = None
            self.update_task_state(result=task_state_result, task_uid=task_uid)

            if not TaskStates.CANCELED.value in [task.status, task.export_provider_task.status]:
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
            # If a task is skipped it will be successfully completed but it won't have a return value.
            # Something needs to be populated to notify the user and to skip the following steps.
            if not (retval and retval.get('result')):
                raise Exception("This task was skipped due to previous failures/cancellations.")
            # update the task
            finished = timezone.now()
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status]:
                logging.info('Task reported on success but was previously canceled ', format(task_uid))
                username = None
                if task.cancel_user:
                    username = task.cancel_user.username
                raise CancelException(task_name=task.export_provider_task.name, user_name=username)

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
            if provider_slug == 'run':
                event = normalize_name(task.export_provider_task.run.job.event)
                download_filename = get_download_filename(name,
                                                          finished,
                                                          ext,
                                                          additional_descriptors=[event, 'eventkit'])
            else:
                download_filename = get_download_filename(name,
                                                          finished,
                                                          ext,
                                                          additional_descriptors=provider_slug)

            # construct the download url
            skip_copy = (task.name == 'OverpassQuery')
            download_url = make_file_downloadable(
                output_url, run_uid, provider_slug=provider_slug, skip_copy=skip_copy,
                download_filename=download_filename,
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
        from eventkit_cloud.tasks.models import ExportTaskRecord
        from eventkit_cloud.tasks.models import ExportTaskException, DataProviderTaskRecord
        try:
            task = ExportTaskRecord.objects.get(uid=task_id)
            task.finished_at = timezone.now()
            task.save()
        except Exception:
            import traceback
            logger.error(traceback.format_exc())
            logger.error('Cannot update the status of ExportTaskRecord object: no such object has been created for '
                         'this task yet.')
        ete = ExportTaskException(task=task, exception=pickle_exception(einfo))
        ete.save()
        if task.status != TaskStates.CANCELED.value:
            task.status = TaskStates.FAILED.value
            task.save()
            logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
            if self.abort_on_error:
                export_provider_task = DataProviderTaskRecord.objects.get(tasks__uid=task_id)
                cancel_synchronous_task_chain(data_provider_task_uid=export_provider_task.uid)
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
        from eventkit_cloud.tasks.models import ExportTaskRecord
        try:
            task = ExportTaskRecord.objects.get(uid=task_uid)
            celery_uid = self.request.id
            if not celery_uid:
                raise Exception("Failed to save celery_UID")
            task.celery_uid = celery_uid
            task.save()
            result = parse_result(result, 'status') or []
            if TaskStates.CANCELED.value in [task.status, task.export_provider_task.status, result]:
                logging.info('canceling before run %s', celery_uid)
                task.status = TaskStates.CANCELED.value
                task.save()
                raise CancelException(task_name=task.export_provider_task.name)
            # The parent ID is actually the process running in celery.
            task.pid = os.getppid()
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


@gdalutils.retry
def osm_data_collection_pipeline(
        export_task_record_uid, stage_dir, job_name='no_job_name_specified', url=None, slug=None,
        bbox=None, user_details=None, config=None, eta=None):
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
    """
    # Reasonable subtask_percentages we're determined by profiling code sections on a developer workstation
    # TODO: Biggest impact to improving ETA estimates reqs higher fidelity tracking of run_query and clip_dataset

    # --- Overpass Query
    op = overpass.Overpass(
        bbox=bbox, stage_dir=stage_dir, slug=slug, url=url,
        job_name=job_name, task_uid=export_task_record_uid,
        raw_data_filename='{}_query.osm'.format(job_name)
    )

    osm_data_filename = op.run_query(user_details=user_details, subtask_percentage=65, eta=eta)  # run the query

    # --- Convert Overpass result to PBF
    osm_filename = os.path.join(stage_dir, osm_data_filename)
    pbf_filename = os.path.join(stage_dir, '{}_query.pbf'.format(job_name))
    pbf_filepath = pbf.OSMToPBF(osm=osm_filename, pbffile=pbf_filename, task_uid=export_task_record_uid).convert()

    # --- Generate thematic gpkg from PBF
    geopackage_filepath = os.path.join(stage_dir, '{}.gpkg'.format(job_name))

    if config is None:
        logger.error("No configuration was provided for OSM export")
        raise RuntimeError("The configuration field is required for OSM data providers")

    feature_selection = FeatureSelection.example(config)

    update_progress(export_task_record_uid, progress=67, eta=eta, msg='Converting data to Geopackage')
    geom = Polygon.from_bbox(bbox)
    g = geopackage.Geopackage(pbf_filepath, geopackage_filepath, stage_dir, feature_selection, geom,
                   export_task_record_uid=export_task_record_uid)
    g.run(subtask_start=77, subtask_percentage=8, eta=eta)  # 77% to 85%

    # --- Add the Land Boundaries polygon layer, this accounts for the majority of post-processing time
    update_progress(export_task_record_uid, 85.5, eta=eta, msg='Clipping data in Geopackage')

    database = settings.DATABASES['feature_data']
    in_dataset = 'PG:"dbname={name} host={host} user={user} password={password} port={port}"'.format(
        host=database['HOST'],
        user=database['USER'],
        password=database['PASSWORD'].replace('$', '\$'),
        port=database['PORT'],
        name=database['NAME'])
    gdalutils.clip_dataset(boundary=bbox, in_dataset=in_dataset, out_dataset=geopackage_filepath, table="land_polygons",
                           fmt='gpkg')

    ret_geopackage_filepath = g.results[0].parts[0]
    assert (ret_geopackage_filepath == geopackage_filepath)
    update_progress(export_task_record_uid, progress=100, eta=eta, msg="Completed OSM data collection pipeline")

    return geopackage_filepath


@app.task(name="OSM (.gpkg)", bind=True, base=FormatTask, abort_on_error=True, acks_late=True)
def osm_data_collection_task(
        self, result=None, stage_dir=None, run_uid=None, provider_slug=None, overpass_url=None, task_uid=None,
        job_name='no_job_name_specified', bbox=None, user_details=None,
        config=None, *args, **kwargs):
    """
    Collects data from OSM & produces a thematic gpkg as a subtask of the task referenced by export_provider_task_id.
    bbox expected format is an iterable of the form [ long0, lat0, long1, lat1 ]
    """
    from eventkit_cloud.tasks.models import ExportRun

    logger.debug("enter run for {0}".format(self.name))
    debug_os = None

    try:
        # Uncomment debug_os to generate a simple CSV of the progress log that can be used to evaluate the accuracy
        # of ETA estimates
        # debug_os = open("{}_progress_log.csv".format(task_uid), 'w')
        eta = ETA(task_uid=task_uid, debug_os=debug_os)

        result = result or {}
        run = ExportRun.objects.get(uid=run_uid)

        if user_details is None:
            user_details = {'username': 'username not set in osm_data_collection_task'}

        gpkg_filepath = osm_data_collection_pipeline(
            task_uid, stage_dir, slug=provider_slug, job_name=job_name, bbox=bbox, user_details=user_details,
            url=overpass_url, config=config, eta=eta
        )

        selection = parse_result(result, 'selection')
        if selection:
            logger.debug("Calling clip_dataset with boundary={}, in_dataset={}".format(selection, gpkg_filepath))
            gpkg_filepath = gdalutils.clip_dataset(boundary=selection, in_dataset=gpkg_filepath, fmt=None)

        result['result'] = gpkg_filepath
        result['geopackage'] = gpkg_filepath

        result = add_metadata_task(result=result, job_uid=run.job.uid, provider_slug=provider_slug)

        logger.debug("exit run for {0}".format(self.name))
    finally:
        if debug_os:
            debug_os.close()

    return result


@app.task(name="Add Metadata", bind=True, base=UserDetailsBase, abort_on_error=False)
def add_metadata_task(self, result=None, job_uid=None, provider_slug=None, user_details=None, *args, **kwargs):
    """
    Task to create metadata to a geopackage.
    """
    from eventkit_cloud.jobs.models import Job, DataProvider

    job = Job.objects.get(uid=job_uid)

    provider = DataProvider.objects.get(slug=provider_slug)
    result = result or {}
    input_gpkg = parse_result(result, 'geopackage')
    date_time = timezone.now()
    bbox = job.extents
    metadata_values = {"fileIdentifier": '{0}-{1}-{2}'.format(job.name, provider.slug, default_format_time(date_time)),
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

    geopackage.add_file_metadata(input_gpkg, metadata)

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
        ogr = OGR(task_uid=task_uid)
        out = ogr.convert(file_format='ESRI Shapefile', in_file=gpkg, out_file=shapefile,
                          params="-lco 'ENCODING=UTF-8' -overwrite")
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
        ogr = OGR(task_uid=task_uid)
        out = ogr.convert(file_format='KML', in_file=gpkg, out_file=kmlfile)
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
        ogr = OGR(task_uid=task_uid)
        out = ogr.convert(file_format='SQLite', in_file=gpkg, out_file=sqlitefile)
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

    geojson_file = os.path.join(stage_dir, "{0}_selection.geojson".format(provider_slug))
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
    from eventkit_cloud.tasks.models import ExportRun, ExportTaskRecord

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
    result = result or {}

    gtiff = parse_result(result, 'result')
    selection = parse_result(result, 'selection')
    if selection:
        gtiff = gdalutils.clip_dataset(boundary=selection, in_dataset=gtiff, fmt='gtiff', task_uid=task_uid)
    else:
        gtiff = gdalutils.convert(dataset=gtiff, fmt='gtiff', task_uid=task_uid)

    result['result'] = gtiff
    result['geotiff'] = gtiff
    return result


@app.task(name='Clip Export', bind=True, base=UserDetailsBase)
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

    # Strip out query string parameters that might conflict
    service_url = re.sub(r"(?i)(?<=[?&])(version|service|request|typename|srsname)=.*?(&|$)", "",
                              service_url)
    query_str = 'SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={}&SRSNAME=EPSG:4326'.format(layer)
    if "?" in service_url:
        if "&" != service_url[-1]:
            service_url += "&"
        service_url += query_str
    else:
        service_url += "?" + query_str

    url = service_url
    cred = get_cred(slug=name, url=url)
    if cred:
        user, pw = cred
        if not re.search(r"(?<=://)[a-zA-Z0-9\-._~]+:[a-zA-Z0-9\-._~]+(?=@)", url):
            url = re.sub(r"(?<=://)", "%s:%s@" % (user, pw), url)

    if bbox:
        params = "-skipfailures -spat {w} {s} {e} {n}".format(
            w=bbox[0], s=bbox[1], e=bbox[2], n=bbox[3])
    else:
        params = "-skipfailures"

    try:
        ogr = OGR(task_uid=task_uid)
        out = ogr.convert(file_format='GPKG', in_file="WFS:\"{}\"".format(url), out_file=gpkg, params=params)
        result['result'] = out
        result['geopackage'] = out
        # Check for geopackage contents; gdal wfs driver fails silently
        if not geopackage.check_content_exists(out):
            raise Exception("Empty response: Unknown layer name '{}' or invalid AOI bounds".format(layer))
        return result
    except Exception as e:
        logger.error('Raised exception in wfs export: {}'.format(str(e)))
        raise Exception(e)


@app.task(name='WCS Export', bind=True, base=ExportTask, abort_on_error=True, acks_late=True)
def wcs_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None,
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None, user_details=None,
                    *args, **kwargs):
    """
    Class defining export for WCS services
    """
    from eventkit_cloud.tasks.models import ExportTaskRecord

    result = result or {}
    out = os.path.join(stage_dir, '{0}.tif'.format(job_name))

    eta = ETA(task_uid=task_uid)
    task = ExportTaskRecord.objects.get(uid=task_uid)
    try:
        wcs_conv = wcs.WCSConverter(config=config, out=out, bbox=bbox, service_url=service_url, layer=layer, debug=True,
                                    name=name, task_uid=task_uid, fmt="gtiff", slug=task.export_provider_task.slug,
                                    user_details=user_details, eta=eta)
        out = wcs_conv.convert()
        result['result'] = out
        result['geotiff'] = out

        return result
    except Exception as e:
        logger.error('Raised exception in WCS service export: %s', str(e))
        raise Exception(e)


@app.task(name='ArcFeatureServiceExport', bind=True, base=FormatTask)
def arcgis_feature_service_export_task(self, result=None, task_uid=None,
                                       stage_dir=None, job_name=None, bbox=None, service_url=None,
                                       *args, **kwargs):
    """
    Class defining sqlite export for ArcFeatureService service.
    """
    result = result or {}
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        if not os.path.exists(os.path.dirname(gpkg)):
            os.makedirs(os.path.dirname(gpkg), 6600)

        try:
            # remove any url query so we can add our own
            service_url = service_url.split('/query?')[0]
        except ValueError:
            # if no url query we can just check for trailing slash and move on
            service_url = service_url.rstrip('/\\')
        finally:
            service_url = '{}{}'.format(service_url, '/query?where=objectid%3Dobjectid&outfields=*&f=json')

        if bbox:
            params = "-skipfailures -t_srs EPSG:3857 -spat_srs EPSG:4326 -spat {w} {s} {e} {n}".format(
                w=bbox[0], s=bbox[1], e=bbox[2], n=bbox[3])
        else:
            params = "-skipfailures -t_srs EPSG:3857"

        ogr = OGR(task_uid=task_uid)
        out = ogr.convert(file_format='GPKG', in_file=service_url, out_file=gpkg, params=params)
        result['result'] = out
        result['geopackage'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in arcgis feature service export, %s', str(e))
        raise Exception(e)


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

    from eventkit_cloud.tasks.models import ExportRun

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


@app.task(name='Raster export (.gpkg)', bind=True, base=FormatTask, abort_on_error=True, acks_late=True)
def mapproxy_export_task(self, result=None, layer=None, config=None, run_uid=None, task_uid=None,
                         stage_dir=None, job_name=None, bbox=None, service_url=None, level_from=None,
                         level_to=None, name=None, service_type=None, *args, **kwargs):
    """
    Class defining geopackage export for external raster service.
    """

    from eventkit_cloud.tasks.models import ExportRun, ExportTaskRecord

    result = result or {}
    run = ExportRun.objects.get(uid=run_uid)
    task = ExportTaskRecord.objects.get(uid=task_uid)
    # ETA estimator will be initialized by the eventkit_cloud.utils.mapproxy.CustomLogger

    selection = parse_result(result, 'selection')

    gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    try:
        w2g = mapproxy.MapproxyGeopackage(gpkgfile=gpkgfile, bbox=bbox,
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

    from eventkit_cloud.tasks.models import ExportRun
    from eventkit_cloud.tasks.task_factory import TaskFactory
    run = ExportRun.objects.get(uid=run_uid)
    try:
        worker = socket.gethostname()
        run.worker = worker
        run.save()
        TaskFactory().parse_tasks(worker=worker, run_uid=run_uid, user_details=user_details)
    except Exception as e:
        run.status = TaskStates.FAILED.value
        run.save()
        logger.error(str(e))
        raise


# This could be improved by using Redis or Memcached to help manage state.
@app.task(name='Wait For Providers', base=UserDetailsBase, acks_late=True)
def wait_for_providers_task(result=None, apply_args=None, run_uid=None, callback_task=None, *args, **kwargs):
    from eventkit_cloud.tasks.models import ExportRun

    if isinstance(callback_task, dict):
        callback_task = signature(callback_task)

    run = ExportRun.objects.filter(uid=run_uid).first()
    if run:
        provider_tasks = run.provider_tasks.filter(~Q(slug='run'))
        if all(TaskStates[provider_task.status] in TaskStates.get_finished_states() for provider_task in
               provider_tasks):
            callback_task.apply_async(**apply_args)
        else:
            logger.error("Waiting for other tasks to finish.")
    else:
        raise Exception("A run could not be found for uid {0}".format(run_uid))


@app.task(name='Project File (.zip)', base=FormatTask, acks_late=True)
def create_zip_task(result=None, data_provider_task_uid=None, *args, **kwargs):
    """
    :param result: The celery task result value, it should be a dict with the current state.
    :param data_provider_task_uid: A data provider to zip (this or run_uid must be passed).
    :return: The run files, or a single zip file if data_provider_task_uid is passed.
    """
    from eventkit_cloud.tasks.models import DataProviderTaskRecord
    from eventkit_cloud.tasks.helpers import get_metadata

    if not result:
        result = {}

    data_provider_task = DataProviderTaskRecord.objects.get(uid=data_provider_task_uid)
    metadata = get_metadata(data_provider_task_uid)

    include_files = metadata['include_files']
    if include_files:
        arcgis_dir = os.path.join(get_run_staging_dir(metadata['run_uid']), Directory.ARCGIS.value)
        make_dirs(arcgis_dir)
        arcgis_metadata_file = os.path.join(arcgis_dir, 'metadata.json')
        arcgis_metadata = get_arcgis_metadata(metadata)
        with open(arcgis_metadata_file, 'w') as open_md_file:
            json.dump(arcgis_metadata, open_md_file)
        include_files += [arcgis_metadata_file]
        # No need to add QGIS file if there aren't any files to be zipped.
        include_files += [generate_qgs_style(metadata)]
        include_files += [get_human_readable_metadata_document(metadata)]
        # Need to remove duplicates from the list because
        # some intermediate tasks produce files with the same name.
        # and add the static resources
        include_files = set(include_files)
        result['result'] = zip_files(include_files=include_files,
                                     file_path=os.path.join(get_provider_staging_dir(metadata['run_uid'],
                                                                                     data_provider_task.slug),
                                                            "{0}.zip".format(metadata['name'])),
                                     static_files=get_style_files())
    else:
        raise Exception("Could not create a zip file because there were not files to include.")
    return result


@app.task(name='Finalize Export Provider Task', base=UserDetailsBase)
def finalize_export_provider_task(result=None, data_provider_task_uid=None,
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
        export_provider_task = DataProviderTaskRecord.objects.get(uid=data_provider_task_uid)
        if TaskStates[result_status] == TaskStates.CANCELED:
            export_provider_task.status = TaskStates.CANCELED.value
        elif TaskStates[result_status] != TaskStates.SUCCESS:
            export_provider_task.status = TaskStates.INCOMPLETE.value
        else:
            export_provider_task.status = TaskStates.COMPLETED.value
        export_provider_task.finished_at = timezone.now()
        export_provider_task.save()

    return result


@gdalutils.retry
def zip_files(include_files, file_path=None, static_files=None, *args, **kwargs):
    """
    Contains the organization for the files within the archive.
    :param include_files: A list of files to be included.
    :param run_uid: The UUID of the export run.
    :param file_path: An optional name for the archive.
    :param static_files: Files that are in the same location for every datapack (i.e. templates and metadata files).
    :return: The zipfile path.
    """

    if not include_files:
        logger.error("zip_file_task called with no include_files.")
        raise Exception("zip_file_task called with no include_files.")

    if not file_path:
        logger.error("zip_file_task called no file path.")
        raise Exception("zip_file_task called no file path.")

    files = [filename for filename in include_files if os.path.splitext(filename)[-1] not in BLACKLISTED_ZIP_EXTS]

    with ZipFile(file_path, 'a', compression=ZIP_DEFLATED, allowZip64=True) as zipfile:
        if static_files:
            for absolute_file_path, relative_file_path in static_files.items():
                if '__pycache__' in absolute_file_path:
                    continue
                filename = relative_file_path
                # Support files should go in the correct directory.  It might make sense to break these files up
                # by directory and then just put each directory in the correct location so that we don't have to
                # list all support files in the future.
                basename = os.path.basename(absolute_file_path)
                if basename == "__init__.py":
                    continue
                elif os.path.basename(os.path.dirname(absolute_file_path)) == Directory.ARCGIS.value:
                    if basename in ["create_mxd.py", "ReadMe.txt"]:
                        filename = os.path.join(Directory.ARCGIS.value, '{0}'.format(basename))
                    else:
                        # Put the support files in the correct directory.
                        filename = os.path.join(Directory.ARCGIS.value, Directory.TEMPLATES.value, '{0}'.format(basename))
                zipfile.write(
                    absolute_file_path,
                    arcname=filename
                )
        for filepath in files:
            # This takes files from the absolute stage paths and puts them in the provider directories in the data dir.
            # (e.g. staging_root/run_uid/provider_slug/file_name.ext -> data/provider_slug/file_name.ext)
            name, ext = os.path.splitext(filepath)
            provider_slug, name = os.path.split(name)
            provider_slug = os.path.split(provider_slug)[1]

            if filepath.endswith((".qgs", "ReadMe.txt")):
                # put the style file in the root of the zip
                filename = '{0}{1}'.format(
                    name,
                    ext
                )
            elif filepath.endswith("metadata.json"):
                # put the metadata file in arcgis folder unless it becomes more useful.
                filename = os.path.join(Directory.ARCGIS.value, '{0}{1}'.format(
                    name,
                    ext
                ))
            else:
                # Put the files into directories based on their provider_slug
                # prepend with `data`
                download_filename = get_download_filename(
                    name,
                    timezone.now(),
                    ext,
                    additional_descriptors=provider_slug
                )
                filename = get_archive_data_path(
                    provider_slug,
                    download_filename
                )

            zipfile.write(
                filepath,
                arcname=filename
            )
        
        if zipfile.testzip():
            raise Exception("The zipped file was corrupted.")

    return file_path


class FinalizeRunBase(UserDetailsBase):
    name = 'Finalize Export Run'

    def run(self, result=None, run_uid=None, stage_dir=None):
        """
         Finalizes export run.

        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
        """
        """
        """
        from eventkit_cloud.tasks.models import ExportRun
        result = result or {}

        run = ExportRun.objects.get(uid=run_uid)
        run.status = TaskStates.COMPLETED.value
        notification_level = NotificationLevel.SUCCESS.value
        verb = NotificationVerb.RUN_COMPLETED.value
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
            notification_level = NotificationLevel.WARNING.value
            verb = NotificationVerb.RUN_FAILED.value
        if all(getattr(TaskStates, task.status, None) == TaskStates.CANCELED for task in provider_tasks):
            run.status = TaskStates.CANCELED.value
            notification_level = NotificationLevel.WARNING.value
            verb = NotificationVerb.RUN_CANCELED.value
        finished = timezone.now()
        run.finished_at = finished
        run.save()

        # sendnotification to user via django notifications
        sendnotification(run, run.job.user, verb, None, None, notification_level, run.status)

        # send notification email to user
        site_url = settings.SITE_URL.rstrip('/')
        url = '{0}/exports/{1}'.format(site_url, run.job.uid)
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
                if not os.getenv('KEEP_STAGE', False):
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
    run.status = TaskStates.COMPLETED.value
    verb = NotificationVerb.RUN_COMPLETED.value
    notification_level = NotificationLevel.SUCCESS.value
    provider_tasks = run.provider_tasks.all()

    # mark run as incomplete if any tasks fail
    if any(getattr(TaskStates, task.status, None) in TaskStates.get_incomplete_states() for task in provider_tasks):
        run.status = TaskStates.INCOMPLETE.value
        notification_level = NotificationLevel.WARNING.value
        verb = NotificationVerb.RUN_FAILED.value
    if all(getattr(TaskStates, task.status, None) == TaskStates.CANCELED for task in provider_tasks):
        run.status = TaskStates.CANCELED.value
        verb = NotificationVerb.RUN_CANCELED.value
        notification_level = NotificationLevel.WARNING.value
    finished = timezone.now()
    run.finished_at = finished
    run.save()

    #sendnotification to user via django notifications

    sendnotification(run, run.job.user, verb, None, None, notification_level, run.status)

    # send notification email to user
    site_url = settings.SITE_URL.rstrip('/')
    url = '{0}/exports/{1}'.format(site_url, run.job.uid)
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
            if not os.getenv('KEEP_STAGE', False):
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


def cancel_synchronous_task_chain(data_provider_task_uid=None):
    from eventkit_cloud.tasks.models import DataProviderTaskRecord

    data_provider_task_record = DataProviderTaskRecord.objects.get(uid=data_provider_task_uid)
    for export_task in data_provider_task_record.tasks.all():
        if TaskStates[export_task.status] == TaskStates.PENDING.value:
            export_task.status = TaskStates.CANCELED.value
            export_task.save()
            kill_task.apply_async(
                kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue="{0}.cancel".format(export_task.worker),
                priority=TaskPriority.CANCEL.value,
                routing_key="{0}.cancel".format(export_task.worker))


@app.task(name='Cancel Export Provider Task', base=UserDetailsBase)
def cancel_export_provider_task(result=None, data_provider_task_uid=None, canceling_username=None, delete=False,
                                error=False, *args, **kwargs):
    """
    Cancels an DataProviderTaskRecord and terminates each subtasks execution.
    Checks if all DataProviderTasks for the Run grouping them have finished & updates the Run's status.
    """

    # There is enough over use of this class (i.e. for errors, deletions, canceling) the reason is because it had all
    # the working logic for stopping future jobs, but that can probably be abstracted a bit, and then let the caller
    # manage the task state (i.e. the task should be FAILED or CANCELED).
    from eventkit_cloud.tasks.models import DataProviderTaskRecord, ExportTaskException
    from eventkit_cloud.tasks.exceptions import CancelException
    from billiard.einfo import ExceptionInfo
    from django.contrib.auth.models import User

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
            raise exception_class(task_name=data_provider_task_record.name, user_name=canceling_user)
        except exception_class as ce:
            einfo = ExceptionInfo()
            einfo.exception = ce
            ExportTaskException.objects.create(task=export_task, exception=pickle_exception(einfo))

        # Remove the ExportTaskResult, which will clean up the files.
        task_result = export_task.result
        if task_result:
            task_result.soft_delete()

        if int(export_task.pid) > 0 and export_task.worker:
            kill_task.apply_async(
                kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                queue="{0}.cancel".format(export_task.worker),
                priority=TaskPriority.CANCEL.value,
                routing_key="{0}.cancel".format(export_task.worker))

    if TaskStates[data_provider_task_record.status] not in TaskStates.get_finished_states():
        if error:
            data_provider_task_record.status = TaskStates.FAILED.value
        else:
            data_provider_task_record.status = TaskStates.CANCELED.value
    data_provider_task_record.save()

    return result


@app.task(name='Cancel Run', base=UserDetailsBase)
def cancel_run(result=None, export_run_uid=None, canceling_username=None, delete=False, *args, **kwargs):
    from eventkit_cloud.tasks.models import ExportRun

    result = result or {}

    export_run = ExportRun.objects.get(uid=export_run_uid)

    for export_provider_task in export_run.provider_tasks.all():
        cancel_export_provider_task(data_provider_task_uid=export_provider_task.uid,
                                    canceling_username=canceling_username, delete=delete,
                                    locking_task_key="cancel_export_provider_task-{0}".format(export_provider_task.uid))
    result['result'] = True
    return result


@app.task(name='Kill Task', base=UserDetailsBase)
def kill_task(result=None, task_pid=None, celery_uid=None, *args, **kwargs):
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
                logger.info("The celery_uid {0} has the status of {1}.".format(celery_uid,
                                                                               AsyncResult(celery_uid, app=app).state))
        except OSError:
            logger.info("{0} PID does not exist.".format(task_pid))
    return result


def update_progress(task_uid, progress=None, subtask_percentage=100.0, subtask_start=0,
                    estimated_finish=None, eta=None, msg=None):
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

    from django.db import connection
    from eventkit_cloud.tasks import set_cache_value

    if task_uid is None:
        return

    if not progress and not estimated_finish:
        return

    if progress is not None:
        subtask_progress = min(progress, 100.0)
        absolute_progress = min(subtask_start + subtask_progress * (subtask_percentage / 100.0), 100.0)

    # We need to close the existing connection because the logger could be using a forked process which
    # will be invalid and throw an error.
    connection.close()

    if absolute_progress:
        set_cache_value(uid=task_uid, attribute="progress",
                        model_name='ExportTaskRecord', value=absolute_progress)
        if eta is not None:
            eta.update(absolute_progress/100.0, dbg_msg=msg)  # convert to [0-1.0]

    if estimated_finish:
        set_cache_value(uid=task_uid, attribute="estimated_finish",
                        model_name='ExportTaskRecord', value=estimated_finish)
    elif eta is not None:
        # Use the updated ETA estimator to determine an estimated_finish
        set_cache_value(uid=task_uid, attribute="estimated_finish",
                        model_name='ExportTaskRecord', value=eta.eta_datetime())


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


def make_dirs(path):
    try:
        os.makedirs(path)
    except OSError:
        if not os.path.isdir(path):
            raise
