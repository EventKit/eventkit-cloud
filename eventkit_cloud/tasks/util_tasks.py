from celery import Task
from celery.app import app_or_default

from eventkit_cloud.celery import app
from audit_logging.celery_support import UserDetailsBase


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


@app.task(name="Get Estimates", base=UserDetailsBase, default_retry_delay=60)
def get_estimates_task(run_uid, data_provider_task_uid, data_provider_task_record_uid):
    from eventkit_cloud.utils.stats.aoi_estimators import AoiEstimator  # NOQA
    from eventkit_cloud.jobs.models import DataProviderTask  # NOQA
    from eventkit_cloud.tasks.models import ExportRun, DataProviderTaskRecord  # NOQA

    run = ExportRun.objects.get(uid=run_uid)
    provider_task = DataProviderTask.objects.get(uid=data_provider_task_uid)

    estimator = AoiEstimator(run.job.extents)
    estimated_size, meta_s = estimator.get_estimate(estimator.Types.SIZE, provider_task.provider)
    estimated_duration, meta_t = estimator.get_estimate(estimator.Types.TIME, provider_task.provider)
    data_provider_task_record = DataProviderTaskRecord.objects.get(uid=data_provider_task_record_uid)
    data_provider_task_record.estimated_size = estimated_size
    data_provider_task_record.estimated_duration = estimated_duration
    data_provider_task_record.save()
