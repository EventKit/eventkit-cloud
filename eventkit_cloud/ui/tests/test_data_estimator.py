# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

from ..data_estimator import get_size_estimate, get_gb_estimate

logger = logging.getLogger(__name__)


class TestExportTaskFactory(TestCase):

    def test_get_gb_estimate(self):
        expected_return_value = 0.0001572864
        actual_return_value = get_gb_estimate(4)
        self.assertAlmostEqual(expected_return_value, actual_return_value, places=9)