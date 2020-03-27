import logging
import subprocess

from billiard import Process
from django.db import connection
import collections

from eventkit_cloud.tasks import set_cache_value

logger = logging.getLogger(__name__)


class TaskProcess(object):
    """Wraps a Task subprocess up and handles logic specifically for the application.
    If the child process calls other subprcesses use billiard.
    Note, unlike multi-use process classes start and join/wait happen during instantiation."""

    def __init__(self, task_uid=None):
        from eventkit_cloud.tasks.models import ExportTaskRecord

        self.task_uid = task_uid
        self.exitcode = None
        self.stdout = None
        self.stderr = None
        self.export_task = ExportTaskRecord.objects.filter(uid=self.task_uid).first()

    def start_process(self, command=None, billiard=False, *args, **kwargs):
        from eventkit_cloud.tasks.enumerations import TaskStates

        if isinstance(command, collections.Callable):
            command()
        elif billiard:
            proc = Process(daemon=False, *args, **kwargs)
            proc.start()
            self.store_pid(pid=proc.pid)
            proc.join()
            self.exitcode = proc.exitcode
        else:
            proc = subprocess.Popen(command, **kwargs)
            (self.stdout, self.stderr) = proc.communicate()
            self.store_pid(pid=proc.pid)
            self.exitcode = proc.wait()

        # We need to close the existing connection because the logger could be using a forked process which,
        # will be invalid and throw an error.
        connection.close()

        if self.export_task and self.export_task.status == TaskStates.CANCELED.value:
            from eventkit_cloud.tasks.exceptions import CancelException

            raise CancelException(
                task_name=self.export_task.export_provider_task.name, user_name=self.export_task.cancel_user.username,
            )

    def store_pid(self, pid=None):
        """
        :param pid: A pid (integer) to store in the Export Task
        :return: None
        """
        if pid:
            if not self.task_uid:
                return
            if self.export_task:
                self.export_task.pid = pid
                self.export_task.save()


def update_progress(
    task_uid, progress=None, subtask_percentage=100.0, subtask_start=0, estimated_finish=None, eta=None, msg=None,
):
    """
    Updates the progress of the ExportTaskRecord from the given task_uid.
    :param task_uid: A uid to reference the ExportTaskRecord.
    :param progress: The percent of completion for the task or subtask [0-100]
    :param subtask_percentage: is the percentage of the task referenced by task_uid the caller takes up. [0-100]
    :param subtask_start: is the beginning of where this subtask's percentage block beings [0-100]
                          (e.g. when subtask_percentage=0.0 the absolute_progress=subtask_start)
    :param estimated_finish: The datetime of when the entire task is expected to finish, overrides eta estimator
    :param eta: The ETA estimator for this task will be used to automatically determine estimated_finish
    :param msg: Message describing the current activity of the task
    """
    if task_uid is None:
        return

    if not progress and not estimated_finish:
        return

    if progress is not None:
        subtask_progress = min(progress, 100.0)
        absolute_progress = min(subtask_start + subtask_progress * (subtask_percentage / 100.0), 100.0)

    # We need to close the existing connection because the logger could be using a forked process which
    # will be invalid and throw an error.
    connection.close()

    if absolute_progress:
        set_cache_value(
            uid=task_uid, attribute="progress", model_name="ExportTaskRecord", value=absolute_progress,
        )
        if eta is not None:
            eta.update(absolute_progress / 100.0, dbg_msg=msg)  # convert to [0-1.0]

    if estimated_finish:
        set_cache_value(
            uid=task_uid, attribute="estimated_finish", model_name="ExportTaskRecord", value=estimated_finish,
        )
    elif eta is not None:
        # Use the updated ETA estimator to determine an estimated_finish
        set_cache_value(
            uid=task_uid, attribute="estimated_finish", model_name="ExportTaskRecord", value=eta.eta_datetime(),
        )
