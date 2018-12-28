# -*- coding: utf-8 -*-



import unicodedata
import uuid

from django.contrib.auth.models import User, Group
from django.contrib.gis.db import models
from django.utils import timezone
from enum import Enum
from notifications.models import Notification

Notification.old_str_func = Notification.__str__


def normalize_unicode_str(self):
    return str(unicodedata.normalize('NFKD', self.old_str_func()).encode('ascii', 'ignore'))


# Modify the Notification model's __str__ method to not return a unicode string, since this seems to cause problems
# with the logger.
Notification.__str__ = normalize_unicode_str



class TimeStampedModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super(TimeStampedModelMixin, self).save(*args, **kwargs)


class TimeTrackingModelMixin(models.Model):
    """
    Mixin for timestamped models.
    """
    started_at = models.DateTimeField(default=timezone.now, editable=False)
    finished_at = models.DateTimeField(editable=False, null=True)

    class Meta:
        abstract = True

    @property
    def duration(self):
        """Get the duration for this ExportTaskRecord."""
        started = self.started_at
        finished = self.finished_at
        if started and finished:
            return str(finished - started)
        else:
            return None  # can't compute yet

    @property
    def get_started_at(self):
        if not self.started_at:
            return None  # not started yet
        else:
            return self.started_at

    @property
    def get_finished_at(self):
        if not self.finished_at:
            return None  # not finished yet
        else:
            return self.finished_at


class UIDMixin(models.Model):
    """
    Mixin for adding identifiers to a model.
    """
    id = models.AutoField(primary_key=True, editable=False)
    uid = models.UUIDField(unique=True, default=uuid.uuid4, editable=False, db_index=True)

    class Meta:
        abstract = True

class GroupPermissionLevel(Enum):
    NONE = "NONE"
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"


class GroupPermission(TimeStampedModelMixin):
    """
    Model associates users with groups.  Note this REPLACES the django.auth provided groupmembership
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    permission = models.CharField(
        choices=[('NONE', 'None'), ('MEMBER', 'Member'), ('ADMIN', 'Admin')],
        max_length=10)

    def __str__(self):
        return '{0}: {1}: {2}'.format(self.user, self.group.name, self.permission)

    def __unicode__(self):
        return '{0}: {1}: {2}'.format(self.user, self.group.name, self.permission)


from eventkit_cloud.tasks.models import Job
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class JobPermissionLevel(Enum):
    NONE = "NONE"
    READ = "READ"
    ADMIN = "ADMIN"


class JobPermission(TimeStampedModelMixin):

    """
    Model associates users or groups with jobs
    """

    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    permission = models.CharField(
        choices=[('NONE', 'None'), ('READ', 'Read'), ('ADMIN', 'Admin')],
        max_length=10)

    @staticmethod
    def jobpermissions(job):
        permissions = {'groups': {}, 'members': {}}
        for jp in JobPermission.objects.filter(job=job):
            item = None
            if jp.content_type == ContentType.objects.get_for_model(User):
                user = User.objects.get(pk=jp.object_id)
                permissions['members'][user.username] = jp.permission
            else:
                group = Group.objects.get(pk=jp.object_id)
                permissions['groups'][group.name] = jp.permission

        return permissions

    @staticmethod
    def userjobs(user, level, include_groups=True):
        perms = []
        job_ids = []

        # get all the jobs this user has been explicitly assigned to

        for jp in JobPermission.objects.filter(content_type=ContentType.objects.get_for_model(User),
                                               object_id=user.id).select_related('job'):
            if level == JobPermissionLevel.READ.value or jp.permission == level:
                perms.append(jp)
                job_ids.append(jp.job.id)

        if not include_groups:
            return (perms, job_ids)

        # Now do the same for groups that the user belongs to

        group_ids = []
        for gp in GroupPermission.objects.filter(user=user):
            group_ids.append(gp.group.id)
        for jp in JobPermission.objects.filter(content_type=ContentType.objects.get_for_model(Group),
                                               object_id__in=group_ids):
            if level == JobPermissionLevel.READ.value or jp.permission == level:
                perms.append(jp)
                job_ids.append(jp.job.id)

        # super users can do anything to any job

        if user.is_superuser:
            job_ids = [job.id for job in Job.objects.all()]

        return (perms, job_ids)

    @staticmethod
    def groupjobs(group, level):
        perms = []
        job_ids = []

        # get all the jobs for which this group has the given permission level

        for jp in JobPermission.objects.filter(content_type=ContentType.objects.get_for_model(Group),
                                               object_id=group.id):
            if level == JobPermissionLevel.READ.value or jp.permission == level:
                perms.append(jp)
                job_ids.append(jp.job.id)

        return (perms, job_ids)

    @staticmethod
    def get_user_permissions(user, job_id):
        """
        Check what level of permission a user has to a job.
        :param user: User obj in question
        :param job_id: Id of the job for which we want the user's permission level
        :return: None, READ, or ADMIN depending on what level of permission the user has to the job
        """
        permission = None

        # All of the permission objects for the job in question.
        jps = JobPermission.objects.filter(job__uid=job_id)

        try:
            # Check if the user has explicit permissions to the job.
            user_permission = jps.filter(content_type=ContentType.objects.get_for_model(User)) \
                .get(object_id=user.pk)
        except JobPermission.DoesNotExist:
            user_permission = None

        if user_permission:
            permission = user_permission.permission

        if permission == JobPermissionLevel.ADMIN.value:
            # If the users has ADMIN permission we can return.
            # If the user does NOT HAVE ADMIN permission we will need to check the groups for implicit ADMIN.
            return JobPermissionLevel.ADMIN.value

        # Get all the ADMIN level group permissions for the user
        users_groups = [gp.group.pk for gp in GroupPermission.objects.filter(user=user) \
            .filter(permission=GroupPermissionLevel.ADMIN.value)]

        # Check if any of the groups the user is an admin of have group-admin permission to the job.
        jp_group_admin = jps.filter(content_type=ContentType.objects.get_for_model(Group)) \
            .filter(object_id__in=users_groups) \
            .filter(permission=JobPermissionLevel.ADMIN.value)

        # If any of the groups the user is an admin of have admin-group permission
        #  we know that the user has implicit ADMIN permission to the job.
        if jp_group_admin.count() > 0:
            return JobPermissionLevel.ADMIN.value

        # If the user already has explict READ permissions we can return without checking for implicit READ via groups.
        if permission:
            return JobPermissionLevel.READ.value

        # Get all the group permissions for groups the user is in.
        users_groups = [gp.group.pk for gp in GroupPermission.objects.filter(user=user)]

        # Check if any of the groups the user is in have group-read permission to the job.
        jp_group_member = jps.filter(content_type=ContentType.objects.get_for_model(Group)) \
            .filter(object_id__in=users_groups) \
            .filter(permission=JobPermissionLevel.READ.value)

        # If any of the groups the user is in have READ permissions we can return.
        if jp_group_member.count() > 0:
            JobPermissionLevel.READ.value

        # If user does not have any explicit or implicit permission to the job we return none.
        return ''

    def __str__(self):
        return '{0} - {1}: {2}: {3}'.format(self.content_type, self.object_id, self.job, self.permission)

    def __unicode__(self):
        return '{0} - {1}: {2}: {3}'.format(self.content_type, self.object_id, self.job, self.permission)
