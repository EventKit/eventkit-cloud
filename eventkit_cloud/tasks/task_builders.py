# -*- coding: utf-8 -*-
import importlib
import logging
import os

from celery import chain  # required for tests
from django.db import DatabaseError

from eventkit_cloud.jobs.models import DataProviderTask, ExportFormat
from eventkit_cloud.tasks import TaskStates
from eventkit_cloud.tasks.export_tasks import reprojection_task
from eventkit_cloud.tasks.helpers import normalize_name, get_metadata
from eventkit_cloud.tasks.models import ExportTaskRecord, DataProviderTaskRecord
from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator

logger = logging.getLogger(__name__)

export_task_registry = {
    'sqlite': 'eventkit_cloud.tasks.export_tasks.sqlite_export_task',
    'kml': 'eventkit_cloud.tasks.export_tasks.kml_export_task',
    'shp': 'eventkit_cloud.tasks.export_tasks.shp_export_task',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.geopackage_export_task',
    'gpkg-thematic': 'eventkit_cloud.tasks.export_tasks.osm_thematic_gpkg_export_task',
    'gtiff': 'eventkit_cloud.tasks.export_tasks.geotiff_export_task',
    'nitf': 'eventkit_cloud.tasks.export_tasks.nitf_export_task',
    'hfa': 'eventkit_cloud.tasks.export_tasks.hfa_export_task'
}


