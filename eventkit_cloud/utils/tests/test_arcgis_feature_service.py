# -*- coding: utf-8 -*-
import logging
import os
from mock import Mock, patch
from django.conf import settings
from django.test import TransactionTestCase
from string import Template
from ..arcgis_feature_service import ArcGISFeatureServiceToGPKG
from uuid import uuid4

logger = logging.getLogger(__name__)


class TestArcFeatureServiceToGPKG(TransactionTestCase):
    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch('eventkit_cloud.utils.arcgis_feature_service.TaskProcess')
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch('eventkit_cloud.tasks.models.ExportTaskRecord')
    @patch('eventkit_cloud.utils.arcgis_feature_service.os.path.exists')
    def test_create_convert(self, exists, export_task):
        gpkg = '/path/to/sqlite.gpkg'
        bbox = [-45, -45, 45, 45]
        layer = 'awesomeLayer'
        name = 'Great export'
        service_url = 'http://my-service.org/FeatureServer/query?=somequery'
        expected_url = '{}{}'.format(service_url.split('/query')[0], '/query?where=objectid%3Dobjectid&outfields=*&f=json')
        cmd = Template("ogr2ogr -skipfailures -t_srs EPSG:3857 -spat_srs EPSG:4326 -spat $minX $minY $maxX $maxY -f GPKG $gpkg '$url'")
        cmd = cmd.safe_substitute({'gpkg': gpkg, 'url': expected_url, 'minX': bbox[0], 'minY': bbox[1], 'maxX': bbox[2], 'maxY': bbox[3]})
        exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        service = ArcGISFeatureServiceToGPKG(gpkg=gpkg,
                                         bbox=bbox,
                                         service_url=service_url,
                                         layer=layer,
                                         debug=False,
                                         name=name,
                                         service_type=None,
                                         task_uid=self.task_uid)
        out = service.convert()
        self.task_process.assert_called_once_with(task_uid=self.task_uid)
        exists.assert_called_once_with(os.path.dirname(gpkg))
        self.task_process().start_process.assert_called_once_with(cmd, executable='/bin/sh', shell=True, stderr=-1,
                                                                  stdout=-1)
        self.assertEquals(out, gpkg)

        self.task_process.return_value = Mock(exitcode=1)
        with self.assertRaises(Exception):
            service.convert()