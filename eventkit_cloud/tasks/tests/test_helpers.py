# -*- coding: utf-8 -*-
from __future__ import absolute_import

import logging
import signal

from django.test import TestCase
from mock import patch, call
import os
import signal
from eventkit_cloud.tasks.helpers import get_style_files, get_file_paths, get_last_update, get_metadata_url, \
    get_osm_last_update

from eventkit_cloud.tasks.helpers import progressive_kill

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):
    """
    Test Task Helpers
    """
    @patch('eventkit_cloud.tasks.helpers.sleep')
    @patch('eventkit_cloud.tasks.helpers.os')
    def test_progessive_kill(self, mock_os, mock_sleep):
        pid = 1
        # Test no PID.
        mock_os.kill.side_effect = [OSError()]
        progressive_kill(pid)
        mock_os.reset_mock

        # Test kill with SIGTERM
        mock_os.kill.side_effect = [None, OSError()]
        progressive_kill(pid)
        mock_os.kill.has_calls([call(pid, signal.SIGTERM)])
        mock_os.reset_mock

        # Test kill with SIGKILL
        mock_os.kill.side_effect = [None, None]
        progressive_kill(pid)
        mock_os.kill.has_calls([call(pid, signal.SIGTERM), call(pid, signal.SIGTERM)])
        mock_os.reset_mock

    def test_get_style_files(self):
        for file in get_style_files():
            self.assertTrue(os.path.isfile(file))

    def test_get_file_paths(self):
        self.assertTrue(os.path.abspath(__file__) in get_file_paths(os.path.dirname(__file__)))


    @patch('eventkit_cloud.tasks.helpers.get_osm_last_update')
    def test_get_last_update(self, mock_get_osm_last_update):
        test_url = "https://test"
        test_type = "osm"
        test_slug = "slug"
        get_last_update(test_url, test_type, slug=test_slug)
        mock_get_osm_last_update.assert_called_once_with(test_url, slug=test_slug)

    @patch('eventkit_cloud.tasks.helpers.auth_requests')
    def test_get_osm_last_update(self, mock_auth_requests):
        test_url = "https://test/interpreter"
        test_slug = "slug"
        expected_url = "https://test/timestamp"
        expected_time = "2017-12-29T13:09:59Z"

        mock_auth_requests.get.return_value.content = expected_time
        returned_time = get_osm_last_update(test_url, slug=test_slug)
        mock_auth_requests.get.assert_called_once_with(expected_url, slug=test_slug)
        self.assertEqual(expected_time, returned_time)

        mock_auth_requests.get.side_effect = Exception("FAIL")
        returned_time = get_osm_last_update(test_url, slug=test_slug)
        self.assertIsNone(returned_time)

    def test_get_metadata_url(self):
        test_url = "https://test"

        expected_value = "https://test?request=GetCapabilities"
        returned_value = get_metadata_url(test_url, 'wcs')
        self.assertEqual(expected_value, returned_value)

        returned_value = get_metadata_url(test_url, 'arcgis-raster')
        self.assertEqual(test_url, returned_value)
