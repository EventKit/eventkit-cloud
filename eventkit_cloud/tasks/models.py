# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import logging

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone

from ..jobs.models import Job, LowerCaseCharField, DataProvider
from ..core.models import UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin
from ..core.helpers import sendnotification, NotificationLevel, NotificationVerb
from notifications.models import Notification
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


def get_all_users_by_permissions(permissions):
    return User.objects.filter(models.Q(groups__name=permissions['groups']) | models.Q(username__in=permissions['users']))


def notification_delete(instance):
    for notification in Notification.objects.filter(actor_object_id=instance.id):
        ct = ContentType.objects.filter(pk=notification.actor_content_type_id).get()
        if ct == ContentType.objects.get_for_model(type(instance)):
            notification.delete()


def notification_soft_delete(instance):
    for notification in Notification.objects.filter(actor_object_id=instance.id):
        ct = ContentType.objects.filter(pk=notification.actor_content_type_id).get()
        if ct == ContentType.objects.get_for_model(type(instance)):
            notification.public = False
            notification.save()


class NotificationModelMixin(models.Model):

    def delete_notifications(self, *args, **kwargs):
        notification_delete(self)

    def soft_delete_notifications(self, *args, **kwargs):
        permissions = kwargs.get('permissions')
        if permissions:
            users = get_all_users_by_permissions(permissions)
            logger.error("users: {0}".format(users))
            for user in users:
                logger.error("Sending notification to {0}".format(user))
                sendnotification(self, user, NotificationVerb.RUN_DELETED.value,
                                 None, None, NotificationLevel.WARNING.value, getattr(self, "status", "DELETED"))

    class Meta:
        abstract = True


class FileProducingTaskResult(UIDMixin, NotificationModelMixin):
    """
    A FileProducingTaskResult holds the information from the task, i.e. the reason for executing the task.
    """
    filename = models.CharField(max_length=508, blank=True, editable=False)
    size = models.FloatField(null=True, editable=False)
    download_url = models.URLField(
        verbose_name='URL to export task result output.',
        max_length=508
    )
    deleted = models.BooleanField(default=False)

    @property
    def task(self):
        if hasattr(self, 'finalize_task') and hasattr(self.export_task):
            raise Exception(
                'Both an ExportTaskRecord and a FinalizeRunHookTaskRecord are linked to FileProducingTaskResult')
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
        return 'FileProducingTaskResult ({}), {}'.format(self.uid, self.filename)


class ExportRun(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin, NotificationModelMixin):
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
    downloadable = models.OneToOneField(FileProducingTaskResult, null=True, on_delete=models.CASCADE, related_name='run')
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
        self.soft_delete_notifications(*args, **kwargs)

    @property
    def zipfile_url(self):
        if self.downloadable:
            return self.downloadable.download_url
        else:
            return ""


class FinalizeRunHookTaskRecord(UIDMixin, TimeStampedModelMixin):
    run = models.ForeignKey(ExportRun)
    celery_uid = models.UUIDField()
    name = models.CharField(max_length=50)
    status = models.CharField(blank=True, max_length=20, db_index=True)
    pid = models.IntegerField(blank=True, default=-1)
    worker = models.CharField(max_length=100, blank=True, editable=False, null=True)
    cancel_user = models.ForeignKey(User, null=True, blank=True, editable=False)
    result = models.OneToOneField(FileProducingTaskResult, null=True, blank=True, related_name='finalize_task')

    class Meta:
        ordering = ['created_at']
        managed = True
        db_table = 'finalize_run_hook_task_record'

    def __str__(self):
        return 'RunFinishedTaskRecord ({}): {}'.format(self.celery_uid, self.status)


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


class UserDownload(UIDMixin):
    """
    Model that stores each DataPack download event.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='downloads')
    downloaded_at = models.DateTimeField(verbose_name="Time of Download", default=timezone.now, editable=False)
    downloadable = models.ForeignKey(FileProducingTaskResult, on_delete=models.CASCADE, related_name='downloads')

    class Meta:
        ordering = ['-downloaded_at']

    @property
    def job(self):
        if self.downloadable.task:
            return self.downloadable.task.export_provider_task.run.job
        if self.downloadable.run:
            return self.downloadable.run.job

    @property
    def provider(self):
        # TODO: This is one of many reasons why DataProviderTaskRecord should maybe point to DataProvider
        if self.downloadable.task:
            return DataProvider.objects.filter(slug=self.downloadable.task.export_provider_task.slug).first()


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


def prefetch_export_runs(queryset_list_or_model):
    prefetch_args = ['job__provider_tasks__provider', 'job__provider_tasks__formats',
                     'provider_tasks__tasks__result', 'provider_tasks__tasks__exceptions']
    if isinstance(queryset_list_or_model, models.query.QuerySet):
        return queryset_list_or_model.select_related('user').prefetch_related(*prefetch_args)
    elif isinstance(queryset_list_or_model, list):
        models.prefetch_related_objects(queryset_list_or_model, *prefetch_args)
    elif isinstance(queryset_list_or_model, ExportRun):
        models.prefetch_related_objects([queryset_list_or_model], *prefetch_args)
    return queryset_list_or_model