class TaskChainBuilder(object):
    """
    Abstract base class for running tasks
    """

    class Meta:
        abstract = True

    def build_tasks(self, primary_export_task, provider_task_uid=None, user=None, run=None, stage_dir=None, worker=None,
                    service_type=None, *args, **kwargs):
        """
        Run OSM export tasks. Specifically create a task chain to be picked up by a celery worker later.

        :param primary_export_task: The task which converts the source data to the interchange format (i.e. OSM-> gpkg)
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
            user_details = {'username': 'unknown-{0}TaskChainBuilder.run_task'.format(primary_export_task.name)}

        logger.debug('Running Job with id: {0}'.format(provider_task_uid))
        # pull the provider_task from the database
        provider_task = DataProviderTask.objects.get(uid=provider_task_uid)
        job = run.job

        job_name = normalize_name(job.name)
        # get the formats to export
        formats = [provider_task_format.slug for provider_task_format in provider_task.formats.all()]
        export_tasks = {}

        # If WCS we will want geotiff...
        if 'wcs' in primary_export_task.name.lower():
            formats += ['gtiff']
            compress = False
        else:
            compress = True

        # build a list of celery tasks based on the export formats...
        for file_format in formats:
            try:
                export_tasks[file_format] = {'obj': create_format_task(file_format), 'task_uid': None}
            except KeyError as e:
                logger.debug('KeyError: export_tasks[{}] - {}'.format(file_format, e))
            except ImportError as e:
                msg = 'Error importing export task: {0}'.format(e)
                logger.debug(msg)

        # Record estimates for size and time
        estimator = AoiEstimator(run.job.extents)
        estimated_size, meta_s = estimator.get_estimate(estimator.Types.SIZE, provider_task.provider)
        estimated_duration, meta_t = estimator.get_estimate(estimator.Types.TIME, provider_task.provider)

        # run the tasks
        data_provider_task_record = DataProviderTaskRecord.objects.create(run=run,
                                                                          name=provider_task.provider.name,
                                                                          slug=provider_task.provider.slug,
                                                                          status=TaskStates.PENDING.value,
                                                                          display=True,
                                                                          estimated_size=estimated_size,
                                                                          estimated_duration=estimated_duration)

        for file_format, task in export_tasks.items():
            # Exports are in 4326 by default, include that in the name.
            task_name = f"{task.get('obj').name} - EPSG:4326"
            export_task = create_export_task_record(
                task_name=task_name,
                export_provider_task=data_provider_task_record, worker=worker,
                display=getattr(task.get('obj'), "display", False)
            )
            export_tasks[file_format]['task_uid'] = export_task.uid

        """
        Create a celery chain which gets the data & runs export formats
        """
        queue_group = os.getenv("CELERY_GROUP_NAME", worker)

        if export_tasks:
            subtasks = []
            for current_format, task in export_tasks.items():
                subtasks.append(task.get('obj').s(
                    run_uid=run.uid, stage_dir=stage_dir, job_name=job_name, compress=compress,
                    task_uid=task.get('task_uid'), user_details=user_details, locking_task_key=data_provider_task_record.uid
                ).set(queue=queue_group, routing_key=queue_group))
                projections = get_metadata(data_provider_task_record.uid)['projections']
                for projection in projections:
                    # Source data is already in 4326, no need to reproject.
                    if projection == 4326:
                        continue

                    # If the format does not support this projection, skip.
                    supported_projections = ExportFormat.objects.get(
                        slug=current_format).supported_projections.all().values_list('srid', flat=True)
                    if projection not in supported_projections:
                        logger.debug(f"Skipping task, {current_format} does not support {projection}.")
                        continue

                    task_name = f"{task.get('obj').name} - EPSG:{projection}"
                    projection_task = create_export_task_record(
                        task_name=task_name,
                        export_provider_task=data_provider_task_record, worker=worker,
                        display=getattr(task.get('obj'), "display", False)
                    )

                    subtasks.append(reprojection_task.s(
                        run_uid=run.uid, stage_dir=stage_dir, job_name=job_name, compress=compress,
                        task_uid=projection_task.uid, user_details=user_details,
                        locking_task_key=data_provider_task_record.uid, projection=projection
                    ).set(queue=queue_group, routing_key=queue_group))
            format_tasks = chain(subtasks)
        else:
            format_tasks = None

        bbox = run.job.extents

        primary_export_task_record = create_export_task_record(
            task_name=primary_export_task.name,
            export_provider_task=data_provider_task_record, worker=worker,
            display=getattr(primary_export_task, "display", False)
        )

        if "osm" in primary_export_task.name.lower():
            queue_routing_key_name = "{}.osm".format(queue_group)
        else:
            queue_routing_key_name = queue_group

        # Set custom zoom levels if available, otherwise use the provider defaults.
        min_zoom = provider_task.min_zoom if provider_task.min_zoom else provider_task.provider.level_from
        max_zoom = provider_task.max_zoom if provider_task.max_zoom else provider_task.provider.level_to

        primary_export_task_signature = primary_export_task.s(name=provider_task.provider.slug,
                                                              run_uid=run.uid,
                                                              provider_slug=provider_task.provider.slug,
                                                              overpass_url=provider_task.provider.url,
                                                              stage_dir=stage_dir,
                                                              export_provider_task_record_uid=data_provider_task_record.uid,
                                                              worker=worker,
                                                              job_name=job_name,
                                                              bbox=bbox,
                                                              selection=job.the_geom.geojson,
                                                              user_details=user_details,
                                                              task_uid=primary_export_task_record.uid,
                                                              layer=provider_task.provider.layer,
                                                              level_from=min_zoom,
                                                              level_to=max_zoom,
                                                              compress=compress,
                                                              service_type=service_type,
                                                              service_url=provider_task.provider.url,
                                                              config=provider_task.provider.config).set(queue=queue_routing_key_name,
                                                                                                        routing_key=queue_routing_key_name)


        if format_tasks:
            tasks = chain(primary_export_task_signature, format_tasks)
        else:
            tasks = primary_export_task_signature

        return data_provider_task_record.uid, tasks


def create_format_task(task_format):
    task_fq_name = export_task_registry[task_format]
    # instantiate the required class.
    parts = task_fq_name.split('.')
    module_path, class_name = '.'.join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    CeleryExportTask = getattr(module, class_name)
    return CeleryExportTask


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
