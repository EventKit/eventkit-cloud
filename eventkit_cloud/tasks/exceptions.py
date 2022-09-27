class CancelException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, message: str = None, task_name=None, user_name="system", filename=None, *args, **kwargs):
        """

        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        self.filename = filename
        if not self.message:
            self.message = f"{task_name} was canceled by {user_name}."
        super(CancelException, self).__init__(self.message, *args, **kwargs)


class DeleteException(Exception):
    """Used to indicate when a user calls for cancellation."""

    def __init__(self, message: str = None, task_name=None, user_name=None, filename=None, *args, **kwargs):
        """

        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        self.filename = filename
        if not self.message:
            self.message = f"{task_name} was deleted by {user_name}."
        super(DeleteException, self).__init__(self.message, *args, **kwargs)


class FailedException(Exception):
    """Used to indicate when a task has failed too many times."""

    def __init__(self, message: str = None, task_name=None, *args, **kwargs):
        """
        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        if not self.message:
            self.message = f"{task_name} has failed too many times and will not be retried."
        super(FailedException, self).__init__(self.message, *args, **kwargs)


class AreaLimitExceededError(Exception):
    """Used to indicate an area is too large."""

    def __init__(self, message: str = None, bbox: list[float] = None, *args, **kwargs):
        """
        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        self.bbox = bbox
        if not self.message:
            self.message = f"The requested boundary {self.bbox} was too large."

        super(AreaLimitExceededError, self).__init__(self.message, *args, **kwargs)


class TooManyRequestsError(Exception):
    """Used to indicate an area is too large."""

    def __init__(self, message: str = None, service_name=None, *args, **kwargs):
        """
        :param message: A non-default message
        :param task_uid: Task_uid to look up user and task name.
        """
        self.message = message  # without this you may get DeprecationWarning
        if not self.message:
            if service_name:
                self.message = f"Too many requests were made to the {service_name} service."
            else:
                self.message = "Too many requests were made to the service."

        super(TooManyRequestsError, self).__init__(self.message, *args, **kwargs)
