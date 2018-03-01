# -*- coding: utf-8 -*-

from __future__ import unicode_literals
import uuid
from enum import Enum
from django.contrib.gis.db import models
from django.utils import timezone
from django.contrib.auth.models import User,Group


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

class GroupPermission(TimeStampedModelMixin):
    """
    Model associates users with groups.  Note this REPLACES the django.auth provided groupmembership
    """

    @staticmethod
    class Permissions(Enum):
        NONE = "NONE"
        MEMBER = "MEMBER"
        ADMIN = "ADMIN"

    user = models.ForeignKey(User)
    group = models.ForeignKey(Group)
    permission  = models.CharField(
        choices=[('NONE','None'),('MEMBER','Member'),('ADMIN','Admin')],
        max_length=10)

    def __str__(self):
        return '{0}: {1}: {2}'.format(self.user, self.group.name, self.permission)

    def __unicode__(self):
        return '{0}: {1}: {2}'.format(self.user, self.group.name, self.permission)


from ..tasks.models import Job
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class JobPermission(TimeStampedModelMixin):

    @staticmethod
    class JobPermissions(object):
        class MemberTypes(Enum):
            NONE = "NONE"
            READ = "READ"
            ADMIN = "ADMIN"

    """
    Model associates users or groups with jobs
    """

    job = models.ForeignKey(Job)
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    permission = models.CharField(
        choices=[('NONE', 'None'), ('READ', 'Read'), ('ADMIN', 'Admin')],
        max_length=10)

    def __str__(self):
        return '{0} - {1}: {2}: {3}'.format(self.content_type, self.object_id, self.job, self.permission)

    def __unicode__(self):
        return '{0} - {1}: {2}: {3}'.format(self.content_type, self.object_id, self.job, self.permission)


