# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os
from mock import MagicMock, Mock, patch, call, mock_open, ANY

logger = logging.getLogger(__name__)


# Note: For these tests we import the functions in the tests,
#  because we need to mock arcpy prior to importing the functions.
#  then we need to patch the functions after importing them. Open to suggestions...

class TestSupport(TestCase):
    def setUp(self):
        self.arcpy = MagicMock()
        self.patcher = patch.dict("sys.modules", arcpy=self.arcpy)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_create_mxd(self):
        from ..support.create_mxd import create_mxd

        with patch('__builtin__.open') as mock_open, patch(
                'eventkit_cloud.ui.support.create_mxd.shutil') as mock_shutil, patch(
            'eventkit_cloud.ui.support.create_mxd.get_temp_mxd') as mock_get_temp_mxd:
            test_mxd = "test.mxd"
            mxd_contents = "Test data."
            mock_open().__enter__().read.return_value = mxd_contents
            returned_mxd_contents = create_mxd(mxd=test_mxd)
            self.assertEqual(mxd_contents, returned_mxd_contents)
            mock_shutil.copy.assert_called_once_with(ANY, test_mxd)

    def test_create_mxd_process(self):
        from ..support.create_mxd import create_mxd_process

        with patch('eventkit_cloud.ui.support.create_mxd.create_mxd') as mock_create_mxd, patch(
                'eventkit_cloud.ui.support.create_mxd.Pool') as mock_pool:
            example_mxd = "value"
            example_metadata = {"some": "data"}
            result = Mock()
            result.get().return_value = example_mxd
            mock_pool.apply_async().return_value = Mock()
            create_mxd_process(mxd=example_mxd, metadata=example_metadata, verify=True)
            mock_pool.return_value.apply_async.called_once_with(ANY,
                                                                kwds={'mxd': example_mxd, 'metadata': example_metadata,
                                                                      'verify': True})

    def test_get_version(self):
        from ..support.create_mxd import get_version

        test_version = '10.5.1'
        self.arcpy.GetInstallInfo.return_value.get.return_value = test_version
        version = get_version()
        self.assertEqual(test_version, version)

    def test_get_temp_mxd(self):
        from ..support.create_mxd import get_temp_mxd

        with patch('eventkit_cloud.ui.support.create_mxd.os') as mock_os, patch(
                'eventkit_cloud.ui.support.create_mxd.shutil') as mock_shutil, patch(
            'eventkit_cloud.ui.support.create_mxd.update_mxd_from_metadata') as mock_update_mxd_from_metadata, patch(
            'eventkit_cloud.ui.support.create_mxd.tempfile') as mock_tempfile, patch(
            'eventkit_cloud.ui.support.create_mxd.get_version') as mock_get_version, patch(
            'eventkit_cloud.ui.support.create_mxd.get_mxd_template') as mock_get_mxd_template:
            example_name = "name"
            expected_name = "{0}.mxd".format(example_name)
            mocked_temporary_file = MagicMock()
            mocked_temporary_file.name = example_name
            mock_tempfile.NamedTemporaryFile.return_value = mocked_temporary_file
            metadata = {"some": "data"}
            with get_temp_mxd(metadata) as mxd_file:
                self.assertEqual(expected_name, mxd_file)
            mocked_temporary_file.close.assert_has_calls([call(), call()])
            mock_os.unlink.assert_called_once_with(expected_name)

    def test_get_layer_file(self):
        from ..support.create_mxd import get_layer_file

        example_layer = "arcpy_layer"
        layer_type = "raster"
        arc_version = "10.5"

        with patch('eventkit_cloud.ui.support.create_mxd.os') as mock_os:
            mock_os.path.isfile.return_value = True
            mock_os.path.abspath.return_value = example_layer
            returned_layer = get_layer_file(layer_type, arc_version)
            self.assertEqual(example_layer, returned_layer)


        with patch('eventkit_cloud.ui.support.create_mxd.os') as mock_os:
            mock_os.path.isfile.return_value = False
            mock_os.path.abspath.return_value = example_layer
            self.assertIsNone(get_layer_file(layer_type, arc_version))

    def test_update_layers(self):
        from ..support.create_mxd import update_layers

        # layer is actually an arc layer object, but string is used here for tests.
        example_layer = "layer"
        old_file_path = "/example/path"
        new_file_path = "/new/path"

        mock_layer = MagicMock()
        mock_layer.supports.return_value = True
        mock_layer.workspacePath = old_file_path
        mock_layer2 = MagicMock()
        mock_layer2.supports.return_value = False
        mock_layer2.workspacePath = old_file_path
        verify = True

        self.arcpy.mapping.ListLayers.return_value = [mock_layer, mock_layer2]
        update_layers(example_layer, new_file_path, verify=verify)
        mock_layer.findAndReplaceWorkspacePath.assert_called_once_with(old_file_path, new_file_path, verify)
        self.arcpy.RecalculateFeatureClassExtent_management.assert_called_once()
