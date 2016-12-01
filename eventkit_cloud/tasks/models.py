# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging
import shutil
import uuid

from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_delete, pre_delete
from django.dispatch.dispatcher import receiver
from django.utils import timezone

from eventkit_cloud.jobs.models import Job
from eventkit_cloud.utils.s3 import delete_from_s3

logger = logging.getLogger(__name__)


class TimeStampedModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    started_at = models.DateTimeField(default=timezone.now, editable=False)
    finished_at = models.DateTimeField(editable=False, null=True)

    class Meta:
        abstract = True


class RunModelMixin(TimeStampedModelMixin):
    """
    Mixin for task runs.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class ExportRun(RunModelMixin):
    """
    ExportRun is the main structure for storing export information.

    A Job provides information for the ExportRun.
    Many ExportRuns can map to a Job.
    Many ExportProviderTasks can map to an ExportRun.
    Many ExportTasks can map to an ExportProviderTask.
    """
    job = models.ForeignKey(Job, related_name='runs')
    user = models.ForeignKey(User, related_name="runs", default=0)
    worker = models.CharField(max_length=50, editable=False, default='', null=True)
    zipfile_url = models.CharField(max_length=1000, db_index=False, blank=True)
    status = models.CharField(
        blank=True,
        max_length=20,
        db_index=True,
        default=''
    )

    class Meta:
        managed = True
        db_table = 'export_runs'

    def __str__(self):
        return '{0}'.format(self.uid)


class ExportProviderTask(models.Model):
    """
    The ExportProviderTask stores the task information for a specific provider.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, blank=True)
    run = models.ForeignKey(ExportRun, related_name='provider_tasks')
    status = models.CharField(blank=True, max_length=20, db_index=True)

    class Meta:
        ordering = ['name']
        managed = True
        db_table = 'export_provider_tasks'

    def __str__(self):
        return 'ExportProviderTask uid: {0}'.format(self.uid)


class ExportTask(models.Model):
    """
     An ExportTask holds the information about the process doing the actual work for a task.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)
    celery_uid = models.UUIDField(null=True)  # celery task uid
    name = models.CharField(max_length=50)
    export_provider_task = models.ForeignKey(ExportProviderTask, related_name='tasks')
    status = models.CharField(blank=True, max_length=20, db_index=True)
    progress = models.IntegerField(default=0, editable=False, null=True)
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    started_at = models.DateTimeField(editable=False, null=True)
    estimated_finish = models.DateTimeField(blank=True, editable=False, null=True)
    finished_at = models.DateTimeField(editable=False, null=True)

    class Meta:
        ordering = ['created_at']
        managed = True
        db_table = 'export_tasks'

    def __str__(self):
        return 'ExportTask uid: {0}'.format(self.uid)


class ExportTaskResult(models.Model):
    """
         An ExportTaskResult holds the information from the task, i.e. the reason for executing the task.
    """
    task = models.OneToOneField(ExportTask, primary_key=True, related_name='result')
    filename = models.CharField(max_length=100, blank=True, editable=False)
    size = models.FloatField(null=True, editable=False)
    download_url = models.URLField(
        verbose_name='Url to export task result output.',
        max_length=254
    )

    class Meta:
        managed = True
        db_table = 'export_task_results'

    def __str__(self):
        return 'ExportTaskResult uid: {0}'.format(self.task.uid)


class ExportTaskException(models.Model):
    """
    Model to store ExportTask exceptions for auditing.
    """
    id = models.AutoField(primary_key=True, editable=False)
    task = models.ForeignKey(ExportTask, related_name='exceptions')
    timestamp = models.DateTimeField(default=timezone.now, editable=False)
    exception = models.TextField(editable=False)

    class Meta:
        managed = True
        db_table = 'export_task_exceptions'


@receiver(post_delete, sender=ExportRun)
def exportrun_delete_exports(sender, instance, **kwargs):
    """
    Delete the associated export files when a ExportRun is deleted.
    """
    download_root = settings.EXPORT_DOWNLOAD_ROOT
    run_uid = instance.uid
    run_dir = '{0}{1}'.format(download_root, run_uid)
    shutil.rmtree(run_dir, ignore_errors=True)


@receiver(pre_delete, sender=ExportRun)
def delete_s3_pre_delete(sender, instance, *args, **kwargs):
    if getattr(settings, 'USE_S3', False):
        delete_from_s3(str(instance.uid))


