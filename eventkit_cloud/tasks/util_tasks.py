from celery import Task
from celery.app import app_or_default

from eventkit_cloud.tasks.models import ExportTask


class RevokeTask(Task):
    def run(self, task_uid):
        export_task = ExportTask.objects.get(uid=task_uid)

        app = app_or_default()
        app.control.revoke(
            str(export_task.celery_uid),
            terminate=True,
            signal='SIGKILL'
        )

        export_task.status = 'CANCELED'
        export_task.save()
