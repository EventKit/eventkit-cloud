# -*- coding: utf-8 -*-
from __future__ import absolute_import

from ..jobs.models import Job
from .models import ExportRun
from .task_runners import ExportOSMTaskRunner, ExportWMSTaskRunner, ExportWMTSTaskRunner
from django.conf import settings
from .export_tasks import FinalizeRunTask
from celery import group, chord
from datetime import datetime, timedelta
import logging
import os
from django.db import DatabaseError

# Get an instance of a logger
logger = logging.getLogger(__name__)


class TaskFactory():
    def __init__(self, job_uid):
        self.job = Job.objects.get(uid=job_uid)
        self.type_task_map = {'osm': ExportOSMTaskRunner, 'wms': ExportWMSTaskRunner, 'wmts': ExportWMTSTaskRunner}
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
                        task_runner_tasks = task_runner.run_task(user=self.job.user,
                                                                 provider_task_uid=provider_task.uid,
                                                                 run=self.run,
                                                                 stage_dir=os.path.join(self.stage_dir,
                                                                                        provider_task.provider.slug))
                        header_tasks += [task_runner_tasks]
                if header_tasks:
                    finalize_task = FinalizeRunTask()
                    chord(group(header_tasks), body=finalize_task.si(stage_dir=self.stage_dir,
                                                              run_uid=self.run.uid).set(link_error=[finalize_task.si()])
                          ).apply_async(expires=datetime.now() + timedelta(days=1))
                else:
                    return False
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
