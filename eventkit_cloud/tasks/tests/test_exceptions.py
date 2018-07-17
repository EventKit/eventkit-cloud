import logging
from django.test import TestCase
from ..exceptions import CancelException

logger = logging.getLogger(__name__)


class TestExceptions(TestCase):

    def test_cancel_exception(self):
        task_name = "Test Task"
        user_name = "Test User"
        message = "The task was canceled"

        output = CancelException(task_name=task_name, user_name=user_name)
        self.assertEqual(output, "{0} was canceled by {1}.".format(task_name, user_name))

        output = CancelException(message=message)
        self.assertEqual(output, message)


