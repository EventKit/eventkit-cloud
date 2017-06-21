# -*- coding: utf-8 -*-
from __future__ import absolute_import

from datetime import datetime, timedelta
import logging
import os

from celery import chain

from ..jobs.models import Job, ExportProvider, ProviderTask, ExportFormat
from ..tasks.models import ExportRun, ExportProviderTask
from .task_runners import (
    ExportGenericOSMTaskRunner,
    ExportThematicOSMTaskRunner,
    ExportWFSTaskRunner,
    ExportExternalRasterServiceTaskRunner,
    ExportArcGISFeatureServiceTaskRunner
)

from ..tasks.export_tasks import (finalize_export_provider_task, clean_up_failure_task, TaskPriority,
                                  bounds_export_task, output_selection_geojson_task, zip_export_provider)
from django.conf import settings
from django.db import DatabaseError
from django.utils import timezone
from ..tasks.task_runners import create_export_task

# Get an instance of a logger
logger = logging.getLogger(__name__)


class TaskFactory:
    """
    A class create Task Runners based on an Export Run.
    """

    def __init__(self,):
        self.type_task_map = {'osm-generic': ExportGenericOSMTaskRunner, 'osm': ExportThematicOSMTaskRunner,
                              'wfs': ExportWFSTaskRunner, 'wms': ExportExternalRasterServiceTaskRunner,
                              'wmts': ExportExternalRasterServiceTaskRunner,
                              'arcgis-raster': ExportExternalRasterServiceTaskRunner,
                              'arcgis-feature': ExportArcGISFeatureServiceTaskRunner}

    def parse_tasks(self, worker=None, run_uid=None, user_details=None):
        """
        :param worker: A worker node (hostname) for a celery worker, this should match the node name used when starting,
         the celery worker.
        :param run_uid: A uid to reference an ExportRun.
        :return:The results from the celery chain or False.
        """
        # This is just to make it easier to trace when user_details haven't been sent
        if user_details is None:
            user_details = {'username': 'TaskFactory-parse_tasks'}

        if run_uid:
            run = ExportRun.objects.get(uid=run_uid)
            job = run.job
            run_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run.uid))
            os.makedirs(run_dir, 0750)
            grouped_provider_tasks = []
            # Add providers to list.
            # Note that if a provider depends on a different provider they should be grouped in a list,
            # otherwise passed in as a single element list.
            osm_thematic_provider_task = osm_generic_provider_task = None
            for grouped_provider_task in job.provider_tasks.all():
                provider_type = grouped_provider_task.provider.export_provider_type.type_name
                # If both osm and osm-thematic are requested then only add one task which will run both exports
                # It would be nice if this could be done for any arbitrary providers, via the API and/or models.
                if provider_type == 'osm':
                    osm_thematic_provider_task = grouped_provider_task
                elif provider_type == 'osm-generic':
                    osm_generic_provider_task = grouped_provider_task
                else:
                    grouped_provider_tasks.append([grouped_provider_task])

            if osm_thematic_provider_task and not osm_generic_provider_task:
                # If a generic OSM task doesn't exist we need to create one so that it can be used.
                osm_generic_provider_task = ProviderTask.objects.create(
                    provider=ExportProvider.objects.get(slug='osm-generic'))
                osm_generic_provider_task.formats.add(ExportFormat.objects.get(slug='gpkg'))
                osm_generic_provider_task.save()
            grouped_provider_tasks.append([osm_generic_provider_task, osm_thematic_provider_task])

            if grouped_provider_tasks:
                tasks_results = []
                for grouped_provider_task in grouped_provider_tasks:
                    task_runner_tasks = None
                    export_provider_task_uids = []
                    for provider_task in grouped_provider_task:
                        if not provider_task:
                            continue
                        # Create an instance of a task runner based on the type name
                        if self.type_task_map.get(provider_task.provider.export_provider_type.type_name):
                            type_name = provider_task.provider.export_provider_type.type_name
                            task_runner = self.type_task_map.get(type_name)()
                            os.makedirs(os.path.join(run_dir, provider_task.provider.slug), 6600)
                            stage_dir = os.path.join(
                                        run_dir,
                                        provider_task.provider.slug)

                            args = {
                                'user': job.user,
                                'provider_task_uid': provider_task.uid,
                                'run': run,
                                'stage_dir': stage_dir,
                                'service_type': provider_task.provider.export_provider_type.type_name,
                                'worker': worker,
                                'user_details': user_details
                            }

                            export_provider_task_uid, chain_task_runner_tasks = task_runner.run_task(**args)
                            export_provider_task_uids += [export_provider_task_uid]

                            if chain_task_runner_tasks:
                                # Create a geojson for clipping this provider if needed
                                selection_task = create_task(
                                    export_provider_task_uid=export_provider_task_uid, stage_dir=stage_dir,
                                    worker=worker, task_type='selection', selection=job.the_geom.geojson,
                                    user_details=user_details
                                )

                                # Export the bounds for this provider
                                bounds_task = create_task(
                                    export_provider_task_uid=export_provider_task_uid, stage_dir=stage_dir,
                                    worker=worker, task_type='bounds', user_details=user_details
                                )

                                if provider_task.provider.zip:
                                    zip_task = create_task(
                                        export_provider_task_uid=export_provider_task_uid, stage_dir=stage_dir,
                                        worker=worker, task_type='zip', job_name=job.name, user_details=user_details
                                    )
                                    bounds_task = chain(bounds_task, zip_task)
                                # Run the task, and when it completes return the status of the task to the model.
                                # The finalize_export_provider_task will check to see if all of the tasks are done, and if they are
                                # it will call FinalizeTask which will mark the entire job complete/incomplete
                                finalize_chain_task_runner_tasks = chain(selection_task, chain_task_runner_tasks,
                                                                         bounds_task, finalize_export_provider_task.s(
                                        run_uid=run_uid,
                                        run_dir=run_dir,
                                        export_provider_task_uid=export_provider_task_uid,
                                        worker=worker
                                    ).set(queue=worker, routing_key=worker))
                                if not task_runner_tasks:
                                    task_runner_tasks = finalize_chain_task_runner_tasks
                                else:
                                    task_runner_tasks = chain(task_runner_tasks, finalize_chain_task_runner_tasks)

                    if not task_runner_tasks:
                        continue

                    tasks_results += [task_runner_tasks.apply_async(
                        interval=1,
                        max_retries=10,
                        expires=datetime.now() + timedelta(days=2),
                        priority=TaskPriority.TASK_RUNNER.value,
                        routing_key=worker,
                        queue=worker,
                        user_details=user_details,
                        link_error=clean_up_failure_task.si(run_uid=run_uid, run_dir=run_dir,
                                                            export_provider_task_uids=export_provider_task_uids,
                                                            worker=worker).set(queue=worker, routing_key=worker))]
                return tasks_results
            return False


