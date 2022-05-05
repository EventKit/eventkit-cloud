import logging
import os

from celery import Celery
from enum import Enum

from celery.app.log import TaskFormatter
from celery.signals import after_setup_task_logger

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")


class TaskPriority(Enum):
    CANCEL = 99  # If cancel isn't higher than new tasks, long running processes will needlessly
    # take resources while the cancel message is blocked.
    FINALIZE_RUN = 90  # If a run is finished it should be cleaned up before starting new tasks.
    FINALIZE_PROVIDER = 80  # It is better to finalize a previous task before starting a new one so that the
    # processed file is made available to the user.
    RUN_TASK = 50  # Running tasks should be higher than picking up tasks
    DEFAULT = 0  # The default task priority in RabbitMQ is zero, so not having a priority is the same as
    # the the default, it is here to be explicit. https://www.rabbitmq.com/priority.html


app = Celery("eventkit_cloud")

app.config_from_object("django.conf:settings")
app.autodiscover_tasks()
app.autodiscover_tasks(related_name="debug_tasks")
app.autodiscover_tasks(related_name="export_tasks")
app.autodiscover_tasks(related_name="scheduled_tasks")

app.conf.task_protocol = 1

@after_setup_task_logger.connect
def setup_task_logger(logger, *args, **kwargs):
    from eventkit_cloud.core.log.context_filter import ContextFilter
    sh = logging.StreamHandler()
    sh.setFormatter(TaskFormatter(
            '[%(asctime)s] %{module}s - %{levelname}s - %(task_id)s - %(task_name)s - %(name)s'))
    logger.addHandler(sh)
    logger.setFilter(ContextFilter())