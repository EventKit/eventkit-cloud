# -*- coding: utf-8 -*-
import copy
import datetime
import json
import os
import socket
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from typing import Union

from celery.utils.log import get_task_logger
from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.mail import EmailMultiAlternatives
from django.core.management import call_command
from django.db.models import Q
from django.template.loader import get_template
from django.utils import timezone
from requests import Response

from eventkit_cloud.auth.models import UserSession
from eventkit_cloud.celery import app
from eventkit_cloud.core.helpers import NotificationLevel, NotificationVerb, sendnotification
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.export_tasks import pick_up_run_task
from eventkit_cloud.tasks.helpers import delete_rabbit_objects, get_all_rabbitmq_objects, list_to_dict
from eventkit_cloud.tasks.models import ExportRun, ExportTaskRecord
from eventkit_cloud.tasks.task_base import EventKitBaseTask, LockingTask
from eventkit_cloud.tasks.util_tasks import kill_workers
from eventkit_cloud.utils.scaling.scale_client import ScaleClient
from eventkit_cloud.utils.scaling.util import get_scale_client
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


@app.task(name="Clean Up Stuck Tasks", base=LockingTask)
def clean_up_stuck_tasks():
    if not settings.TASK_TIMEOUT:
        return

    # Celery should clean up tasks automatically so add a buffer to let that happen.
    task_timeout = settings.TASK_TIMEOUT + 120
    client, app_name = get_scale_client()
    time_threshold = datetime.datetime.now(timezone.utc) - datetime.timedelta(seconds=task_timeout)
    export_task_records = (
        ExportTaskRecord.objects.prefetch_related("export_provider_task__tasks")
        .select_related("export_provider_task__run")
        .filter(Q(status=TaskState.RUNNING.value) & Q(started_at__lt=time_threshold))
    )
    run_uids = []
    for export_task_record in export_task_records:
        run = export_task_record.export_provider_task.run
        run_uids.append(str(run.uid))

        # Cancel the export task records that are over the timeout
        export_task_record.status = TaskState.CANCELED.value
        export_task_record.save()

        # Update DPTR to pending so that it can get picked up again
        data_provider_task_record = export_task_record.export_provider_task
        data_provider_task_record.status = TaskState.PENDING.value
        data_provider_task_record.save()

        # Update run to submitted so that it can get picked up again.
        run.status = TaskState.SUBMITTED.value
        run.save()

    kill_workers(run_uids, client)


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
    """
    @param max_tasks_memory: The amount of memory in MB to allow for all of the tasks.
    @type max_tasks_memory: int
    """
    from audit_logging.utils import get_user_details

    client, app_name = get_scale_client()

    celery_task_details = get_celery_task_details(client, app_name)
    running_tasks_memory = int(celery_task_details["memory"])
    celery_tasks = get_celery_tasks_scale_by_run()

    # Check if we need to scale for default system tasks.
    scale_default_tasks(client, app_name, celery_tasks)

    # Get run in progress
    runs = ExportRun.objects.filter(status=TaskState.SUBMITTED.value, deleted=False)
    total_tasks = 0
    running_tasks = client.get_running_tasks(app_name)
    logger.info(f"Running tasks: {running_tasks}")

    if running_tasks:
        total_tasks = running_tasks["pagination"].get("total_results", 0)
        # Get a list of running task names excluding the default celery tasks.
        running_task_names = [
            resource.get("name") for resource in running_tasks.get("resources") if resource.get("name") != "celery"
        ]
        finished_runs = ExportRun.objects.filter(
            Q(uid__in=running_task_names)
            & (Q(status__in=[state.value for state in TaskState.get_finished_states()]) | Q(deleted=True))
        )

        finished_run_uids = []
        for finished_run in finished_runs:
            logger.info(
                f"Stopping {finished_run.uid} because it is in a finished state ({finished_run.status}) "
                f"or was deleted ({finished_run.deleted})."
            )
            finished_run_uids.append(str(finished_run.uid))
        kill_workers(task_names=finished_run_uids, client=client)

    for run in runs:
        celery_run_task = copy.deepcopy(celery_tasks["run"])

        logger.info(f"Checking to see if submitted run {run.uid} needs a new worker.")
        max_runs = int(os.getenv("RUNS_CONCURRENCY", 3))

        if max_runs and total_tasks >= max_runs:
            logger.info(f"total_tasks ({total_tasks}) >= max_runs ({max_runs})")
            break
        if running_tasks_memory + celery_run_task["memory"] >= max_tasks_memory:
            logger.info("Not enough available memory to scale another run.")
            break
        task_name = run.uid

        running_tasks_by_queue = client.get_running_tasks(app_name, task_name)
        running_tasks_by_queue_count = running_tasks_by_queue["pagination"].get("total_results", 0)

        logger.info(f"Currently {running_tasks_by_queue_count} tasks running for {task_name}.")
        if running_tasks_by_queue_count:
            logger.info(f"Already a consumer for {task_name}")
            continue
        user_session = UserSession.objects.filter(user=run.user).last()
        session_token = None
        if user_session:
            session = Session.objects.get(session_key=user_session.session_id)
            session_token = session.get_decoded().get("session_token")

        user_details = get_user_details(run.user)
        pick_up_run_task.s(run_uid=str(run.uid), session_token=session_token, user_details=user_details).apply_async(
            queue=str(task_name), routing_key=str(task_name)
        )
        celery_run_task["command"] = celery_run_task["command"].format(celery_group_name=task_name)
        run_task_command(client, app_name, str(task_name), celery_run_task)
        # Keep track of new resources being used.
        total_tasks += 1
        running_tasks_memory += celery_run_task["memory"]


