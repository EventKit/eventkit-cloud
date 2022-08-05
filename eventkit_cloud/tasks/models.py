# -*- coding: utf-8 -*-
import logging
from pathlib import Path
from typing import List, Optional, Union

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Q
from django.utils import timezone
from notifications.models import Notification

from eventkit_cloud.core.helpers import NotificationLevel, NotificationVerb, sendnotification
from eventkit_cloud.core.models import (
    FileFieldMixin,
    LowerCaseCharField,
    TimeStampedModelMixin,
    TimeTrackingModelMixin,
    UIDMixin,
)
from eventkit_cloud.jobs.helpers import get_valid_regional_justification
from eventkit_cloud.jobs.models import (
    DataProvider,
    Job,
    JobPermission,
    JobPermissionLevel,
    MapImageSnapshot,
    RegionalPolicy,
)
from eventkit_cloud.tasks import DEFAULT_CACHE_EXPIRATION, get_cache_value, set_cache_value
from eventkit_cloud.tasks.enumerations import TaskState

logger = logging.getLogger(__name__)


def get_all_users_by_permissions(permissions):
    return User.objects.filter(
        models.Q(groups__name=permissions["groups"]) | models.Q(username__in=permissions["members"])
    ).distinct()


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
        permissions = kwargs.get("permissions")
        if permissions:
            users = get_all_users_by_permissions(permissions)
            logger.error("users: {0}".format(users))
            for user in users:
                logger.error("Sending notification to {0}".format(user))
                sendnotification(
                    self,
                    user,
                    NotificationVerb.RUN_DELETED.value,
                    None,
                    None,
                    NotificationLevel.WARNING.value,
                    getattr(self, "status", "DELETED"),
                )

    class Meta:
        abstract = True


class FileProducingTaskResult(UIDMixin, FileFieldMixin, NotificationModelMixin):
    """
    A FileProducingTaskResult holds the information from the task, i.e. the reason for executing the task.
    """

    deleted = models.BooleanField(default=False)

    def soft_delete(self, *args, **kwargs):
        from eventkit_cloud.tasks.signals import exporttaskresult_delete_exports

        exporttaskresult_delete_exports(self.__class__, self)
        self.deleted = True
        self.export_task.display = False
        self.save()

    def user_can_download(self, user: User):
        """
        Checks to see if the user has all of the required permissions to download the file.  To not make these
        requests slower ideally the downloadable will have already
        select_related("export_task__export_provider_task__provider", "export_task__export_provider_task__run")
        :param user: The user requesting the file.
        :param downloadable: The downloadable file.
        :return:
        """

        jobs = JobPermission.userjobs(user, JobPermissionLevel.READ.value)
        job = jobs.filter(runs__data_provider_task_records__tasks__result=self).first()
        providers = []

        if not job:
            return False

        # Check the associated RunZipFile for attribute classes.
        attribute_classes = []
        for run_zip_file in self.runzipfile_set.all():
            for data_provider_task_record in run_zip_file.data_provider_task_records.all():
                providers.append(data_provider_task_record.provider)
                if data_provider_task_record.provider.attribute_class:
                    attribute_classes.append(data_provider_task_record.provider.attribute_class)

        for attribute_class in attribute_classes:
            if attribute_class and not attribute_class.users.filter(id=user.id):
                return False

        # Get the providers associated with this download if it's not a zipfile.
        if self.export_task.export_provider_task.provider:
            providers.append(self.export_task.export_provider_task.provider)

        # Check to make sure the user has agreed to the regional policy if one exists.
        for policy in RegionalPolicy.objects.filter(
            region__the_geom__intersects=job.the_geom, providers__in=providers
        ).prefetch_related("justifications"):
            if not get_valid_regional_justification(policy, user):
                return False

        return True

    class Meta:
        managed = True
        db_table = "export_task_results"

    def __str__(self):
        return "FileProducingTaskResult ({}), {}".format(self.uid, self.filename)

    def clone(self):

        self.id = None
        self.uid = None
        self.save()

        return self


