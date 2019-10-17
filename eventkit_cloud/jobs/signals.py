import logging
import requests

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.db.models.signals import post_save, pre_delete
from django.dispatch.dispatcher import receiver
from django.urls import reverse

from eventkit_cloud.core.models import JobPermission, JobPermissionLevel
from eventkit_cloud.jobs.models import Job, DataProvider, MapImageSnapshot
from eventkit_cloud.jobs.helpers import get_thumbnail_dir

from eventkit_cloud.utils.s3 import delete_from_s3

import os
from PIL import Image
from io import BytesIO

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

    if created:
        jp = JobPermission.objects.create(job=instance, content_object=instance.user,
                                          permission=JobPermissionLevel.ADMIN.value)
        jp.save()



@receiver(pre_delete, sender=MapImageSnapshot)
def mapimagesnapshot_delete(sender, instance, *args, **kwargs):
    """
    Delete associated files when deleting the FileProducingTaskResult.
    """
    # The url should be constructed as [download context, run_uid, filename]
    if getattr(settings, 'USE_S3', False):
        delete_from_s3(download_url=instance.download_url)
    url_parts = instance.download_url.split('/')
    full_file_download_path = '/'.join([settings.SNAPSHOT_DOWNLOAD_ROOT.rstrip('/'), url_parts[-2], url_parts[-1]])
    try:
        os.remove(full_file_download_path)
        logger.info("The file {0} was deleted.".format(full_file_download_path))
    except OSError:
        logger.warn("The file {0} was already removed or does not exist.".format(full_file_download_path))


@receiver(post_save, sender=DataProvider)
def job_post_save(sender, instance, created, **kwargs):
    """
    This method is executed whenever a Job  object is created.

    If created is true, assign the user as an ADMIN for this job
    """
    base_url = reverse('map', args=['dg-its', '/wmts'])
    logger.info(instance.preview_url)
    img = Image.open(BytesIO(request.content))
    logger.info(img)
    import random
    if instance.preview_url:
        if created:
            thumbnail_snapshot = MapImageSnapshot.objects.create(download_url='dl', filename='/path', size=1 )
            thumbnail_snapshot.save()
            instance.thumbnail = thumbnail_snapshot
            instance.save()
        if instance.thumbnail is None or random.randint(0, 10) < 8:
            logger.info('enter create')
            filepath = get_thumbnail_dir(instance.slug) + '.png'
            img.save(filepath)
            filesize = os.stat(filepath).st_size
            thumbnail_snapshot = MapImageSnapshot.objects.create(download_url=filepath, filename=filepath, size=filesize)
            thumbnail_snapshot.save()
            instance.thumbnail = thumbnail_snapshot
            instance.save()
