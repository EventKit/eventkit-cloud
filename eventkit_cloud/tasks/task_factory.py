# -*- coding: utf-8 -*-
from __future__ import absolute_import

from ..jobs.models import Job
from .models import ExportRun
from .task_runners import ExportOSMTaskRunner, ExportWFSTaskRunner, ExportExternalRasterServiceTaskRunner, ExportArcGISFeatureServiceTaskRunner
from django.conf import settings
from .export_tasks import FinalizeExportProviderTask
from celery import chord
from datetime import datetime, timedelta
import logging
import os
from django.db import DatabaseError

# Get an instance of a logger
logger = logging.getLogger(__name__)


class TaskFactory():

    def __init__(self, ):
        # self.job = Job.objects.get(uid=job_uid)
        # self.job_uid = job_uid
        self.type_task_map = {'osm': ExportOSMTaskRunner, 'wfs': ExportWFSTaskRunner, 'wms': ExportExternalRasterServiceTaskRunner, 'wmts': ExportExternalRasterServiceTaskRunner, 'arcgis-raster': ExportExternalRasterServiceTaskRunner, 'arcgis-feature': ExportArcGISFeatureServiceTaskRunner}
        # setup the staging directory

    def parse_tasks(self, worker=None, run_uid=None):
        print("PARSING RUN {0} TASKS FOR WORKER: {1}".format(run_uid, worker))
        if run_uid:
            run = ExportRun.objects.get(uid=run_uid)
            job = run.job
            stage_dir = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run.uid)))
            os.makedirs(stage_dir, 6600)
            provider_tasks = [provider_task for provider_task in job.provider_tasks.all()]
            if provider_tasks:
                for provider_task in provider_tasks:
                    # Create an instance of a task runner based on the type name
                    if self.type_task_map.get(provider_task.provider.export_provider_type.type_name):
                        task_runner = self.type_task_map.get(provider_task.provider.export_provider_type.type_name)()
                        os.makedirs(os.path.join(stage_dir, provider_task.provider.slug), 6600)
                        export_provider_task_uid, task_runner_tasks = task_runner.run_task(user=job.user,
                                                                                           provider_task_uid=provider_task.uid,
                                                                                           run=run,
                                                                                           stage_dir=os.path.join(
                                                                                               stage_dir,
                                                                                               provider_task.provider.slug),
                                                                                           service_type=provider_task.provider.export_provider_type.type_name,
                                                                                           worker=worker)
                        # Run the task, and when it completes return the status of the task to the model.
                        # The FinalizeExportProviderTask will check to see if all of the tasks are done, and if they are
                        #  it will call FinalizeTask which will mark the entire job complete/incomplete.
                        if not task_runner_tasks:
                            print("NO TASK_RUNNER_TASKS RETURNED")
                            return False
                        finalize_export_provider_task = FinalizeExportProviderTask()
                        (task_runner_tasks | finalize_export_provider_task.si(run_uid=run.uid,
                                                                              stage_dir=os.path.join(
                                                                                  stage_dir,
                                                                                  provider_task.provider.slug),
                                                                              export_provider_task_uid=export_provider_task_uid).set(queue=worker)
                              ).apply_async(interval=1, max_retries=10, expires=datetime.now() + timedelta(days=2),
                                            link_error=[finalize_export_provider_task.si(run_uid=run.uid,
                                                                                         stage_dir=os.path.join(
                                                                                             stage_dir,
                                                                                             provider_task.provider.slug),
                                                                                         export_provider_task_uid=export_provider_task_uid).set(queue=worker)])
            else:
                return False


def create_run(job_uid):
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
        run = ExportRun.objects.create(job=job, user=job.user, status='SUBMITTED')  # persist the run
        run.save()
        run_uid = str(run.uid)
        logger.debug('Saved run with id: {0}'.format(run_uid))
        return run_uid
    except DatabaseError as e:
        logger.error('Error saving export run: {0}'.format(e))
        raise e

