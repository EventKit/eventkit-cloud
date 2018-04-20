# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os
from mock import Mock, patch, call, mock_open

from ..support.create_mxd import create_mxd

logger = logging.getLogger(__name__)


class TestSupport(TestCase):

    @patch('__builtins__.open')
    @patch('eventkit_cloud.ui.support.create_mxd.shutil')
    @patch('eventkit_cloud.ui.support.create_mxd.get_temp_mxd')
    def test_create_mxd(self, mock_get_temp_mxd, mock_shutil, mock_open):

        test_mxd = "test.mxd"
        mxd_contents = "Test data."
        mock_temp_file = Mock()
        mock_get_temp_mxd.return_value = mock_temp_file

        mock_shutil.copy.assert_called_once_with(mock_temp_file, test_mxd)
        mock_open.assert_not_called()

        mock_open_mxd = Mock()
        mock_open_mxd.read().return_value = mxd_contents
        mock_open.return_value = mock_open_mxd
        returned_mxd_contents = create_mxd(mxd=test_mxd)
        self.assertEqual(mxd_contents, returned_mxd_contents)

