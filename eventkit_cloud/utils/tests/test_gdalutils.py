# -*- coding: utf-8 -*-
import logging
import os
from uuid import uuid4

from django.test import TestCase
from mock import Mock, patch, call, MagicMock, ANY
from osgeo import gdal, ogr

from eventkit_cloud.utils.gdalutils import convert, is_envelope, get_distance, \
    get_dimensions, merge_geotiffs, get_meta, get_band_statistics, convert_raster, convert_vector, progress_callback

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
    def test_get_meta(self, open_ds_mock, isfile):

        dataset_path = "/path/to/dataset"
        isfile.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        ds_mock = Mock(spec=gdal.Dataset)
        ds_mock.RasterCount = 0
        open_ds_mock.return_value = ds_mock
        ds_mock.GetDriver.return_value.ShortName = 'gtiff'
        expected_meta = {'driver': 'gtiff', 'is_raster': True, 'nodata': None}
        returned_meta = get_meta(dataset_path)
        self.assertEqual(expected_meta, returned_meta)

        ds_mock.RasterCount = 2
        ds_mock.GetRasterBand.return_value.GetNoDataValue.return_value = -32768.0
        expected_meta = {'driver': 'gtiff', 'is_raster': True, 'nodata': -32768.0}
        returned_meta = get_meta(dataset_path)
        self.assertEqual(expected_meta, returned_meta)

        ds_mock = Mock(spec=ogr.DataSource)
        open_ds_mock.return_value = ds_mock
        ds_mock.GetDriver.return_value.GetName.return_value = 'gpkg'
        expected_meta = {'driver': 'gpkg', 'is_raster': False, 'nodata': None}
        returned_meta = get_meta(dataset_path)
        self.assertEqual(expected_meta, returned_meta)

        open_ds_mock.return_value = None
        expected_meta = {'driver': None, 'is_raster': None, 'nodata': None}
        returned_meta = get_meta(dataset_path)
        self.assertEqual(expected_meta, returned_meta)

    def test_is_envelope(self):
        envelope_gj = """{"type": "MultiPolygon",
            "coordinates": [ [
                [   [0,0],
                    [1,0],
                    [1,1],
                    [0,1],
                    [0,0]
                ]
            ] ]
        }"""
        triangle_gj = """{"type": "MultiPolygon",
            "coordinates": [ [
                [   [0,0],
                    [1,0],
                    [0,1],
                    [0,0]
                ]
            ] ]
        }"""
        non_env_gj = """{"type": "MultiPolygon",
            "coordinates": [ [
                [   [0,0],
                    [1.5,0],
                    [1,1],
                    [0,1],
                    [0,0]
                ]
            ] ]
        }"""
        empty_gj = ""

        self.assertTrue(is_envelope(envelope_gj))
        self.assertFalse(is_envelope(triangle_gj))
        self.assertFalse(is_envelope(non_env_gj))
        self.assertFalse(is_envelope(empty_gj))

    @patch('eventkit_cloud.utils.gdalutils.get_task_command')
    @patch('eventkit_cloud.utils.gdalutils.is_envelope')
    @patch('eventkit_cloud.utils.gdalutils.get_meta')
    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    def test_convert(self, isfile, get_meta_mock, is_envelope_mock, get_task_command_mock):

        isfile.return_value = True

        with self.assertRaises(Exception):
            convert(boundary=None, input_file=None)

        # Raster geopackage
        extra_parameters = ""
        in_projection = "EPSG:4326"
        out_projection = "EPSG:3857"
        geojson_file = "/path/to/geojson"
        out_dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = gdal.GDT_Byte
        dstalpha = True
        lambda_mock = Mock()
        get_task_command_mock.return_value = lambda_mock
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True, 'nodata': None}
        is_envelope_mock.return_value = False
        convert(boundary=geojson_file, input_file=in_dataset, output_file=out_dataset, fmt=fmt, task_uid=self.task_uid, projection=3857)
        get_task_command_mock.assert_called_once_with(convert_raster, in_dataset, out_dataset, fmt=fmt, creation_options=None,
                                     band_type=band_type, dst_alpha=dstalpha, boundary=geojson_file, compress=False,
                                     src_srs=in_projection, dst_srs=out_projection, task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()

        # Geotiff
        fmt = "gtiff"
        band_type = None
        dstalpha = None
        get_meta_mock.return_value = {'driver': 'gtiff', 'is_raster': True, 'nodata': None}
        is_envelope_mock.return_value = True  # So, no need for -dstalpha
        convert(boundary=geojson_file, input_file=in_dataset, output_file=out_dataset, fmt=fmt, task_uid=self.task_uid)
        get_task_command_mock.assert_called_once_with(convert_raster, in_dataset, out_dataset, fmt=fmt,
                                                      creation_options=None, band_type=band_type, dst_alpha=dstalpha,
                                                      boundary=geojson_file, compress=False, src_srs=in_projection,
                                                      dst_srs=in_projection, task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()

        # Geotiff with non-envelope polygon cutline
        is_envelope_mock.return_value = False
        dstalpha = True
        convert(boundary=geojson_file, input_file=in_dataset, output_file=out_dataset, fmt=fmt, task_uid=self.task_uid)
        get_task_command_mock.assert_called_once_with(convert_raster, in_dataset, out_dataset, fmt=fmt,
                                                      creation_options=None, band_type=band_type, dst_alpha=dstalpha,
                                                      boundary=geojson_file, compress=False, src_srs=in_projection,
                                                      dst_srs=in_projection, task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()

        # Vector
        fmt = "gpkg"
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': False}
        convert(boundary=geojson_file, input_file=in_dataset, output_file=out_dataset, fmt=fmt, task_uid=self.task_uid)
        get_task_command_mock.assert_called_once_with(convert_vector, in_dataset, out_dataset, fmt=fmt,
                                                      creation_options=None, src_srs=in_projection,
                                                      dst_srs=in_projection, layers=None, boundary=geojson_file, bbox=None,
                                                      task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()

        # Test that extra_parameters are added when converting to NITF.
        fmt = "nitf"
        extra_parameters = "-co ICORDS=G"
        in_projection = "EPSG:4326"
        out_projection = "EPSG:3857"
        band_type = None
        dstalpha = True
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True}
        convert(fmt=fmt, input_file=in_dataset, creation_options=extra_parameters, output_file=out_dataset, task_uid=self.task_uid, projection=3857)
        get_task_command_mock.assert_called_once_with(convert_raster, in_dataset, out_dataset, fmt=fmt,
                                                      creation_options=extra_parameters,
                                                      band_type=band_type, dst_alpha=dstalpha, boundary=None,
                                                      compress=False,  src_srs=in_projection, dst_srs=out_projection,
                                                      task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()

        # Test converting to a new projection
        fmt = "gpkg"
        in_projection = "EPSG:4326"
        out_projection = "EPSG:3857"
        band_type = gdal.GDT_Byte
        dstalpha = True
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True}
        convert(fmt=fmt, input_file=in_dataset, output_file=out_dataset, task_uid=self.task_uid, projection=3857)
        get_task_command_mock.assert_called_once_with(convert_raster, in_dataset, out_dataset, fmt=fmt,
                                                      creation_options=None,
                                                      band_type=band_type, dst_alpha=dstalpha, boundary=None,
                                                      compress=False,
                                                      src_srs=in_projection, dst_srs=out_projection,
                                                      task_uid=self.task_uid)
        get_task_command_mock.reset_mock()
        self.task_process().start_process.assert_called_once_with(lambda_mock)
        self.task_process.reset_mock()


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

    def test_merge_geotiffs(self):
        in_files = ['1.tif', '2.tif', '3.tif', '4.tif']
        out_file = 'merged.tif'
        task_uid = "1234"
        result = merge_geotiffs(in_files, out_file, task_uid=task_uid)
        self.task_process.start_process.called_once()
        self.assertEqual(out_file, result)

        with self.assertRaises(Exception):
            self.task_process().start_process.side_effect = Exception("Error")
            merge_geotiffs(in_files, out_file, task_uid=task_uid)

    @patch('eventkit_cloud.utils.gdalutils.gdal')
    def test_get_band_statistics(self, mock_gdal):
        in_file = "test.tif"
        example_stats = [0, 10, 5, 2]
        mock_gdal.Open.return_value.GetRasterBand.return_value.GetStatistics.return_value = example_stats
        returned_stats = get_band_statistics(in_file)
        self.assertEqual(example_stats, returned_stats)
        mock_gdal.Open.assert_called_once_with(in_file)

        mock_gdal.Open.return_value.GetRasterBand.return_value.GetStatistics.side_effect = [Exception]
        self.assertIsNone(get_band_statistics(in_file))

    @patch('eventkit_cloud.utils.gdalutils.update_progress')
    def test_progress_callback(self, mock_update_progress):
        example_percentage = .10
        example_message = "message"
        task_uid = "123"
        subtask_percentage = 100
        example_user_data = {"task_uid": task_uid, "subtask_percentage": subtask_percentage}
        progress_callback(example_percentage, example_message, example_user_data)
        mock_update_progress.assert_called_once_with(task_uid, progress=10,
                                                     subtask_percentage=subtask_percentage,
                                                     msg=example_message)

    @patch('eventkit_cloud.utils.gdalutils.get_dataset_names')
    @patch('eventkit_cloud.utils.gdalutils.gdal')
    def test_convert_raster(self, mock_gdal, mock_get_dataset_names):
        task_uid = '123'
        input_file = '/test/test.gpkg'
        output_file = '/test/test.tif'
        compress = True
        boundary = '/test/test.json'
        fmt = 'gtiff'
        srs = "EPSG:4326"

        mock_get_dataset_names.return_value = (input_file, output_file)
        convert_raster(input_file, output_file, fmt=fmt, boundary=boundary,
                       compress=compress, src_srs=srs, dst_srs=srs, task_uid=task_uid)
        mock_gdal.Warp.assert_called_once_with(output_file, [input_file],
                                               callback=progress_callback,
                                               callback_data={'task_uid': task_uid, 'subtask_percentage': 50},
                                               cropToCutline=True, cutlineDSName=boundary,
                                               dstSRS=srs, format=fmt, srcSRS=srs)
        mock_gdal.Translate.assert_called_once_with(output_file, input_file, bandList=[1, 2, 3],
                                                    callback=progress_callback, format=fmt,
                                                    callback_data={'task_uid': task_uid, 'subtask_percentage': 50},
                                                    creationOptions=['COMPRESS=JPEG',
                                                                      'PHOTOMETRIC=YCBCR',
                                                                      'TILED=YES'])

    @patch('eventkit_cloud.utils.gdalutils.gdal')
    def test_convert_vector(self, mock_gdal):
        task_uid = '123'
        input_file = '/test/test.gpkg'
        output_file = '/test/test.kml'
        boundary = '/test/test.json'
        fmt = 'kml'
        src_srs = "EPSG:4326"
        dst_srs = "EPSG:3857"

        convert_vector(input_file, output_file, fmt=fmt, boundary=boundary,
                       src_srs=src_srs, dst_srs=dst_srs, task_uid=task_uid)
        mock_gdal.VectorTranslate.assert_called_once_with(output_file, input_file, accessMode='overwrite',
                                                          callback=progress_callback,
                                                          callback_data={'task_uid': task_uid}, dstSRS=dst_srs,
                                                          format=fmt, geometryType='PROMOTE_TO_MULTI',
                                                          options=['-clipSrc', boundary],
                                                          reproject=True, skipFailures=True, srcSRS=src_srs)
