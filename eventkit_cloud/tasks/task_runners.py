# -*- coding: utf-8 -*-
import importlib
import logging
import re
import json

from django.conf import settings
from django.db import DatabaseError

from celery import group, chain  # required for tests
from eventkit_cloud.jobs.models import ProviderTask
from eventkit_cloud.tasks.models import ExportTask, ExportProviderTask

from .export_tasks import (osm_conf_task, osm_prep_schema_task,
                           osm_to_pbf_convert_task, overpass_query_task,
                           wfs_export_task, external_raster_service_export_task,
                           arcgis_feature_service_export_task, osm_create_styles_task)

# Get an instance of a logger
logger = logging.getLogger(__name__)

export_task_registry = {
    'sqlite': 'eventkit_cloud.tasks.export_tasks.sqlite_export_task',
    'kml': 'eventkit_cloud.tasks.export_tasks.kml_export_task',
    'shp': 'eventkit_cloud.tasks.export_tasks.shp_export_task',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.geopackage_export_task',
    'gpkg-thematic': 'eventkit_cloud.tasks.export_tasks.osm_thematic_gpkg_export_task'
}


class TaskRunner(object):
    """
    Abstract base class for running tasks
    """

    class Meta:
        abstract = True

    def run_task(self, *args, **kwargs):
        raise NotImplementedError('Override in subclass.')


class ExportGenericOSMTaskRunner(TaskRunner):
    """
    Runs Generic OSM Export Tasks
    """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run OSM export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the ProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An ExportProviderTask uid and the Celery Task Chain or None, False.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}

        # build a list of celery tasks based on the export formats..
        for format in formats:
            try:
                export_tasks[format] = {'obj': create_format_task(format), 'task_uid': None}
            except KeyError as e:
                logger.debug(e)
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks

        if len(export_tasks) > 0:
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

            osm_tasks = {'conf': {'obj': osm_conf_task, 'task_uid': None},
                         'query': {'obj': overpass_query_task, 'task_uid': None},
                         'pbfconvert': {'obj': osm_to_pbf_convert_task, 'task_uid': None},
                         'prep_schema': {'obj': osm_prep_schema_task, 'task_uid': None}}

            export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                     name=provider_task.provider.name,
                                                                     slug=provider_task.provider.slug,
                                                                     status="PENDING")
            # save initial tasks to the db with 'PENDING' state, store task_uid for updating the task later.
            for task_type, task in osm_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task, worker=worker)
                osm_tasks[task_type]['task_uid'] = export_task.uid
            # save export(format) tasks to the db with 'PENDING' state, store task_uid for updating the task later.
            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task, worker=worker)
                export_tasks[task_type]['task_uid'] = export_task.uid

            """
            Create a celery chain which runs the initial conf and query tasks (initial_tasks),
            followed by a chain of pbfconvert and prep_schema (schema_tasks).
            The export format tasks (format_tasks) are then run in parallel, followed
            by the finalize_task at the end to clean up staging dirs, update run status, email user etc..
            """
            initial_tasks = (
                osm_tasks.get('conf').get('obj').s(categories=categories,
                                                    task_uid=osm_tasks.get('conf').get('task_uid'),
                                                    job_name=job_name,
                                                    stage_dir=stage_dir).set(queue=worker, routing_key=worker) |
                osm_tasks.get('query').get('obj').s(stage_dir=stage_dir,
                                                     task_uid=osm_tasks.get('query').get('task_uid'),
                                                     job_name=job_name,
                                                     bbox=bbox,
                                                     filters=job.filters).set(queue=worker, routing_key=worker)
            )

            schema_tasks = (
                osm_tasks.get('pbfconvert').get('obj').s(stage_dir=stage_dir,
                                                          job_name=job_name,
                                                          task_uid=osm_tasks.get('pbfconvert').get('task_uid')).set(
                    queue=worker, routing_key=worker) |
                osm_tasks.get('prep_schema').get('obj').s(stage_dir=stage_dir,
                                                           job_name=job_name,
                                                           task_uid=osm_tasks.get('prep_schema').get('task_uid')).set(
                    queue=worker, routing_key=worker)
            )

            task_chain = (initial_tasks | schema_tasks)

            if export_tasks.get('gpkg'):
                gpkg_export_task = export_tasks.pop('gpkg')
                task_chain = (task_chain | gpkg_export_task.get('obj').s(run_uid=run.uid,
                                                        stage_dir=stage_dir,
                                                        job_name=job_name,
                                                        task_uid=gpkg_export_task.get('task_uid')).set(queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                        stage_dir=stage_dir,
                                                        job_name=job_name,
                                                        task_uid=task.get('task_uid')).set(queue=worker, routing_key=worker) for
                                     task_name, task in
                                     export_tasks.iteritems() if task is not None)
                task_chain = (task_chain | format_tasks)

            """
            the tasks are chained instead of nested groups.
            this is because celery3.x has issues with handling these callbacks
            even using redis as a result backend
            """

            return export_provider_task.uid, task_chain
        else:
            return None, None


