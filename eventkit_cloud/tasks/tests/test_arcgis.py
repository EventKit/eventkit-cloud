# -*- coding: utf-8 -*-
import logging

from django.test import TestCase
from unittest.mock import MagicMock, Mock, patch, ANY

logger = logging.getLogger(__name__)


# Note: For these tests we import the functions in the tests,
#  because we need to mock arcpy prior to importing the functions.
#  then we need to patch the functions after importing them. Open to suggestions...


class TestCreateMXD(TestCase):
    def setUp(self):
        self.arcpy = MagicMock()
        self.patcher = patch.dict("sys.modules", arcpy=self.arcpy)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_create_mxd(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import create_mxd

        with patch("builtins.open") as mock_open, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.shutil"
        ) as mock_shutil, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.get_mxd_template"
        ) as mock_get_mxd_template, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.update_mxd_from_metadata"
        ) as mock_update_from_metadata:
            test_mxd = "test.mxd"
            mxd_contents = "Test data."
            test_metadata = {"metadata_keys": "metadata_values"}
            verify = True
            mock_get_mxd_template.return_value = test_mxd
            mock_open().__enter__().read.return_value = mxd_contents
            returned_mxd_contents = create_mxd(mxd=test_mxd, metadata=test_metadata, verify=verify)
            mock_update_from_metadata.assert_called_once_with(test_mxd, test_metadata, verify=verify)
            self.assertEqual(mxd_contents, returned_mxd_contents)
            mock_shutil.copy.assert_called_once_with(ANY, test_mxd)

    def test_create_mxd_process(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import create_mxd_process

        with patch("eventkit_cloud.tasks.arcgis.create_mxd.create_mxd"), patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.Pool"
        ) as mock_pool:
            example_mxd = "value"
            example_metadata = {"some": "data"}
            result = Mock()
            result.get().return_value = example_mxd
            mock_pool.apply_async().return_value = Mock()
            create_mxd_process(mxd=example_mxd, metadata=example_metadata, verify=True)
            mock_pool.return_value.apply_async.called_once_with(
                ANY, kwds={"mxd": example_mxd, "metadata": example_metadata, "verify": True}
            )

    def test_version(self):
        test_version = "10.5.1"
        self.arcpy.GetInstallInfo.return_value.get.return_value = test_version
        from eventkit_cloud.tasks.arcgis.create_mxd import CURRENT_VERSION

        self.assertEqual(CURRENT_VERSION, test_version)

    def test_get_layer_file(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import get_layer_file

        example_layer = "arcpy_layer"
        layer_type = "raster"
        arc_version = "10.5"

        with patch("eventkit_cloud.tasks.arcgis.create_mxd.os") as mock_os:
            mock_os.path.isfile.return_value = True
            mock_os.path.abspath.return_value = example_layer
            returned_layer = get_layer_file(layer_type, arc_version)
            self.assertEqual(example_layer, returned_layer)

        with patch("eventkit_cloud.tasks.arcgis.create_mxd.os") as mock_os:
            mock_os.path.isfile.return_value = False
            mock_os.path.abspath.return_value = example_layer
            self.assertIsNone(get_layer_file(layer_type, arc_version))

    def test_update_layers(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import update_layer

        # layer is actually an arc layer object, but string is used here for tests.
        example_layer = "layer"
        new_file_name = "path"
        new_file_dir = "/new"
        new_file_path = f"{new_file_dir}/{new_file_name}"
        old_file_path = "/example/path"
        example_type = "osm"

        mock_layer = MagicMock()
        mock_layer.supports.return_value = True
        mock_layer.workspacePath = old_file_path
        mock_layer2 = MagicMock()
        mock_layer2.supports.return_value = False
        mock_layer2.workspacePath = old_file_path
        verify = True

        self.arcpy.mapping.ListLayers.return_value = [mock_layer, mock_layer2]
        update_layer(example_layer, new_file_path, example_type, verify=verify)
        mock_layer.findAndReplaceWorkspacePath.assert_called_once_with(old_file_path, new_file_path, verify)
        self.arcpy.RecalculateFeatureClassExtent_management.assert_called_once()

        example_type = "elevation"
        update_layer(example_layer, new_file_path, example_type, verify=verify)
        mock_layer.replaceDataSource.assert_called_once_with(new_file_dir, "NONE", new_file_name, verify)
        mock_layer.replaceDataSource.reset_mock()

        example_type = "raster"
        update_layer(example_layer, new_file_path, example_type, verify=verify)
        mock_layer.replaceDataSource.assert_called_once_with(new_file_dir, "RASTER_WORKSPACE", new_file_name, verify)


class TestCreateAPRX(TestCase):
    def setUp(self):
        self.arcpy = MagicMock()
        self.patcher = patch.dict("sys.modules", arcpy=self.arcpy)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()

    def test_create_aprx(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import create_aprx

        with patch("builtins.open") as mock_open, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.shutil"
        ) as mock_shutil, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.get_aprx_template"
        ) as mock_get_aprx_template, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.update_aprx_from_metadata"
        ) as mock_update_from_metadata:
            test_aprx = "test.aprx"
            aprx_contents = "Test data."
            test_metadata = {"metadata_keys": "metadata_values"}
            verify = True
            mock_get_aprx_template.return_value = test_aprx
            mock_open().__enter__().read.return_value = aprx_contents
            returned_aprx_contents = create_aprx(aprx=test_aprx, metadata=test_metadata, verify=verify)
            mock_update_from_metadata.assert_called_once_with(test_aprx, test_metadata, verify=verify)
            self.assertEqual(aprx_contents, returned_aprx_contents)
            mock_shutil.copy.assert_called_once_with(ANY, test_aprx)

    def test_create_aprx_process(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import create_aprx_process

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.create_aprx"), patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.Pool"
        ) as mock_pool:
            example_aprx = "value"
            example_metadata = {"some": "data"}
            result = Mock()
            result.get().return_value = example_aprx
            mock_pool.apply_async().return_value = Mock()
            create_aprx_process(aprx=example_aprx, metadata=example_metadata, verify=True)
            mock_pool.return_value.apply_async.called_once_with(
                ANY, kwds={"aprx": example_aprx, "metadata": example_metadata, "verify": True}
            )

    def test_version(self):
        test_version = "10.5.1"
        self.arcpy.GetInstallInfo.return_value.get.return_value = test_version
        from eventkit_cloud.tasks.arcgis.create_aprx import CURRENT_VERSION

        self.assertEqual(CURRENT_VERSION, test_version)

    def test_get_layer_file(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import get_layer_file

        example_layer = "arcpy_layer"
        layer_type = "raster"
        arc_version = "10.5"

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.os") as mock_os:
            mock_os.path.isfile.return_value = True
            mock_os.path.abspath.return_value = example_layer
            returned_layer = get_layer_file(layer_type, arc_version)
            self.assertEqual(example_layer, returned_layer)

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.os") as mock_os:
            mock_os.path.isfile.return_value = False
            mock_os.path.abspath.return_value = example_layer
            self.assertIsNone(get_layer_file(layer_type, arc_version))

    def test_update_layers(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import update_layer

        new_file_name = "path"
        new_file_dir = "/new"
        new_file_path = f"{new_file_dir}/{new_file_name}"
        old_file_path = "/example/path"

        mock_group_layer = MagicMock()
        mock_layer = MagicMock()
        mock_layer.supports.return_value = True
        mock_layer.workspacePath = old_file_path
        mock_layer2 = MagicMock()
        mock_layer2.supports.return_value = False
        mock_layer2.workspacePath = old_file_path
        mock_group_layer.listLayers.return_value = [mock_layer, mock_layer2]

        verify = True

        original_connection_properties = {"something": "blah", "connection_info": {"database": old_file_path}}

        mock_layer.connectionProperties = original_connection_properties

        example_type = "osm"
        expected_connection_properties = original_connection_properties
        expected_connection_properties["connection_info"]["database"] = new_file_path
        expected_connection_properties["connection_info"]["authentication_mode"] = "OSA"
        update_layer(mock_group_layer, new_file_path, example_type, verify=verify)
        mock_layer.updateConnectionProperties.assert_called_once_with(
            original_connection_properties, expected_connection_properties, validate=verify
        )
        mock_layer.updateConnectionProperties.reset_mock()
        self.arcpy.management.RecalculateFeatureClassExtent.assert_called_once()

        example_type = "elevation"
        expected_connection_properties = original_connection_properties
        expected_connection_properties["dataset"] = new_file_name
        expected_connection_properties["workspace_factory"] = "Raster"
        update_layer(mock_group_layer, new_file_path, example_type, verify=verify)
        mock_layer.updateConnectionProperties.assert_called_once_with(
            original_connection_properties, expected_connection_properties, validate=verify
        )
        mock_layer.updateConnectionProperties.reset_mock()
        mock_layer.replaceDataSource.reset_mock()

        example_type = "raster"
        expected_connection_properties = original_connection_properties
        expected_connection_properties["connection_info"]["database"] = new_file_dir
        expected_connection_properties["dataset"] = new_file_name
        update_layer(mock_group_layer, new_file_path, example_type, verify=verify)
        mock_layer.updateConnectionProperties.assert_called_once_with(
            original_connection_properties, expected_connection_properties, validate=verify
        )
        mock_layer.updateConnectionProperties.reset_mock()
