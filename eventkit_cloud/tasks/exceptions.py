class CancelException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, task_uid, message=None, *args):
        """

        :param message: A nondefault message
        :param task_uid: Task_uid to look up user and task name.
        :param args:
        """
        from .models import ExportTask
        self.message = message  # without this you may get DeprecationWarning
        if not self.message:
            if task_uid:
                export_task = ExportTask.objects.get(uid=task_uid)
                message = "{0} was cancelled by {1}.".format(export_task.export_provider_task.name, export_task.cancel_user.name)

        # allow users initialize misc. arguments as any other builtin Error
        super(CancelException, self).__init__(message, *args)
