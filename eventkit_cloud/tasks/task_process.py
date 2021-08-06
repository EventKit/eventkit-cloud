import collections
import logging
import subprocess
from concurrent.futures import ThreadPoolExecutor

from django.db import connection

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

    def start_process(self, command=None, *args, **kwargs):
        from eventkit_cloud.tasks.enumerations import TaskState

        # We need to close the existing connection because the logger could be using a forked process which,
        # will be invalid and throw an error.
        connection.close()

        if isinstance(command, collections.Callable):
            with ThreadPoolExecutor() as executor:
                future = executor.submit(command)
                future.result()
        else:
            proc = subprocess.Popen(command, *args, **kwargs)
            (self.stdout, self.stderr) = proc.communicate()
            self.store_pid(pid=proc.pid)
            self.exitcode = proc.wait()

        if self.export_task and self.export_task.status == TaskState.CANCELED.value:
            from eventkit_cloud.tasks.exceptions import CancelException

            raise CancelException(
                task_name=self.export_task.export_provider_task.name,
                user_name=self.export_task.cancel_user.username,
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
