# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os
from mock import MagicMock, Mock, patch, call, mock_open

logger = logging.getLogger(__name__)


class TestSupport(TestCase):

    def setUp(self):
        self.arcpy = MagicMock()
        self.patcher = patch.dict("sys.modules", arcpy=self.arcpy)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    # @patch('__builtin__.open')
    # @patch('eventkit_cloud.ui.support.create_mxd.shutil')
    # @patch('eventkit_cloud.ui.support.create_mxd.get_temp_mxd')
    # def test_create_mxd(self, mock_get_temp_mxd, mock_shutil, mock_open):
    #     from ..support.create_mxd import create_mxd
    #
    #     test_mxd = "test.mxd"
    #     mxd_contents = "Test data."
    #     mock_temp_file = MagicMock()
    #     mock_get_temp_mxd.return_value = mock_temp_file
    #
    #     mock_open_mxd = MagicMock()
    #     mock_open_mxd.open.return_value.__enter__.return_value.read.return_value = mxd_contents
    #     mock_open.return_value = mock_open_mxd
    #     returned_mxd_contents = create_mxd(mxd=test_mxd)
    #     self.assertEqual(mxd_contents, returned_mxd_contents)
    #     mock_shutil.copy.assert_called_once_with(mock_temp_file, test_mxd)
    #     mock_open.assert_called_once()

    @patch('eventkit_cloud.ui.support.create_mxd.Pool')
    def test_create_mxd_process(self, mock_pool):

        example_mxd = "value"
        result = Mock()
        result.get().return_value = example_mxd
        mock_pool.apply_async().return_value = Mock()

    def test_get_version(self):
        from ..support.create_mxd import get_version

        test_version = '10.5.1'
        self.arcpy.GetInstallInfo().get.return_value = test_version
        version = get_version()
        self.assertEqual(test_version, version)