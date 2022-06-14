from django.contrib.auth.models import Group, User
from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver

from eventkit_cloud.jobs.models import remove_permissions


@receiver(pre_delete, sender=User)
def delete_user(sender, instance, **kwargs):
    remove_permissions(User, instance.id)


@receiver(pre_delete, sender=Group)
def delete_group(sender, instance, **kwargs):
    remove_permissions(Group, instance.id)
