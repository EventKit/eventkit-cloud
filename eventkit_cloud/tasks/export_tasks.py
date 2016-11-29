# -*- coding: utf-8 -*-
from __future__ import absolute_import

import cPickle
import glob
import os
import re
import shutil
from zipfile import ZipFile

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError
from django.template.loader import get_template
from django.utils import timezone

from celery import Task
from celery.utils.log import get_task_logger
from celery.app import app_or_default

from eventkit_cloud.jobs.presets import TagParser
from eventkit_cloud.utils import (
    kml, osmconf, osmparse, overpass, pbf, s3, shp, thematic_gpkg,
    external_service, wfs, arcgis_feature_service, sqlite,
)

import socket

BLACKLISTED_ZIP_EXTS = ['.pbf', '.osm', '.ini', '.txt', 'om5']
COMPLETE_STATES = ['COMPLETED', 'INCOMPLETE', 'CANCELLED']

# Get an instance of a logger
logger = get_task_logger(__name__)


# ExportTask abstract base class and subclasses.

class ExportTask(Task):
    """
    Abstract base class for export tasks.
    """

    def run(self, *args, **kwargs):
        pass

    # whether to abort the whole run if this task fails.
    abort_on_error = False

    class Meta:
        abstract = True

    def on_success(self, retval, task_id, args, kwargs):
        """
        Update the successfuly completed task as follows:

            1. update the time the task completed
            2. caclulate the size of the output file
            3. calculate the download path of the export
            4. create the export download directory
            5. copy the export file to the download directory
            6. create the export task result
            7. update the export task status and save it
        """
        from eventkit_cloud.tasks.models import ExportTask as ExportTaskModel
        from eventkit_cloud.tasks.models import ExportTaskResult
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
            if settings.USE_S3:
                download_url = s3.upload_to_s3(
                    run_uid,
                    os.path.join(provider_slug, filename)
                )
            else:
                try:
                    if not os.path.exists(run_dir):
                        os.makedirs(run_dir)
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

        task.status = 'SUCCESS'
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
        from eventkit_cloud.tasks.models import ExportTask as ExportTaskModel
        from eventkit_cloud.tasks.models import ExportTaskException, ExportProviderTask
        logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
        task = ExportTaskModel.objects.get(celery_uid=task_id)
        task.status = 'FAILED'
        task.finished_at = timezone.now()
        task.save()
        exception = cPickle.dumps(einfo)
        ete = ExportTaskException(task=task, exception=exception)
        ete.save()
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

    def update_task_state(self, task_uid=None):
        """
        Update the task state and celery task uid.
        Can use the celery uid for diagnostics.
        """
        started = timezone.now()
        from eventkit_cloud.tasks.models import ExportTask as ExportTaskModel
        self.request.id
        try:
            task = ExportTaskModel.objects.get(uid=task_uid)
            celery_uid = self.request.id
            task.celery_uid = celery_uid
            task.status = 'RUNNING'
            task.export_provider_task.status = 'RUNNING'
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
            categories=None,
            stage_dir=None,
            job_name=None,
            task_uid=None):
        self.update_task_state(task_uid=task_uid)
        conf = osmconf.OSMConfig(categories, job_name=job_name)
        configfile = conf.create_osm_conf(stage_dir=stage_dir)
        return {'result': configfile}


