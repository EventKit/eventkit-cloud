# -*- coding: utf-8 -*-
from __future__ import absolute_import

import cPickle
import logging
import os
import shutil
from zipfile import ZipFile
import socket

from django.core.cache import caches
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template, render_to_string
from django.utils import timezone
from enum import Enum
from celery.result import AsyncResult
from celery import Task
from celery.utils.log import get_task_logger
from ..celery import app, TaskPriority
from ..jobs.presets import TagParser
from ..utils import (
    kml, osmconf, osmparse, overpass, pbf, s3, shp, thematic_gpkg,
    external_service, wfs, arcgis_feature_service, sqlite, geopackage
)
import json

from .exceptions import CancelException


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
class LockingTask(Task):
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

        from ..tasks.models import (ExportTaskResult, ExportTask as ExportTaskModel)
        # update the task
        finished = timezone.now()
        task = ExportTaskModel.objects.get(celery_uid=task_id)
        task.finished_at = finished
        task.progress = 100
        # get the output
        output_url = retval['result']
        stat = os.stat(output_url)
        size = stat.st_size / 1024 / 1024.00
        # construct the download_path
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        parts = output_url.split('/')
        filename = parts[-1]
        provider_slug = parts[-2]
        run_uid = parts[-3]
        run_dir = os.path.join(download_root, run_uid)
        name, ext = os.path.splitext(filename)
        download_file = '{0}-{1}-{2}{3}'.format(
            name,
            provider_slug,
            finished.strftime('%Y%m%d'),
            ext
        )
        download_path = os.path.join(run_dir, download_file)

        # construct the download url
        try:
            if getattr(settings, "USE_S3", False):
                download_url = s3.upload_to_s3(
                    run_uid,
                    os.path.join(provider_slug, filename),
                    download_file
                )
            else:
                try:
                    if not os.path.isdir(run_dir):
                        os.makedirs(run_dir)
                except OSError as e:
                    logger.info(e)
                try:
                    # don't copy raw run_dir data
                    if task.name != 'OverpassQuery':
                        shutil.copy(output_url, download_path)
                except IOError:
                    logger.error('Error copying output file to: {0}'.format(download_path))

                download_media_root = settings.EXPORT_MEDIA_ROOT.rstrip('\/')
                download_url = '/'.join([download_media_root, run_uid, download_file])

            # save the task and task result
            result = ExportTaskResult(
                task=task,
                filename=filename,
                size=size,
                download_url=download_url
            )
            result.save()
        except IOError:
            logger.warning(
                'output file %s was not able to be found (run_uid: %s)',
                filename,
                run_uid
            )

        task.status = TaskStates.SUCCESS.value
        task.save()
        super(ExportTask, self).on_success(retval, task_id, args, kwargs)

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
        if task.status != TaskStates.CANCELED.value:
            task.status = TaskStates.FAILED.value
            logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
            if self.abort_on_error:
                run = ExportProviderTask.objects.get(tasks__celery_uid=task_id).run
                # error_handler = export_task_error_handler()
                # run error handler
                stage_dir = kwargs['stage_dir']
                export_task_error_handler.si(
                    run_uid=str(run.uid),
                    task_id=task_id,
                    stage_dir=stage_dir
                ).delay()
            return {'state': TaskStates.CANCELED.value}
        super(ExportTask, self).on_failure(exc, task_id, args, kwargs, einfo)

    def update_task_state(self, result={}, task_uid=None):
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
            task.status = TaskStates.RUNNING.value
            task.export_provider_task.status = TaskStates.RUNNING.value
            task.started_at = started
            task.save()
            task.export_provider_task.save()
            logger.debug('Updated task: {0} with uid: {1}'.format(task.name, task.uid))
        except DatabaseError as e:
            logger.error('Updating task {0} state throws: {1}'.format(task_uid, e))
            raise e


