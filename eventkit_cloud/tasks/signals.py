from django.conf import settings
from django.db.models.signals import pre_delete, post_delete
from django.dispatch.dispatcher import receiver

from eventkit_cloud.tasks.models import ExportRun, ExportRunFile, FileProducingTaskResult
from eventkit_cloud.utils.s3 import delete_from_s3

import os
import shutil
import logging


logger = logging.getLogger(__file__)


@receiver(pre_delete, sender=ExportRun)
def exportrun_delete_exports(sender, instance, *args, **kwargs):
    """
    Delete the associated export files and notifications when an ExportRun is deleted.
    """
    if getattr(settings, "USE_S3", False):
        delete_from_s3(run_uid=str(instance.uid))
    run_dir = "{0}/{1}".format(settings.EXPORT_DOWNLOAD_ROOT.rstrip("/"), str(instance.uid))
    try:
        shutil.rmtree(run_dir, ignore_errors=True)
        logger.info("The directory {0} was deleted.".format(run_dir))
    except OSError:
        logger.warn("The directory {0} was already moved or doesn't exist.".format(run_dir))
    instance.delete_notifications()


@receiver(pre_delete, sender=FileProducingTaskResult)
def exporttaskresult_delete_exports(sender, instance, *args, **kwargs):
    """
    Delete associated files when deleting the FileProducingTaskResult.
    """
    # The url should be constructed as [download context, run_uid, filename]
    if getattr(settings, "USE_S3", False):
        delete_from_s3(download_url=instance.download_url)
    url_parts = instance.download_url.split("/")
    full_file_download_path = "/".join([settings.EXPORT_DOWNLOAD_ROOT.rstrip("/"), url_parts[-2], url_parts[-1]])
    try:
        os.remove(full_file_download_path)
        logger.info("The directory {0} was deleted.".format(full_file_download_path))
    except OSError:
        logger.warn("The file {0} was already removed or does not exist.".format(full_file_download_path))
    instance.delete_notifications()


@receiver(post_delete, sender=ExportRunFile)
def export_run_file_delete(sender, instance, using, **kwargs):
    instance.file.delete(save=False)
