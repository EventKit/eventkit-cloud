# -*- coding: utf-8 -*-
import importlib
import logging
from typing import List

from celery import chain  # required for tests
from django.db import DatabaseError

from eventkit_cloud.jobs.models import DataProvider, DataProviderTask, ExportFormat, ProxyFormat
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.export_tasks import create_datapack_preview, reprojection_task
from eventkit_cloud.tasks.helpers import get_celery_queue_group, get_default_projection, normalize_name
from eventkit_cloud.tasks.models import DataProviderTaskRecord, ExportTaskRecord
from eventkit_cloud.tasks.util_tasks import get_estimates_task

logger = logging.getLogger(__name__)

export_task_registry = {
    "sqlite": "eventkit_cloud.tasks.export_tasks.sqlite_export_task",
    "kml": "eventkit_cloud.tasks.export_tasks.kml_export_task",
    "shp": "eventkit_cloud.tasks.export_tasks.shp_export_task",
    "gpkg": "eventkit_cloud.tasks.export_tasks.geopackage_export_task",
    "gpkg-thematic": "eventkit_cloud.tasks.export_tasks.osm_thematic_gpkg_export_task",
    "gtiff": "eventkit_cloud.tasks.export_tasks.geotiff_export_task",
    "nitf": "eventkit_cloud.tasks.export_tasks.nitf_export_task",
    "hfa": "eventkit_cloud.tasks.export_tasks.hfa_export_task",
    "mbtiles": "eventkit_cloud.tasks.export_tasks.mbtiles_export_task",
    "gpx": "eventkit_cloud.tasks.export_tasks.gpx_export_task",
    "pbf": "eventkit_cloud.tasks.export_tasks.pbf_export_task",
    "ogcapi-process": "eventkit_cloud.tasks.export_tasks.ogc_result_task",
}


