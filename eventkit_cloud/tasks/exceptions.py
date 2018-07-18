



class CancelException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, message=None, task_name=None, user_name=None, filename=None, *args, **kwargs):
        """

        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        self.filename = filename
        if not self.message:
                self.message = "{0} was canceled by {1}.".format(task_name, user_name)
        super(CancelException, self).__init__(self.message, *args, **kwargs)


class DeleteException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, message=None, task_name=None, user_name=None, filename=None, *args, **kwargs):
        """

        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        self.filename = filename
        if not self.message:
                self.message = "{0} was deleted by {1}.".format(task_name, user_name)
        super(DeleteException, self).__init__(self.message, *args, **kwargs)


class Error(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(message)


class Unauthorized(Error):
    def __init__(self, message):
        super(Error, self).__init__('Unauthorized: {0}'.format(message))


class InvalidLicense(Error):
    def __init__(self, message):
        super(Error, self).__init__('InvalidLicense: {0}'.format(message))