@app.task(name="OSMConf", bind=True, base=ExportTask, abort_on_error=True)
def osm_conf_task(self, result={}, categories=None, stage_dir=None, job_name=None, task_uid=None):
    """
    Task to create the ogr2ogr conf file.
    """
    self.update_task_state(result=result, task_uid=task_uid)
    conf = osmconf.OSMConfig(categories, job_name=job_name)
    configfile = conf.create_osm_conf(stage_dir=stage_dir)
    result['result'] = configfile
    return result


@app.task(name="OverpassQuery", bind=True, base=ExportTask, abort_on_error=True)
def overpass_query_task(self, result={}, task_uid=None, stage_dir=None, job_name=None, filters=None, bbox=None):
    """
    Runs the query and returns the path to the filtered osm file.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    op = overpass.Overpass(
        bbox=bbox, stage_dir=stage_dir,
        job_name=job_name, filters=filters, task_uid=task_uid
    )
    op.run_query()  # run the query
    filtered_osm = op.filter()  # filter the results
    result['result'] = filtered_osm
    return result


@app.task(name="OSM2PBF", bind=True, base=ExportTask, abort_on_error=True)
def osm_to_pbf_convert_task(self, result={}, task_uid=None, stage_dir=None, job_name=None):
    """
    Task to convert osm to pbf format.
    Returns the path to the pbf file.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    osm = os.path.join(stage_dir, '{0}.osm'.format(job_name))
    pbffile = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
    o2p = pbf.OSMToPBF(osm=osm, pbffile=pbffile, task_uid=task_uid)
    pbffile = o2p.convert()
    result['result'] = pbffile
    return result


@app.task(name="OSMSchema", bind=True, base=ExportTask, abort_on_error=True)
def osm_prep_schema_task(self, result={}, task_uid=None, stage_dir=None, job_name=None):
    """
    Task to create the default sqlite schema.
    """

    self.update_task_state(result=result, task_uid=task_uid)
    osm = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
    gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
    osmconf_ini = os.path.join(stage_dir, '{0}.ini'.format(job_name))
    osmparser = osmparse.OSMParser(osm=osm, gpkg=gpkg, osmconf=osmconf_ini, task_uid=task_uid)
    osmparser.create_geopackage()
    osmparser.create_default_schema_gpkg()
    osmparser.update_zindexes()
    result['result'] = gpkg
    result['geopackage'] = gpkg
    return result


@app.task(name="Create Styles", bind=True, base=ExportTask, abort_on_error=False)
def osm_create_styles_task(self, result={}, task_uid=None, stage_dir=None, job_name=None, provider_slug=None, bbox=None):
    """
    Task to create styles for osm.
    """
    self.update_task_state(result=result, task_uid=task_uid)
    input_gpkg = parse_result(result, 'geopackage')

    gpkg_file = '{0}-{1}-{2}.gpkg'.format(job_name,
                                          provider_slug,
                                          timezone.now().strftime('%Y%m%d'))
    style_file = os.path.join(stage_dir, '{0}-osm-{1}.qgs'.format(job_name,
                                                                  timezone.now().strftime("%Y%m%d")))

    from ..tasks.models import ExportProvider
    provider_name = ExportProvider.objects.get(slug=provider_slug).name
    with open(style_file, 'w') as open_file:
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


@app.task(name="Geopackage Format (OSM)", bind=True, base=ExportTask, abort_on_error=True)
def osm_thematic_gpkg_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
    """
    Task to export thematic gpkg.
    """

    from eventkit_cloud.tasks.models import ExportRun
    self.update_task_state(result=result, task_uid=task_uid)
    run = ExportRun.objects.get(uid=run_uid)
    tags = run.job.categorised_tags
    if os.path.isfile(os.path.join(stage_dir, '{0}.gpkg'.format(job_name))):
        result['result'] = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        return result
    # This allows the thematic task to be chained with the osm task taking the output as an input here.
    input_gpkg = parse_result(result, 'geopackage')
    try:
        t2s = thematic_gpkg.ThematicGPKG(gpkg=input_gpkg, stage_dir=stage_dir, tags=tags, job_name=job_name,
                                         task_uid=task_uid)
        out = t2s.convert()
        result['result'] = out
        return result
    except Exception as e:
        logger.error('Raised exception in thematic gpkg task, %s', str(e))
        raise Exception(e)  # hand off to celery..