class TaskChainBuilder(object):
    """
    Abstract base class for running tasks
    """

    class Meta:
        abstract = True

    def build_tasks(
        self,
        primary_export_task,
        provider_task_uid=None,
        user=None,
        run=None,
        stage_dir=None,
        worker=None,
        service_type=None,
        session_token=None,
        *args,
        **kwargs,
    ):
        """
        Create a task chain to be picked up by a celery worker later.

        :param primary_export_task: The task which converts the source data to the interchange format (i.e. OSM-> gpkg)
        :param provider_task_uid: A reference uid for the DataProviderTask model.
        :param user: The user executing the task.
        :param run: The ExportRun which this task will belong to.
        :param stage_dir: The directory where to store the files while they are being created.
        :param worker: The celery worker assigned this task.
        :param service_type: The type of service (i.e. wmts) deprecated.
        :param session_token: A users session token.
        :return: An DataProviderTaskRecord uid and the Celery Task Chain or None, False.
        """

        logger.debug("Running Job with id: {0}".format(provider_task_uid))
        # pull the provider_task from the database
        data_provider_task = (
            DataProviderTask.objects.select_related("provider")
            .prefetch_related("formats__supported_projections")
            .get(uid=provider_task_uid)
        )
        data_provider: DataProvider = data_provider_task.provider
        job = run.job

        # This is just to make it easier to trace when user_details haven't been sent
        user_details = kwargs.get("user_details")
        if user_details is None:
            from audit_logging.utils import get_user_details

            user_details = get_user_details(user)

        job_name = normalize_name(job.name)
        # get the formats to export
        formats: List[ExportFormat] = list(data_provider_task.formats.all())

        data_provider_task_record: DataProviderTaskRecord
        created: bool
        data_provider_task_record, created = DataProviderTaskRecord.objects.get_or_create(
            run=run,
            name=data_provider.name,
            provider=data_provider,
            status=TaskState.PENDING.value,
            display=True,
        )

        projections = [projection.srid for projection in run.job.projections.all()]

        """
        Create a celery chain which gets the data & runs export formats
        """

        queue_group = get_celery_queue_group(run_uid=run.uid, worker=worker)

        # Record estimates for size and time
        get_estimates_task.apply_async(
            queue=queue_group,
            routing_key=queue_group,
            kwargs={
                "run_uid": run.uid,
                "data_provider_task_uid": data_provider_task.uid,
                "data_provider_task_record_uid": data_provider_task_record.uid,
            },
        )

        # TODO: Fix skip_primary_export_task task it fails to run the job in some situations.
        # skip_primary_export_task = False
        # if set(item.name.lower() for item in formats).issubset(
        #     set(item.name.lower() for item in get_proxy_formats(data_provider))
        # ):
        # skip_primary_export_task = True

        export_tasks = {}  # {export_format : (etr_uid, export_task)}
        for export_format in formats:
            # TODO: Alter to not use options
            logger.info(f"Setting up task for format: {export_format.name} with {export_format.options}")
            if is_supported_proxy_format(export_format, data_provider):
                export_task = create_format_task("ogcapi-process")
            else:
                export_task = create_format_task(export_format.slug)

            default_projection = get_default_projection(export_format.get_supported_projection_list(), projections)
            task_name = export_format.name
            if default_projection:
                task_name = f"{task_name} - EPSG:{default_projection}"
            export_task_record = create_export_task_record(
                task_name=task_name,
                export_provider_task=data_provider_task_record,
                worker=worker,
                display=getattr(export_task, "display", False),
            )
            export_tasks[export_format] = (export_task_record, export_task)

        bbox = run.job.extents

        """
        Create a celery chain which gets the data & runs export formats
        """
        if export_tasks:
            subtasks = list()
            if data_provider.preview_url:
                subtasks.append(
                    create_datapack_preview.s(
                        stage_dir=stage_dir,
                        task_uid=data_provider_task_record.uid,
                    ).set(queue=queue_group, routing_key=queue_group)
                )

            for current_format, (export_task_record, export_task) in export_tasks.items():
                supported_projections = current_format.get_supported_projection_list()
                default_projection = get_default_projection(supported_projections, selected_projections=projections)

                subtasks.append(
                    export_task.s(
                        run_uid=run.uid,
                        stage_dir=stage_dir,
                        job_name=job_name,
                        task_uid=export_task_record.uid,
                        user_details=user_details,
                        locking_task_key=export_task_record.uid,
                        config=data_provider.config,
                        service_url=data_provider.url,
                        export_format_slug=current_format.slug,
                        bbox=bbox,
                        session_token=session_token,
                        projection=default_projection,
                        provider_slug=data_provider.slug,
                        export_provider_task_record_uid=data_provider_task_record.uid,
                        worker=worker,
                        selection=job.the_geom.geojson,
                        layer=data_provider.layer,
                        service_type=service_type,
                    ).set(queue=queue_group, routing_key=queue_group)
                )

                for projection in list(set(supported_projections) & set(projections)):

                    # This task was already added as the initial format conversion.
                    if projection == default_projection:
                        continue
                    if projection:
                        task_name = f"{export_task.name} - EPSG:{projection}"
                    projection_task = create_export_task_record(
                        task_name=task_name,
                        export_provider_task=data_provider_task_record,
                        worker=worker,
                        display=getattr(export_task, "display", True),
                    )
                    subtasks.append(
                        reprojection_task.s(
                            run_uid=run.uid,
                            stage_dir=stage_dir,
                            job_name=job_name,
                            task_uid=projection_task.uid,
                            user_details=user_details,
                            locking_task_key=data_provider_task_record.uid,
                            projection=projection,
                            config=data_provider.config,
                        ).set(queue=queue_group, routing_key=queue_group)
                    )

            format_tasks = chain(subtasks)
        else:
            format_tasks = None

        primary_export_task_record = create_export_task_record(
            task_name=primary_export_task.name,
            export_provider_task=data_provider_task_record,
            worker=worker,
            display=getattr(primary_export_task, "display", False),
        )

        if "osm" in primary_export_task.name.lower():
            queue_routing_key_name = "{}.large".format(queue_group)
        else:
            queue_routing_key_name = queue_group

        # Set custom zoom levels if available, otherwise use the provider defaults.

        min_zoom = data_provider_task.min_zoom if data_provider_task.min_zoom else data_provider.level_from
        max_zoom = data_provider_task.max_zoom if data_provider_task.max_zoom else data_provider.level_to

        primary_export_task_signature = primary_export_task.s(
            name=data_provider.slug,
            run_uid=run.uid,
            provider_slug=data_provider.slug,
            overpass_url=data_provider.url,
            stage_dir=stage_dir,
            export_provider_task_record_uid=data_provider_task_record.uid,
            worker=worker,
            job_name=job_name,
            bbox=bbox,
            selection=job.the_geom.geojson,
            user_details=user_details,
            task_uid=primary_export_task_record.uid,
            layer=data_provider.layer,
            level_from=min_zoom,
            level_to=max_zoom,
            service_type=service_type,
            service_url=data_provider.url,
            config=data_provider.config,
            session_token=session_token,
            projection=default_projection,
        )
        primary_export_task_signature = primary_export_task_signature.set(
            queue=queue_routing_key_name, routing_key=queue_routing_key_name
        )
        # if skip_primary_export_task:
        #     tasks = chain(format_tasks)
        #     primary_export_task_record.delete()
        # else:
        tasks = chain(primary_export_task_signature, format_tasks)

        # tasks = chain(tasks)

        return data_provider_task_record.uid, tasks


def create_format_task(task_format):
    task_fq_name = export_task_registry[task_format]
    # instantiate the required class.
    parts = task_fq_name.split(".")
    module_path, class_name = ".".join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    CeleryExportTask = getattr(module, class_name)
    return CeleryExportTask


def create_export_task_record(task_name=None, export_provider_task=None, worker=None, display=False):
    try:
        export_task, created = ExportTaskRecord.objects.get_or_create(
            export_provider_task=export_provider_task,
            name=task_name,
            defaults={"status": "PENDING", "name": task_name, "worker": worker, "display": display},
        )
        logger.debug("Saved task: {0}".format(task_name))
    except DatabaseError as e:
        logger.error("Saving task {0} threw: {1}".format(task_name, e))
        raise e
    return export_task


def is_supported_proxy_format(export_format: ExportFormat, data_provider: DataProvider):
    return ProxyFormat.objects.get(export_format=export_format, data_provider=data_provider)


def get_proxy_formats(data_provider: DataProvider):
    return ExportFormat.objects.filter(proxy_format__provider=data_provider)


def error_handler(task_id=None):
    logger.debug("In error handler %s" % task_id)
