# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os

from mock import Mock, patch, mock_open
from eventkit_cloud.ui.helpers import file_to_geojson, \
    read_json_file, unzip_file, write_uploaded_file, is_mgrs, is_lat_lon


logger = logging.getLogger(__name__)


class TestHelpers(TestCase):

    @patch('eventkit_cloud.ui.helpers.convert_vector')
    @patch('eventkit_cloud.ui.helpers.os.path.splitext')
    @patch('eventkit_cloud.ui.helpers.shutil.rmtree')
    @patch('eventkit_cloud.ui.helpers.read_json_file')
    @patch('eventkit_cloud.ui.helpers.os.path.exists')
    @patch('eventkit_cloud.ui.helpers.get_meta')
    @patch('eventkit_cloud.ui.helpers.os.listdir')
    @patch('eventkit_cloud.ui.helpers.unzip_file')
    @patch('eventkit_cloud.ui.helpers.write_uploaded_file')
    @patch('eventkit_cloud.ui.helpers.os.mkdir')
    @patch('eventkit_cloud.ui.helpers.uuid4')
    def test_file_to_geojson(self, mock_uid, mock_makedir, mock_write, mock_unzip, mock_listdirs, mock_meta,
                             mock_exists, mock_reader, mock_rm, mock_split, mock_convert_vector):
        geojson = {'type': 'FeatureCollection', 'other_stuff': {}}
        file = Mock()
        example_uid = 12345
        file.name = 'test_file.geojson'
        mock_uid.return_value = example_uid
        mock_split.return_value = 'test_file', '.geojson'
        mock_makedir.return_value = True
        mock_write.return_value = True
        mock_unzip.return_value = False
        mock_listdirs.return_value = []
        mock_meta.return_value = {'driver': 'GeoJSON', 'is_raster': False}
        mock_convert_vector.return_value = file.name
        mock_exists.return_value = True
        mock_reader.return_value = geojson
        with self.settings(
            EXPORT_STAGING_ROOT='/var/lib/stage'
        ):
            # It should run through the entire process for a geojson file and return it
            dir = f"/var/lib/stage/{example_uid}"
            expected_file_name, expected_file_ext = os.path.splitext(file.name)
            expected_in_path = os.path.join(dir, f"in_{expected_file_name}-{example_uid}{expected_file_ext}")
            expected_out_path = os.path.join(dir, f"out_{expected_file_name}-{example_uid}.geojson")
            ret = file_to_geojson(file)
            self.assertEqual(ret, geojson)
            mock_makedir.assert_called_once_with(dir)
            mock_write.assert_called_once_with(file, expected_in_path)
            mock_meta.assert_called_once_with(expected_in_path, is_raster=False)
            mock_convert_vector.assert_called_once_with(expected_in_path, expected_out_path, fmt="geojson")
            mock_rm.assert_called_once_with(dir)
            mock_convert_vector.reset_mock()
            mock_meta.reset_mock()

            # It should run through the entire process for a zip shp and return a geojson
            file.name = 'something.zip'
            mock_split.return_value = 'something', '.zip'
            mock_unzip.return_value = True
            expected_file_name, expected_file_ext = os.path.splitext(file.name)
            expected_in_path = os.path.join(dir, f"in_{expected_file_name}-{example_uid}{expected_file_ext}")
            expected_out_path = os.path.join(dir, f"out_{expected_file_name}-{example_uid}.geojson")
            mock_listdirs.return_value = ['something.shp']
            updated_in_path = os.path.join(dir, 'something.shp')
            ret = file_to_geojson(file)
            self.assertEqual(ret, geojson)
            mock_unzip.assert_called_once_with(expected_in_path, dir)
            mock_listdirs.assert_called_with(dir)
            mock_meta.convert_vector(updated_in_path, is_raster=False)
            mock_convert_vector.assert_called_once_with(updated_in_path, expected_out_path, fmt="geojson")

            # It should raise an exception if there is no file extension
            file.name = 'something'
            mock_split.return_value = 'something', ''
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if zip does not contain shp
            file.name = 'thing.zip'
            mock_split.return_value = 'thing', '.zip'
            mock_unzip.return_value = True
            mock_listdirs.return_value = ['thing.dbf', 'thing.prj']
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if no driver can be found
            file.name = 'test.geojson'
            mock_split.return_value = 'test', '.geojson'
            mock_meta.return_value = {'driver': None, 'is_raster': None}
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if input file is not vector
            mock_meta.return_value = {'driver': 'GTiff', 'is_raster': True}
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if the convert throws one
            with self.assertRaises(Exception):
                mock_meta.return_value = {'driver': 'GeoJSON', 'is_raster': False}
                mock_convert_vector.side_effect = Exception('doh!')
                file_to_geojson(file)

            # It should raise and exception if output file does not exist
            with self.assertRaises(Exception):
                mock_exists.return_value = False
                file_to_geojson(file)

    @patch('eventkit_cloud.ui.helpers.json')
    def test_read_json_file(self, fake_json):
        file_path = '/path/to/file.geojson'
        geojson = {'type': 'FeatureCollection', 'other_stuff': {}}
        fake_json.load.return_value = geojson
        with patch('eventkit_cloud.ui.helpers.open', new_callable=mock_open()) as m:
            ret = read_json_file(file_path)
            self.assertEqual(ret, geojson)
            m.assert_called_once_with(file_path)
            fake_json.load.assert_called_once_with(m.return_value.__enter__.return_value)

            m.side_effect = Exception('Thats not right!')
            self.assertRaises(Exception, read_json_file, file_path)


    @patch('eventkit_cloud.ui.helpers.zipfile')
    def test_unzip_file(self, zipfile):
        mock_zip = Mock()
        mock_zip.extractall = Mock()
        mock_zip.close = Mock()
        zipfile.ZipFile.return_value = mock_zip

        file_path = '/path/to/file.txt'
        directory = '/path/to'

        ret = unzip_file(file_path, directory)
        self.assertTrue(ret)
        zipfile.ZipFile.assert_called_once_with(file_path, 'r')
        mock_zip.extractall.assert_called_once_with(directory)
        mock_zip.close.assert_called_once

        mock_zip.extractall.side_effect = Exception('oh no!')
        self.assertRaises(Exception, unzip_file, file_path, directory)

    def test_write_uploaded_file(self):
        with patch('eventkit_cloud.ui.helpers.open', new_callable=mock_open()) as m:
            test_file = Mock()
            test_file.chunks = Mock(return_value=['1', '2','3','4','5'])
            file_path = '/path/to/file.txt'
            ret = write_uploaded_file(test_file, file_path)
            self.assertTrue(ret)
            m.assert_called_once_with(file_path, 'wb+')
            test_file.chunks.assert_called_once
            self.assertEqual(m.return_value.__enter__.return_value.write.call_count, 5)

            m.side_effect = Exception('whoops!')
            self.assertRaises(Exception, write_uploaded_file, test_file, file_path)

    def test_is_mgrs(self):
        valid_spaced = '18S TJ 90000 10000'
        valid_no_space = '18STJ9000010000'
        invalid = '180 TJ S0000 10000'
        self.assertTrue(is_mgrs(valid_spaced))
        self.assertTrue(is_mgrs(valid_no_space))
        self.assertFalse(is_mgrs(invalid))

    def test_is_lat_lon(self):
        valid_1 = '90 180'
        valid_2 = '-45, -120'
        valid_3 = '+67.0890808,129.0980007'
        valid_4 = '38.00 N, 89.088 E'
        invalid_1 = '390, 97.00'
        invalid_2 = '45a -25.00'
        invalid_3 = '-45.0+67.00'
        self.assertTrue(is_lat_lon(valid_1))
        self.assertTrue(is_lat_lon(valid_2))
        self.assertTrue(is_lat_lon(valid_3))
        self.assertTrue(is_lat_lon(valid_4))
        self.assertFalse(is_lat_lon(invalid_1))
        self.assertFalse(is_lat_lon(invalid_2))
        self.assertFalse(is_lat_lon(invalid_3))

        with patch('eventkit_cloud.ui.helpers.float') as float:
            float.side_effect = ValueError
            self.assertFalse(is_lat_lon(valid_1))

        with patch('eventkit_cloud.ui.helpers.math') as math:
            math.isnan.return_value = True
            self.assertFalse(is_lat_lon(valid_3))


