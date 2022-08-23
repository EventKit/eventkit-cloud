import logging

from django.db.models.signals import pre_delete
from django.dispatch.dispatcher import receiver

from eventkit_cloud.tasks.models import ExportRun, FileProducingTaskResult
from eventkit_cloud.utils.s3 import delete_from_s3

logger = logging.getLogger(__file__)


@receiver(pre_delete, sender=ExportRun)
def exportrun_delete_exports(sender, instance, *args, **kwargs):
    """
    Delete the associated export files and notifications when an ExportRun is deleted.
    """
    runs = instance.job.runs.all().order_by("-created_at")
    instance.job.last_export_run = runs[1] if len(runs) > 1 else None
    instance.job.save()
    delete_from_s3(run_uid=str(instance.uid))
    instance.delete_notifications()


@receiver(pre_delete, sender=FileProducingTaskResult)
def exporttaskresult_delete_exports(sender, instance, *args, **kwargs):
    """
    Delete associated files when deleting the FileProducingTaskResult.
    """
    instance.delete_notifications()
