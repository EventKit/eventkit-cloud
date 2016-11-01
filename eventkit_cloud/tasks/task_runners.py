# -*- coding: utf-8 -*-
import importlib
import logging
import re
import json
import os

from django.conf import settings
from django.db import DatabaseError

from celery import chain, group
from celery.canvas import Signature

from eventkit_cloud.jobs.models import ProviderTask
from eventkit_cloud.tasks.models import ExportTask, ExportProviderTask

from .export_tasks import (OSMConfTask, OSMPrepSchemaTask,
                           OSMToPBFConvertTask, OverpassQueryTask,
                           WFSExportTask, ExternalRasterServiceExportTask,
                           ArcGISFeatureServiceExportTask, ThematicGPKGExportTask, )

# Get an instance of a logger
logger = logging.getLogger(__name__)

export_task_registry = {
    'sqlite': 'eventkit_cloud.tasks.export_tasks.SqliteExportTask',
    'kml': 'eventkit_cloud.tasks.export_tasks.KmlExportTask',
    'shp': 'eventkit_cloud.tasks.export_tasks.ShpExportTask',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.GeopackageExportTask',
}

export_task_registry_thematic = {
    'kml': 'eventkit_cloud.tasks.export_tasks.ThematicKmlExportTask',
    'shp': 'eventkit_cloud.tasks.export_tasks.ThematicShpExportTask',
    'sqlite': 'eventkit_cloud.tasks.export_tasks.ThematicSQLiteExportTask',
    'thematic-gpkg': 'eventkit_cloud.tasks.export_tasks.ThematicGPKGExportTask',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.ThematicGPKGExportTask'
}


class TaskRunner(object):
    """
    Abstract base class for running tasks
    """

    class Meta:
        abstract = True

    def run_task(self, *args, **kwargs):
        raise NotImplementedError('Override in subclass.')


