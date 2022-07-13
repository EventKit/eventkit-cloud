# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

from eventkit_cloud.utils.scaling.exceptions import MultipleTaskTerminationErrors, ScaleLimitError, TaskTerminationError

logger = logging.getLogger(__name__)


class TestExceptions(TestCase):
    def test_scale_limit_error(self):
        with self.assertRaises(ScaleLimitError):
            raise ScaleLimitError("Test")

    def test_task_termination_error(self):
        with self.assertRaises(TaskTerminationError):
            raise TaskTerminationError(task_name="Test")
        with self.assertRaises(TaskTerminationError):
            raise TaskTerminationError()
        with self.assertRaises(TaskTerminationError):
            raise TaskTerminationError("ERROR")

    def test_multiple_task_termination_errors(self):
        with self.assertRaises(MultipleTaskTerminationErrors):
            try:
                raise TaskTerminationError(task_name="Test")
            except TaskTerminationError as tte:
                raise MultipleTaskTerminationErrors([tte])