class ExportThematicOSMTaskRunner(TaskRunner):
    """Run Thematic OSM Export Tasks, this requires an OSM file be available to it."""

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run OSM export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the ProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :param osm_gpkg: A OSM geopackage with the planet osm schema.
        :return: An ExportProviderTask uid and the Celery Task Chain or None, False.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))

        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}

        # build a list of celery tasks based on the export formats...
        for format in formats:
            if format == 'gpkg':
                continue
            try:
                export_tasks[format] = {'obj': create_format_task(format), 'task_uid': None}
            except KeyError as e:
                logger.debug(e)
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        export_provider_task = ExportProviderTask.objects.create(run=run,
                                                                 name=provider_task.provider.name,
                                                                 slug=provider_task.provider.slug,
                                                                 status="PENDING")

        for task_type, task in export_tasks.iteritems():
            export_task = create_export_task(task_name=task.get('obj').name,
                                             export_provider_task=export_provider_task, worker=worker)
            export_tasks[task_type]['task_uid'] = export_task.uid

        """
        Create a celery chain which uses a gpkg file with the planet osm schema, so that it can be converted to a
        thematic schema.
        """
        thematic_gpkg_task = create_format_task('gpkg-thematic')
        thematic_gpkg = {'obj': thematic_gpkg_task,
                         'task_uid': create_export_task(task_name=thematic_gpkg_task.name,
                                                        export_provider_task=export_provider_task, worker=worker).uid}

        # Note this needs to be mutable (s instead of si) so that it can take the result of the generic osm tasks.
        thematic_task = thematic_gpkg.get('obj').s(run_uid=run.uid,
                                                      stage_dir=stage_dir,
                                                      job_name=job_name,
                                                      task_uid=thematic_gpkg.get('task_uid')).set(
            queue=worker, routing_key=worker)
        if export_tasks:
            format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                       stage_dir=stage_dir,
                                                       job_name=job_name,
                                                       task_uid=task.get('task_uid')).set(queue=worker, routing_key=worker) for
                                    task_name, task in
                                    export_tasks.iteritems())
        else:
            format_tasks = None

        thematic_tasks = (thematic_task | format_tasks) if format_tasks else thematic_task

        bbox = run.job.extents
        style_task = osm_create_styles_task.s(task_uid=create_export_task(task_name=osm_create_styles_task.name,
                                                                           export_provider_task=export_provider_task,
                                                                           worker=worker).uid,
                                               stage_dir=stage_dir,
                                               job_name=job_name,
                                               bbox=bbox,
                                               provider_slug=provider_task.provider.slug).set(queue=worker,
                                                                                              routing_key=worker)

        return export_provider_task.uid, (thematic_tasks | style_task)


