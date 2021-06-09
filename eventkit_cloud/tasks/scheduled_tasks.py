# -*- coding: utf-8 -*-
import copy
import datetime
import json
import os
import socket
import uuid
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from typing import Union

from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.mail import EmailMultiAlternatives
from django.core.management import call_command
from django.template.loader import get_template
from django.utils import timezone

from eventkit_cloud.auth.models import UserSession
from eventkit_cloud.celery import app
from eventkit_cloud.core.helpers import (
    sendnotification,
    NotificationVerb,
    NotificationLevel,
)
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.export_tasks import pick_up_run_task
from eventkit_cloud.tasks.helpers import get_all_rabbitmq_objects, delete_rabbit_objects, get_message_count
from eventkit_cloud.tasks.models import ExportRun
from eventkit_cloud.tasks.task_base import LockingTask, EventKitBaseTask
from eventkit_cloud.tasks.util_tasks import shutdown_celery_workers
from eventkit_cloud.utils.docker_client import DockerClient
from eventkit_cloud.utils.pcf import PcfClient
from eventkit_cloud.utils.stats.generator import update_all_statistics_caches

logger = get_task_logger(__name__)


@app.task(name="Expire Runs", base=EventKitBaseTask)
def expire_runs_task():
    """
    Checks all runs.
    Expires all runs older than 2 weeks,
    Emails users one week before scheduled expiration time
    and 2 days before schedule expiration time.
    """
    from eventkit_cloud.tasks.models import ExportRun

    site_url = getattr(settings, "SITE_URL")
    runs = ExportRun.objects.filter(deleted=False)

    for run in runs:
        expiration = run.expiration
        email = run.user.email
        uid = run.job.uid
        url = "{0}/status/{1}".format(site_url.rstrip("/"), uid)
        notified = run.notified
        now = timezone.now()
        # if expired delete the run:
        if expiration <= now:
            run.soft_delete()

        # if two days left and most recent notification was at the 7 day mark email user
        elif expiration - now <= timezone.timedelta(days=2):
            if not notified or (notified and notified < expiration - timezone.timedelta(days=2)):
                sendnotification(
                    run,
                    run.job.user,
                    NotificationVerb.RUN_EXPIRING.value,
                    None,
                    None,
                    NotificationLevel.WARNING.value,
                    run.status,
                )
                if email:
                    send_warning_email(date=expiration, url=url, addr=email, job_name=run.job.name)
                run.notified = now
                run.save()

        # if one week left and no notification yet email the user
        elif expiration - now <= timezone.timedelta(days=7) and not notified:
            sendnotification(
                run,
                run.job.user,
                NotificationVerb.RUN_EXPIRING.value,
                None,
                None,
                NotificationLevel.WARNING.value,
                run.status,
            )
            if email:
                send_warning_email(date=expiration, url=url, addr=email, job_name=run.job.name)
            run.notified = now
            run.save()

# Get all runs that are not done from the database.  In progress or not started.
# Make sure that any in progress runs have an active listener.  If not, spin up the run and use that run uid.
# Otherwise grab the next run uid and spin up a new worker for it.
# Run uids vs. queues.  If there's a queue with that run uid with no listeners spin up a new one.
@app.task(name="Scale Celery", base=LockingTask)
def scale_celery_task(max_tasks_memory: int = 4096):  # NOQA
    """
    Built specifically for Docker or PCF deployments.
    Scales up celery instances when necessary.
    """

    # Check to see if there is work that we care about and if so, scale a queue specific worker to do it.
    if getattr(settings, "CELERY_SCALE_BY_RUN"):
        scale_by_runs(max_tasks_memory)
    else:
        celery_tasks = get_celery_tasks_scale_by_task()
        scale_by_tasks(celery_tasks, max_tasks_memory)


