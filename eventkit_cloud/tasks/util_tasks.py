from celery import Task
from celery.app import app_or_default
from eventkit_cloud.celery import app

from eventkit_cloud.tasks.models import ExportTaskRecord, DataProviderTaskRecord


class RevokeTask(Task):
    def run(self, task_uid):
        pt = DataProviderTaskRecord.objects.filter(uid=task_uid).first()
        export_tasks = pt.tasks.all()
        app = app_or_default()

        for et in export_tasks:
            app.control.revoke(
                str(et.celery_uid),
                terminate=True,
                signal='SIGKILL'
            )

            et.status = 'CANCELED'
            et.save()

        pt.status = 'CANCELED'
        pt.save()
app.register_task(RevokeTask())
