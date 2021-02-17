from enum import Enum


class TaskState(Enum):
    COMPLETED = "COMPLETED"  # Used for runs when all tasks were successful
    INCOMPLETE = "INCOMPLETE"  # Used for runs when one or more tasks were unsuccessful
    SUBMITTED = "SUBMITTED"  # Used for runs that have not been started

    PENDING = "PENDING"  # Used for tasks that have not been started
    RUNNING = "RUNNING"  # Used for tasks that have been started
    CANCELED = "CANCELED"  # Used for tasks that have been CANCELED by the user
    SUCCESS = "SUCCESS"  # Used for tasks that have successfully completed
    FAILED = "FAILED"  # Used for tasks that have failed (an exception other than CancelException was thrown

    # or a non-zero exit code was returned.)

    @staticmethod
    def get_finished_states():
        return [
            TaskState.COMPLETED,
            TaskState.INCOMPLETE,
            TaskState.CANCELED,
            TaskState.SUCCESS,
            TaskState.FAILED,
        ]

    @staticmethod
    def get_incomplete_states():
        return [TaskState.FAILED, TaskState.INCOMPLETE, TaskState.CANCELED]

    @staticmethod
    def get_not_finished_states():
        return [TaskState.PENDING, TaskState.RUNNING, TaskState.SUBMITTED]
