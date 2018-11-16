from eventkit_cloud.tasks.models import ExportRun
from datetime import timedelta, datetime


def meters_to_sq_km(meters):
    return meters / 1000000


def get_duration(time_tracking_model):
    """
    The duration in seconds
    :param time_tracking_model: A model that has finished_at and started_at properties.
    :return: Time in seconds (float).
    """

    time = (getattr(time_tracking_model, 'finished_at', datetime(0)) - getattr(time_tracking_model, 'started_at',
                                                                                datetime(0))).seconds
    if time:
        return time


def get_averages(run_uids=None):
    if run_uids:
        runs = ExportRun.objects.filter(uids__in=run_uids)
    else:
        runs = ExportRun.objects.all()

    # optimize
    runs = runs.select_related('user').prefetch_related('job__provider_tasks__provider',
                                                        'job__provider_tasks__formats',
                                                        'provider_tasks__tasks__result',
                                                        'provider_tasks__tasks__exceptions')

    times = {}
    for run in runs:
        area = meters_to_sq_km(run.job.the_geom_webmercator.area)
        for provider_task in run.provider_tasks.all():
            if not times.get(provider_task.slug):
                times[provider_task.slug] = []
            # Seconds per kilometer
            duration = get_duration(provider_task)
            if duration:
                times[provider_task.slug] += [duration/area]

    for provider_task, times in times.items():
        print(provider_task)
        print(str(timedelta(seconds=sum(times))))

