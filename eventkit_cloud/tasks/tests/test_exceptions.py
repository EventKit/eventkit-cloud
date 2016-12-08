import logging
from django.test import TestCase
from ..exceptions import CancelException

logger = logging.getLogger(__name__)


class TestExceptions(TestCase):

    def test_cancel_exception(self):
        task_name = "Test Task"
        user_name = "Test User"
        message = "The task was cancelled"

        output = CancelException(task_name=task_name, user_name=user_name)
        self.assertEquals(output.message, "{0} was cancelled by {1}.".format(task_name, user_name))

        output = CancelException(message=message)
        self.assertEquals(output.message, message)


