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


class OGC_Status(Enum):
    # finished status
    SUCCESSFUL = "successful"  # Used for when a job is completed successfully.
    FAILED = "failed"  # Used for when a job fails to process.
    DISMISSED = "dismissed"  # Used for when a job is not processed.

    # incomplete status
    ACCEPTED = "accepted"
    RUNNING = "running"

    @staticmethod
    def get_finished_status():
        return [
            OGC_Status.SUCCESSFUL.value,
            OGC_Status.FAILED.value,
            OGC_Status.DISMISSED.value,
        ]

    @staticmethod
    def get_incomplete_states():
        return [
            OGC_Status.ACCEPTED.value,
            OGC_Status.RUNNING.value,
        ]