def scale_default_tasks(client, app_name, celery_tasks):
    broker_api_url = settings.CELERY_BROKER_API_URL
    queues = get_all_rabbitmq_objects(broker_api_url, "queues")
    queue = queues.get("celery") or {}
    queue_name = queue.get("name")
    pending_messages = queue.get("messages", 0)
    logger.info(f"Queue {queue_name} has {pending_messages} pending messages.")

    running_default_tasks = client.get_running_tasks(app_name, "celery")
    total_default_tasks = running_default_tasks["pagination"].get("total_results", 0)
    logger.info("Running default tasks: {}".format(running_default_tasks))
    if pending_messages and total_default_tasks < celery_tasks["celery"].get("limit", 0):
        logger.info(f"Scaling up a worker for queue {queue_name}.")
        celery_run_task = copy.deepcopy(celery_tasks["celery"])
        run_task_command(client, app_name, "celery", celery_run_task)
        logger.info("Running default tasks: {}".format(running_default_tasks))
    elif total_default_tasks and not pending_messages:
        kill_workers(["celery"], client)


def scale_by_tasks(celery_tasks, max_tasks_memory):

    client, app_name = get_scale_client()

    broker_api_url = settings.CELERY_BROKER_API_URL
    queue_class = "queues"

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
        dicts = list_to_dict(queues, "name")
        # If no tasks were run, give up... otherwise try to run another task.
        has_run_task = False
        running_tasks = client.get_running_tasks(app_name)
        if not any([queue.get("messages", 0) for queue_name, queue in dicts.items()]):
            running_task_names = []
            for running_task in running_tasks.get("resources"):
                running_task_name = running_task.get("name")
                running_task_names.append(running_task_name)
                logger.info(f"No messages left in the queue, shutting down {running_task_name}.")
            kill_workers(task_names=running_task_names, client=client)
            break

        queues_to_kill = []
        for celery_task_name, celery_task in celery_tasks.items():
            queue = dicts.get(celery_task_name)
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
                    f"The {queue_name} has no messages, but has running_tasks_by_queue_count. Scheduling shutdown..."
                )
                queues_to_kill.append(queue_name)
            else:
                if running_tasks_by_queue_count:
                    logger.info(
                        f"Already {running_tasks_by_queue_count} workers, processing {pending_messages} total pending "
                        f"messages left in {queue_name} queue."
                    )

            running_tasks_memory = client.get_running_tasks_memory(app_name)
            kill_workers(queues_to_kill, client)

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


def run_task_command(client: ScaleClient, app_name: str, queue_name: str, task: dict):
    """
    :param client: A Pcf Client object.
    :param app_name: The name of the pcf application to send the task to.
    :param queue_name: Name of queue to scale.
    :param task:A dict containing the command, memory, and disk for the task to run.
    :return: None
    """
    command = task["command"]
    disk = task["disk"]
    memory = task["memory"]

    logger.info(f"Sending task to {app_name} with command {command} with {disk} disk and {memory} memory")
    client.run_task(name=queue_name, command=command, disk_in_mb=disk, memory_in_mb=memory, app_name=app_name)


