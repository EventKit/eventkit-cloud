# -*- coding: utf-8 -*-
import logging
from unittest.mock import Mock, patch

from django.conf import settings
from django.test import TestCase

from eventkit_cloud.utils.scaling import get_scale_client

logger = logging.getLogger(__name__)


class TestUtil(TestCase):
    @patch("eventkit_cloud.utils.scaling.util.Pcf")
    @patch("eventkit_cloud.utils.scaling.util.Dummy")
    @patch("eventkit_cloud.utils.scaling.util.Docker")
    def test_get_scale_client(self, mock_docker, mock_dummy, mock_pcf):
        with self.settings(DEBUG_CELERY=True):
            dummy_client = Mock()
            mock_dummy.return_value = dummy_client
            self.assertEqual((dummy_client, "Dummy"), get_scale_client())
        with self.settings(DEBUG_CELERY=False, PCF_SCALING=True, CELERY_TASK_APP="celery"):
            pcf_client = Mock()
            mock_pcf.return_value = pcf_client
            self.assertEqual((pcf_client, "celery"), get_scale_client())
        with self.settings(DEBUG_CELERY=False, PCF_SCALING=True):
            pcf_client = Mock()
            mock_pcf.return_value = pcf_client
            self.assertEqual((pcf_client, None), get_scale_client())
        with self.settings(DEBUG_CELERY=False, PCF_SCALING=False):
            docker_client = Mock()
            mock_docker.return_value = docker_client
            self.assertEqual((docker_client, settings.DOCKER_IMAGE_NAME), get_scale_client())