class OverpassQueryTask(ExportTask):
    """
    Class to run an overpass query.
    """
    name = 'OverpassQuery'
    abort_on_error = True

    def run(self, task_uid=None, stage_dir=None, job_name=None, filters=None, bbox=None):
        """
        Runs the query and returns the path to the filtered osm file.
        """
        self.update_task_state(task_uid=task_uid)
        progress_tracker = get_progress_tracker(task_uid=task_uid)
        op = overpass.Overpass(
            bbox=bbox, stage_dir=stage_dir,
            job_name=job_name, filters=filters, progress_tracker=progress_tracker
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

    def run(self, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        osm = os.path.join(stage_dir, '{0}.osm'.format(job_name))
        pbffile = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
        o2p = pbf.OSMToPBF(osm=osm, pbffile=pbffile)
        pbffile = o2p.convert()
        return {'result': pbffile}


class OSMPrepSchemaTask(ExportTask):
    """
    Task to create the default sqlite schema.
    """
    name = 'OSMSchema'
    abort_on_error = True

    def run(self, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        osm = os.path.join(stage_dir, '{0}.pbf'.format(job_name))
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        osmconf_ini = os.path.join(stage_dir, '{0}.ini'.format(job_name))
        osmparser = osmparse.OSMParser(osm=osm, gpkg=gpkg, osmconf=osmconf_ini)
        osmparser.create_geopackage()
        osmparser.create_default_schema_gpkg()
        osmparser.update_zindexes()
        return {'result': gpkg}


class ThematicShpExportTask(ExportTask):
    """
    Task to export thematic shapefile.

    Requires ThematicGPKGExportTask to be called first.
    """

    name = "ESRI Shapefile Export"

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):

        from eventkit_cloud.tasks.models import ExportRun
        self.update_task_state(task_uid=task_uid)
        ExportRun.objects.get(uid=run_uid)
        thematic_gpkg_file = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        shapefile = os.path.join(stage_dir, '{0}_shp'.format(job_name))

        try:
            t2s = shp.GPKGToShp(gpkg=thematic_gpkg_file, shapefile=shapefile)
            out = t2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in thematic shp task, %s', str(e))
            raise Exception(e)  # hand off to celery..


class ThematicGPKGExportTask(ExportTask):
    """
    Task to export thematic gpkg.
    """

    name = "GPKG Format"

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        from eventkit_cloud.tasks.models import ExportRun
        self.update_task_state(task_uid=task_uid)
        run = ExportRun.objects.get(uid=run_uid)
        tags = run.job.categorised_tags
        if os.path.isfile(os.path.join(stage_dir, '{0}.gpkg'.format(job_name))):
            return {'result': os.path.join(stage_dir, '{0}.gpkg'.format(job_name))}
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        try:
            t2s = thematic_gpkg.ThematicGPKG(gpkg=gpkg, tags=tags, job_name=job_name)
            out = t2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in thematic gpkg task, %s', str(e))
            raise Exception(e)  # hand off to celery..


class ShpExportTask(ExportTask):
    """
    Class defining SHP export function.
    """
    name = 'ESRI Shapefile Format (Generic)'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):

        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        shapefile = os.path.join(stage_dir, '{0}_generic_shp'.format(job_name))

        try:
            s2s = shp.GPKGToShp(gpkg=gpkg, shapefile=shapefile)
            out = s2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in shapefile export, %s', str(e))
            raise Exception(e)


class KmlExportTask(ExportTask):
    """
    Class defining KML export function.
    """
    name = 'KML Format (Generic)'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        kmlfile = os.path.join(stage_dir, '{0}_generic.kml'.format(job_name))
        try:
            s2k = kml.GPKGToKml(gpkg=gpkg, kmlfile=kmlfile)
            out = s2k.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in kml export, %s', str(e))
            raise Exception(e)


class SqliteExportTask(ExportTask):
    """
    Class defining SQLITE export function.
    """

    name = 'SQLITE Format (Generic)'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        sqlitefile = os.path.join(stage_dir, '{0}_generic.sqlite'.format(job_name))
        try:
            s2g = sqlite.GPKGToSQLite(gpkg=gpkg, sqlitefile=sqlitefile)
            out = s2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in sqlite export, %s', str(e))
            raise Exception(e)


class GeopackageExportTask(ExportTask):
    """
    Class defining geopackage export function.
    """
    name = 'Geopackage Format (Generic)'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        # gpkg already generated by OSMPrepSchema so just return path
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        return {'result': gpkg}


class ThematicSQLiteExportTask(ExportTask):
    """
    Class defining Thematic SQLite export function.
    Requires ThematicGPKGExportTask.
    """
    name = 'SQLITE Format'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        sqlitefile = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        try:
            s2g = sqlite.GPKGToSQLite(sqlitefile=sqlitefile, gpkg=gpkgfile)
            out = s2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in thematic geopackage export, %s', str(e))
            raise Exception(e)


class ThematicKmlExportTask(ExportTask):
    """
    Class defining kml export
    Requires ThematicGPKGExportTask
    """
    name = 'KML Format'

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        kmlfile = os.path.join(stage_dir, '{0}.kml'.format(job_name))
        try:
            s2k = kml.GPKGToKml(gpkg=gpkg, kmlfile=kmlfile)
            out = s2k.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in kml export, %s', str(e))
            raise Exception(e)


class WFSExportTask(ExportTask):
    """
    Class defining sqlite export for WFS service.
    """
    name = 'WFSExport'

    def run(self, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, bbox=None,
            service_url=None, name=None, service_type=None):
        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        try:
            w2g = wfs.WFSToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url, name=name, layer=layer,
                                config=config, service_type=service_type)
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

    def run(self, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, bbox=None,
            service_url=None, name=None, service_type=None):
        self.update_task_state(task_uid=task_uid)
        gpkg = os.path.join(stage_dir, '{0}_generic.gpkg'.format(job_name))
        try:
            w2g = arcgis_feature_service.ArcGISFeatureServiceToGPKG(gpkg=gpkg, bbox=bbox, service_url=service_url,
                                                                    name=name, layer=layer,
                                                                    config=config, service_type=service_type)
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

    def run(self, layer=None, config=None, run_uid=None, task_uid=None, stage_dir=None, job_name=None, bbox=None,
            service_url=None, level_from=None, level_to=None, name=None, service_type=None):
        self.update_task_state(task_uid=task_uid)
        gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        progress_tracker = get_progress_tracker(task_uid=task_uid)
        try:
            w2g = external_service.ExternalRasterServiceToGeopackage(gpkgfile=gpkgfile, bbox=bbox,
                                                                     service_url=service_url, name=name, layer=layer,
                                                                     config=config, level_from=level_from,
                                                                     level_to=level_to, service_type=service_type,
                                                                     progress_tracker=progress_tracker)
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

    def run(self, run_uid=None):
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

    def run(self, run_uid=None, task_uid=None, stage_dir=None, job_name=None):
        from eventkit_cloud.tasks.models import ExportRun
        from eventkit_cloud.jobs.models import ExportConfig
        self.update_task_state(task_uid=task_uid)
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
            config = ExportConfig.objects.create(name=name, filename=filename, config_type='PRESET',
                                                 content_type=content_type, user=user, published=feature_pub)
            config.upload.save(filename, preset_file)

            output_path = config.upload.path
            job.configs.clear()
            job.configs.add(config)
            return {'result': output_path}