class ExportRun(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin, NotificationModelMixin):
    """
    ExportRun is the main structure for storing export information.

    A Job provides information for the ExportRun.
    Many ExportRuns can map to a Job.
    Many DataProviderTasks can map to an ExportRun.
    Many ExportTasks can map to an DataProviderTaskRecord.
    """

    job = models.ForeignKey(Job, related_name="runs", on_delete=models.CASCADE)
    parent_run = models.ForeignKey(
        "ExportRun", related_name="child_runs", null=True, default=None, on_delete=models.SET_NULL
    )
    user = models.ForeignKey(User, related_name="runs", default=0, on_delete=models.CASCADE)
    worker = models.CharField(max_length=50, editable=False, default="", null=True)
    status = models.CharField(blank=True, max_length=20, db_index=True, default="")
    expiration = models.DateTimeField(default=timezone.now, editable=True)
    notified = models.DateTimeField(default=None, blank=True, null=True)
    deleted = models.BooleanField(default=False, db_index=True)
    is_cloning = models.BooleanField(default=False)
    delete_user = models.ForeignKey(User, null=True, blank=True, editable=False, on_delete=models.CASCADE)

    class Meta:
        managed = True
        db_table = "export_runs"
        verbose_name = "ExportRun (DataPack)"
        verbose_name_plural = "ExportRuns (DataPacks)"

    def __str__(self):
        return "{0}".format(str(self.uid))

    def soft_delete(self, user=None, *args, **kwargs):
        from eventkit_cloud.tasks.export_tasks import cancel_run
        from eventkit_cloud.tasks.signals import exportrun_delete_exports

        exportrun_delete_exports(self.__class__, self)
        username = None
        if user:
            self.delete_user = user
            username = user.username
        self.deleted = True
        logger.info("Deleting run {0} by user {1}".format(str(self.uid), user))
        cancel_run(export_run_uid=self.uid, canceling_username=username, delete=True)
        self.save()
        self.soft_delete_notifications(*args, **kwargs)

    def clone(self, download_data=True):

        data_provider_task_records = list(self.data_provider_task_records.exclude(provider__slug=""))

        parent_id = self.id
        self.pk = None
        self.id = None
        self.uid = None

        self.expiration = timezone.now() + timezone.timedelta(days=14)
        self.created_at = timezone.now()
        self.started_at = None
        self.finished_at = None
        self.save()

        for data_provider_task_record in data_provider_task_records:
            if data_provider_task_record.provider:
                dptr = data_provider_task_record.clone(self)
                if not self.data_provider_task_records.filter(id=dptr.id):
                    self.data_provider_task_records.add(dptr)

        self.parent_run = ExportRun.objects.get(id=parent_id)
        self.is_cloning = True
        self.deleted = False
        self.save()

        if download_data:
            self.download_data()
            self.is_cloning = False
            self.save()

        return self

    def download_data(self):
        """
        Downloads the data for a run into the staging directory.
        This is helpful when wanting to clone a run but delay the downloading of the data
        onto a fresh node if not using shared storage.
        """
        # This logic was considered in each related model to the run, but was mostly just passing flags through
        # to both keep existing models and/or download data for the related models.  This became messy and unnecessary,
        # since cloning and managing datapacks is mostly done at the run level.  If managing data fell to the data
        # provider or task level, then it doesn't make sense to have a
        # complicated helper function like this for each model.
        from eventkit_cloud.tasks.helpers import download_run_directory

        previous_run = self.parent_run
        download_run_directory(previous_run, self)

        data_provider_task_records = (
            self.data_provider_task_records.exclude(slug="run")
            .prefetch_related("tasks__result")
            .select_related("preview")
        )

        for data_provider_task_record in data_provider_task_records:
            file_models: List[Union[Optional[FileProducingTaskResult], Optional[MapImageSnapshot]]] = [
                data_provider_task_record.preview
            ]
            export_task_record: ExportTaskRecord
            for export_task_record in data_provider_task_record.tasks.all():
                file_models.append(export_task_record.result)

            for file_model in file_models:
                if not file_model:
                    continue
                # strip the old run uid off the filename and add a new one.
                filename = Path(str(self.uid)).joinpath(Path(file_model.file.name).relative_to(str(previous_run.uid)))
                file_model.file = str(filename)
                file_model.filename = str(filename)
                file_model.save()

        self.is_cloning = False
        self.save()


class ExportRunFile(UIDMixin, TimeStampedModelMixin, FileFieldMixin):
    """
    The ExportRunFile stores additional files to be added to each ExportRun zip archive.
    """

    provider = models.ForeignKey(
        DataProvider,
        on_delete=models.CASCADE,
        related_name="file_provider",
        null=True,
        blank=True,
        help_text="An optional data provider to associate the file with.",
    )

    def save(self, *args, **kwargs):
        if self.pk:
            export_run_file = ExportRunFile.objects.get(id=self.id)
            if export_run_file.file != self.file:
                export_run_file.file.delete(save=False)
        super(ExportRunFile, self).save(*args, **kwargs)


