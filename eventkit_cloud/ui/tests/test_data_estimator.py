# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

from ..data_estimator import get_size_estimate, get_gb_estimate
from mock import Mock, patch

logger = logging.getLogger(__name__)


class TestDataEstimation(TestCase):

    def test_get_gb_estimate(self):
        expected_return_value = 0.0001572864
        actual_return_value = get_gb_estimate(4)
        self.assertAlmostEqual(expected_return_value, actual_return_value, places=9)

    @patch('eventkit_cloud.ui.data_estimator.get_gb_estimate')
    @patch('eventkit_cloud.ui.data_estimator.DataProvider')
    def test_get_size_estimate(self, export_provider, get_estimate):
        provider_name = "Test_name"
        get_estimate.return_value = 4
        export_provider.objects.get.return_value = Mock(level_from=0, level_to=1)
        returned_values = get_size_estimate(provider_name, bbox=[-1, -1, 0, 0])
        export_provider.objects.get.assert_called_once_with(name=provider_name)
        # two tiles, an arbritary value of four from the mock, one tile per level represented in array.
        expected_values = [2, 4, [1, 1]]
        self.assertEquals(returned_values, expected_values)
