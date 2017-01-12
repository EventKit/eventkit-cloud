# -*- coding: utf-8 -*-
from __future__ import absolute_import

import cPickle
import glob
import logging
import os
import shutil
from zipfile import ZipFile
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError, transaction
from django.db.models import Q
from django.template.loader import get_template
from django.utils import timezone
from enum import Enum
from time import sleep
from celery.result import AsyncResult

from celery import Task
from celery.utils.log import get_task_logger

from ..celery import app
from ..jobs.presets import TagParser
from ..utils import (
    kml, osmconf, osmparse, overpass, pbf, s3, shp, thematic_gpkg,
    external_service, wfs, arcgis_feature_service, sqlite,
)
from .exceptions import CancelException
import socket

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


# ExportTask abstract base class and subclasses.

class ExportTask(Task):
    """
    Abstract base class for export tasks.
    """

    # whether to abort the whole run if this task fails.
    abort_on_error = False

    class Meta:
        abstract = True

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
        from ..tasks.models import ExportTask as ExportTaskModel
        from ..tasks.models import ExportTaskResult
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
                    if not os.path.exists(run_dir):
                        os.makedirs(run_dir)
                except OSError as e:
                    logger.error(e)
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

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Update the failed task as follows:

            1. pull out the ExportTask
            2. update the task status and finish time
            3. create an export task exception
            4. save the export task with the task exception
            5. run ExportTaskErrorHandler if the run should be aborted
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
                error_handler = ExportTaskErrorHandler()
                # run error handler
                stage_dir = kwargs['stage_dir']
                error_handler.si(
                    run_uid=str(run.uid),
                    task_id=task_id,
                    stage_dir=stage_dir
                ).delay()
            return {'state': TaskStates.CANCELED.value}

    def update_task_state(self, result=None, task_uid=None):
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


class OSMConfTask(ExportTask):
    """
    Task to create the ogr2ogr conf file.
    """
    name = 'OSMConf'
    abort_on_error = True

    def run(self,
            result=None,
            categories=None,
            stage_dir=None,
            job_name=None,
            task_uid=None):
        self.update_task_state(result=result, task_uid=task_uid)
        conf = osmconf.OSMConfig(categories, job_name=job_name)
        configfile = conf.create_osm_conf(stage_dir=stage_dir)
        return {'result': configfile}


class OverpassQueryTask(ExportTask):
    """
    Class to run an overpass query.
    """
    name = 'OverpassQuery'
    abort_on_error = True

    def run(self, result=None, task_uid=None, stage_dir=None, job_name=None, filters=None, bbox=None):
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
        return {'result': filtered_osm}