class FinalizeExportProviderTask(Task):
    """
        Finalizes provider task.

        Cleans up staging directory.
        Updates run with finish time.
        Emails user notification.
    """

    name = 'Finalize Export Provider Run'

    def run(self, run_uid=None, export_provider_task_uid=None, stage_dir=None, worker=None):
        from eventkit_cloud.tasks.models import ExportProviderTask, ExportRun
        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)

        if export_provider_task.status != "CANCELLED":
            export_provider_task.status = 'COMPLETED'

        # mark run as incomplete if any tasks fail
        if any(task.status == 'FAILED' for task in export_provider_task.tasks.all()):
            export_provider_task.status = 'INCOMPLETE'
        export_provider_task.save()

        export_provider_task = ExportProviderTask.objects.get(
            uid=export_provider_task_uid
        )

        run_complete = False
        provider_tasks = export_provider_task.run.provider_tasks.all()
        if all(pt.status in COMPLETE_STATES for pt in provider_tasks):
            run_complete = True

        if run_complete:
            run = ExportRun.objects.get(uid=run_uid)
            if run.job.include_zipfile:
                zipfile_task = ZipFileTask()
                zipfile_task.si(
                    run_uid=run_uid,
                    stage_dir=stage_dir
                ).set(queue=worker)()

            finalize_run_task = FinalizeRunTask()
            finalize_run_task.si(
                run_uid=run_uid,
                stage_dir=os.path.dirname(stage_dir)
            )()

        if os.path.isdir(stage_dir):
            try:
                shutil.rmtree(stage_dir)
            except IOError or OSError:
                logger.error('Error removing {0} during export finalize'.format(stage_dir))


