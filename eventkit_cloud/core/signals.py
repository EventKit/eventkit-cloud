from django.contrib.auth.models import User, Group
from eventkit_cloud.core.models import remove_permissions
from django.dispatch.dispatcher import receiver
from django.db.models.signals import pre_delete


@receiver(pre_delete, sender=User)
def delete_user(sender, instance, **kwargs):
    remove_permissions(User, instance.id)


@receiver(pre_delete, sender=Group)
def delete_group(sender, instance, **kwargs):
    remove_permissions(Group, instance.id)
