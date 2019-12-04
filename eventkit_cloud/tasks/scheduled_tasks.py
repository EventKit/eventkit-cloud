# -*- coding: utf-8 -*-
import datetime
import json
import os
import socket

from celery.utils.log import get_task_logger
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import get_template
from django.utils import timezone

from eventkit_cloud.celery import app
from eventkit_cloud.tasks.helpers import get_all_rabbitmq_objects, get_message_count

logger = get_task_logger(__name__)


# Seems redundant to expire_runs, if not needed should be deleted for 1.0.0
# @app.task(name='Purge Unpublished Exports')
# def PurgeUnpublishedExportsTask():
#     """
#     Purge unpublished export tasks after 48 hours.
#     """
#     from eventkit_cloud.jobs.models import Job
#     time_limit = timezone.now() - timezone.timedelta(hours=48)
#     expired_jobs = Job.objects.filter(created_at__lt=time_limit, published=False)
#     count = expired_jobs.count()
#     logger.debug('Purging {0} unpublished exports.'.format(count))
#     expired_jobs.delete()


@app.task(name='Expire Runs')
def expire_runs():
    """
    Checks all runs.
    Expires all runs older than 2 weeks,
    Emails users one week before scheduled expiration time
    and 2 days before schedule expiration time.
    """
    from eventkit_cloud.tasks.models import ExportRun
    site_url = getattr(settings, "SITE_URL")
    runs = ExportRun.objects.all()

    for run in runs:
        expiration = run.expiration
        email = run.user.email
        if not email:
            break
        uid = run.job.uid
        url = '{0}/status/{1}'.format(site_url.rstrip('/'), uid)
        notified = run.notified
        now = timezone.now()
        # if expired delete the run:
        if expiration <= now:
            run.delete()

        # if two days left and most recent notification was at the 7 day mark email user
        elif expiration - now <= timezone.timedelta(days=2):
            if not notified or (notified and notified < expiration - timezone.timedelta(days=2)):
                send_warning_email(date=expiration, url=url, addr=email, job_name=run.job.name)
                run.notified = now
                run.save()

        # if one week left and no notification yet email the user
        elif expiration - now <= timezone.timedelta(days=7) and not notified:
            send_warning_email(date=expiration, url=url, addr=email, job_name=run.job.name)
            run.notified = now
            run.save()


@app.task(name="PCF Scale Celery")
def pcf_scale_celery(max_tasks_memory):
    """
    Built specifically for PCF deployments.
    Scales up celery instances when necessary.
    """
    from eventkit_cloud.utils.pcf import PcfClient
    from eventkit_cloud.tasks.models import ExportRun

    if os.getenv('CELERY_TASK_APP'):
        app_name = os.getenv('CELERY_TASK_APP')
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    celery_group_name = os.getenv("CELERY_GROUP_NAME", socket.gethostname())

    celery_tasks = {
        celery_group_name: {
            "command": "celery worker -A eventkit_cloud --concurrency=$CONCURRENCY --loglevel=$LOG_LEVEL -n worker@%h -Q $CELERY_GROUP_NAME ",
            "disk": "1500MB",
            "memory": "250MB"
        },
        "celery": {
            "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery ",
            "disk": "1500MB",
            "memory": "250MB"
        },
        f"{celery_group_name}.osm": {
            "command": "celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n osm@%h -Q $CELERY_GROUP_NAME.osm ",
            "disk": "1500MB",
            "memory": "2000MB"
        },
        f"{celery_group_name}.finalize": {
            "command": "celery worker -A eventkit_cloud --concurrency=2 -n finalize@%h -Q $CELERY_GROUP_NAME.finalize ",
            "disk": "1500MB",
            "memory": "250MB"
        }
    }
    cancel_queue_command = "& exec celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n cancel@%h -Q $HOSTNAME.cancel"

    broker_api_url = getattr(settings, 'BROKER_API_URL')
    queue_class = "queues"

    client = PcfClient()
    client.login()

    running_tasks = client.get_running_tasks(app_name)
    running_tasks_memory = 0
    for task in running_tasks["resources"]:
        running_tasks_memory += task["memory_in_mb"]

    # Check to see if there is work that we care about and if so, scale a queue specific worker to do it.
    for queue in get_all_rabbitmq_objects(broker_api_url, queue_class):
        queue_name = queue.get('name')
        pending_messages = queue.get('messages', 0)
        if celery_group_name in queue_name or queue_name == "celery":
            logger.info(f"Queue {queue_name} has {pending_messages} pending messages.")
            running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
            if pending_messages > running_tasks_by_queue:
                if running_tasks_memory < max_tasks_memory:
                    command = celery_tasks[queue_name]["command"] + cancel_queue_command
                    disk = celery_tasks[queue_name]["disk"]
                    memory = celery_tasks[queue_name]["memory"]
                    logger.info(f"Sending task to {app_name} with command {command} with {disk} disk and {memory} memory")
                    client.run_task(name=queue_name, command=command, disk_in_mb=disk, memory_in_mb=memory, app_name=app_name)
                    running_tasks_memory += memory
                else:
                    logger.info(f"Already at max memory usage, skipping scale with {pending_messages} total pending messages left in {queue_name} queue.")


@app.task(name="Check Provider Availability")
def check_provider_availability():
    from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus
    from eventkit_cloud.utils.provider_check import perform_provider_check

    for provider in DataProvider.objects.all():
        status = json.loads(perform_provider_check(provider, None))
        data_provider_status = DataProviderStatus.objects.create(related_provider=provider)
        data_provider_status.last_check_time = datetime.datetime.now()
        data_provider_status.status = status['status']
        data_provider_status.status_type = status['type']
        data_provider_status.message = status['message']
        data_provider_status.save()


def send_warning_email(date=None, url=None, addr=None, job_name=None):
    """
    Args:
        date: A datetime object representing when the run will expire
        url: The url to the detail page of the export
        addr: The email address to which the email will be sent

    Returns: None
    """

    subject = "Your EventKit DataPack is set to expire."
    to = [addr]
    from_email = getattr(
        settings,
        'DEFAULT_FROM_EMAIL',
        'Eventkit Team <eventkit.team@gmail.com>'
    )
    ctx = {'url': url, 'date': str(date), 'job_name': job_name}

    text = get_template('email/expiration_warning.txt').render(ctx)
    html = get_template('email/expiration_warning.html').render(ctx)
    try:
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()
    except Exception as e:
        logger.error("Encountered an error when sending status email: {}".format(e))


@app.task(name='Clean Up Queues')
def clean_up_queues():
    broker_api_url = getattr(settings, 'BROKER_API_URL')
    queue_class = "queues"
    exchange_class = "exchanges"

    if not broker_api_url:
        logger.error("Cannot clean up queues without a BROKER_API_URL.")
        return
    with app.connection() as conn:
        channel = conn.channel()
        if not channel:
            logger.error("Could not establish a rabbitmq channel")
            return
        for queue in get_all_rabbitmq_objects(broker_api_url, queue_class):
            queue_name = queue.get('name')
            try:
                channel.queue_delete(queue_name, if_unused=True, if_empty=True)
                logger.info("Removed queue: {}".format(queue_name))
            except Exception as e:
                logger.info(e)
        for exchange in get_all_rabbitmq_objects(broker_api_url, exchange_class):
            exchange_name = exchange.get('name')
            try:
                channel.exchange_delete(exchange_name, if_unused=True)
                logger.info("Removed exchange: {}".format(exchange_name))
            except Exception as e:
                logger.info(e)