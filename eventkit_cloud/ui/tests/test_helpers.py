# -*- coding: utf-8 -*-
import logging
from unittest.mock import Mock, mock_open, patch
from uuid import uuid4

from django.test import TestCase

from eventkit_cloud.ui.helpers import (
    file_to_geojson,
    is_lat_lon,
    is_mgrs,
    read_json_file,
    unzip_file,
    write_uploaded_file,
)

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):
    @patch("eventkit_cloud.ui.helpers.unzip_file")
    @patch("eventkit_cloud.ui.helpers.polygonize")
    @patch("eventkit_cloud.ui.helpers.convert_vector")
    @patch("eventkit_cloud.ui.helpers.shutil.rmtree")
    @patch("eventkit_cloud.ui.helpers.read_json_file")
    @patch("eventkit_cloud.ui.helpers.os.path.exists")
    @patch("eventkit_cloud.ui.helpers.get_meta")
    @patch("eventkit_cloud.ui.helpers.os.listdir")
    def test_file_to_geojson(
        self,
        mock_listdir,
        mock_get_meta,
        mock_exists,
        mock_read_json_file,
        mock_rmtree,
        mock_convert_vector,
        mock_polygonize,
        mock_unzip_file,
    ):
        expected_geojson = {"type": "FeatureCollection", "other_stuff": {}}
        stage_dir = "/var/lib/stage"
        file_name_stem = "test_file"
        input_path = f"{stage_dir}/{file_name_stem}.geojson"
        expected_output_path = f"{stage_dir}/out_{file_name_stem}.geojson"
        mock_convert_vector.return_value = expected_output_path
        mock_exists.return_value = True
        mock_read_json_file.return_value = expected_geojson

        # Test raster
        mock_get_meta.return_value = {"driver": "GeoJSON", "is_raster": True}
        self.assertEqual(expected_geojson, file_to_geojson(input_path))
        mock_polygonize.assert_called_once_with(input_path, expected_output_path)

        # Test vector
        mock_get_meta.return_value = {"driver": "GeoJSON", "is_raster": False}
        self.assertEqual(expected_geojson, file_to_geojson(input_path))
        mock_convert_vector.assert_called_once_with(input_path, expected_output_path, driver="geojson")
        mock_convert_vector.reset_mock()
        mock_rmtree(stage_dir)

        # Test shapefile
        input_path = f"{stage_dir}/{file_name_stem}.zip"
        mock_unzip_file.return_value = True
        shapefile = "test.shp"
        mock_listdir.return_value = [shapefile]
        expected_input_path = f"{stage_dir}/{shapefile}"
        self.assertEqual(expected_geojson, file_to_geojson(input_path))
        mock_convert_vector.assert_called_once_with(expected_input_path, expected_output_path, driver="geojson")

        with self.assertRaises(Exception):
            # Test bad file
            mock_exists.return_value = False
            file_to_geojson(input_path)

    @patch("eventkit_cloud.ui.helpers.json")
    def test_read_json_file(self, fake_json):
        file_path = "/path/to/file.geojson"
        geojson = {"type": "FeatureCollection", "other_stuff": {}}
        fake_json.load.return_value = geojson
        with patch("eventkit_cloud.ui.helpers.open", new_callable=mock_open()) as m:
            ret = read_json_file(file_path)
            self.assertEqual(ret, geojson)
            m.assert_called_once_with(file_path)
            fake_json.load.assert_called_once_with(m.return_value.__enter__.return_value)

            m.side_effect = Exception("Thats not right!")
            self.assertRaises(Exception, read_json_file, file_path)

    @patch("eventkit_cloud.ui.helpers.zipfile")
    def test_unzip_file(self, zipfile):
        mock_zip = Mock()
        mock_zip.extractall = Mock()
        mock_zip.close = Mock()
        zipfile.ZipFile.return_value = mock_zip

        file_path = "/path/to/file.txt"
        directory = "/path/to"

        ret = unzip_file(file_path, directory)
        self.assertTrue(ret)
        zipfile.ZipFile.assert_called_once_with(file_path, "r")
        mock_zip.extractall.assert_called_once_with(directory)
        mock_zip.close.assert_called_once

        mock_zip.extractall.side_effect = Exception("oh no!")
        self.assertRaises(Exception, unzip_file, file_path, directory)

    @patch("eventkit_cloud.ui.helpers.uuid4")
    def test_write_uploaded_file(self, mock_uuid):
        example_uuid = str(uuid4())
        mock_uuid.return_value = example_uuid
        with patch("eventkit_cloud.ui.helpers.open", new_callable=mock_open()) as m:
            test_file = Mock()
            test_file.chunks = Mock(return_value=["1", "2", "3", "4", "5"])
            test_file_stem_name = "file"
            test_file_name = f"{test_file_stem_name}.txt"
            test_file.name = test_file_name
            file_path = "/path/to/file.txt"
            ret = write_uploaded_file(test_file)
            self.assertTrue(ret)
            m.assert_called_once_with(
                f"/var/lib/eventkit/exports_stage/{example_uuid}/in_{test_file_stem_name}-{example_uuid}.txt", "wb+"
            )

            test_file.chunks.assert_called_once
            self.assertEqual(m.return_value.__enter__.return_value.write.call_count, 5)

            m.side_effect = Exception("whoops!")
            self.assertRaises(Exception, write_uploaded_file, test_file, file_path)

    def test_is_mgrs(self):
        valid_spaced = "18S TJ 90000 10000"
        valid_no_space = "18STJ9000010000"
        invalid = "180 TJ S0000 10000"
        self.assertTrue(is_mgrs(valid_spaced))
        self.assertTrue(is_mgrs(valid_no_space))
        self.assertFalse(is_mgrs(invalid))

    def test_is_lat_lon(self):
        valid_1 = "90 180"
        valid_2 = "-45, -120"
        valid_3 = "+67.0890808,129.0980007"
        valid_4 = "38.00 N, 89.088 E"
        invalid_1 = "390, 97.00"
        invalid_2 = "45a -25.00"
        invalid_3 = "-45.0+67.00"
        self.assertTrue(is_lat_lon(valid_1))
        self.assertTrue(is_lat_lon(valid_2))
        self.assertTrue(is_lat_lon(valid_3))
        self.assertTrue(is_lat_lon(valid_4))
        self.assertFalse(is_lat_lon(invalid_1))
        self.assertFalse(is_lat_lon(invalid_2))
        self.assertFalse(is_lat_lon(invalid_3))

        with patch("eventkit_cloud.ui.helpers.float") as float:
            float.side_effect = ValueError
            self.assertFalse(is_lat_lon(valid_1))

        with patch("eventkit_cloud.ui.helpers.math") as math:
            math.isnan.return_value = True
            self.assertFalse(is_lat_lon(valid_3))
