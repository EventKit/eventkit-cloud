# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

from eventkit_cloud.utils.scaling.scale_client import ScaleClient

logger = logging.getLogger(__name__)


class TestScaleClient(TestCase):
    def setUp(self):
        self.client = ScaleClient()

    def test_run_task(self):
        self.client.run_task("name", "command", disk_in_mb=1, memory_in_mb=2, app_name="app_name")

    def test_get_running_tasks(self):
        self.client.get_running_tasks(app_name="app_name", names="names,names")

    def test_get_running_tasks_memory(self):
        self.client.get_running_tasks_memory("app_name")

    def test_terminate_task(self):
        self.client.terminate_task("task_name")
