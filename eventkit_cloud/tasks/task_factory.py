# -*- coding: utf-8 -*-
from __future__ import absolute_import

from ..jobs.models import Job
from .models import ExportRun
from .task_runners import ExportOSMTaskRunner, ExportExternalRasterServiceTaskRunner
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
    def __init__(self, job_uid):
        self.job = Job.objects.get(uid=job_uid)
        self.type_task_map = {'osm': ExportOSMTaskRunner, 'wms': ExportExternalRasterServiceTaskRunner, 'wmts': ExportExternalRasterServiceTaskRunner, 'arcgis': ExportExternalRasterServiceTaskRunner}
        # setup the staging directory
        self.run = self.create_run()
        if self.run:
            self.stage_dir = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)))
            os.makedirs(self.stage_dir, 6600)

    def parse_tasks(self):
        if self.run:
            provider_tasks = [provider_task for provider_task in self.job.provider_tasks.all()]
            if provider_tasks:
                header_tasks = []
                for provider_task in provider_tasks:
                    # Create an instance of a task runner based on the type name
                    if self.type_task_map.get(provider_task.provider.export_provider_type.type_name):
                        task_runner = self.type_task_map.get(provider_task.provider.export_provider_type.type_name)()
                        os.makedirs(os.path.join(self.stage_dir, provider_task.provider.slug), 6600)
                        export_provider_task_uid, task_runner_tasks = task_runner.run_task(user=self.job.user,
                                                                                           provider_task_uid=provider_task.uid,
                                                                                           run=self.run,
                                                                                           stage_dir=os.path.join(
                                                                                               self.stage_dir,
                                                                                               provider_task.provider.slug),
                                                                                           service_type=provider_task.provider.export_provider_type.type_name)
                        # Run the task, and when it completes return the status of the task to the model.
                        # The FinalizeExportProviderTask will check to see if all of the tasks are done, and if they are
                        #  it will call FinalizeTask which will mark the entire job complete/incomplete.
                        finalize_export_provider_task = FinalizeExportProviderTask()
                        (task_runner_tasks | finalize_export_provider_task.si(run_uid=self.run.uid,
                                                                              stage_dir=os.path.join(
                                                                                  self.stage_dir,
                                                                                  provider_task.provider.slug),
                                                                              export_provider_task_uid=export_provider_task_uid)
                              ).apply_async(interval=1, max_retries=10, expires=datetime.now() + timedelta(days=2),
                                            link_error=[finalize_export_provider_task.si(run_uid=self.run.uid,
                                                                                         stage_dir=os.path.join(
                                                                                             self.stage_dir,
                                                                                             provider_task.provider.slug),
                                                                                         export_provider_task_uid=export_provider_task_uid)])
            else:
                return False

    def create_run(self):
        # start the run
        run = None
        try:
            # enforce max runs
            max_runs = settings.EXPORT_MAX_RUNS
            # get the number of existing runs for this job
            run_count = self.job.runs.count()
            if run_count > 0:
                while run_count > max_runs - 1:
                    # delete the earliest runs
                    self.job.runs.earliest(field_name='started_at').delete()  # delete earliest
                    run_count -= 1
            # add the export run to the database
            run = ExportRun.objects.create(job=self.job, user=self.job.user, status='SUBMITTED')  # persist the run
            run.save()
            run_uid = str(run.uid)
            logger.debug('Saved run with id: {0}'.format(run_uid))
            return run
        except DatabaseError as e:
            logger.error('Error saving export run: {0}'.format(e))
            raise e
