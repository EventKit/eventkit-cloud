from django.db.models.signals import post_save
from django.dispatch.dispatcher import receiver
from django.contrib.auth.models import Group, User

from ..jobs.models import Job
from ..core.models import JobPermission

import logging
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """
    This method is executed whenever a User object is created.

    Adds the new user to DefaultExportExtentGroup.
    """
    if created:
        instance.groups.add(Group.objects.get(name='DefaultExportExtentGroup'))


@receiver(post_save, sender=Job)
def job_post_save(sender, instance, created, **kwargs):
    """
    This method is executed whenever a Job  object is created.

    If created is true, assign the user as an ADMIN for this job
    """

    if created :
        jp = JobPermission.objects.create(job=instance, content_object=instance.user,
                                          permission=JobPermission.Permissions.ADMIN.value)
        jp.save()

