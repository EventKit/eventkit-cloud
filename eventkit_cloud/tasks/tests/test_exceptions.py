import logging

from django.test import TestCase

from eventkit_cloud.tasks.exceptions import CancelException

logger = logging.getLogger(__name__)


class TestExceptions(TestCase):

    def test_cancel_exception(self):
        task_name = "Test Task"
        user_name = "Test User"
        message = "The task was canceled"

        output = CancelException(task_name=task_name, user_name=user_name)
        self.assertEquals(output.message, "{0} was canceled by {1}.".format(task_name, user_name))

        output = CancelException(message=message)
        self.assertEquals(output.message, message)


