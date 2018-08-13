from django.contrib.auth.models import User, Group
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.db import models

from eventkit_cloud.core.models import JobPermission


class OAuth(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, blank=False)
    identification = models.CharField(max_length=200, unique=True, blank=False)
    commonname = models.CharField(max_length=100, blank=False)
    user_info = JSONField(default={})

    class Meta:  # pragma: no cover
        managed = True
        db_table = 'auth_oauth'

    def __str__(self):
        return '{0}'.format(self.commonname)


def delete(self):
    for job_permission in JobPermission.objects.filter(object_id=self.pk):
        job_permission.content_type = ContentType.objects.get_for_model(User)
        job_permission.object_id = job_permission.job.user.pk
        job_permission.save()

    super(Group, self).delete()


Group.delete = delete