def create_run(job_uid, user=None):
    """
    This will create a new Run based on the provided job uid.
    :param job_uid: The UID to reference the Job model.
    :return: An ExportRun object.
    """

    # start the run
    try:
        # enforce max runs
        max_runs = settings.EXPORT_MAX_RUNS
        # get the number of existing runs for this job
        job = Job.objects.get(uid=job_uid)
        invalid_licenses = get_invalid_licenses(job)
        if invalid_licenses:
            raise InvalidLicense("The user: {0} has not agreed to the following licenses: {1}.\n" \
                        "Please use the user account page, or the user api to agree to the " \
                        "licenses prior to exporting the data.".format(job.user.username, invalid_licenses))
        if not user:
            user = job.user
        if job.user != user and not user.is_superuser:
            raise Unauthorized("The user: {0} is not authorized to create a run based on the job: {1}.".format(
                job.user.username, job.name
            ))
        run_count = job.runs.count()
        if run_count > 0:
            while run_count > max_runs - 1:
                # delete the earliest runs
                job.runs.earliest(field_name='started_at').delete()  # delete earliest
                run_count -= 1
        # add the export run to the database
        run = ExportRun.objects.create(job=job, user=user, status='SUBMITTED',
                                       expiration=(timezone.now() + timezone.timedelta(days=14)))  # persist the run
        run.save()
        run_uid = run.uid
        logger.debug('Saved run with id: {0}'.format(str(run_uid)))
        return run_uid
    except DatabaseError as e:
        logger.error('Error saving export run: {0}'.format(e))
        raise e


def create_task(export_provider_task_uid=None, stage_dir=None, worker=None, selection=None, task_type=None,
                job_name=None, user_details=None):
    """
    Create a new task to export the bounds for an ExportProviderTask
    :param export_provider_task_uid: An export provider task UUID.
    :param worker: The name of the celery worker assigned the task.
    :return: A celery task signature.
    """""
    # This is just to make it easier to trace when user_details haven't been sent
    if user_details is None:
        user_details = {'username': 'unknown-create_task'}

    task_map = {"bounds": bounds_export_task, "selection": output_selection_geojson_task, "zip": zip_export_provider}

    task = task_map.get(task_type)
    export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task_uid)
    export_task = create_export_task(
        task_name=task.name, export_provider_task=export_provider_task, worker=worker,
        display=getattr(task, "display", False)
    )
    return task.s(
        run_uid=export_provider_task.run.uid, task_uid=export_task.uid, selection=selection, stage_dir=stage_dir,
        provider_slug=export_provider_task.slug, export_provider_task_uid=export_provider_task_uid, job_name=job_name,
        user_details=user_details
    ).set(queue=worker, routing_key=worker)


def get_invalid_licenses(job):
    """
    :param user: A user to verify licenses against. 
    :param job: The job containing the licensed datasets.
    :return: A list of invalid licenses.
    """
    from ..api.serializers import UserDataSerializer
    licenses = UserDataSerializer.get_accepted_licenses(job.user)
    invalid_licenses = []
    for provider_tasks in job.provider_tasks.all():
        license = provider_tasks.provider.license
        if license and not licenses.get(license.slug):
            invalid_licenses += [license.name]
    return invalid_licenses


class Error(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(message)

class Unauthorized(Error):
    def __init__(self, message):
        super(Error, self).__init__('Unauthorized: {0}'.format(message))

class InvalidLicense(Error):
    def __init__(self, message):
        super(Error, self).__init__('InvalidLicense: {0}'.format(message))
