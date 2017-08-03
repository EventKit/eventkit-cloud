# -*- coding: utf-8 -*-
import logging
import os
from osgeo import gdal, ogr
from mock import Mock, patch, call
from uuid import uuid4
from django.test import TestCase

from ..gdalutils import open_ds, cleanup_ds, clip_dataset, convert, driver_for

logger = logging.getLogger(__name__)


class TestGeopackage(TestCase):
    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.task_process_patcher = patch('eventkit_cloud.utils.gdalutils.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('osgeo.gdal')
    @patch('osgeo.ogr')
    def test_driver_for(self, ogr_mock, gdal_mock):

        dataset_path = "/path/to/dataset"

        gdal_mock.Open().__enter__().GetDriver.return_value = gdal.GetDriverByName('gtiff')
        expected_driver, expected_is_raster = 'gtiff', True
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_driver, returned_driver)
        self.assertEqual(expected_is_raster, returned_is_raster)
        gdal_mock.Open.assert_called_once_with(dataset_path)

        gdal_mock.Open.side_effect = RuntimeError("not recognized as a supported file format")
        ogr_mock.Open().__enter__().GetDriver.return_value = ogr.GetDriverByName('gpkg')
        expected_driver, expected_is_raster = 'gpkg', False
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_driver, returned_driver)
        self.assertEqual(expected_is_raster, returned_is_raster)
        ogr_mock.Open.assert_called_once_with(dataset_path)

        ogr_mock.Open.return_value = None
        expected_driver, expected_is_raster = None, None
        returned_driver, returned_is_raster = driver_for(dataset_path)
        self.assertEqual(expected_driver, returned_driver)
        self.assertEqual(expected_is_raster, returned_is_raster)

    @patch('os.rename')
    def test_clip_dataset(self, rename):

        with self.assertRaises(Exception):
            clip_dataset(geojson_file=None, dataset=None)

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
        self.task_process.return_value = Mock(exitcode=0)
        clip_dataset(geojson_file=geojson_file, dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)
        rename.assert_called_once_with(dataset, in_dataset)

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
        clip_dataset(geojson_file=geojson_file, dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)
        rename.assert_called_once_with(dataset, in_dataset)

        # Vector
        fmt = "gpkg"
        expected_cmd = "ogr2ogr - f {0} - clipsrc {1} {2} {3}".format(
            fmt,
            geojson_file,
            dataset,
            in_dataset
        )
        clip_dataset(geojson_file=geojson_file, dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)
        rename.assert_called_once_with(dataset, in_dataset)

    @patch('os.rename')
    def test_convert(self, rename):

        with self.assertRaises(Exception):
            convert(dataset=None)

        # Raster geopackage
        geojson_file = "/path/to/geojson"
        dataset = "/path/to/dataset"
        in_dataset = "/path/to/old_dataset"
        fmt = "gpkg"
        band_type = "-ot byte"
        expected_cmd = "gdalwarp -of {0} {1} {2} {3}".format(
            geojson_file,
            band_type,
            in_dataset,
            dataset
        )
        self.task_process.return_value = Mock(exitcode=0)
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)

        # Geotiff
        fmt = "gtiff"
        band_type = ""
        expected_cmd = "gdalwarp -of {0} {1} {2} {3}".format(
            geojson_file,
            band_type,
            in_dataset,
            dataset
        )
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
        convert(dataset=dataset, fmt=fmt, task_uid=self.task_uid)
        self.task_process().start_process.assert_called_with(expected_cmd, executable='/bin/bash', shell=True,
                                                             stderr=-1, stdout=-1)