class ExportWFSTaskRunner(TaskRunner):
    """
    Runs External Service Export Tasks
    """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run WFS export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the ProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An ExportProviderTask uid and the Celery Task Chain or None, False.
        """
        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = ProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_job_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for _format in formats:
            try:
                # instantiate the required class.
                export_tasks[_format] = {'obj': create_format_task(_format), 'task_uid': None}
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
                                                                     slug=provider_task.provider.slug,
                                                                     status="PENDING")

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task, worker=worker)
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = wfs_export_task
            export_task = create_export_task(task_name=service_task.name,
                                             export_provider_task=export_provider_task, worker=worker)

            task_chain = (service_task.s(stage_dir=stage_dir,
                                            job_name=job_name,
                                            task_uid=export_task.uid,
                                            name=provider_task.provider.slug,
                                            layer=provider_task.provider.layer,
                                            bbox=bbox,
                                            service_url=provider_task.provider.url).set(queue=worker, routing_key=worker))

            if export_tasks.get('gpkg'):
                gpkg_export_task = export_tasks.pop('gpkg')
                task_chain = (task_chain | gpkg_export_task.get('obj').s(run_uid=run.uid,
                                                                         stage_dir=stage_dir,
                                                                         job_name=job_name,
                                                                         task_uid=gpkg_export_task.get('task_uid')).set(
                    queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                        stage_dir=stage_dir,
                                                        job_name=job_name,
                                                        task_uid=task.get('task_uid')).set(queue=worker, routing_key=worker) for task_name, task
                                     in
                                     export_tasks.iteritems() if task is not None)

                task_chain = (task_chain | format_tasks)
            return export_provider_task.uid, task_chain
        else:
            return None, None


class ExportArcGISFeatureServiceTaskRunner(TaskRunner):
    """
        Run ArcGIS Feature Service export tasks.
        Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the ProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An ExportProviderTask uid and the Celery Task Chain or None, False.
        """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
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
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for format in formats:
            try:
                # instantiate the required class.
                export_tasks[format] = {'obj': create_format_task(format), 'task_uid': None}
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
                                                                     slug=provider_task.provider.slug,
                                                                     status="PENDING")

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task(task_name=task.get('obj').name,
                                                 export_provider_task=export_provider_task, worker=worker)
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = arcgis_feature_service_export_task
            export_task = create_export_task(task_name=service_task.name,
                                             export_provider_task=export_provider_task, worker=worker)

            task_chain = (service_task.s(stage_dir=stage_dir,
                                            job_name=job_name,
                                            task_uid=export_task.uid,
                                            name=provider_task.provider.slug,
                                            layer=provider_task.provider.layer,
                                            bbox=bbox,
                                            service_url=provider_task.provider.url).set(queue=worker, routing_key=worker))

            if export_tasks.get('gpkg'):
                gpkg_export_task = export_tasks.pop('gpkg')
                task_chain = (task_chain | gpkg_export_task.get('obj').s(run_uid=run.uid,
                                                                           stage_dir=stage_dir,
                                                                           job_name=job_name,
                                                                           task_uid=gpkg_export_task.get('task_uid')).set(
                    queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                        stage_dir=stage_dir,
                                                        job_name=job_name,
                                                        task_uid=task.get('task_uid')).set(queue=worker, routing_key=worker) for task_name, task
                                     in
                                     export_tasks.iteritems() if task is not None)

                task_chain = (task_chain | format_tasks)
            return export_provider_task.uid, task_chain
        else:
            return None, None


class ExportExternalRasterServiceTaskRunner(TaskRunner):
    """
        Run External Service (raster tiler) export tasks.
        Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the ProviderTask model.
        :param user: The user executing the task.
        :param service_type: The type name of the service type to autoconfigure the service (not yet implemented).
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An ExportProviderTask uid and the Celery Task Chain or None, False.
        """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None, worker=None, **kwargs):
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
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        try:
            # instantiate the required class.
            export_tasks['gpkg'] = {'obj': create_format_task('gpkg'), 'task_uid': None}
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
                                                                     slug=provider_task.provider.slug,
                                                                     status="PENDING")


            export_task = create_export_task(task_name=external_raster_service_export_task.name,
                                             export_provider_task=export_provider_task, worker=worker)

            service_task = external_raster_service_export_task.s(stage_dir=stage_dir,
                                                                  run_uid=run.uid,
                                                                  job_name=job_name,
                                                                  task_uid=export_task.uid,
                                                                  name=provider_task.provider.slug,
                                                                  layer=provider_task.provider.layer,
                                                                  config=provider_task.provider.config,
                                                                  bbox=bbox,
                                                                  selection=job.the_geom.geojson,
                                                                  service_url=provider_task.provider.url,
                                                                  level_from=provider_task.provider.level_from,
                                                                  level_to=provider_task.provider.level_to,
                                                                  service_type=service_type).set(queue=worker,
                                                                                                 routing_key=worker)
            return export_provider_task.uid, service_task
        else:
            return None, None


def create_format_task(task_format):
    task_fq_name = export_task_registry[task_format]
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


def create_export_task(task_name=None, export_provider_task=None, worker=None):
    try:
        export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                name=task_name, worker=worker)
        logger.debug('Saved task: {0}'.format(task_name))
    except DatabaseError as e:
        logger.error('Saving task {0} threw: {1}'.format(task_name, e))
        raise e
    return export_task


def error_handler(task_id=None):
    logger.debug('In error handler %s' % task_id)
