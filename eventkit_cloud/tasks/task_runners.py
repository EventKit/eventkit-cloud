# -*- coding: utf-8 -*-
import importlib
import json
import logging
import re

from django.conf import settings
from django.db import DatabaseError

from celery import group, chain  # required for tests
from eventkit_cloud.jobs.models import DataProviderTask
from eventkit_cloud.tasks.export_tasks import (
    wcs_export_task,
    wfs_export_task,
    external_raster_service_export_task,
    arcgis_feature_service_export_task,
    osm_data_collection_task,
    TaskStates)

from eventkit_cloud.tasks.models import ExportTaskRecord, DataProviderTaskRecord

logger = logging.getLogger(__name__)

export_task_registry = {
    'sqlite': 'eventkit_cloud.tasks.export_tasks.sqlite_export_task',
    'kml': 'eventkit_cloud.tasks.export_tasks.kml_export_task',
    'shp': 'eventkit_cloud.tasks.export_tasks.shp_export_task',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.geopackage_export_task',
    'gpkg-thematic': 'eventkit_cloud.tasks.export_tasks.osm_thematic_gpkg_export_task',
    'geotiff': 'eventkit_cloud.tasks.export_tasks.geotiff_export_task'
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
    """ Run OSM Export Tasks; Essentially, collect data and convert to thematic gpkg, then run output formats.
    """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run OSM export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :param osm_gpkg: A OSM geopackage with the planet osm schema.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        user_details = kwargs.get('user_details')
        if user_details is None:
            user_details = {'username': 'unknown-ExportOSMTaskRunner.run_task'}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job

        job_name = normalize_name(job.name)
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
                logger.debug('KeyError: export_tasks[{}] - {}'.format(format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        export_provider_task_record = DataProviderTaskRecord.objects.create(run=run,
                                                                            name=provider_task.provider.name,
                                                                            slug=provider_task.provider.slug,
                                                                            status=TaskStates.PENDING.value,
                                                                            display=True)

        for format, task in export_tasks.iteritems():
            export_task = create_export_task_record(
                task_name=task.get('obj').name,
                export_provider_task=export_provider_task_record, worker=worker,
                display=getattr(task.get('obj'), "display", False)
            )
            export_tasks[format]['task_uid'] = export_task.uid

        """
        Create a celery chain which gets a gpkg of osm data & runs export formats
        """
        if export_tasks:
            format_tasks = chain(
                task.get('obj').s(
                    run_uid=run.uid, stage_dir=stage_dir, job_name=job_name, task_uid=task.get('task_uid'),
                    user_details=user_details, locking_task_key=export_provider_task_record.uid
                ).set(queue=worker, routing_key=worker)
                for format_ignored, task in export_tasks.iteritems()
            )
        else:
            format_tasks = None

        bbox = run.job.extents

        osm_data_collection_task_record = create_export_task_record(
            task_name=osm_data_collection_task.name,
            export_provider_task=export_provider_task_record, worker=worker,
            display=getattr(osm_data_collection_task, "display", False)
        )

        osm_gpkg_task = osm_data_collection_task.s(
            run_uid=run.uid, provider_slug=provider_task.provider.slug, stage_dir=stage_dir,
            export_provider_task_record_uid=export_provider_task_record.uid, worker=worker,
            job_name=job_name, bbox=bbox, user_details=user_details, task_uid=osm_data_collection_task_record.uid,
            config=provider_task.provider.config, locking_task_key=export_provider_task_record.uid
        )

        if format_tasks:
            tasks = chain(osm_gpkg_task, format_tasks)
        else:
            tasks = osm_gpkg_task

        return export_provider_task_record.uid, tasks


class ExportWFSTaskRunner(TaskRunner):
    """
    Runs External WFS Service Export Tasks
    """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run WFS export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        user_details = kwargs.get('user_details')
        if user_details is None:
            user_details = {'username': 'unknown-ExportWFSTaskRunner.run_task'}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for _format in formats:
            try:
                # instantiate the required class.
                export_tasks[_format] = {'obj': create_format_task(_format), 'task_uid': None}
            except KeyError as e:
                logger.debug('KeyError: export_tasks[{}] - {}'.format(_format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:
            bbox = job.extents

            export_provider_task = DataProviderTaskRecord.objects.create(run=run,
                                                                         name=provider_task.provider.name,
                                                                         slug=provider_task.provider.slug,
                                                                         status=TaskStates.PENDING.value,
                                                                         display=True)

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task_record(task_name=task.get('obj').name,
                                                        export_provider_task=export_provider_task, worker=worker,
                                                        display=getattr(task.get('obj'), "display", False))
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = wfs_export_task
            export_task = create_export_task_record(task_name=service_task.name,
                                                    export_provider_task=export_provider_task, worker=worker,
                                                    display=getattr(service_task, "display", False))

            task_chain = (service_task.s(stage_dir=stage_dir,
                                         job_name=job_name,
                                         task_uid=export_task.uid,
                                         name=provider_task.provider.slug,
                                         layer=provider_task.provider.layer,
                                         bbox=bbox,
                                         service_url=provider_task.provider.url,
                                         user_details=user_details,
                                         locking_task_key=export_provider_task.uid).set(queue=worker, routing_key=worker))

            if export_tasks.get('gpkg'):
                gpkg_export_task = export_tasks.pop('gpkg')
                task_chain = (task_chain | gpkg_export_task.get('obj').s(run_uid=run.uid,
                                                                         stage_dir=stage_dir,
                                                                         job_name=job_name,
                                                                         task_uid=gpkg_export_task.get('task_uid'),
                                                                         user_details=user_details,
                                                                         locking_task_key=export_provider_task.uid) \
                              .set(queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                       stage_dir=stage_dir,
                                                       job_name=job_name,
                                                       task_uid=task.get('task_uid'),
                                                       user_details=user_details).set(queue=worker, routing_key=worker)
                                     for task_name, task
                                     in
                                     export_tasks.iteritems() if task is not None)

                task_chain = (task_chain | format_tasks)

            return export_provider_task.uid, task_chain
        else:
            return None, None


# TODO: create super class for OGC web service task runners, to cut down on code duplication
class ExportWCSTaskRunner(TaskRunner):
    """
    Runs External WCS Service Export Tasks
    """
    export_task_registry = settings.EXPORT_TASKS

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None, **kwargs):
        """
        Run WCS export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        user_details = kwargs.get('user_details')
        if user_details is None:
            user_details = {'username': 'unknown-ExportWCSTaskRunner.run_task'}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        formats += ['geotiff']
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for _format in formats:
            try:
                # instantiate the required class.
                export_tasks[_format] = {'obj': create_format_task(_format), 'task_uid': None}
            except KeyError as e:
                logger.debug('KeyError: export_tasks[{}] - {}'.format(_format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:
            bbox = job.extents

            export_provider_task = DataProviderTaskRecord.objects.create(run=run,
                                                                         name=provider_task.provider.name,
                                                                         slug=provider_task.provider.slug,
                                                                         status=TaskStates.PENDING.value,
                                                                         display=True)

            export_tasks.pop('gpkg')

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task_record(task_name=task.get('obj').name,
                                                        export_provider_task=export_provider_task, worker=worker,
                                                        display=getattr(task.get('obj'), "display", False))
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = wcs_export_task
            export_task = create_export_task_record(task_name=service_task.name,
                                                    export_provider_task=export_provider_task, worker=worker,
                                                    display=getattr(service_task, "display", False))

            task_chain = (service_task.s(stage_dir=stage_dir,
                                         job_name=job_name,
                                         task_uid=export_task.uid,
                                         name=provider_task.provider.slug,
                                         layer=provider_task.provider.layer,
                                         bbox=bbox,
                                         service_url=provider_task.provider.url,
                                         user_details=user_details,
                                         locking_task_key=export_provider_task.uid).set(queue=worker, routing_key=worker))

            if export_tasks.get('geotiff'):
                gtiff_export_task = export_tasks.pop('geotiff')
                task_chain = (task_chain | gtiff_export_task.get('obj').s(run_uid=run.uid,
                                                                          stage_dir=stage_dir,
                                                                          job_name=job_name,
                                                                          task_uid=gtiff_export_task.get('task_uid'),
                                                                          user_details=user_details,
                                                                          locking_task_key=export_provider_task.uid)
                              .set(queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                       stage_dir=stage_dir,
                                                       job_name=job_name,
                                                       task_uid=task.get('task_uid'),
                                                       user_details=user_details).set(queue=worker, routing_key=worker)
                                     for task_name, task
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

        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
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
        # This is just to make it easier to trace when user_details haven't been sent
        user_details = kwargs.get('user_details')
        if user_details is None:
            user_details = {'username': 'unknown-ExportArcGISFeatureServiceTaskRunner.run_task'}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for format in formats:
            try:
                # instantiate the required class.
                export_tasks[format] = {'obj': create_format_task(format), 'task_uid': None}
            except KeyError as e:
                logger.debug('KeyError: export_tasks[{}] - {}'.format(format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:

            bbox = job.extents
            export_provider_task = DataProviderTaskRecord.objects.create(run=run,
                                                                         name=provider_task.provider.name,
                                                                         slug=provider_task.provider.slug,
                                                                         status=TaskStates.PENDING.value,
                                                                         display=True)

            for task_type, task in export_tasks.iteritems():
                export_task = create_export_task_record(task_name=task.get('obj').name,
                                                        export_provider_task=export_provider_task, worker=worker,
                                                        display=getattr(task.get('obj'), "display", False))
                export_tasks[task_type]['task_uid'] = export_task.uid

            service_task = arcgis_feature_service_export_task
            export_task = create_export_task_record(task_name=service_task.name,
                                                    export_provider_task=export_provider_task, worker=worker,
                                                    display=getattr(service_task, "display", False))

            task_chain = (service_task.s(stage_dir=stage_dir,
                                         job_name=job_name,
                                         task_uid=export_task.uid,
                                         name=provider_task.provider.slug,
                                         layer=provider_task.provider.layer,
                                         bbox=bbox,
                                         service_url=provider_task.provider.url,
                                         user_details=user_details,
                                         locking_task_key=export_provider_task.uid).set(queue=worker, routing_key=worker))

            if export_tasks.get('gpkg'):
                gpkg_export_task = export_tasks.pop('gpkg')
                task_chain = (task_chain | gpkg_export_task.get('obj').s(run_uid=run.uid,
                                                                         stage_dir=stage_dir,
                                                                         job_name=job_name,
                                                                         task_uid=gpkg_export_task.get('task_uid'),
                                                                         user_details=user_details).set(
                    queue=worker, routing_key=worker))

            if len(export_tasks) > 0:
                format_tasks = chain(task.get('obj').s(run_uid=run.uid,
                                                       stage_dir=stage_dir,
                                                       job_name=job_name,
                                                       task_uid=task.get('task_uid'),
                                                       user_details=user_details,
                                                       locking_task_key=export_provider_task.uid).set(queue=worker, routing_key=worker)
                                     for task_name, task
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

        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param service_type: The type name of the service type to autoconfigure the service (not yet implemented).
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
        """

    def run_task(self, provider_task_uid=None, user=None, run=None, stage_dir=None, service_type=None, worker=None,
                 **kwargs):
        """
        Run export tasks.

        Args:
            provider_task_uid: the uid of the provider_task to run.

        Return:
            the ExportRun instance.
        """
        user_details = kwargs.get('user_details')
        if user_details is None:
            user_details = {'username': 'unknown-ExportExternalRasterServiceTaskRunner.run_task'}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job
        job_name = normalize_name(job.name)

        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}
        # build a list of celery tasks based on the export formats..
        for _format in formats:
            try:
                # instantiate the required class.
                export_tasks[_format] = {'obj': create_format_task(_format), 'task_uid': None}
            except KeyError as e:
                logger.debug('KeyError: export_tasks[{}] - {}'.format(_format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # run the tasks
        if len(export_tasks) > 0:

            bbox = job.extents
            export_provider_task = DataProviderTaskRecord.objects.create(run=run,
                                                                         name=provider_task.provider.name,
                                                                         slug=provider_task.provider.slug,
                                                                         status=TaskStates.PENDING.value,
                                                                         display=True)

            export_task = create_export_task_record(task_name=external_raster_service_export_task.name,
                                                    export_provider_task=export_provider_task, worker=worker,
                                                    display=getattr(external_raster_service_export_task, "display",
                                                                    False))

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
                                                                 service_type=service_type,
                                                                 user_details=user_details,
                                                                 locking_task_key=export_provider_task.uid).set(queue=worker,
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


def normalize_name(name):
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", '', name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", '_', s)
    return s.lower()


def create_export_task_record(task_name=None, export_provider_task=None, worker=None, display=False):
    try:
        export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=task_name, worker=worker, display=display)
        logger.debug('Saved task: {0}'.format(task_name))
    except DatabaseError as e:
        logger.error('Saving task {0} threw: {1}'.format(task_name, e))
        raise e
    return export_task


def error_handler(task_id=None):
    logger.debug('In error handler %s' % task_id)