class ExportOSMTaskRunner(TaskRunner):
    """
    Runs HOT Export Tasks
    """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None):
        """
        Run export tasks.
        Args:
            provider_task_uid: the uid of the provider_task to run.
        Return:
            the ExportRun instance.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)

        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [format.slug for format in provider_task.formats.all()]
        export_tasks = {}
        thematic_exports = {}
        task_list = []
        # build a list of celery tasks based on the export formats..
        for format in formats:
            try:
                # instantiate the required class.
                if service_type.get('osm'):
                    export_tasks[format] = {'obj': create_format_task(format)(), 'task_uid': None}
                if format != 'gpkg' and service_type.get('osm-thematic'):
                    thematic_exports[format] = {'obj': create_format_thematic_task(format)(), 'task_uid': None}
            except KeyError as e:
                logger.debug(e)
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)


        # run the tasks
        if service_type.get('osm') or service_type.get('osm-thematic'):

            # pull out the tags to create the conf file
            categories = job.categorised_tags  # dict of points/lines/polygons
            bbox = job.overpass_extents  # extents of provider_task in order required by overpass

            """
            Set up the initial tasks:
                1. Create the ogr2ogr config file for converting pbf to sqlite.
                2. Create the Overpass Query task which pulls raw data from overpass and filters it.
                3. Convert raw osm to compressed pbf.
                4. Create the default sqlite schema file using ogr2ogr config file created at step 1.
            Store in osm_tasks to hold the task_uid.
            """

            osm_tasks = {'conf': {'obj': OSMConfTask(), 'task_uid': None},
                         'query': {'obj': OverpassQueryTask(), 'task_uid': None},
                         'pbfconvert': {'obj': OSMToPBFConvertTask(), 'task_uid': None},
                         'prep_schema': {'obj': OSMPrepSchemaTask(), 'task_uid': None}}
            # check for transform and/or translate configurations
            """
            Not implemented for now.
            transform = provider_task.configs.filter(config_type='TRANSFORM')
            translate = provider_task.configs.filter(config_type='TRANSLATION')
            """
            export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                     name=provider_task.provider.name,
                                                                     status="PENDING")
            # save initial tasks to the db with 'PENDING' state, store task_uid for updating the task later.
            for task_type, task in osm_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task)
                osm_tasks[task_type]['task_uid'] = export_task.uid
            # save export(format) tasks to the db with 'PENDING' state, store task_uid for updating the task later.
            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task)
                export_tasks[task_type]['task_uid'] = export_task.uid

            for task_type, task in thematic_exports.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task)
                thematic_exports[task_type]['task_uid'] = export_task.uid

            """
            Create a celery chain which runs the initial conf and query tasks (initial_tasks),
            followed by a chain of pbfconvert and prep_schema (schema_tasks).
            The export format tasks (format_tasks) are then run in parallel, followed
            by the finalize_task at the end to clean up staging dirs, update run status, email user etc..
            """
            initial_tasks = (
                osm_tasks.get('conf').get('obj').si(categories=categories,
                                                    task_uid=osm_tasks.get('conf').get('task_uid'),
                                                    job_name=job_name,
                                                    stage_dir=stage_dir) |
                osm_tasks.get('query').get('obj').si(stage_dir=stage_dir,
                                                     task_uid=osm_tasks.get('query').get('task_uid'),
                                                     job_name=job_name,
                                                     bbox=bbox,
                                                     filters=job.filters)
            )

            schema_tasks = (
                osm_tasks.get('pbfconvert').get('obj').si(stage_dir=stage_dir,
                                                          job_name=job_name,
                                                          task_uid=osm_tasks.get('pbfconvert').get('task_uid')) |
                osm_tasks.get('prep_schema').get('obj').si(stage_dir=stage_dir,
                                                           job_name=job_name,
                                                           task_uid=osm_tasks.get('prep_schema').get('task_uid'))
            )

            task_chain = (initial_tasks | schema_tasks)

            thematic_tasks = None
            if service_type.get('osm-thematic'):

                thematic_gpkg_task = create_format_thematic_task('thematic-gpkg')()
                thematic_gpkg = {'obj': thematic_gpkg_task,
                                   'task_uid': create_export_task(task_name=thematic_gpkg_task.name,
                                                                  export_provider_task=export_provider_task).uid}
                thematic_tasks = (thematic_gpkg.get('obj').si(run_uid=run.uid,
                                                                stage_dir=stage_dir,
                                                                job_name=job_name,
                                                                task_uid=thematic_gpkg.get('task_uid')) |
                                  group(task.get('obj').si(run_uid=run.uid,
                                                           stage_dir=stage_dir,
                                                           job_name=job_name,
                                                           task_uid=task.get('task_uid')) for task_name, task in
                                        thematic_exports.iteritems())
                                  )

            if service_type.get('osm'):
                format_tasks = group(task.get('obj').si(run_uid=run.uid,
                                                        stage_dir=stage_dir,
                                                        job_name=job_name,
                                                        task_uid=task.get('task_uid')) for task_name, task in
                                     export_tasks.iteritems() if task is not None)
                task_chain = (task_chain | format_tasks)
            """
            the tasks are chained instead of nested groups.
            this is because celery3.x has issues with handling these callbacks
            even using redis as a result backend
            """

            if service_type.get('osm-thematic'):
                task_chain = (task_chain | thematic_tasks)

            return export_provider_task.uid, task_chain
        else:
            return None, False


class ExportWFSTaskRunner(TaskRunner):
    """
    Runs External Service Export Tasks
    """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None):
        """
        Run export tasks.

        Args:
            provider_task_uid: the uid of the provider_task to run.

        Return:
            the ExportRun instance.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [format.slug for format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for format in formats:
            if not format.startswith('thematic-'):
                try:
                    # instantiate the required class.
                    export_tasks[format] = {'obj': create_format_task(format)(), 'task_uid': None}
                except KeyError as e:
                    logger.debug(e)
                except ImportError as e:
                    msg = 'Error importing export task: {0}'.format(e)
                    logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:
            bbox = json.loads("[{}]".format(job.overpass_extents))

            # swap xy
            bbox = [bbox[1], bbox[0], bbox[3], bbox[2]]
            export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                     name=provider_task.provider.name,
                                                                     status="PENDING")

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task)
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = WFSExportTask()
            export_task = create_export_task(task_name=service_task.name,
                                             export_provider_task=export_provider_task)

            initial_task = (service_task.si(stage_dir=stage_dir,
                                            job_name=job_name,
                                            task_uid=export_task.uid,
                                            name=provider_task.provider.slug,
                                            layer=provider_task.provider.layer,
                                            bbox=bbox,
                                            service_url=provider_task.provider.url))

            format_tasks = group(task.get('obj').si(run_uid=run.uid,
                                                    stage_dir=stage_dir,
                                                    job_name=job_name,
                                                    task_uid=task.get('task_uid')) for task_name, task in
                                 export_tasks.iteritems() if task is not None)

            task_chain = (initial_task | format_tasks)
            return export_provider_task.uid, task_chain


