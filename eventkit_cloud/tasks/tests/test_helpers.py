# -*- coding: utf-8 -*-
from __future__ import absolute_import

import logging
import signal

from django.test import TestCase
from mock import patch, call

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