def scale_by_runs(max_tasks_memory):
    # Immediately return if there are no pending runs.
    broker_api_url = getattr(settings, "BROKER_API_URL")
    queue_class = "queues"

    print("Scaling By Runs")
    if os.getenv("CELERY_TASK_APP"):
        app_name = os.getenv("CELERY_TASK_APP")
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    if os.getenv("PCF_SCALING"):
        client = PcfClient()
        client.login()
    else:
        client = DockerClient()
        app_name = settings.DOCKER_IMAGE_NAME

    celery_task_details = get_celery_task_details(client, app_name)
    running_tasks_memory = int(celery_task_details['memory'])
    celery_task = get_celery_tasks_scale_by_run()
    # Get run in progress
    runs = ExportRun.objects.filter(status=TaskState.SUBMITTED.value, deleted=False)
    logger.error(f"Checking runs {runs}")

    total_tasks = 0
    running_tasks = client.get_running_tasks(app_name)
    if running_tasks:
        total_tasks = running_tasks["pagination"].get("total_results", 0)
        logger.error(f"RUNNING TASKS: {running_tasks}")
        running_task_names = [resource.get("name") for resource in running_tasks.get("resources")]
        logger.error(f"RUNNING TASK NAMES: {running_task_names}")
        finished_runs = ExportRun.objects.filter(uid__in=running_task_names, status=TaskState.get_finished_states())
        for finished_run in finished_runs:
            shutdown_celery_workers(finished_run.uid)
    for run in runs:
        logger.error(f"Checking to see if submitted run {run.uid} needs a new worker.")
        max_runs = int(os.getenv("RUNS_CONCURRENCY", 3))
        if max_runs and total_tasks >= max_runs:
            logger.error(f"The maximum amount of tasks ({max_runs})")
            break
        logger.error(f"{running_tasks_memory} + {celery_task['memory']} < {max_tasks_memory}")
        if running_tasks_memory + celery_task['memory'] >= max_tasks_memory:
            logger.info("Not enough available memory to scale another run.")
            break
        task_name = run.uid
        task = copy.deepcopy(celery_task)
        task["command"] = task["command"].format(celery_group_name=task_name)

        running_tasks_by_queue = client.get_running_tasks(app_name, task_name)
        running_tasks_by_queue_count = running_tasks_by_queue["pagination"].get("total_results", 0)

        logger.error(f"Currently {running_tasks_by_queue_count} tasks running for {task_name}.")
        if running_tasks_by_queue_count:
            logger.info(f"Already a consumer for {task_name}")
            continue
        logger.info(f"Running pick up run for {task_name}")
        user_session = UserSession.objects.filter(user=run.user).last()
        session_token = None
        if user_session:
            session = Session.objects.get(session_key=user_session.session_id)
            session_token = session.get_decoded().get("session_token")
        pick_up_run_task(run_uid=run.uid, session_token=session_token)
        logger.info("Spinning up a worker to complete those tasks...")
        logger.info(f"Running task command with client: {client}, app_name: {app_name}, run.uid: {run.uid}, and task: {task}")
        run_task_command(client, app_name, str(task_name), task)
        total_tasks += 1


def scale_by_tasks(celery_tasks, max_tasks_memory):
    if os.getenv("CELERY_TASK_APP"):
        app_name = os.getenv("CELERY_TASK_APP")
    else:
        app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")

    broker_api_url = getattr(settings, "BROKER_API_URL")
    queue_class = "queues"

    client = PcfClient()
    client.login()

    celery_pcf_task_details = get_celery_task_details(client, app_name, celery_tasks)

    logger.info(f"Running Tasks Memory used: {celery_pcf_task_details['memory']} MB")

    celery_tasks = order_celery_tasks(celery_tasks, celery_pcf_task_details["task_counts"])

    # we don't want to exceed our memory but we also don't want to prevent tasks that _can_ run from running.
    smallest_memory_required = int(min([v["memory"] for k, v in celery_tasks.items()])) or 0
    logger.info(f"smallest_memory_required: {smallest_memory_required}")
    logger.info(f"max_tasks_memory: {max_tasks_memory}")
    running_tasks_memory = celery_pcf_task_details["memory"]
    while running_tasks_memory + smallest_memory_required <= max_tasks_memory:
        queues = get_all_rabbitmq_objects(broker_api_url, queue_class)
        queues = list_to_dict(queues, "name")
        # If no tasks were run, give up... otherwise try to run another task.
        has_run_task = False
        if not any([queue.get("messages", 0) for queue_name, queue in queues.items()]):
            break
        for celery_task_name, celery_task in celery_tasks.items():
            queue = queues.get(celery_task_name)
            if not queue:
                continue
            queue_name = queue.get("name")
            pending_messages = queue.get("messages", 0)
            if pending_messages:
                logger.info(f"Queue {queue_name} has {pending_messages} pending messages.")
            # Get updated information...
            running_tasks_by_queue = client.get_running_tasks(app_name, queue_name)
            running_tasks_by_queue_count = running_tasks_by_queue["pagination"].get("total_results", 0)
            if pending_messages > running_tasks_by_queue_count:
                # Allow queues to have a limit, so that we don't spin up 30 priority queues.
                limit = celery_task.get("limit")
                if limit:
                    if running_tasks_by_queue_count >= limit:
                        continue
                if running_tasks_memory + celery_tasks[queue_name]["memory"] <= max_tasks_memory:
                    run_task_command(client, app_name, queue_name, celery_tasks[queue_name])
            elif running_tasks_by_queue_count and not pending_messages:
                logger.info(
                    f"The {queue_name} has no messages, but has running_tasks_by_queue_count. Sending shutdown..."
                )
                shutdown_celery_workers.s(queue_name).apply_async(queue=queue_name, routing_key=queue_name)
            else:
                if running_tasks_by_queue_count:
                    logger.info(
                        f"Already {running_tasks_by_queue_count} workers, processing {pending_messages} total pending "
                        f"messages left in {queue_name} queue."
                    )
            running_tasks_memory = client.get_running_tasks_memory(app_name)
        if not has_run_task:
            break


