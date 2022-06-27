import logging

from django.test import TestCase

from eventkit_cloud.tasks.exceptions import CancelException, DeleteException, FailedException

logger = logging.getLogger(__name__)


class TestExceptions(TestCase):
    def test_cancel_exception(self):
        task_name = "Test Task"
        user_name = "Test User"
        message = "The task was canceled"

        output = CancelException(task_name=task_name, user_name=user_name)
        self.assertEqual(str(output), f"{task_name} was canceled by {user_name}.")

        output = CancelException(message=message)
        self.assertEqual(str(output), message)

    def test_delete_exception(self):
        task_name = "Test Task"
        user_name = "Test User"
        message = "The task was deleted"

        output = DeleteException(task_name=task_name, user_name=user_name)
        self.assertEqual(str(output), f"{task_name} was deleted by {user_name}.")

        output = DeleteException(message=message)
        self.assertEqual(str(output), message)

    def test_failed_exception(self):
        task_name = "Test Task"
        message = "The task has failed"

        output = FailedException(task_name=task_name)
        self.assertEqual(
            str(output),
            f"{task_name} has failed too many times and will not be retried.",
        )

        output = FailedException(message=message)
        self.assertEqual(str(output), message)