@app.task(name='ESRI Shapefile Format', bind=True, base=ExportTask)
def shp_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
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
        logger.error('Raised exception in shapefile export, %s', str(e))
        raise Exception(e)


@app.task(name='KML Format', bind=True, base=ExportTask)
def kml_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
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


@app.task(name='SQLITE Format', bind=True, base=ExportTask)
def sqlite_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
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


@app.task(name='Bounds Export', bind=True, base=ExportTask)
def bounds_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, provider_slug=None, *args, **kwargs):
    """
    Class defining geopackage export function.
    """
    from .models import ExportRun

    self.update_task_state(result=result, task_uid=task_uid)
    run = ExportRun.objects.get(uid=run_uid)

    result_gpkg = parse_result(result, 'geopackage')
    bounds = run.job.the_geom.geojson or run.job.bounds_geojson

    gpkg = os.path.join(stage_dir, '{0}_bounds.gpkg'.format(provider_slug))
    gpkg = geopackage.add_geojson_to_geopackage(geojson=bounds, gpkg=gpkg, layer_name='bounds', task_uid=task_uid)

    result['result'] = gpkg
    result['geopackage'] = result_gpkg
    return result


@app.task(name='Create Selection GeoJSON', base=LockingTask)
def output_selection_geojson_task(result={}, selection=None, stage_dir=None, provider_slug=None, *args, **kwargs):
    """
    Class defining geopackage export function.
    """

    geojson_file = os.path.join(stage_dir,
                                "{0}_selection.geojson".format(provider_slug))

    if selection and not os.path.isfile(geojson_file):
        # Test if json.
        json.loads(selection)
        with open(geojson_file, 'w') as open_file:
            open_file.write(selection)
        result['selection'] = geojson_file

    return result


@app.task(name='Geopackage Format', bind=True, base=ExportTask)
def geopackage_export_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
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
                    job_name=None, bbox=None, service_url=None, name=None, service_type=None):
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


@app.task(name='ArcFeatureServiceExport', bind=True, base=ExportTask)
def arcgis_feature_service_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None,
                                       stage_dir=None, job_name=None, bbox=None, service_url=None, name=None,
                                       service_type=None):
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


@app.task(name='External Raster Service Export', bind=True, base=ExportTask)
def external_raster_service_export_task(self, result={}, layer=None, config=None, run_uid=None, task_uid=None,
                                        stage_dir=None, job_name=None, bbox=None, service_url=None, level_from=None,
                                        level_to=None, name=None, service_type=None, *args, **kwargs):
    """
    Class defining geopackage export for external raster service.
    """

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
def pick_up_run_task(self, result={}, run_uid=None):
    """
    Generates a Celery task to assign a celery pipeline to a specific worker.
    """

    from .models import ExportRun
    from .task_factory import TaskFactory

    worker = socket.gethostname()
    run = ExportRun.objects.get(uid=run_uid)
    run.worker = worker
    run.save()
    TaskFactory().parse_tasks(worker=worker, run_uid=run_uid)