def get_celery_task_details(client, app_name: str, celery_tasks: Union[dict, list] = None):
    """
    Gets information about currently running tasks.
    :param client:
    :param app_name: The name of the celery app running the tasks.
    :param celery_tasks: A dictionary with information about the celery tasks.
    :return: A dict of information with task counts and resource usage.
        example: {"task_counts": {celery': 1, "group_a": 0 ...}, "memory": 2048, "disk": 2048}
    """
    running_tasks = client.get_running_tasks(app_name)
    total_memory = 0
    total_disk = 0
    task_counts = dict.fromkeys(celery_tasks, 0) if celery_tasks else {}
    for running_task in running_tasks["resources"]:
        total_memory += running_task["memory_in_mb"]
        total_disk += running_task["disk_in_mb"]
        running_task_name = running_task["name"]
        if running_task_name in task_counts:
            task_counts[running_task_name] += 1
    return {"task_counts": task_counts, "memory": total_memory, "disk": total_disk}


def order_celery_tasks(celery_tasks, task_counts):
    """Ensure at least one task is running."""
    ordered_tasks = OrderedDict()
    # Add celery tasks information that have no running tasks...
    for celery_task_name in celery_tasks.keys():
        if task_counts[celery_task_name] == 0:
            ordered_tasks[celery_task_name] = celery_tasks[celery_task_name]
    # Then add the rest.
    ordered_tasks.update(celery_tasks)
    return ordered_tasks


def run_task_command(client: PcfClient, app_name: str, queue_name: str, task: dict):
    """
    :param client: A Pcf Client object.
    :param app_name: The name of the pcf application to send the task to.
    :param queue_name: Name of queue to scale.
    :param task:A dict containing the command, memory, and disk for the task to run.
    :return: None
    """
    print(f"RUN TASK COMMAND TASK DICT: {task}")
    command = task["command"]
    disk = task["disk"]
    memory = task["memory"]

    # TODO: Is queue_name really the right term here?
    logger.info(f"Sending task to {app_name} with command {command} with {disk} disk and {memory} memory")
    client.run_task(name=queue_name, command=command, disk_in_mb=disk, memory_in_mb=memory, app_name=app_name)


def list_to_dict(list_to_convert: dict, key_name: str):
    """
    USed to convert a list of dictionaries to a dictionary using some common properties (i.e. name)
    Careful as data will be lost for duplicate entries, this assumes the list is a "set".
    :param list_to_convert: A list of dictionaries
    :param key_name: A value from each dict to use as the key.
    :return: A dictionary.
    """
    converted_dict = dict()
    if list_to_convert:
        for item in list_to_convert:
            converted_dict[item[key_name]] = item
    return converted_dict


@app.task(
    name="Check Provider Availability",
    base=EventKitBaseTask,
    expires=timezone.now() + timezone.timedelta(minutes=int(os.getenv("PROVIDER_CHECK_INTERVAL", "30"))),
)
def check_provider_availability_task():
    from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus
    from eventkit_cloud.utils.provider_check import perform_provider_check

    for provider in DataProvider.objects.all():
        status = json.loads(perform_provider_check(provider, None))
        data_provider_status = DataProviderStatus.objects.create(related_provider=provider)
        data_provider_status.last_check_time = datetime.datetime.now()
        data_provider_status.status = status["status"]
        data_provider_status.status_type = status["type"]
        data_provider_status.message = status["message"]
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
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Eventkit Team <eventkit.team@gmail.com>")
    ctx = {"url": url, "date": str(date), "job_name": job_name}

    text = get_template("email/expiration_warning.txt").render(ctx)
    html = get_template("email/expiration_warning.html").render(ctx)
    try:
        msg = EmailMultiAlternatives(subject, text, to=to, from_email=from_email)
        msg.attach_alternative(html, "text/html")
        msg.send()
    except Exception as e:
        logger.error("Encountered an error when sending status email: {}".format(e))


