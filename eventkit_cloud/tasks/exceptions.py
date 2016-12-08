class CancelException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, message=None, task_name=None, user_name=None, *args, **kwargs):
        """

        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        from .models import ExportTask
        self.message = message  # without this you may get DeprecationWarning
        if not self.message:
                self.message = "{0} was cancelled by {1}.".format(task_name, user_name)
        super(CancelException, self).__init__(self.message, *args, **kwargs)
