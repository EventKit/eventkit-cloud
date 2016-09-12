# -*- coding: utf-8 -*-
from __future__ import absolute_import

import cPickle
import os
import shutil

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.db import DatabaseError
from django.template import Context
from django.template.loader import get_template
from django.utils import timezone

from celery import Task
from celery.utils.log import get_task_logger

from oet2.jobs.presets import TagParser
from oet2.utils import (
    kml, osmconf, osmparse, overpass, pbf, shp, thematic_shp, geopackage, wms
)

# Get an instance of a logger
logger = get_task_logger(__name__)


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
        Update the successfuly completed task as follows:

            1. update the time the task completed
            2. caclulate the size of the output file
            3. calculate the download path of the export
            4. create the export download directory
            5. copy the export file to the download directory
            6. create the export task result
            7. update the export task status and save it
        """
        from oet2.tasks.models import ExportTask, ExportTaskResult
        # update the task
        finished = timezone.now()
        task = ExportTask.objects.get(celery_uid=task_id)
        provider_task_name = task.export_provider_task.name
        task.finished_at = finished
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
        provider_dir = os.path.join(run_dir, provider_slug)
        download_path = os.path.join(provider_dir, filename)
        try:
            if not os.path.exists(run_dir):
                os.makedirs(run_dir)
            if not os.path.exists(provider_dir):
                os.makedirs(provider_dir)
            # don't copy raw run_dir data
            if (task.name != 'OverpassQuery'):
                shutil.copy(output_url, download_path)
        except IOError as e:
            logger.error('Error copying output file to: {0}'.format(download_path))
        # construct the download url
        download_media_root = settings.EXPORT_MEDIA_ROOT.rstrip('\/')
        download_url = '/'.join([download_media_root, run_uid, provider_slug, filename])
        # save the task and task result
        result = ExportTaskResult(
            task=task,
            filename=filename,
            size=size,
            download_url=download_url
        )
        result.save()
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
        from oet2.tasks.models import ExportTask, ExportTaskException, ExportProviderTask
        logger.debug('Task name: {0} failed, {1}'.format(self.name, einfo))
        task = ExportTask.objects.get(celery_uid=task_id)
        task.status = 'FAILED'
        task.finished_at = timezone.now()
        task.save()
        exception = cPickle.dumps(einfo)
        ete = ExportTaskException(task=task, exception=exception)
        ete.save()
        if self.abort_on_error:
            run = ExportProviderTask.objects.get(tasks__celery_uid=task_id).run
            run.status = 'FAILED'
            run.finished_at = timezone.now()
            run.save()
            error_handler = ExportTaskErrorHandler()
            # run error handler
            stage_dir = kwargs['stage_dir']
            error_handler.si(run_uid=str(run.uid), task_id=task_id, stage_dir=stage_dir).delay()

    def after_return(self, *args, **kwargs):
        logger.debug('Task returned: {0}'.format(self.request))

    def update_task_state(self, task_uid=None):
        """
        Update the task state and celery task uid.
        Can use the celery uid for diagnostics.
        """
        started = timezone.now()
        from oet2.tasks.models import ExportTask
        celery_uid = self.request.id
        try:
            task = ExportTask.objects.get(uid=task_uid)
            celery_uid = self.request.id
            task.celery_uid = celery_uid
            task.status = 'RUNNING'
            task.started_at = started
            task.save()
            logger.debug('Updated task: {0} with uid: {1}'.format(task.name, task.uid))
        except DatabaseError as e:
            logger.error('Updating task {0} state throws: {1}'.format(task.name, e))
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

    def run(self, task_uid= None, stage_dir=None, job_name=None, filters=None, bbox=None):
        """
        Runs the query and returns the path to the filtered osm file.
        """
        self.update_task_state(task_uid=task_uid)
        op = overpass.Overpass(
            bbox=bbox, stage_dir=stage_dir,
            job_name=job_name, filters=filters
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

    def run(self, task_uid= None, stage_dir=None, job_name=None):
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
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        osmconf = os.path.join(stage_dir, '{0}.ini'.format(job_name))
        osmparser = osmparse.OSMParser(osm=osm, sqlite=sqlite, osmconf=osmconf)
        osmparser.create_spatialite()
        osmparser.create_default_schema()
        osmparser.update_zindexes()
        return {'result': sqlite}


class ThematicLayersExportTask(ExportTask):
    """
    Task to export thematic shapefile.
    """

    name = "Thematic Shapefile Export"

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        from oet2.tasks.models import ExportRun
        self.update_task_state(task_uid=task_uid)
        run = ExportRun.objects.get(uid=run_uid)
        tags = run.job.categorised_tags
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        try:
            t2s = thematic_shp.ThematicSQliteToShp(sqlite=sqlite, tags=tags, job_name=job_name)
            t2s.generate_thematic_schema()
            out = t2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in thematic task, %s', str(e))
            raise Exception(e)  # hand off to celery..


class ShpExportTask(ExportTask):
    """
    Class defining SHP export function.
    """
    name = 'Default Shapefile Export'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        shapefile = os.path.join(stage_dir,'{0}_shp'.format(job_name))
        try:
            s2s = shp.SQliteToShp(sqlite=sqlite, shapefile=shapefile)
            out = s2s.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in shapefile export, %s', str(e))
            raise Exception(e)


class KmlExportTask(ExportTask):
    """
    Class defining KML export function.
    """
    name = 'KML Export'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        kmlfile = os.path.join(stage_dir, '{0}.kml'.format(job_name))
        try:
            s2k = kml.SQliteToKml(sqlite=sqlite, kmlfile=kmlfile)
            out = s2k.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in kml export, %s', str(e))
            raise Exception(e)

class SqliteExportTask(ExportTask):
    """
    Class defining SQLITE export function.
    """

    name = 'SQLITE Export'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        # sqlite already generated by OSMPrepSchema so just return path.
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        return {'result': sqlite}


class GeopackageExportTask(ExportTask):
    """
    Class defining geopackage export function.
    """
    name = 'Geopackage Export'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        sqlite = os.path.join(stage_dir, '{0}.sqlite'.format(job_name))
        gpkgfile = os.path.join(stage_dir, '{0}.gpkg'.format(job_name))
        try:
            s2g = geopackage.SQliteToGeopackage(sqlite=sqlite, gpkgfile=gpkgfile)
            out = s2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in geopackage export, %s', str(e))
            raise Exception(e)


class WMSExportTask(ExportTask):
    """
    Class defining geopackage export function.
    """
    name = 'WMS Export'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        self.update_task_state(task_uid=task_uid)
        gpkgfile = stage_dir + job_name + '.gpkg'
        try:

            w2g = wms.WMSToGeopackage(gpkgfile=gpkgfile)
            out = w2g.convert()
            return {'result': out}
        except Exception as e:
            logger.error('Raised exception in wms export, %s', str(e))
            raise Exception(e)


class GeneratePresetTask(ExportTask):
    """
    Generates a JOSM Preset from the exports selected features.
    """

    name = 'Generate Preset'

    def run(self, run_uid=None, task_uid= None, stage_dir=None, job_name=None):
        from oet2.tasks.models import ExportRun
        from oet2.jobs.models import ExportConfig
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
            config = ExportConfig.objects.create(
                name=name, filename=filename,
                config_type='PRESET', content_type=content_type,
                user=user, published=feature_pub
            )
            config.upload.save(filename, preset_file)

            output_path = config.upload.path
            job.configs.clear()
            job.configs.add(config)
            return {'result': output_path}


class FinalizeRunTask(Task):
    """
    Finalizes export run.

    Cleans up staging directory.
    Updates run with finish time.
    Emails user notification.
    """

    name = 'Finalize Export Run'

    def run(self, run_uid=None, stage_dir=None):
        from oet2.tasks.models import ExportRun
        run = ExportRun.objects.get(uid=run_uid)
        run.status = 'COMPLETED'
        tasks = []
        provider_tasks = run.provider_tasks.all()
        for provider_task in provider_tasks:
            tasks.extend(provider_task.tasks.all())
        # mark run as incomplete if any tasks fail
        for task in tasks:
            if task.status == 'FAILED':
                run.status = 'INCOMPLETE'
        finished = timezone.now()
        run.finished_at = finished
        run.save()
        try:
            shutil.rmtree(stage_dir)
        except IOError as e:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))

        # send notification email to user
        hostname = settings.HOSTNAME
        url = 'http://{0}/exports/{1}'.format(hostname, run.job.uid)
        addr = run.user.email
        subject = "Your HOT Export is ready"
        to = [addr]
        from_email = 'HOT Exports <exports@hotosm.org>'
        ctx = {
            'url': url,
            'status': run.status
        }
        text = get_template('email/email.txt').render(Context(ctx))
        html = get_template('email/email.html').render(Context(ctx))
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()


class ExportTaskErrorHandler(Task):
    """
    Handles un-recoverable errors in export tasks.
    """

    name = "Export Task Error Handler"

    def run(self, run_uid, task_id=None, stage_dir=None):
        from oet2.tasks.models import ExportRun
        finished = timezone.now()
        run = ExportRun.objects.get(uid=run_uid)
        run.finished_at = finished
        run.status = 'FAILED'
        run.save()
        try:
            if os.path.isdir(stage_dir):
                #leave the stage_dir in place for debugging
                #shutil.rmtree(stage_dir)
                pass
        except IOError as e:
            logger.error('Error removing {0} during export finalize'.format(stage_dir))
        hostname = settings.HOSTNAME
        url = 'http://{0}/exports/{1}'.format(hostname, run.job.uid)
        addr = run.user.email
        subject = "Your HOT Export Failed"
        # email user and administrator
        to = [addr, settings.TASK_ERROR_EMAIL]
        from_email = 'HOT Exports <exports@hotosm.org>'
        ctx = {
            'url': url,
            'task_id': task_id
        }
        text = get_template('email/error_email.txt').render(Context(ctx))
        html = get_template('email/error_email.html').render(Context(ctx))
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()
