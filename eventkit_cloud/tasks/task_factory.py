# -*- coding: utf-8 -*-
from __future__ import absolute_import

from datetime import datetime, timedelta
import logging
import os
from uuid import UUID

from eventkit_cloud.jobs.models import Job, ExportProvider, ProviderTask, ExportFormat
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.export_tasks import FinalizeExportProviderTask, CleanUpFailure
from .task_runners import (
    ExportGenericOSMTaskRunner,
    ExportThematicOSMTaskRunner,
    ExportWFSTaskRunner,
    ExportExternalRasterServiceTaskRunner,
    ExportArcGISFeatureServiceTaskRunner
)

from django.conf import settings
from django.db import DatabaseError
from django.utils import timezone

# Get an instance of a logger
logger = logging.getLogger(__name__)


class TaskFactory:
    """
    A class create Task Runners based on an Export Run.
    """

    def __init__(self, ):
        self.type_task_map = {'osm-generic': ExportGenericOSMTaskRunner, 'osm': ExportThematicOSMTaskRunner,
                              'wfs': ExportWFSTaskRunner, 'wms': ExportExternalRasterServiceTaskRunner,
                              'wmts': ExportExternalRasterServiceTaskRunner,
                              'arcgis-raster': ExportExternalRasterServiceTaskRunner,
                              'arcgis-feature': ExportArcGISFeatureServiceTaskRunner}

    def parse_tasks(self, worker=None, run_uid=None):
        """

        :param worker: A worker node (hostname) for a celery worker, this should match the node name used when starting,
         the celery worker.
        :param run_uid: A uid to reference an ExportRun.
        :return:The results from the celery chain or False.
        """
        if run_uid:
            run = ExportRun.objects.get(uid=run_uid)
            job = run.job
            run_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run.uid))
            os.makedirs(run_dir, 6600)
            grouped_provider_tasks = []
            # Add providers to list.
            # Note that if a provider depends on a different provider they should be grouped in a list,
            # otherwise passed in as a single element list.
            osm_thematic_provider_task = osm_generic_provider_task = None
            for provider_task in job.provider_tasks.all():
                provider_type = provider_task.provider.export_provider_type.type_name
                # If both osm and osm-thematic are requested then only add one task which will run both exports
                # It would be nice if this could be done for any arbitrary providers, via the API and/or models.
                if provider_type == 'osm':
                    osm_thematic_provider_task = provider_task
                elif provider_type == 'osm-generic':
                    osm_generic_provider_task = provider_task
                else:
                    grouped_provider_tasks.append([provider_task])

            if osm_thematic_provider_task and not osm_generic_provider_task:
                # If a generic OSM task doesn't exist we need to create one so that it can be used.
                osm_generic_provider_task = ProviderTask.objects.create(
                    provider=ExportProvider.objects.get(slug='osm-generic'))
                osm_generic_provider_task.formats.add(ExportFormat.objects.get(slug='gpkg'))
                osm_generic_provider_task.save()
            grouped_provider_tasks.append([osm_generic_provider_task, osm_thematic_provider_task])

            if grouped_provider_tasks:
                tasks_results = []
                for provider_task in grouped_provider_tasks:
                    task_runner_tasks = None
                    export_provider_task_uids = []
                    for chain_task in provider_task:
                        if not chain_task:
                            continue
                        # Create an instance of a task runner based on the type name
                        if self.type_task_map.get(chain_task.provider.export_provider_type.type_name):
                            type_name = chain_task.provider.export_provider_type.type_name
                            task_runner = self.type_task_map.get(type_name)()

                            os.makedirs(os.path.join(run_dir, chain_task.provider.slug), 6600)

                            args = {'user': job.user,
                                    'provider_task_uid': chain_task.uid,
                                    'run': run,
                                    'stage_dir': os.path.join(
                                        run_dir,
                                        chain_task.provider.slug),
                                    'service_type': chain_task.provider.export_provider_type.type_name,
                                    'worker': worker
                                    }

                            export_provider_task_uid, chain_task_runner_tasks = task_runner.run_task(**args)
                            export_provider_task_uids += [export_provider_task_uid]
                            if chain_task_runner_tasks:
                                finalize_export_provider_task = FinalizeExportProviderTask()
                                # Run the task, and when it completes return the status of the task to the model.
                                # The FinalizeExportProviderTask will check to see if all of the tasks are done, and if they are
                                # it will call FinalizeTask which will mark the entire job complete/incomplete
                                finalize_chain_task_runner_tasks = (
                                chain_task_runner_tasks | finalize_export_provider_task.s(
                                    run_uid=run_uid,
                                    run_dir=run_dir,
                                    export_provider_task_uid=export_provider_task_uid,
                                    worker=worker
                                ).set(queue=worker))
                                if not task_runner_tasks:
                                    task_runner_tasks = finalize_chain_task_runner_tasks
                                else:
                                    task_runner_tasks = (task_runner_tasks | finalize_chain_task_runner_tasks)

                    if not task_runner_tasks:
                        continue

                    clean_up_failure = CleanUpFailure()
                    tasks_results += [task_runner_tasks.apply_async(
                        interval=1,
                        max_retries=10,
                        expires=datetime.now() + timedelta(days=2),
                        link_error=[clean_up_failure.s(run_uid=run_uid, run_dir=run_dir,
                                                       export_provider_task_uids=export_provider_task_uids,
                                                       worker=worker).set(queue=worker)])
                    ]
                return tasks_results

            return False


def create_run(job_uid):
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
        run_count = job.runs.count()
        if run_count > 0:
            while run_count > max_runs - 1:
                # delete the earliest runs
                job.runs.earliest(field_name='started_at').delete()  # delete earliest
                run_count -= 1
        # add the export run to the database
        run = ExportRun.objects.create(job=job, user=job.user, status='SUBMITTED',
                                       expiration=(timezone.now() + timezone.timedelta(days=14)))  # persist the run
        run.save()
        run_uid = run.uid
        logger.debug('Saved run with id: {0}'.format(str(run_uid)))
        return run_uid
    except DatabaseError as e:
        logger.error('Error saving export run: {0}'.format(e))
        raise e
