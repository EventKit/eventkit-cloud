class ScaleLimitError(Exception):
    """Raise when the application couldn't scale for all needed jobs."""

    pass


class TaskTerminationError(Exception):
    """Raise when something goes wrong while trying to terminate a task"""

    def __init__(self, message=None, task_name=None, *args, **kwargs):
        """
        :param message: A non-default message
        :param task_name: The name of the task that was unsuccessfully terminated
        """
        self.message = message
        if not self.message:
            if task_name:
                self.message = f"Failed to terminate task with name: {task_name}"
            else:
                self.message = "Failed to terminate task with unknown name"
        super(TaskTerminationError, self).__init__(self.message, *args, **kwargs)


class MultipleTaskTerminationErrors(TaskTerminationError):
    """Raise when multiple task termination errors occurred"""

    def __init__(self, errors: list[TaskTerminationError]) -> None:
        """
        :param errors: All of the task termination errors that occurred
        """
        self.errors = errors
        super().__init__(self.errors)

    def __str__(self) -> str:
        return "The following errors occurred while trying to terminate multiple tasks\n" + "\n".join(
            [str(err) for err in self.errors]
        )