@app.task(name='Generate Preset', bind=True, base=ExportTask)
def generate_preset_task(self, result={}, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
    """
    Generates a JOSM Preset from the exports selected features.
    """

    from eventkit_cloud.tasks.models import ExportRun
    from eventkit_cloud.jobs.models import ExportConfig
    self.update_task_state(result=result, task_uid=task_uid)
    run = ExportRun.objects.get(uid=run_uid)
    job = run.job
    user = job.user
    feature_save = job.feature_save
    feature_pub = job.feature_pub
    # check if we should create a josm preset
    if feature_save or feature_pub:
        tags = job.tags.all()
        tag_parser = TagParser(tags=tags)
        xml = tag_parser.parse_tags()
        preset_file = ContentFile(xml)
        name = job.name
        filename = job_name + '_preset.xml'
        content_type = 'application/xml'
        config = ExportConfig.objects.create(
            name=name,
            filename=filename,
            config_type='PRESET',
            content_type=content_type,
            user=user,
            published=feature_pub
        )
        config.upload.save(filename, preset_file)

        output_path = config.upload.path
        job.configs.clear()
        job.configs.add(config)
        result['result'] = output_path
        return result


@app.task(name='Clean Up Failure Task', base=Task)
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


@app.task(name='Finalize Export Provider Run', base=LockingTask)
def finalize_export_provider_task(result={}, run_uid=None, export_provider_task_uid=None, run_dir=None, worker=None, *args, **kwargs):
    """
    Finalizes provider task.

    Cleans up staging directory.
    Updates run with finish time.
    """

    from eventkit_cloud.tasks.models import ExportProviderTask, ExportRun

    run_finished = False
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

        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)

        provider_tasks = export_provider_task.run.provider_tasks.all()
        if all(TaskStates[provider_task.status] in TaskStates.get_finished_states() for provider_task in
               provider_tasks):
            run_finished = True

    if run_finished:
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
            include_files = list(set(include_files))
            if include_files:
                zip_file_task.run(run_uid=run_uid, include_files=include_files)

        finalize_run_task.si(
            run_uid=run_uid,
            stage_dir=run_dir
        ).set(queue=worker, routing_key=worker).apply_async(
            interval=1,
            max_retries=10,
            queue=worker,
            routing_key=worker,
            priority=TaskPriority.FINALIZE_RUN.value)
    else:
        return result


@app.task(name='Zip File Export', base=LockingTask)
def zip_file_task(result={}, run_uid=None, include_files=None):
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
        logger.error("zip_file_task called with no include_files.")
        return {'result': None}
    files += [filename for filename in include_files if os.path.splitext(filename)[-1] not in BLACKLISTED_ZIP_EXTS]

    run = ExportRunModel.objects.get(uid=run_uid)

    name = run.job.name
    project = run.job.event
    date = timezone.now().strftime('%Y%m%d')
    # XXX: name-project-eventkit-yyyymmdd.zip
    zip_filename = "{0}-{1}-{2}-{3}.{4}".format(
        name,
        project,
        "eventkit",
        date,
        'zip'
    )

    zip_st_filepath = os.path.join(st_filepath, zip_filename)
    zip_dl_filepath = os.path.join(dl_filepath, zip_filename)
    with ZipFile(zip_st_filepath, 'w') as zipfile:
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

    run_uid = str(run_uid)
    if getattr(settings, "USE_S3", False):
        # TODO open up a stream directly to the s3 file so no local
        #      persistence is required
        zipfile_url = s3.upload_to_s3(run_uid, zip_filename, zip_filename)
        os.remove(zip_st_filepath)
    else:
        shutil.copy(zip_st_filepath, zip_dl_filepath)
        zipfile_url = os.path.join(run_uid, zip_filename)

    run.zipfile_url = zipfile_url
    run.save()

    result['result'] = zip_st_filepath
    return result


class FinalizeRunTaskClass(LockingTask):
    """
    Finalizes Cleans up stage_dir for ExportRun
    """

    name = 'Finalize Export Run'

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        stage_dir = retval['stage_dir']
        try:
            if stage_dir:
                shutil.rmtree(stage_dir)
        except IOError or OSError:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))
        super(FinalizeRunTaskClass, self).after_return(status, retval, task_id, args, kwargs, einfo)


