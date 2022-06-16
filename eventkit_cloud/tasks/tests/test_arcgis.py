# -*- coding: utf-8 -*-
import logging
from unittest.mock import ANY, MagicMock, Mock, patch

from django.test import TestCase

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

    def test_get_data_source_by_type(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import get_data_source_by_type

        data_sources = {"osm": {"type": "osm"}, "roads": {"type": "vector"}, "Imagery": {"type": "raster"}}

        expected_sources = {"osm": {"type": "osm"}, "roads": {"type": "vector"}}
        # OSM should be returned when vector is requested...
        returned_sources = get_data_source_by_type(data_type="vector", data_sources=data_sources)
        self.assertEqual(expected_sources, returned_sources)

        # Other sources should return as themselves.
        expected_sources = {"Imagery": {"type": "raster"}}
        returned_sources = get_data_source_by_type(data_type="raster", data_sources=data_sources)
        self.assertEqual(expected_sources, returned_sources)

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

    def test_get_mxd_template(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import get_mxd_template

        with patch("eventkit_cloud.tasks.arcgis.create_mxd.os") as mock_os:

            mock_os.path.isfile.return_value = True
            version = "10.5.1"
            expected_file = "/arcgis/templates/template-10-5.mxd"
            mock_os.path.abspath.return_value = expected_file
            self.assertEqual(expected_file, get_mxd_template(version))

            version = "10.4.1"
            expected_file = "/arcgis/templates/template-10-4.mxd"
            mock_os.path.abspath.return_value = expected_file
            self.assertEqual(expected_file, get_mxd_template(version))

            version = "10.8.1"
            expected_file = "/arcgis/templates/template-10-6.mxd"
            mock_os.path.abspath.return_value = expected_file
            self.assertEqual(expected_file, get_mxd_template(version))

            with self.assertRaises(Exception):
                mock_os.path.isfile.return_value = False
                get_mxd_template(version)

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

    def test_add_layers_to_group(self):
        from eventkit_cloud.tasks.arcgis.create_mxd import add_layers_to_group

        example_mxd = Mock()
        verify = False
        example_version = "10.8"
        example_arc_layer = Mock()

        with patch("eventkit_cloud.tasks.arcgis.create_mxd.get_layer_file") as mock_get_layer_file, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.add_layer_to_mxd"
        ) as mock_add_layer_to_mxd, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.update_layer"
        ) as mock_update_layer, patch(
            "eventkit_cloud.tasks.arcgis.create_mxd.os"
        ) as mock_os:
            mock_add_layer_to_mxd.return_value = example_arc_layer

            example_source = {
                "osm": {
                    "type": "osm",
                    "name": "OSM",
                    "files": [
                        {"file_path": "osm.gpkg", "file_ext": ".gpkg", "projection": 4326},
                        {"file_path": "osm.kml", "file_ext": ".kml", "projection": 4326},
                    ],
                }
            }
            file_type = example_source["osm"]["type"]
            file_path = example_source["osm"]["files"][0]["file_path"]
            file_projection = example_source["osm"]["files"][0]["projection"]
            mock_os.path.abspath.side_effect = [
                example_source["osm"]["files"][0]["file_path"],
                example_source["osm"]["files"][1]["file_path"],
            ]

            example_layer_file = "vector"
            mock_get_layer_file.return_value = example_layer_file
            add_layers_to_group(example_source, example_layer_file, example_mxd, verify, example_version)
            mock_add_layer_to_mxd.assert_called_with(
                "OSM_4326_gpkg", example_layer_file, example_mxd, group_layer=example_layer_file
            )
            mock_update_layer.assert_called_once_with(
                example_arc_layer, file_path, file_type, projection=file_projection, verify=verify
            )
            mock_add_layer_to_mxd.reset_mock()
            mock_update_layer.reset_mock()

            mock_add_layer_to_mxd.return_value = example_arc_layer
            example_source = {
                "imagery": {
                    "type": "raster",
                    "name": "Imagery",
                    "files": [{"file_path": "imagery.gpkg", "file_ext": ".gpkg", "projection": 4326}],
                }
            }
            file_type = example_source["imagery"]["type"]
            file_path = example_source["imagery"]["files"][0]["file_path"]
            file_projection = example_source["imagery"]["files"][0]["projection"]
            mock_os.path.abspath.side_effect = [example_source["imagery"]["files"][0]["file_path"]]

            example_layer_file = "raster"
            mock_get_layer_file.return_value = example_layer_file
            add_layers_to_group(example_source, example_layer_file, example_mxd, verify, example_version)

            mock_add_layer_to_mxd.assert_called_with(
                "Imagery_4326_gpkg", example_layer_file, example_mxd, group_layer=example_layer_file
            )
            mock_update_layer.assert_called_once_with(
                example_arc_layer, file_path, file_type, projection=file_projection, verify=verify
            )
            mock_add_layer_to_mxd.reset_mock()
            mock_update_layer.reset_mock()


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
            datapack_path = "/example/datapack"
            aprx_contents = "Test data."
            test_metadata = {"metadata_keys": "metadata_values"}
            verify = True
            mock_get_aprx_template.return_value = test_aprx
            mock_open().__enter__().read.return_value = aprx_contents
            returned_aprx_contents = create_aprx(datapack_path, aprx=test_aprx, metadata=test_metadata, verify=verify)
            mock_update_from_metadata.assert_called_once_with(test_aprx, test_metadata, datapack_path, verify=verify)
            self.assertEqual(aprx_contents, returned_aprx_contents)
            mock_shutil.copy.assert_called_once_with(ANY, test_aprx)

    def test_get_aprx_template(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import get_aprx_template

        expected_file = "/arcgis/templates/template-2-7.aprx"
        example_datapack_path = "/test/datapack"
        with patch("eventkit_cloud.tasks.arcgis.create_aprx.os") as mock_os:

            mock_os.path.isfile.return_value = True
            mock_os.path.abspath.return_value = expected_file
            self.assertEqual(expected_file, get_aprx_template(example_datapack_path))

            with self.assertRaises(Exception):
                mock_os.path.isfile.return_value = False
                get_aprx_template(example_datapack_path)

    def test_create_aprx_process(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import create_aprx_process

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.create_aprx"), patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.Pool"
        ) as mock_pool:
            example_aprx = "value"
            example_metadata = {"some": "data"}
            example_datapack_path = "/test/datapack"
            result = Mock()
            result.get().return_value = example_aprx
            mock_pool.apply_async().return_value = Mock()
            create_aprx_process(example_datapack_path, aprx=example_aprx, metadata=example_metadata, verify=True)
            mock_pool.return_value.apply_async.called_once_with(
                ANY,
                args=(example_datapack_path,),
                kwds={"aprx": example_aprx, "metadata": example_metadata, "verify": True},
            )

    def test_version(self):
        test_version = "2.6"
        self.arcpy.GetInstallInfo.return_value.get.return_value = test_version
        from eventkit_cloud.tasks.arcgis.create_aprx import CURRENT_VERSION

        self.assertEqual(CURRENT_VERSION, test_version)

    def test_update_aprx_from_metadata(self):
        test_version = "2.3"
        self.arcpy.GetInstallInfo.return_value.get.return_value = test_version
        from eventkit_cloud.tasks.arcgis.create_aprx import update_aprx_from_metadata

        example_file_name = "output.aprx"

        mock_aprx = MagicMock()
        mock_mapx = Mock()
        mock_aprx.listMaps.return_value = [mock_mapx]
        self.arcpy.mp.ArcGISProject.return_value = mock_aprx

        expected_data_sources = ["list of sources"]
        example_metadata = {"name": "example_name", "has_vector": True, "data_sources": expected_data_sources}
        verify = True

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.os") as mock_os, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.add_layer_to_map"
        ) as mock_add_layer_to_map, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.get_data_source_by_type"
        ) as mock_get_data_source_by_type, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.get_layer_file"
        ) as mock_get_layer_file, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.add_layers_to_group"
        ) as mock_add_layers_to_group:
            expected_full_path = f"/test/{example_file_name}"
            mock_layer_file = Mock()
            mock_get_layer_file.return_value = mock_layer_file
            mock_os.path.abspath.return_value = expected_full_path
            mock_group_layer = Mock()
            mock_add_layer_to_map.return_value = mock_group_layer
            mock_data_sources = Mock()
            mock_get_data_source_by_type.return_value = mock_data_sources
            update_aprx_from_metadata(
                file_name=example_file_name, metadata=example_metadata, datapack_path=expected_full_path, verify=verify
            )
            self.arcpy.mp.ArcGISProject.assert_called_once_with(expected_full_path)
            mock_os.path.abspath.assert_called_once_with(example_file_name)
            mock_add_layer_to_map.assert_called_once_with("Vector", mock_layer_file, mock_mapx)
            mock_get_data_source_by_type.assert_called_once_with("vector", expected_data_sources)
            mock_add_layers_to_group.assert_called_once_with(
                mock_data_sources, mock_group_layer, mock_mapx, expected_full_path, verify=verify
            )

    def test_get_data_source_by_type(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import get_data_source_by_type

        data_sources = {"osm": {"type": "osm"}, "roads": {"type": "vector"}, "Imagery": {"type": "raster"}}

        expected_sources = {"osm": {"type": "osm"}, "roads": {"type": "vector"}}
        # OSM should be returned when vector is requested...
        returned_sources = get_data_source_by_type(data_type="vector", data_sources=data_sources)
        self.assertEqual(expected_sources, returned_sources)

        # Other sources should return as themselves.
        expected_sources = {"Imagery": {"type": "raster"}}
        returned_sources = get_data_source_by_type(data_type="raster", data_sources=data_sources)
        self.assertEqual(expected_sources, returned_sources)

    def test_get_layer_file(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import get_layer_file

        example_layer = "arcpy_layer"
        layer_type = "raster"
        arc_version = "2.6"

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

    def test_add_layers_to_group(self):
        from eventkit_cloud.tasks.arcgis.create_aprx import add_layers_to_group

        example_mapx = Mock()
        verify = False
        example_version = "2.7"
        example_arc_layer = Mock()

        with patch("eventkit_cloud.tasks.arcgis.create_aprx.get_layer_file") as mock_get_layer_file, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.add_layer_to_map"
        ) as mock_add_layer_to_map, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.update_layer"
        ) as mock_update_layer, patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.create_vector_layers"
        ), patch(
            "eventkit_cloud.tasks.arcgis.create_aprx.os"
        ) as mock_os:
            mock_add_layer_to_map.return_value = example_arc_layer

            example_source = {
                "osm": {
                    "type": "osm",
                    "name": "OSM",
                    "files": [
                        {"file_path": "osm.gpkg", "file_ext": ".gpkg", "projection": 4326},
                        {"file_path": "osm.kml", "file_ext": ".kml", "projection": 4326},
                    ],
                }
            }
            file_type = example_source["osm"]["type"]
            file_path = example_source["osm"]["files"][0]["file_path"]
            file_projection = example_source["osm"]["files"][0]["projection"]
            mock_os.path.abspath.side_effect = [
                example_source["osm"]["files"][0]["file_path"],
                example_source["osm"]["files"][1]["file_path"],
            ]

            example_layer_file = "vector"
            mock_get_layer_file.return_value = example_layer_file
            add_layers_to_group(
                example_source, example_layer_file, example_mapx, file_path, verify=verify, version=example_version
            )
            mock_add_layer_to_map.assert_called_with(
                "OSM_4326_gpkg", example_layer_file, example_mapx, group_layer=example_layer_file
            )
            mock_update_layer.assert_called_once_with(
                example_arc_layer, file_path, file_type, projection=file_projection, verify=verify
            )
            mock_add_layer_to_map.reset_mock()
            mock_update_layer.reset_mock()

            mock_add_layer_to_map.return_value = example_arc_layer
            example_source = {
                "imagery": {
                    "type": "raster",
                    "name": "Imagery",
                    "files": [{"file_path": "imagery.gpkg", "file_ext": ".gpkg", "projection": 4326}],
                }
            }
            file_type = example_source["imagery"]["type"]
            file_path = example_source["imagery"]["files"][0]["file_path"]
            file_projection = example_source["imagery"]["files"][0]["projection"]
            mock_os.path.abspath.side_effect = [example_source["imagery"]["files"][0]["file_path"]]

            example_layer_file = "raster"
            mock_get_layer_file.return_value = example_layer_file
            add_layers_to_group(example_source, example_layer_file, example_mapx, file_path, verify, example_version)

            mock_add_layer_to_map.assert_called_with(
                "Imagery_4326_gpkg", example_layer_file, example_mapx, group_layer=example_layer_file
            )
            mock_update_layer.assert_called_once_with(
                example_arc_layer, file_path, file_type, projection=file_projection, verify=verify
            )
            mock_add_layer_to_map.reset_mock()
            mock_update_layer.reset_mock()