class OSMToPBFConvertTask(ExportTask):
    """
    Task to convert osm to pbf format.
    Returns the path to the pbf file.
    """
    name = 'OSM2PBF'
    abort_on_error = True

    def run(self, result=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(result=result, task_uid=task_uid)
        osm = os.path.join(stage_dir, '{0}.osm'.format(job_name))
        pbffile = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
        o2p = pbf.OSMToPBF(osm=osm, pbffile=pbffile, task_uid=task_uid)
        pbffile = o2p.convert()
        return {'result': pbffile}


class OSMPrepSchemaTask(ExportTask):
    """
    Task to create the default sqlite schema.
    """
    name = 'OSMSchema'
    abort_on_error = True

    def run(self, result=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(result=result, task_uid=task_uid)
        osm = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        osmconf_ini = os.path.join(stage_dir, '{0}.ini'.format(job_name))
        osmparser = osmparse.OSMParser(osm=osm, gpkg=gpkg, osmconf=osmconf_ini, task_uid=task_uid)
        osmparser.create_geopackage()
        osmparser.create_default_schema_gpkg()
        osmparser.update_zindexes()
        return {'result': gpkg}


class OSMThematicGPKGExportTask(ExportTask):
    """
    Task to export thematic gpkg.
    """

    name = "Geopackage Format (OSM)"

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        from eventkit_cloud.tasks.models import ExportRun
        self.update_task_state(result=result, task_uid=task_uid)
        run = ExportRun.objects.get(uid=run_uid)
        tags = run.job.categorised_tags
        if os.path.isfile(os.path.join(stage_dir, '{0}.gpkg'.format(job_name))):
            return {'result': os.path.join(stage_dir, '{0}.gpkg'.format(job_name))}
        # This allows the thematic task to be chained with the osm task taking the output as an input here.
        input_gpkg = parse_result(result, 'geopackage')
        try:
            t2s = thematic_gpkg.ThematicGPKG(gpkg=input_gpkg, stage_dir=stage_dir, tags=tags, job_name=job_name,
                                             task_uid=task_uid)
            out = t2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in thematic gpkg task, %s', str(e))
            raise Exception(e)  # hand off to celery..


class ShpExportTask(ExportTask):
    """
    Class defining SHP export function.
    """
    name = 'ESRI Shapefile Format'

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):

        self.update_task_state(result=result, task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        shapefile = os.path.join(stage_dir, '{0}_shp'.format(job_name))

        try:
            s2s = shp.GPKGToShp(gpkg=gpkg, shapefile=shapefile, task_uid=task_uid)
            out = s2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in shapefile export, %s', str(e))
            raise Exception(e)


class KmlExportTask(ExportTask):
    """
    Class defining KML export function.
    """
    name = 'KML Format'

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(result=result, task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        kmlfile = os.path.join(stage_dir, '{0}.kml'.format(job_name))
        try:
            s2k = kml.GPKGToKml(gpkg=gpkg, kmlfile=kmlfile, task_uid=task_uid)
            out = s2k.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in kml export, %s', str(e))
            raise Exception(e)


class SqliteExportTask(ExportTask):
    """
    Class defining SQLITE export function.
    """

    name = 'SQLITE Format'

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(result=result, task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        sqlitefile = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        try:
            s2g = sqlite.GPKGToSQLite(gpkg=gpkg, sqlitefile=sqlitefile, task_uid=task_uid)
            out = s2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in sqlite export, %s', str(e))
            raise Exception(e)


class GeopackageExportTask(ExportTask):
    """
    Class defining geopackage export function.
    """
    name = 'Geopackage Format'

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(result=result, task_uid=task_uid)
        # gpkg already generated by OSMPrepSchema so just return path
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        return {'result': gpkg, 'geopackage': gpkg}


class WFSExportTask(ExportTask):
    """
    Class defining sqlite export for WFS service.
    """
    name = 'WFSExport'

    def run(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
            bbox=None,
            service_url=None, name=None, service_type=None):
        self.update_task_state(result=result, task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        try:
            w2g = wfs.WFSToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url, name=name, layer=layer,
                                config=config, service_type=service_type, task_uid=task_uid)
            out = w2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in external service export, %s', str(e))
            raise Exception(e)


class ArcGISFeatureServiceExportTask(ExportTask):
    """
    Class defining sqlite export for ArcFeatureService service.
    """
    name = 'ArcFeatureServiceExport'

    def run(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
            bbox=None,
            service_url=None, name=None, service_type=None):
        self.update_task_state(result=result, task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        try:
            w2g = arcgis_feature_service.ArcGISFeatureServiceToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url,
                                                                    name=name, layer=layer,
                                                                    config=config, service_type=service_type,
                                                                    task_uid=task_uid)
            out = w2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in external service export, %s', str(e))
            raise Exception(e)


class ExternalRasterServiceExportTask(ExportTask):
    """
    Class defining geopackage export for external raster service.
    """
    name = 'External Raster Service Export'

    def run(self, result=None, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None,
            bbox=None,
            service_url=None, level_from=None, level_to=None, name=None, service_type=None):
        self.update_task_state(result=result, task_uid=task_uid)
        gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        try:
            w2g = external_service.ExternalRasterServiceToGeopackage(gpkgfile=gpkgfile, bbox=bbox,
                                                                     service_url=service_url, name=name, layer=layer,
                                                                     config=config, level_from=level_from,
                                                                     level_to=level_to, service_type=service_type,
                                                                     task_uid=task_uid)
            out = w2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in external service export, %s', str(e))
            raise Exception(e)


class PickUpRunTask(Task):
    """
    Generates a Celery task to assign a celery pipeline to a specific worker.
    """

    name = 'Pickup Run'

    def run(self, result=None, run_uid=None):
        from .models import ExportRun
        from .task_factory import TaskFactory

        worker = socket.gethostname()
        run = ExportRun.objects.get(uid=run_uid)
        run.worker = worker
        run.save()
        TaskFactory().parse_tasks(worker=worker, run_uid=run_uid)


class GeneratePresetTask(ExportTask):
    """
    Generates a JOSM Preset from the exports selected features.
    """

    name = 'Generate Preset'

    def run(self, result=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
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
            return {'result': output_path}


class CleanUpFailure(Task):
    """
    Used to close tasks in a failed chain.

    If a task fails or is canceled, it all of the uid will be passed here and the failed object will be found and propagated,
    to the subsequent tasks in the chain. Additionally they will be finalized to ensure that the run finishes.
    """

    name = 'Clean Up Failure Task'

    def run(self, result=None, export_provider_task_uids=[], run_uid=None, run_dir=None, worker=None, *args, **kwargs):
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

            finalize_export_provider_task = FinalizeExportProviderTask()
            finalize_export_provider_task.si(
                run_uid=run_uid,
                export_provider_task_uid=export_provider_task_uid,
                worker=worker
            ).set(queue=worker).apply_async(
                interval=1,
                max_retries=10)


class FinalizeExportProviderTask(Task):
    """
        Finalizes provider task.

        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
    """

    name = 'Finalize Export Provider Run'

    def run(self, result=None, run_uid=None, export_provider_task_uid=None, run_dir=None, worker=None, *args, **kwargs):
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
                    if not TaskStates[export_provider_task.status] in TaskStates.get_incomplete_states():
                        for export_task in export_provider_task.tasks.all():
                            try:
                                filename = export_task.result.filename
                            except Exception:
                                continue
                            full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                          export_provider_task.slug, filename)
                            if not os.path.isfile(full_file_path):
                                continue
                            include_files += [full_file_path]
                # Need to remove duplicates from the list because
                # some intermediate tasks produce files with the same name.
                include_files = list(set(include_files))
                if include_files:
                    ZipFileTask().run(run_uid=run_uid, include_files=include_files)

            finalize_run_task = FinalizeRunTask()
            finalize_run_task.si(
                run_uid=run_uid,
                stage_dir=run_dir,
            ).apply_async(queue=worker)

        return result


class ZipFileTask(Task):
    """
    rolls up runs into a zip file
    """
    name = 'Zip File Export'

    def run(self, result=None, run_uid=None, include_files=None):
        from eventkit_cloud.tasks.models import ExportRun as ExportRunModel
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        staging_root = settings.EXPORT_STAGING_ROOT.rstrip('\/')

        dl_filepath = os.path.join(download_root, str(run_uid))
        st_filepath = os.path.join(staging_root, str(run_uid))

        files = []
        if not include_files:
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

        return {'result': zip_st_filepath}


class FinalizeRunTask(Task):
    """
    Finalizes export run.

    Cleans up staging directory.
    Updates run with finish time.
    Emails user notification.
    """

    name = 'Finalize Export Run'

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        stage_dir = retval['stage_dir']
        try:
            if stage_dir:
                shutil.rmtree(stage_dir)
        except IOError or OSError:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))

    def run(self, result=None, run_uid=None, stage_dir=None):
        from eventkit_cloud.tasks.models import ExportRun

        run = ExportRun.objects.get(uid=run_uid)
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
        # TODO: from email address should not be hardcoded
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

        return {'stage_dir': stage_dir}


class ExportTaskErrorHandler(Task):
    """
    Handles un-recoverable errors in export tasks.
    """

    name = "Export Task Error Handler"

    def run(self, run_uid, task_id=None, stage_dir=None):
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


class CancelExportProviderTask(Task):
    """
    Cancels an ExportProviderTask and terminates each subtasks execution.
    """

    name = "Cancel Export Provider Task"

    def run(self, export_provider_task_uid=None, canceling_user=None):
        from ..tasks.models import ExportProviderTask, ExportTaskException, ExportTaskResult, \
            ExportTask as ExportTaskModel
        from ..tasks.exceptions import CancelException
        from billiard.einfo import ExceptionInfo
        from datetime import datetime, timedelta

        import sys
        export_provider_task = ExportProviderTask.objects.filter(uid=export_provider_task_uid).first()
        if not export_provider_task:
            return False

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

                # This part uses celery to revoke the task, which has no need to rely on specific pid information and
                # may be removed or simplified in the future.
                # if export_task.pid and export_task.worker:
                # If using revoke there isn't a need to put the kill task on the correct queue, because celery will
                # broadcast the message.
                # KillTask().apply_async(kwargs={"task_pid": export_task.pid, "celery_uid": export_task.celery_uid},
                #                        queue="{0}-cancel".format(export_task.worker))

            KillTask().run(celery_uid=export_task.celery_uid)

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
        finalize_export_provider_task = FinalizeExportProviderTask()
        finalize_export_provider_task.si(
            run_uid=run_uid,
            stage_dir=stage_dir,
            export_provider_task_uid=export_provider_task_uid,
            worker=worker
        ).set(queue=worker).apply_async(
            interval=1,
            max_retries=10,
            expires=datetime.now() + timedelta(days=2)
        )


class KillTask(Task):
    """
        Asks a worker to kill a task.
    """

    name = "Kill Task"

    def run(self, task_pid=None, celery_uid=None):
        app.control.revoke(str(celery_uid), terminate=True)

        # This all works but isn't helpful until priority queues are supported.
        # import os, signal
        # from celery.result import AsyncResult
        # import celery.states
        #
        # if task_pid:
        #     # Don't kill tasks with default pid.
        #     if task_pid <= 0:
        #         return
        #     try:
        #
        #         # Ensure the task is still running otherwise the wrong process will be killed
        #         # if AsyncResult(celery_uid, app=app).state == celery.states.STARTED:
        #             # If the task finished prior to receiving this kill message it could throw an OSError.
        #             os.kill(task_pid, signal.SIGTERM)
        #     except OSError:
        #         logger.info("{0} PID does not exist.")


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
    else:
        return task_result