@app.task(name='Finalize Export Run', base=FinalizeRunTaskClass)
def finalize_run_task(result={}, run_uid=None, stage_dir=None):
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
    # mark run as incomplete if any tasks fail
    if any(task.status in TaskStates.get_incomplete_states() for task in provider_tasks):
        run.status = TaskStates.INCOMPLETE.value
    if all(task.status == TaskStates.CANCELED.value for task in provider_tasks):
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


@app.task(name='Export Task Error Handler', bind=True, base=LockingTask)
def export_task_error_handler(self, result={}, run_uid=None, task_id=None, stage_dir=None):
    """
    Handles un-recoverable errors in export tasks.
    """

    from eventkit_cloud.tasks.models import ExportRun
    finished = timezone.now()
    run = ExportRun.objects.get(uid=run_uid)
    run.finished_at = finished
    run.status = TaskStates.INCOMPLETE.value
    run.save()
    try:
        if os.path.isdir(stage_dir):
            # DON'T leave the stage_dir in place for debugging
            shutil.rmtree(stage_dir)
    except IOError:
        logger.error('Error removing {0} during export finalize'.format(stage_dir))

    hostname = settings.HOSTNAME
    url = 'http://{0}/exports/{1}'.format(hostname, run.job.uid)
    addr = run.user.email
    subject = "Your Eventkit Data Pack has a failure."
    # email user and administrator
    to = [addr, settings.TASK_ERROR_EMAIL]
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Eventkit Team <eventkit.team@gmail.com>')
    ctx = {
        'url': url,
        'task_id': task_id
    }
    text = get_template('email/error_email.txt').render(ctx)
    html = get_template('email/error_email.html').render(ctx)
    msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
    msg.attach_alternative(html, "text/html")
    msg.send()
    return result


@app.task(name='Cancel Export Provider Task', base=LockingTask)
def cancel_export_provider_task(result={}, export_provider_task_uid=None, canceling_user=None):
    """
    Cancels an ExportProviderTask and terminates each subtasks execution.
    """

    from ..tasks.models import ExportProviderTask, ExportTaskException, ExportTaskResult
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
        export_task.status = TaskStates.CANCELED.value
        export_task.cancel_user = canceling_user
        export_task.save()
        # This part is to populate the UI with the cancel message.  If a different mechanism is incorporated
        # to pass task information to the users, then it may make sense to replace this.
        try:
            raise CancelException(task_name=export_provider_task.name, user_name=canceling_user)
        except CancelException as ce:
            einfo = ExceptionInfo()
            einfo.exception = ce
            ExportTaskException.objects.create(task=export_task, exception=cPickle.dumps(einfo))

        # Remove the ExportTaskResult, which will clean up the files.
        task_result = ExportTaskResult.objects.filter(task=export_task).first()
        if task_result:
            task_result.delete()

        if export_task.pid and export_task.worker:
            kill_task.apply_async(kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                                  queue="{0}.cancel".format(export_task.worker),
                                  priority=TaskPriority.CANCEL.value,
                                  routing_key="{0}.cancel".format(export_task.worker))

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


@app.task(name='Kill Task', base=LockingTask)
def kill_task(result={}, task_pid=None, celery_uid=None):
    """
    Asks a worker to kill a task.
    """

    # This all works but isn't helpful until priority queues are supported.
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


def update_progress(task_uid, progress=None, estimated_finish=None):
    """
    Updates the progress of the ExportTask from the given task_uid.
    :param task_uid: A uid to reference the ExportTask.
    :return: A function which can be called to update the progress on an ExportTask.
    """

    from ..tasks.models import ExportTask
    from django.db import connection

    if not estimated_finish and not progress:
        return
    if progress > 100:
        progress = 100
    try:
        # We need to close the existing connection because the logger could be using a forked process which,
        # will be invalid and throw an error.
        connection.close()
        export_task = ExportTask.objects.get(uid=task_uid)
    except ExportTask.DoesNotExist:
        return
    if progress:
        export_task.progress = progress
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

