# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

from eventkit_cloud.utils.scaling.dummy import Dummy

logger = logging.getLogger(__name__)


class TestDummy(TestCase):
    def setUp(self):
        self.client: Dummy = Dummy()

    def test_run_task(self):
        self.assertIsNone(self.client.run_task("test", "cmd", disk_in_mb=1, memory_in_mb=1, app_name="test"))

    def test_get_running_tasks(self):
        expected_result = {"resources": [], "pagination": {"total_results": 0}}
        self.assertEqual(expected_result, self.client.get_running_tasks())

    def test_get_running_tasks_memory(self):
        self.assertEqual(0, self.client.get_running_tasks_memory("test"))

    def test_terminate_task(self):
        with self.assertRaises(SystemExit):
            self.client.terminate_task("test")
