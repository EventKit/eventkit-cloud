# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os
from mock import Mock, patch, call, mock_open
from ..helpers import cd, get_style_files, get_file_paths, file_to_geojson, \
    read_json_file, unzip_file, write_uploaded_file

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):

    def test_cd(self):
        current_path = os.getcwd()
        parent_path = os.path.dirname(current_path)
        with cd(parent_path):
            self.assertEquals(parent_path, os.getcwd())
        self.assertEquals(current_path, os.getcwd())

    def test_get_style_files(self):
        for file in get_style_files():
            self.assertTrue(os.path.isfile(file))

    def test_get_file_paths(self):
        self.assertTrue(os.path.abspath(__file__) in get_file_paths(os.path.dirname(__file__)))

    @patch('eventkit_cloud.ui.helpers.os.path.splitext')
    @patch('eventkit_cloud.ui.helpers.shutil.rmtree')
    @patch('eventkit_cloud.ui.helpers.read_json_file')
    @patch('eventkit_cloud.ui.helpers.os.path.exists')
    @patch('eventkit_cloud.ui.helpers.subprocess')
    @patch('eventkit_cloud.ui.helpers.driver_for')
    @patch('eventkit_cloud.ui.helpers.os.listdir')
    @patch('eventkit_cloud.ui.helpers.unzip_file')
    @patch('eventkit_cloud.ui.helpers.write_uploaded_file')
    @patch('eventkit_cloud.ui.helpers.os.mkdir')
    @patch('eventkit_cloud.ui.helpers.uuid4')
    def test_file_to_geojson(self, uid, makedir, write, unzip, listdirs, driver, subproc, exists, reader, rm, split):
        geojson = {'type': 'FeatureCollection', 'other_stuff': {}}
        file = Mock()
        file.name = 'test_file.geojson'
        split.return_value = 'test_file', '.geojson'
        uid.return_value = 12345
        makedir.return_value = True
        write.return_value = True
        unzip.return_value = False
        listdirs.return_value = []
        driver.return_value = ('GeoJSON', False)
        proc = Mock()
        proc.wait = Mock()
        subproc.Popen.return_value = proc
        exists.return_value = True
        reader.return_value = geojson
        with self.settings(
            EXPORT_STAGING_ROOT='/var/lib/stage'
        ):
            # It should run through the entire process for a geojson file and return it
            dir = '/var/lib/stage/12345'
            expected_file_name, expected_file_ext = os.path.splitext(file.name)
            expected_in_path = os.path.join(dir, 'in_{0}{1}'.format(expected_file_name, expected_file_ext))
            expected_out_path = os.path.join(dir, 'out_{0}.geojson'.format(expected_file_name))
            ret = file_to_geojson(file)
            self.assertEquals(ret, geojson)
            makedir.assert_called_once_with(dir)
            write.assert_called_once_with(file, expected_in_path)
            driver.assert_called_once_with(expected_in_path)
            expected_cmd = "ogr2ogr -f geojson {0} {1}".format(expected_out_path, expected_in_path)
            subproc.Popen.assert_called_once_with(expected_cmd, shell=True, executable='/bin/bash')
            rm.assert_called_once_with(dir)


            # It should run through the entire process for a zip shp and return a geojson
            file.name = 'something.zip'
            split.return_value = 'something', '.zip'
            unzip.return_value = True
            expected_file_name, expected_file_ext = os.path.splitext(file.name)
            expected_in_path = os.path.join(dir, 'in_{0}{1}'.format(expected_file_name, expected_file_ext))
            expected_out_path = os.path.join(dir, 'out_{0}.geojson'.format(expected_file_name))
            listdirs.return_value = ['something.shp']
            updated_in_path = os.path.join(dir, 'something.shp')
            updated_cmd = 'ogr2ogr -f geojson {0} {1}'.format(expected_out_path, updated_in_path)
            ret = file_to_geojson(file)
            self.assertEquals(ret, geojson)
            unzip.assert_called_once_with(expected_in_path, dir)
            listdirs.assert_called_with(dir)
            driver.assert_called_with(updated_in_path)
            subproc.Popen.called_with(updated_cmd, shell=True, executable='/bin/bash')

            # It should raise an exception if there is no file extension
            file.name = 'something'
            split.return_value = 'something', ''
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if zip does not contain shp
            file.name = 'thing.zip'
            split.return_value = 'thing', '.zip'
            unzip.return_value = True
            listdirs.return_value = ['thing.dbf', 'thing.prj']
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if no driver can be found
            file.name = 'test.geojson'
            split.return_value = 'test', '.geojson'
            driver.return_value = None, None
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise an exception if the subprocess throws one
            driver.return_value = 'GeoJSON', False
            subproc.Popen.side_effect = Exception('doh!')
            self.assertRaises(Exception, file_to_geojson, file)

            # It should raise and exception if output file does not exist
            subproc.Popen.side_effect = None
            exists.return_value = False
            self.assertRaises(Exception, file_to_geojson, file)

    @patch('eventkit_cloud.ui.helpers.json')
    def test_read_json_file(self, fake_json):
        file_path = '/path/to/file.geojson'
        geojson = {'type': 'FeatureCollection', 'other_stuff': {}}
        fake_json.load.return_value = geojson
        with patch('eventkit_cloud.ui.helpers.open', new_callable=mock_open()) as m:
            ret = read_json_file(file_path)
            self.assertEquals(ret, geojson)
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
            m.assert_called_once_with(file_path, 'w+')
            test_file.chunks.assert_called_once
            self.assertEqual(m.return_value.__enter__.return_value.write.call_count, 5)

            m.side_effect = Exception('whoops!')
            self.assertRaises(Exception, write_uploaded_file, test_file, file_path)