@app.task(name="Clean Up Queues", base=EventKitBaseTask)
def clean_up_queues_task():
    """Deletes all of the queues that don't have any consumers or messages"""
    api_url = getattr(settings, "BROKER_API_URL")
    delete_rabbit_objects(api_url)


@app.task(name="Clear Tile Cache", base=EventKitBaseTask)
def clear_tile_cache_task():
    call_command("clear_tile_cache")


@app.task(name="Clear User Sessions", base=EventKitBaseTask)
def clear_user_sessions_task():
    call_command("clearsessions")


@app.task(name="Update Statistics Caches", base=EventKitBaseTask)
def update_all_statistics_caches_task():
    update_all_statistics_caches(executor=ThreadPoolExecutor)


def get_celery_health_check_command(node_type: str):
    """
    Constructs a health check command for celery workers.
    :param node_type: A string with the name of the node type to add to hostnames.
    """
    hostnames = ["priority@$HOSTNAME"]
    if node_type != "priority":
        hostnames.append(f"{node_type}@$HOSTNAME")

    ping_command = " && ".join(
        [f"celery inspect -A eventkit_cloud --timeout=20 --destination={hostname} ping" for hostname in hostnames]
    )
    health_check_command = (
        f" & sleep 30; while {ping_command} >/dev/null 2>&1; do sleep 60; done; "
        f"echo At least one $HOSTNAME worker is dead! Killing Task...; pkill celery"
    )

    return health_check_command


def get_celery_tasks_scale_by_run():
    default_command = "echo '************STARTING NEW WORKER****************' && hostname && env & CELERY_GROUP_NAME={celery_group_name} exec celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n large@%h -Q {celery_group_name}.large & CELERY_GROUP_NAME={celery_group_name} exec celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery & CELERY_GROUP_NAME={celery_group_name} exec celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n priority@%h -Q {celery_group_name}.priority,$HOSTNAME.priority & CELERY_GROUP_NAME={celery_group_name} exec celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n worker@%h -Q {celery_group_name}"

    celery_tasks = {
        "command": default_command,
        # NOQA
        "disk": int(os.getenv("CELERY_TASK_DISK", 12288)),
        "memory": int(os.getenv("CELERY_TASK_MEMORY", 8192))
    }

    celery_tasks = json.loads(os.getenv("CELERY_TASKS", "{}")) or celery_tasks

    return celery_tasks


def get_celery_tasks_scale_by_task():
    """
    Sets up a dict with settings for running about running PCF tasks for celery.
    Adding or modifying queues can be done here.
    :return:
    """
    celery_group_name = getattr(settings, "CELERY_GROUP_NAME", socket.gethostname())

    priority_queue_command = " & exec celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL --concurrency=1 -n priority@%h -Q $CELERY_GROUP_NAME.priority,$HOSTNAME.priority"  # NOQA

    celery_tasks = OrderedDict(
        {
            f"{celery_group_name}": {
                "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n worker@%h -Q $CELERY_GROUP_NAME "
                + priority_queue_command
                + get_celery_health_check_command("worker"),
                # NOQA
                "disk": 2048,
                "memory": 2048,
            },
            f"{celery_group_name}.large": {
                "command": "celery worker -A eventkit_cloud --concurrency=1 --loglevel=$LOG_LEVEL -n large@%h -Q $CELERY_GROUP_NAME.large "  # NOQA
                + priority_queue_command
                + get_celery_health_check_command("large"),
                # NOQA
                "disk": 2048,
                "memory": 4096,
            },
            "celery": {
                "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n celery@%h -Q celery "
                + priority_queue_command
                + get_celery_health_check_command("celery"),
                "disk": 2048,
                "memory": 2048,
                "limit": 6,
            },
            f"{celery_group_name}.priority": {
                "command": "celery worker -A eventkit_cloud --loglevel=$LOG_LEVEL -n priority@%h -Q $CELERY_GROUP_NAME.priority "  # NOQA
                + get_celery_health_check_command("priority"),  # NOQA
                # NOQA
                "disk": 2048,
                "memory": 2048,
                "limit": 2,
            },
        }
    )

    celery_tasks = json.loads(os.getenv("CELERY_TASKS", "{}")) or celery_tasks

    return celery_tasks
