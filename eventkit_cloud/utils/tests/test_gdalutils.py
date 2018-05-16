# -*- coding: utf-8 -*-
import logging
import os
from osgeo import gdal, ogr
from mock import Mock, patch, call, MagicMock,ANY
from uuid import uuid4
from django.test import TestCase

from ..gdalutils import open_ds, cleanup_ds, clip_dataset, convert, driver_for, get_transform, get_distance, \
    get_dimensions, get_line, merge_geotiffs

logger = logging.getLogger(__name__)


class TestGdalUtils(TestCase):
    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.task_process_patcher = patch('eventkit_cloud.utils.gdalutils.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    @patch('eventkit_cloud.utils.gdalutils.open_ds')
    def test_driver_for(self, open_ds_mock, isfile):

        dataset_path = "/path/to/dataset"
        isfile.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        ds_mock = Mock(spec=gdal.Dataset)
        open_ds_mock.return_value = ds_mock
        ds_mock.GetDriver.return_value.ShortName = 'gtiff'
        expected_driver, expected_is_raster = 'gtiff', True
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_driver, returned_driver)
        self.assertEqual(expected_is_raster, returned_is_raster)

        ds_mock = Mock(spec=ogr.DataSource)
        open_ds_mock.return_value = ds_mock
        ds_mock.GetDriver.return_value.GetName = 'gpkg'
        open_ds_mock.return_value = Mock(spec=ogr.DataSource)
        expected_driver, expected_is_raster = 'gpkg', False
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_is_raster, returned_is_raster)

        open_ds_mock.return_value = None
        expected_driver, expected_is_raster = None, None
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_driver, returned_driver)
        self.assertEqual(expected_is_raster, returned_is_raster)

    @patch('eventkit_cloud.utils.gdalutils.driver_for')
    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    def test_clip_dataset(self, isfile, driver_for_mock):

        isfile.return_value = True

        with self.assertRaises(Exception):
            clip_dataset(boundary=None, dataset=None)

        # Raster geopackage
        geojson_file = "/path/to/geojson"
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = "-ot byte"
        expected_cmd = "gdalwarp -cutline {0} -crop_to_cutline -dstalpha -of {1} {2} {3} {4}".format(
            geojson_file,
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        driver_for_mock.return_value = ('gpkg', True)
        self.task_process.return_value = Mock(exitcode=0)
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)


        # Geotiff
        fmt = "gtiff"
        band_type = ""
        expected_cmd = "gdalwarp -cutline {0} -crop_to_cutline -dstalpha -of {1} {2} {3} {4}".format(
            geojson_file,
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        driver_for_mock.return_value = ('gtiff', True)
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Vector
        fmt = "gpkg"
        expected_cmd = "ogr2ogr -f {0} -clipsrc {1} {2} {3}".format(
            fmt,
            geojson_file,
            dataset,
            in_dataset
        )
        driver_for_mock.return_value = ('gpkg', False)
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

    @patch('eventkit_cloud.utils.gdalutils.driver_for')
    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    @patch('eventkit_cloud.utils.gdalutils.os.rename')
    def test_convert(self, rename, isfile, driver_for_mock):

        isfile.return_value = True

        with self.assertRaises(Exception):
            convert(dataset=None)

        # No-op (same source and destination format)
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        driver_for_mock.return_value = ('gpkg', True)
        self.task_process.return_value = Mock(exitcode=0)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_not_called()

        # Raster geopackage from geotiff
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = "-ot byte"
        expected_cmd = "gdalwarp -of {0} {1} {2} {3}".format(
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        driver_for_mock.return_value = ('geotiff', True)
        self.task_process.return_value = Mock(exitcode=0)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Geotiff from raster geopackage
        fmt = "gtiff"
        band_type = ""
        expected_cmd = "gdalwarp -of {0} {1} {2} {3}".format(
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        driver_for_mock.return_value = ('gpkg', True)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Vector
        fmt = "gpkg"
        expected_cmd = "ogr2ogr -f {0} {1} {2}".format(
            fmt,
            dataset,
            in_dataset
        )
        driver_for_mock.return_value = ('geojson', False)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

    def test_get_distance(self,):
        expected_distance = 972.38
        point_a = [-72.377162, 42.218109]
        point_b = [-72.368493, 42.218903]
        distance = get_distance(point_a, point_b)
        self.assertEqual(int(expected_distance), int(distance))

    @patch('eventkit_cloud.utils.gdalutils.get_distance')
    def test_get_dimensions(self, mock_get_distance):
        bbox = [0, 1, 2, 3]
        scale = 10
        expected_dim = [10, 20]
        mock_get_distance.side_effect = [100, 200]
        dim = get_dimensions(bbox, scale)
        mock_get_distance.assert_has_calls(
            [call([bbox[0], bbox[1]], [bbox[2], bbox[1]]), call([bbox[0], bbox[1]], [bbox[0], bbox[3]])])
        self.assertEqual(dim, expected_dim)

    @patch('eventkit_cloud.utils.gdalutils.TaskProcess')
    def test_merge_geotiffs(self, mock_taskprocess):
        in_files = ['1.tif', '2.tif', '3.tif', '4.tif']
        out_file = 'merged.tif'
        task_uid = "1234"
        expected_command = "gdalwarp {0} {1}".format(' '.join(in_files), out_file)
        mock_tp = MagicMock()
        mock_tp.exitcode = 0
        mock_taskprocess.return_value = mock_tp
        result = merge_geotiffs(in_files, out_file, task_uid=task_uid)
        mock_tp.start_process.called_once_with(expected_command, shell=True, executable="/bin/bash",
                               stdout=ANY, stderr=ANY)
        self.assertEqual(out_file, result)

        with self.assertRaises(Exception):
            mock_tp.exitcode = 1
            merge_geotiffs(in_files, out_file, task_uid=task_uid)