@app.task(
    name="Check Provider Availability",
    base=EventKitBaseTask,
    expires=timezone.now() + timezone.timedelta(minutes=int(os.getenv("PROVIDER_CHECK_INTERVAL", "30"))),
)
def check_provider_availability_task():
    from eventkit_cloud.jobs.models import DataProvider, DataProviderStatus

    for provider in DataProvider.objects.all():
        status = provider.check_status()
        data_provider_status = DataProviderStatus.objects.create(related_provider=provider)
        data_provider_status.last_check_time = datetime.datetime.now()
        try:
            data_provider_status.status = status["status"]
            data_provider_status.status_type = status["type"]
            data_provider_status.message = status["message"]
            data_provider_status.save()
        except Exception as e:
            logger.error(f"Cannot read index from {status}")
            if isinstance(status, Response):
                logger.error(f"Status content: {status.content}")  # type: ignore
            raise e


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
    api_url = settings.CELERY_BROKER_API_URL
    delete_rabbit_objects(api_url, rabbit_classes=["queues", "exchanges"])


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

    health_check_command = (
        " & sleep 30;"
        f"while celery -A eventkit_cloud inspect --timeout=20 --destination={node_type}@$HOSTNAME ping >/dev/null 2>&1;"
        "do sleep 60; done; echo At least one $HOSTNAME worker is dead! Killing Task...; pkill celery"
    )

    return health_check_command


def get_celery_tasks_scale_by_run():
    default_command = (
        "echo '************STARTING NEW WORKER****************' && hostname && echo {celery_group_name} & "
        "CELERY_GROUP_NAME={celery_group_name} exec celery -A eventkit_cloud worker --concurrency=1 "
        "--loglevel=$LOG_LEVEL -n large@%h -Q {celery_group_name}.large "
        "& CELERY_GROUP_NAME={celery_group_name} exec celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL "
        "-n priority@%h -Q {celery_group_name}.priority,$HOSTNAME.priority & CELERY_GROUP_NAME={celery_group_name} "
        "exec celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n worker@%h -Q {celery_group_name}"
    )

    celery_tasks = {
        "run": {
            "command": default_command,
            # NOQA
            "disk": int(os.getenv("CELERY_TASK_DISK", 12288)),
            "memory": int(os.getenv("CELERY_TASK_MEMORY", 8192)),
        },
        "celery": {
            "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n celery@%h -Q celery,celery.priority "
            + get_celery_health_check_command("celery"),
            "disk": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_DISK_SIZE"]),
            "memory": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_MEMORY_SIZE"]),
            "limit": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_MAX_DEFAULT_TASKS"]),
        },
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

    priority_queue_command = " & exec celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL --concurrency=1 -n priority@%h -Q $CELERY_GROUP_NAME.priority,$HOSTNAME.priority"  # NOQA

    celery_tasks = OrderedDict(
        {
            f"{celery_group_name}": {
                "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n worker@%h -Q $CELERY_GROUP_NAME "
                + priority_queue_command
                + get_celery_health_check_command("worker"),
                # NOQA
                "disk": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_DISK_SIZE"]),
                "memory": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_MEMORY_SIZE"]),
            },
            f"{celery_group_name}.large": {
                "command": "celery -A eventkit_cloud worker --concurrency=1 --loglevel=$LOG_LEVEL -n large@%h -Q $CELERY_GROUP_NAME.large "  # NOQA
                + priority_queue_command
                + get_celery_health_check_command("large"),
                # NOQA
                "disk": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_DISK_SIZE"]),
                "memory": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_MEMORY_SIZE"]) * 2,
            },
            "celery": {
                "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n celery@%h -Q celery "
                + priority_queue_command
                + get_celery_health_check_command("celery"),
                "disk": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_DISK_SIZE"]),
                "memory": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_MEMORY_SIZE"]),
                "limit": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_MAX_DEFAULT_TASKS"]),
            },
            f"{celery_group_name}.priority": {
                "command": "celery -A eventkit_cloud worker --loglevel=$LOG_LEVEL -n priority@%h -Q $CELERY_GROUP_NAME.priority "  # NOQA
                + get_celery_health_check_command("priority"),  # NOQA
                # NOQA
                "disk": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_DISK_SIZE"]),
                "memory": int(settings.CELERY_DEFAULT_TASK_SETTINGS["CELERY_DEFAULT_MEMORY_SIZE"]),
                "limit": 2,
            },
        }
    )

    celery_tasks = json.loads(os.getenv("CELERY_TASKS", "{}")) or celery_tasks

    return celery_tasks