class DataProviderTaskRecord(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
    The DataProviderTaskRecord stores the task information for a specific provider.
    """

    from eventkit_cloud.jobs.models import MapImageSnapshot

    name = models.CharField(max_length=100, blank=True)
    slug = LowerCaseCharField(max_length=40, default="")
    provider = models.ForeignKey(
        DataProvider, on_delete=models.CASCADE, related_name="task_record_providers", null=True, blank=True
    )
    run = models.ForeignKey(ExportRun, related_name="data_provider_task_records", on_delete=models.CASCADE)
    status = models.CharField(blank=True, max_length=20, db_index=True)
    display = models.BooleanField(default=False)
    estimated_size = models.FloatField(null=True, blank=True)
    estimated_duration = models.FloatField(null=True, blank=True)
    preview = models.ForeignKey(
        MapImageSnapshot, blank=True, null=True, on_delete=models.SET_NULL, help_text="A preview for a provider task."
    )

    class Meta:
        ordering = ["name"]
        managed = True
        db_table = "data_provider_task_records"
        constraints = [
            models.UniqueConstraint(fields=["run", "provider"], name="unique_provider_run_per_task_record"),
            models.UniqueConstraint(
                fields=["run", "slug"], condition=Q(slug="run"), name="unique_run_slug_per_task_record"
            ),
        ]

    def __str__(self):
        return "DataProviderTaskRecord uid: {0}".format(str(self.uid))

    def clone(self, run: ExportRun):
        """
        The ExportRun needs to be a **new** run, otherwise integrity errors will happen.
        """
        export_task_records = list(self.tasks.all())
        preview = self.preview
        self.id = None
        self.uid = None
        self.run = run
        self.save()

        for export_task_record in export_task_records:
            etr = export_task_record.clone(self)
            if not self.tasks.filter(id=etr.id).exists():
                self.tasks.add(etr)

        if preview:
            self.preview = preview.clone()

        return self


class UserDownload(UIDMixin):
    """
    Model that stores each DataPack download event.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="downloads")
    downloaded_at = models.DateTimeField(verbose_name="Time of Download", default=timezone.now, editable=False)
    downloadable = models.ForeignKey(FileProducingTaskResult, on_delete=models.CASCADE, related_name="downloads")

    class Meta:
        ordering = ["-downloaded_at"]

    @property
    def job(self):
        if self.downloadable.export_task:
            return self.downloadable.export_task.export_provider_task.run.job

    @property
    def provider(self):
        if self.downloadable.export_task:
            return self.downloadable.export_task.export_provider_task.provider

    def clone(self):
        self.id = None
        self.uid = None
        self.save()

        return self