class ZipFileTask(Task):
    """
    rolls up runs into a zip file
    """
    name = 'Zip File Export'

    def run(self, run_uid=None, stage_dir=None):
        from eventkit_cloud.tasks.models import ExportRun as ExportRunModel
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        staging_root = settings.EXPORT_STAGING_ROOT.rstrip('\/')

        dl_filepath = os.path.join(download_root, str(run_uid))
        st_filepath = os.path.join(staging_root, str(run_uid))

        files = []
        for root, dirnames, filenames in os.walk(st_filepath):
            files += [
                os.path.join(root, filename) for filename in filenames
                if os.path.splitext(filename)[-1] not in BLACKLISTED_ZIP_EXTS
                ]

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

        zip_filepath = os.path.join(dl_filepath, zip_filename)
        with ZipFile(zip_filepath, 'w') as zipfile:
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
        if settings.USE_S3:
            # TODO open up a stream directly to the s3 file so no local 
            #      persistence is required
            zipfile_url = s3.upload_to_s3(run_uid, zip_filename)
            os.remove(zip_filepath)
        else:
            zipfile_url = os.path.join(run_uid, zip_filename)

        run.zipfile_url = zipfile_url
        run.save()

        return {'result': zip_filepath}


class FinalizeRunTask(Task):
    """
    Finalizes export run.

    Cleans up staging directory.
    Updates run with finish time.
    Emails user notification.
    """

    name = 'Finalize Export Run'

    def run(self, run_uid=None, stage_dir=None):
        from eventkit_cloud.tasks.models import ExportRun

        run = ExportRun.objects.get(uid=run_uid)
        run.status = 'COMPLETED'
        provider_tasks = run.provider_tasks.all()
        # mark run as incomplete if any tasks fail
        if any(task.status == 'INCOMPLETE' for task in provider_tasks):
            run.status = 'INCOMPLETE'
        finished = timezone.now()
        run.finished_at = finished
        run.save()

        try:
            shutil.rmtree(stage_dir)
        except IOError or OSError:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))

        # send notification email to user
        hostname = settings.HOSTNAME
        url = 'http://{0}/exports/{1}'.format(hostname, run.job.uid)
        addr = run.user.email
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
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()


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
        run.status = 'INCOMPLETE'
        run.save()
        try:
            if os.path.isdir(stage_dir):
                # leave the stage_dir in place for debugging
                shutil.rmtree(stage_dir)
                # pass
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


class RevokeTask(Task):
    """
    Revokes an ExportProviderTask and terminates each subtasks execution.
    """

    name = "Revoke Task"

    def run(self, task_uid):
        from eventkit_cloud.tasks.models import ExportProviderTask
        from eventkit_cloud.celery import app

        export_provider_task = ExportProviderTask.objects.get(uid=task_uid)
        export_tasks = export_provider_task.tasks.all()

        for export_task in export_tasks:
            app.control.revoke(
                task_id=str(export_task.celery_uid),
                wait=True,
                terminate=True,
                signal='SIGQUIT'
            )

            export_task.status = 'CANCELLED'
            export_task.save()

        export_provider_task.status = 'CANCELLED'
        export_provider_task.save()


def get_progress_tracker(task_uid=None):
    """
    Takes a task uid to create a closure that can be updated to change the status in the ExportTask object.
    :param task_uid: A uid to reference the ExportTask.
    :return: A function which can be called to update the progress on an ExportTask.
    """
    from eventkit_cloud.tasks.models import ExportTask
    if not task_uid:
        return

    def progress_tracker(progress=None, estimated_finish=None):
        if not estimated_finish and not progress:
            return
        if progress > 100:
            progress = 100
        export_task = ExportTask.objects.get(uid=task_uid)
        if progress:
            export_task.progress = progress
        if estimated_finish:
            export_task.estimated_finish = estimated_finish
        export_task.save()

    return progress_tracker
