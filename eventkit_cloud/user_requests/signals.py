from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch.dispatcher import receiver

from eventkit_cloud.user_requests.models import DataProviderRequest, SizeIncreaseRequest
from eventkit_cloud.utils.rocket_chat import RocketChat


@receiver(post_save, sender=DataProviderRequest)
def data_provider_post_save(sender, instance, created, **kwargs):
    rocketchat_notifications = settings.ROCKETCHAT_NOTIFICATIONS
    if rocketchat_notifications:
        channels = rocketchat_notifications["channels"]
        if created:
            message = f"@here: A new provider request, {instance.uid} has been submitted by {instance.user}."
        else:
            message = (
                f"@here: A provider request, {instance.uid} has been updated"
                f"and is now {instance.get_status_display()}."
            )

        client = RocketChat(**rocketchat_notifications)
        for channel in channels:
            client.post_message(channel, message)


@receiver(post_save, sender=SizeIncreaseRequest)
def size_request_post_save(sender, instance, created, **kwargs):
    rocketchat_notifications = settings.ROCKETCHAT_NOTIFICATIONS
    if rocketchat_notifications:
        channels = rocketchat_notifications["channels"]
        if created:
            message = f"@here: A new data size increase request, {instance.uid} has been submitted by {instance.user}."
        else:
            message = (
                f"@here: A data size increase request, {instance.uid} has "
                f"been updated and is now {instance.get_status_display()}."
            )

        client = RocketChat(**rocketchat_notifications)
        for channel in channels:
            client.post_message(channel, message)