class ExportTaskRecord(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
    An ExportTaskRecord holds the information about the process doing the actual work for a task.
    """

    celery_uid = models.UUIDField(null=True)  # celery task uid
    name = models.CharField(max_length=100)
    export_provider_task = models.ForeignKey(DataProviderTaskRecord, related_name="tasks", on_delete=models.CASCADE)
    status = models.CharField(blank=True, max_length=20, db_index=True)
    pid = models.IntegerField(blank=True, default=-1)
    worker = models.CharField(max_length=100, blank=True, editable=False, null=True)
    cancel_user = models.ForeignKey(User, null=True, blank=True, editable=False, on_delete=models.CASCADE)
    display = models.BooleanField(default=False)
    result = models.OneToOneField(
        "FileProducingTaskResult", on_delete=models.CASCADE, null=True, blank=True, related_name="export_task"
    )
    hide_download = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]
        managed = True
        db_table = "export_task_records"
        constraints = [
            models.UniqueConstraint(
                fields=["name", "export_provider_task"], name="unique_name_per_export_provider_task"
            ),
        ]

    def __str__(self):
        return "ExportTaskRecord uid: {0}".format(str(self.uid))

    @property
    def progress(self):
        if TaskState[self.status] in TaskState.get_finished_states():
            return 100
        return get_cache_value(obj=self, attribute="progress", default=0)

    @progress.setter
    def progress(self, value, expiration=DEFAULT_CACHE_EXPIRATION):
        return set_cache_value(obj=self, attribute="progress", value=value, expiration=expiration)

    @property
    def estimated_finish(self):
        if TaskState[self.status] in TaskState.get_finished_states():
            return
        return get_cache_value(obj=self, attribute="estimated_finish", default=0)

    @estimated_finish.setter
    def estimated_finish(self, value, expiration=DEFAULT_CACHE_EXPIRATION):
        return set_cache_value(obj=self, attribute="estimated_finish", value=value, expiration=expiration)

    def clone(self, data_provider_task_record: DataProviderTaskRecord):
        # Get the exceptions from the old ExportTaskRecord
        exceptions = list(self.exceptions.all())

        # Create a new FPTR now because we can't clone the ETR with the old FPTR since it has a unique constraint.
        if self.result:
            file_producing_task_result = self.result.clone()
            file_producing_task_result.id = None
            file_producing_task_result.uid = None
            file_producing_task_result.save()
            self.result = file_producing_task_result

        # Create the new ExportTaskRecord
        self.id = None
        self.uid = None
        self.export_provider_task = data_provider_task_record
        self.save()

        # Add the exceptions to the new ExportTaskRecord
        for exception in exceptions:
            e = exception.clone()
            if not self.exceptions.filter(id=e.id).exists():
                self.exceptions.add(e)
        self.save()

        return self


class ExportTaskException(TimeStampedModelMixin):
    """
    Model to store ExportTaskRecord exceptions for auditing.
    """

    id = models.AutoField(primary_key=True, editable=False)
    task = models.ForeignKey(ExportTaskRecord, related_name="exceptions", on_delete=models.CASCADE)
    exception = models.TextField(editable=False)

    class Meta:
        managed = True
        db_table = "export_task_exceptions"

    def clone(self):
        self.id = None
        self.uid = None
        self.save()

        return self


def prefetch_export_runs(queryset_list_or_model):
    prefetch_args = [
        "job__data_provider_tasks__provider",
        "job__data_provider_tasks__formats",
        "data_provider_task_records__tasks__result",
        "data_provider_task_records__tasks__exceptions",
    ]
    if isinstance(queryset_list_or_model, models.query.QuerySet):
        return queryset_list_or_model.select_related("user").prefetch_related(*prefetch_args)
    elif isinstance(queryset_list_or_model, list):
        models.prefetch_related_objects(queryset_list_or_model, *prefetch_args)
    elif isinstance(queryset_list_or_model, ExportRun):
        models.prefetch_related_objects([queryset_list_or_model], *prefetch_args)
    return queryset_list_or_model


class RunZipFile(UIDMixin, TimeStampedModelMixin, TimeTrackingModelMixin):
    """
    Model to store zip files associated with ExportRun objects.
    """

    run = models.ForeignKey(ExportRun, on_delete=models.CASCADE, related_name="zip_files", null=True, blank=True)
    data_provider_task_records = models.ManyToManyField(DataProviderTaskRecord)
    downloadable_file = models.ForeignKey(FileProducingTaskResult, on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"RunZipFile uid: {self.uid}"

    @property
    def message(self):
        return get_cache_value(obj=self, attribute="message", default="")

    @message.setter
    def message(self, value, expiration=DEFAULT_CACHE_EXPIRATION):
        return set_cache_value(obj=self, attribute="message", value=value, expiration=expiration)

    @property
    def status(self):
        return get_cache_value(obj=self, attribute="status", default="")

    @status.setter
    def status(self, value, expiration=DEFAULT_CACHE_EXPIRATION):
        return set_cache_value(obj=self, attribute="status", value=value, expiration=expiration)


def get_run_zip_file_slug_sets(new_run, old_run_zip_files):
    """
    :param old_run_zip_files: A list of run zip files.
    :return: A set of provider slugs for each zip file.
    """

    data_provider_task_records = new_run.data_provider_task_records.exclude(provider__isnull=True)
    all_run_zip_file_slugs = [
        data_provider_task_record.provider.slug for data_provider_task_record in data_provider_task_records
    ]
    run_zip_file_slug_sets = []

    for old_run_zip_file in old_run_zip_files:
        run_zip_file_slug_set = []
        for data_provider_task_record in old_run_zip_file.data_provider_task_records.all():
            run_zip_file_slug_set.append(data_provider_task_record.provider.slug)

        # Don't rerun the overall project zip file.
        if all_run_zip_file_slugs != run_zip_file_slug_set:
            run_zip_file_slug_sets.append(run_zip_file_slug_set)

    return run_zip_file_slug_sets
