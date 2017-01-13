# -*- coding: utf-8 -*-
from __future__ import absolute_import

from datetime import datetime, timedelta
import logging
import os
from uuid import UUID

from eventkit_cloud.jobs.models import Job
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.export_tasks import FinalizeExportProviderTask
from .task_runners import (
    ExportOSMTaskRunner,
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
        self.type_task_map = {'osm-generic': ExportOSMTaskRunner, 'osm': ExportOSMTaskRunner,
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
            stage_dir = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run.uid)))
            os.makedirs(stage_dir, 6600)
            osm_task = None
            osm_types = {'osm-generic': None, 'osm': None}
            provider_tasks = []
            osm_provider_tasks = {}
            # Add providers to list.
            # If both osm and osm-thematic are requested then only add one task which will run both exports
            for provider_task in job.provider_tasks.all():
                provider_type = provider_task.provider.export_provider_type.type_name
                if provider_type in ['osm-generic', 'osm']:
                    osm_types[provider_type] = True
                    osm_provider_tasks[provider_type] = provider_task
                else:
                    provider_tasks.append(provider_task)
            if osm_types.get('osm'):
                provider_tasks.append(osm_provider_tasks.get('osm'))
                osm_task = osm_provider_tasks.get('osm')
            elif osm_types.get('osm-generic'):
                provider_tasks.append(osm_provider_tasks.get('osm-generic'))
                osm_task = osm_provider_tasks.get('osm-generic')

            if provider_tasks:
                tasks_results = []
                for provider_task in provider_tasks:
                    # Create an instance of a task runner based on the type name
                    if self.type_task_map.get(provider_task.provider.export_provider_type.type_name):
                        type_name = provider_task.provider.export_provider_type.type_name
                        task_runner = self.type_task_map.get(type_name)()
                        os.makedirs(os.path.join(stage_dir, provider_task.provider.slug), 6600)
                        # If the provider is osm we need to pass in a dict 
                        # which indicates which osm providers will be included
                        if provider_task == osm_task:
                            args = {'user': job.user,
                                    'provider_task_uid': provider_task.uid,
                                    'run': run,
                                    'stage_dir': os.path.join(
                                        stage_dir,
                                        'osm-data'),
                                    'service_type': osm_types,
                                    'worker': worker
                                    }
                        else:
                            args = {'user': job.user,
                                    'provider_task_uid': provider_task.uid,
                                    'run': run,
                                    'stage_dir': os.path.join(
                                        stage_dir,
                                        provider_task.provider.slug),
                                    'service_type': provider_task.provider.export_provider_type.type_name,
                                    'worker': worker
                                    }
                        export_provider_task_uid, task_runner_tasks = task_runner.run_task(**args)
                        # Run the task, and when it completes return the status of the task to the model.
                        # The FinalizeExportProviderTask will check to see if all of the tasks are done, and if they are
                        #  it will call FinalizeTask which will mark the entire job complete/incomplete.
                        if not task_runner_tasks:
                            return False
                        # trt_res = task_runner_tasks.freeze()
                        # assert trt_res.task_id, "task_id must be populated"
                        # ept = ExportProviderTask.objects.get(uid=export_provider_task_uid)
                        # ept.celery_uid = UUID(trt_res.task_id)
                        # ept.save()

                        finalize_export_provider_task = FinalizeExportProviderTask()
                        tasks_results += [
                            (task_runner_tasks | finalize_export_provider_task.si(
                                run_uid=run.uid,
                                stage_dir=os.path.join(stage_dir, provider_task.provider.slug),
                                export_provider_task_uid=export_provider_task_uid,
                                worker=worker
                            ).set(queue=worker)).apply_async(
                                interval=1,
                                max_retries=10,
                                expires=datetime.now() + timedelta(days=2),
                                on_error=[finalize_export_provider_task.si(
                                run_uid=run.uid,
                                stage_dir=os.path.join(stage_dir, provider_task.provider.slug),
                                export_provider_task_uid=export_provider_task_uid,
                                worker=worker)]
                            )
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
        run = ExportRun.objects.create(job=job, user=job.user, status='SUBMITTED', expiration=(timezone.now() + timezone.timedelta(days=14)))  # persist the run
        run.save()
        run_uid = run.uid
        logger.debug('Saved run with id: {0}'.format(str(run_uid)))
        return run_uid
    except DatabaseError as e:
        logger.error('Error saving export run: {0}'.format(e))
        raise e
