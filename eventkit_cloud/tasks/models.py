# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from ..jobs.models import Job, LowerCaseCharField
from ..core.models import UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin

logger = logging.getLogger(__name__)


class ExportRun(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
    ExportRun is the main structure for storing export information.

    A Job provides information for the ExportRun.
    Many ExportRuns can map to a Job.
    Many DataProviderTasks can map to an ExportRun.
    Many ExportTasks can map to an DataProviderTaskRecord.
    """
    job = models.ForeignKey(Job, related_name='runs')
    user = models.ForeignKey(User, related_name="runs", default=0)
    worker = models.CharField(max_length=50, editable=False, default='', null=True)
    zipfile_url = models.CharField(max_length=1000, db_index=False, blank=True, null=True)
    status = models.CharField(
        blank=True,
        max_length=20,
        db_index=True,
        default=''
    )
    expiration = models.DateTimeField(default=timezone.now, editable=True)
    notified = models.DateTimeField(default=None, blank=True, null=True)
    deleted = models.BooleanField(default=False)
    delete_user = models.ForeignKey(User, null=True, blank=True, editable=False)

    class Meta:
        managed = True
        db_table = 'export_runs'
        verbose_name = 'ExportRun (DataPack)'
        verbose_name_plural = 'ExportRuns (DataPacks)'

    def __str__(self):
        return '{0}'.format(self.uid)

    def soft_delete(self, user=None, *args, **kwargs):
        from .export_tasks import cancel_run
        from .signals import exportrun_delete_exports
        exportrun_delete_exports(self.__class__, self)
        username = None
        if user:
            self.delete_user = user
            username = user.username
        self.deleted = True
        logger.info("Deleting run {0} by user {1}".format(self.uid, user))
        cancel_run(export_run_uid=self.uid, canceling_username=username, delete=True)
        self.save()


class DataProviderTaskRecord(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
    The DataProviderTaskRecord stores the task information for a specific provider.
    """
    name = models.CharField(max_length=50, blank=True)
    slug = LowerCaseCharField(max_length=40, default='')
    run = models.ForeignKey(ExportRun, related_name='provider_tasks')
    status = models.CharField(blank=True, max_length=20, db_index=True)
    display = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']
        managed = True
        db_table = 'data_provider_task_records'

    def __str__(self):
        return 'DataProviderTaskRecord uid: {0}'.format(self.uid)


class ExportTaskRecord(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
     An ExportTaskRecord holds the information about the process doing the actual work for a task.
    """
    celery_uid = models.UUIDField(null=True)  # celery task uid
    name = models.CharField(max_length=50)
    export_provider_task = models.ForeignKey(DataProviderTaskRecord, related_name='tasks')
    status = models.CharField(blank=True, max_length=20, db_index=True)
    progress = models.IntegerField(default=0, editable=False, null=True)
    estimated_finish = models.DateTimeField(blank=True, editable=False, null=True)
    pid = models.IntegerField(blank=True, default=-1)
    worker = models.CharField(max_length=100, blank=True, editable=False, null=True)
    cancel_user = models.ForeignKey(User, null=True, blank=True, editable=False)
    display = models.BooleanField(default=False)
    result = models.OneToOneField('FileProducingTaskResult', null=True, blank=True, related_name='export_task')

    class Meta:
        ordering = ['created_at']
        managed = True
        db_table = 'export_task_records'

    def __str__(self):
        return 'ExportTaskRecord uid: {0}'.format(self.uid)


class FinalizeRunHookTaskRecord(UIDMixin, TimeStampedModelMixin):
    run = models.ForeignKey(ExportRun)
    celery_uid = models.UUIDField()
    task_name = models.CharField(max_length=50)
    status = models.CharField(blank=True, max_length=20, db_index=True)
    pid = models.IntegerField(blank=True, default=-1)
    worker = models.CharField(max_length=100, blank=True, editable=False, null=True)
    cancel_user = models.ForeignKey(User, null=True, blank=True, editable=False)
    result = models.OneToOneField('FileProducingTaskResult', null=True, blank=True, related_name='finalize_task')

    class Meta:
        ordering = ['created_at']
        managed = True
        db_table = 'finalize_run_hook_task_record'

    def __str__(self):
        return 'RunFinishedTaskRecord ({}): {}'.format(self.celery_uid, self.status)


class FileProducingTaskResult(models.Model):
    """
         A FileProducingTaskResult holds the information from the task, i.e. the reason for executing the task.
    """
    id = models.AutoField(primary_key=True)
    filename = models.CharField(max_length=100, blank=True, editable=False)
    size = models.FloatField(null=True, editable=False)
    download_url = models.URLField(
        verbose_name='URL to export task result output.',
        max_length=254
    )
    deleted = models.BooleanField(default=False)

    @property
    def task(self):
        if hasattr(self, 'finalize_task') and hasattr(self.export_task):
            raise Exception('Both an ExportTaskRecord and a FinalizeRunHookTaskRecord are linked to FileProducingTaskResult')
        elif hasattr(self, 'finalize_task'):
            ret = self.finalize_task
        elif hasattr(self, 'export_task'):
            ret = self.export_task
        else:
            ret = None
        return ret

    def soft_delete(self, *args, **kwargs):
        from .signals import exporttaskresult_delete_exports
        exporttaskresult_delete_exports(self.__class__, self)
        self.deleted = True
        self.save()
        if hasattr(self.task, 'display'):
            self.task.display = False
            self.task.save()

    class Meta:
        managed = True
        db_table = 'export_task_results'

    def __str__(self):
        return 'FileProducingTaskResult ({}), {}'.format(self.id, self.filename)


class ExportTaskException(TimeStampedModelMixin):
    """
    Model to store ExportTaskRecord exceptions for auditing.
    """
    id = models.AutoField(primary_key=True, editable=False)
    task = models.ForeignKey(ExportTaskRecord, related_name='exceptions')
    exception = models.TextField(editable=False)

    class Meta:
        managed = True
        db_table = 'export_task_exceptions'

