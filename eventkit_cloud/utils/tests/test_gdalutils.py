# -*- coding: utf-8 -*-
import logging
import os
from uuid import uuid4
from subprocess import Popen, PIPE

from django.test import TestCase
from mock import Mock, patch, call, MagicMock, ANY
from osgeo import gdal, ogr

from eventkit_cloud.utils.gdalutils import clip_dataset, is_envelope, convert, get_distance, \
    get_dimensions, merge_geotiffs, get_meta, get_band_statistics, track_progress

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

    @patch('eventkit_cloud.utils.gdalutils.is_envelope')
    @patch('eventkit_cloud.utils.gdalutils.get_meta')
    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    def test_clip_dataset(self, isfile, get_meta_mock, is_envelope_mock):

        isfile.return_value = True

        with self.assertRaises(Exception):
            clip_dataset(boundary=None, in_dataset=None)

        # Raster geopackage
        geojson_file = "/path/to/geojson"
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = "-ot byte"
        expected_cmd = "gdalwarp -overwrite -cutline {} -crop_to_cutline {} -of {} {} {} {}".format(
            geojson_file,
            "-dstalpha",
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True, 'nodata': None}
        is_envelope_mock.return_value = False
        self.task_process.return_value = Mock(exitcode=0)
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Geotiff
        fmt = "gtiff"
        band_type = ""
        expected_cmd = "gdalwarp -overwrite -cutline {} -crop_to_cutline {} -of {} {} {} {}".format(
            geojson_file,
            "",
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        get_meta_mock.return_value = {'driver': 'gtiff', 'is_raster': True, 'nodata': None}
        is_envelope_mock.return_value = True  # So, no need for -dstalpha
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Geotiff with non-envelope polygon cutline
        expected_cmd = "gdalwarp -overwrite -cutline {} -crop_to_cutline {} -of {} {} {} {}".format(
            geojson_file,
            "-dstalpha",
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        is_envelope_mock.return_value = False
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Vector
        fmt = "gpkg"
        expected_cmd = "ogr2ogr -overwrite -f {0} -clipsrc {1} {2} {3}".format(
            fmt,
            geojson_file,
            dataset,
            in_dataset
        )
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': False}
        clip_dataset(boundary=geojson_file, in_dataset=in_dataset, out_dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

    @patch('eventkit_cloud.utils.gdalutils.get_meta')
    @patch('eventkit_cloud.utils.gdalutils.os.path.isfile')
    @patch('eventkit_cloud.utils.gdalutils.os.rename')
    def test_convert(self, rename, isfile, get_meta_mock):

        isfile.return_value = True

        with self.assertRaises(Exception):
            convert(dataset=None)

        # No-op (same source and destination format)
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True}
        self.task_process.return_value = Mock(exitcode=0)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_not_called()

        # Raster geopackage from geotiff
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = "-ot byte"
        expected_cmd = "gdalwarp -overwrite -of {0} {1} {2} {3}".format(
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        get_meta_mock.return_value = {'driver': 'gtiff', 'is_raster': True, 'nodata': None}
        self.task_process.return_value = Mock(exitcode=0)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Geotiff from raster geopackage
        fmt = "gtiff"
        band_type = ""
        expected_cmd = "gdalwarp -overwrite -of {0} {1} {2} {3}".format(
            fmt,
            band_type,
            in_dataset,
            dataset
        )
        get_meta_mock.return_value = {'driver': 'gpkg', 'is_raster': True}
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Vector
        fmt = "gpkg"
        expected_cmd = "ogr2ogr -overwrite -f {0} {1} {2}".format(
            fmt,
            dataset,
            in_dataset
        )
        get_meta_mock.return_value = {'driver': 'geojson', 'is_raster': False}
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

    def test_track_progress(self):
        step = 0

        def assert_progress(progress):
            nonlocal step
            self.assertEqual(progress, step * 10.0)
            step += 1

        script_file = "{}/files/mock_gdal_progress.sh".format(
            os.path.dirname(os.path.abspath(__file__)).replace("\\", "/"))
        proc = Popen(["bash", "-c", script_file], stdout=PIPE, stderr=PIPE, bufsize=0, universal_newlines=True)
        track_progress(proc, assert_progress)
        self.assertEqual(step, 11)  # len([0, 10, 20, ..., 100])