class ExportArcGISFeatureServiceTaskRunner(TaskRunner):
    """
    Runs External Service Export Tasks
    """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None):
        """
        Run export tasks.

        Args:
            provider_task_uid: the uid of the provider_task to run.

        Return:
            the ExportRun instance.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [format.slug for format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for format in formats:
            if not format.startswith('thematic-'):
                try:
                    # instantiate the required class.
                    export_tasks[format] = {'obj': create_format_task(format)(), 'task_uid': None}
                except KeyError as e:
                    logger.debug(e)
                except ImportError as e:
                    msg = 'Error importing export task: {0}'.format(e)
                    logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:
            bbox = json.loads("[{}]".format(job.overpass_extents))

            # swap xy
            bbox = [bbox[1], bbox[0], bbox[3], bbox[2]]
            export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                     name=provider_task.provider.name,
                                                                     status="PENDING")

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task)
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = ArcGISFeatureServiceExportTask()
            export_task = create_export_task(task_name=service_task.name,
                                             export_provider_task=export_provider_task)

            initial_task = (service_task.si(stage_dir=stage_dir,
                                            job_name=job_name,
                                            task_uid=export_task.uid,
                                            name=provider_task.provider.slug,
                                            layer=provider_task.provider.layer,
                                            bbox=bbox,
                                            service_url=provider_task.provider.url))

            format_tasks = group(task.get('obj').si(run_uid=run.uid,
                                                    stage_dir=stage_dir,
                                                    job_name=job_name,
                                                    task_uid=task.get('task_uid')) for task_name, task in
                                 export_tasks.iteritems() if task is not None)

            task_chain = (initial_task | format_tasks)
            return export_provider_task.uid, task_chain


class ExportExternalRasterServiceTaskRunner(TaskRunner):
    """
    Runs External Service Export Tasks
    """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None):
        """
        Run export tasks.

        Args:
            provider_task_uid: the uid of the provider_task to run.

        Return:
            the ExportRun instance.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [format.slug for format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        # for format in formats:
        try:
            # instantiate the required class.
            # export_tasks[format] = {'obj': create_format_task(format)(), 'task_uid': None}
            export_tasks['gpkg'] = {'obj': create_format_task('gpkg')(), 'task_uid': None}
        except KeyError as e:
            logger.debug(e)
        except ImportError as e:
            msg = 'Error importing export task: {0}'.format(e)
            logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:
            bbox = json.loads("[{}]".format(job.overpass_extents))

            # swap xy
            bbox = [bbox[1], bbox[0], bbox[3], bbox[2]]
            export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                     name=provider_task.provider.name,
                                                                     status="PENDING")

            service_task = ExternalRasterServiceExportTask()
            export_task = create_export_task(task_name=service_task.name,
                                             export_provider_task=export_provider_task)

            return export_provider_task.uid, service_task.si(stage_dir=stage_dir,
                                                             job_name=job_name,
                                                             task_uid=export_task.uid,
                                                             name=provider_task.provider.slug,
                                                             layer=provider_task.provider.layer,
                                                             config=provider_task.provider.config,
                                                             bbox=bbox,
                                                             service_url=provider_task.provider.url,
                                                             level_from=provider_task.provider.level_from,
                                                             level_to=provider_task.provider.level_to,
                                                             service_type=service_type)
        else:
            return None, None


def create_format_task(format):
    task_fq_name = export_task_registry[format]
    # instantiate the required class.
    parts = task_fq_name.split('.')
    module_path, class_name = '.'.join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    CeleryExportTask = getattr(module, class_name)
    return CeleryExportTask

def create_format_thematic_task(format):
    task_fq_name = export_task_registry_thematic[format]
    # instantiate the required class.
    parts = task_fq_name.split('.')
    module_path, class_name = '.'.join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    CeleryExportTask = getattr(module, class_name)
    return CeleryExportTask


def normalize_job_name(name):
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", '', name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", '_', s)
    return s.lower()


def create_export_task(task_name=None, export_provider_task=None):
    try:
        export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                status='PENDING', name=task_name)
        logger.debug('Saved task: {0}'.format(task_name))
    except DatabaseError as e:
        logger.error('Saving task {0} threw: {1}'.format(task_name, e))
        raise e
    return export_task


def error_handler(task_id=None):
    logger.debug('In error handler %s' % task_id)
