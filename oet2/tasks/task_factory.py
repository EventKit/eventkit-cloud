# -*- coding: utf-8 -*-
from __future__ import absolute_import

from ..jobs.models import Job, ProviderTask
from .task_runners import ExportOSMTaskRunner

class TaskFactory():

    def __init__(self, job_uid):
        self.job = Job.objects.get(uid=job_uid)
        self.type_task_map = {'osm': ExportOSMTaskRunner}
        self.parse_tasks()

    def parse_tasks(self):
        provider_tasks = [provider_task for provider_task in self.job.provider_tasks.all()]
        for provider_task in provider_tasks:
            # Create an instance of a task runner based on the type name
            task_runner = self.type_task_map.get(provider_task.provider.export_provider_type.type_name)()
            task_runner.run_task(user=self.job.user,
                                 provider_task_uid=provider_task.uid,
                                 job_name=self.job.name)
            return task_runner

