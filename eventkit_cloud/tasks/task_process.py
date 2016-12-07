from billiard import Process
import subprocess
from inspect import getcallargs

import logging

logger = logging.getLogger(__name__)


class TaskProcess(object):
    """Wraps a Task subprocess up and handles logic specifically for the application.
    If the child process calls other subprcesses use billiard.
    Note, unlike multi-use process classes start and join/wait happen during instantiation."""

    def __init__(self, task_uid=None):
        self.task_uid = task_uid
        self.exitcode = None
        self.stdout = None
        self.stderr = None

    def start_process(self, command=None, billiard=False, *args, **kwargs):
        if billiard:
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
        if self.exitcode != 0:
            if not self.task_uid:
                return
            from .models import ExportTask
            from ..tasks.export_tasks import TaskStates
            export_task = ExportTask.objects.get(uid=self.task_uid)
            if export_task.status == TaskStates.CANCELLED.value:
                from ..tasks.exceptions import CancelException
                raise CancelException(task_name=export_task.export_provider_task.name,
                                      user_name=export_task.cancel_user.username)

    def store_pid(self, pid=None):
        """

        :param pid: A pid (integer) to store in the Export Task
        :return: None
        """
        if pid:
            if not self.task_uid:
                return
            from ..tasks.models import ExportTask
            export_task = ExportTask.objects.get(uid=self.task_uid)
            export_task.pid = pid
            export_task.save()
