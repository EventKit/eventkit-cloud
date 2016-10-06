# -*- coding: utf-8 -*-
# test cases for HOT Export Tasks
import cPickle
import logging
import os
import sys
import uuid

from mock import call, Mock, PropertyMock, patch

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase

from celery.datastructures import ExceptionInfo

from eventkit_cloud.jobs import presets
from eventkit_cloud.jobs.models import Job, Tag
from eventkit_cloud.tasks.export_tasks import (
    ExportTaskErrorHandler, FinalizeRunTask,
    GeneratePresetTask, KmlExportTask, OSMConfTask, WMSExportTask, GeopackageExportTask,
    OSMPrepSchemaTask, OSMToPBFConvertTask, OverpassQueryTask, ShpExportTask
)
from eventkit_cloud.tasks.models import ExportRun, ExportTask, ExportTaskResult, ExportProviderTask

logger = logging.getLogger(__name__)


class TestExportTasks(TestCase):
    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        # bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob',
                                      description='Test description', user=self.user,
                                      the_geom=the_geom)
        self.job.feature_save = True
        self.job.feature_pub = True
        self.job.save()
        self.run = ExportRun.objects.create(job=self.job, user=self.user)
        parser = presets.PresetParser(self.path + '/files/hdm_presets.xml')
        tags = parser.parse()
        self.assertIsNotNone(tags)
        self.assertEquals(238, len(tags))
        # save all the tags from the preset
        for tag_dict in tags:
            tag = Tag.objects.create(
                key=tag_dict['key'],
                value=tag_dict['value'],
                job=self.job,
                data_model='osm',
                geom_types=tag_dict['geom_types']
            )
        self.assertEquals(238, self.job.tags.all().count())

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.osmconf.OSMConfig')
    def test_run_osmconf_task(self, mock_config, mock_request):
        task = OSMConfTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        osm_conf = mock_config.return_value
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid))
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.ini'.format(job_name))
        osm_conf.create_osm_conf.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='osmconf')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        osm_conf.create_osm_conf.assert_called_with(stage_dir=stage_dir)
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.overpass.Overpass')
    def test_run_overpass_task(self, overpass, mock_request):
        task = OverpassQueryTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        overpass = overpass.return_value
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        job_name = self.job.name.lower()
        raw_osm_path = stage_dir + '/' + 'query.osm'
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.osm'.format(job_name))
        overpass.run_query.return_value = raw_osm_path
        overpass.filter.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Overpass Query')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        overpass.run_query.assert_called_once()
        overpass.filter.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.pbf.OSMToPBF')
    def test_run_osmtopbf_task(self, mock_overpass, mock_request):
        task = OSMToPBFConvertTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        osmtopbf = mock_overpass.return_value
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.pbf'.format(job_name))
        osmtopbf.convert.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='OSM2PBF')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        osmtopbf.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.osmparse.OSMParser')
    def test_run_osmprepschema_task(self, mock_parser, mock_request):
        task = OSMPrepSchemaTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        prep_schema = mock_parser.return_value
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.sqlite'.format(job_name))
        prep_schema.instancemethod.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='OSM Schema Prep')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        prep_schema.instancemethod.assert_called_once()
        prep_schema.create_spatialite.assert_called_once()
        prep_schema.create_default_schema.assert_called_once()
        prep_schema.upate_zindexes.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.shp.SQliteToShp')
    def test_run_shp_export_task(self, mock, mock_request):
        task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        sqlite_to_shp = mock.return_value
        job_name = self.job.name.lower()
        sqlite_to_shp.convert.return_value = '/path/to/' + job_name + '.shp'
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        sqlite_to_shp.convert.assert_called_once()
        self.assertEquals('/path/to/' + job_name + '.shp', result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.kml.SQliteToKml')
    def test_run_kml_export_task(self, mock_kml, mock_request):
        task = KmlExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        sqlite_to_kml = mock_kml.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.kmz'.format(job_name))
        sqlite_to_kml.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='SQliteToKml')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        sqlite_to_kml.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.geopackage.SQliteToGeopackage')
    def test_run_gpkg_export_task(self, mock_gpkg, mock_request):
        task = GeopackageExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        sqlite_to_gpkg = mock_gpkg.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        sqlite_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        sqlite_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.wms.WMSToGeopackage')
    def test_run_wms_export_task(self, mock_wms, mock_request):
        task = WMSExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        wms_to_gpkg = mock_wms.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        wms_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status='PENDING',
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        wms_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals('RUNNING', run_task.status)

    @patch('os.makedirs')
    @patch('os.path.exists')
    @patch('shutil.copy')
    @patch('os.stat')
    def test_task_on_success(self, os_stat, shutil_copy, exists, mkdirs):
        exists.return_value = False  # download dir doesn't exist
        osstat = os_stat.return_value
        type(osstat).st_size = PropertyMock(return_value=1234567890)
        shp_export_task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        succeeded_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status='RUNNING',
            name=shp_export_task.name
        )
        shp_export_task = ShpExportTask()
        provider_slug = 'osm-vector'
        download_url = '/'.join([settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(self.run.uid),
                                 provider_slug, 'file.shp'])
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(self.run.uid))
        provider_dir = os.path.join(run_dir, provider_slug)
        shp_export_task.on_success(retval={'result': download_url}, task_id=celery_uid,
                                   args={}, kwargs={'run_uid': str(self.run.uid)})
        os_stat.assert_called_once_with(download_url)
        exists.assert_has_calls([call(run_dir), call(provider_dir)])
        mkdirs.assert_has_calls([call(run_dir), call(provider_dir)])
        task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        result = task.result
        self.assertIsNotNone(result)
        self.assertEqual(task, result.task)
        self.assertEquals('SUCCESS', task.status)
        self.assertEquals('ESRI Shapefile Format', task.name)
        # pull out the result and test
        result = ExportTaskResult.objects.get(task__celery_uid=celery_uid)
        self.assertIsNotNone(result)
        self.assertEquals(download_url, result.download_url)

    def test_task_on_failure(self, ):
        shp_export_task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        succeeded_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status='RUNNING',
            name=shp_export_task.name
        )
        exc = None
        exc_info = None
        try:
            raise ValueError('some unexpected error')
        except ValueError as e:
            exc = e
            exc_info = sys.exc_info()
        einfo = ExceptionInfo(exc_info=exc_info)
        shp_export_task.on_failure(exc, task_id=celery_uid, einfo=einfo,
                                   args={}, kwargs={'run_uid': str(self.run.uid)})
        task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        exception = task.exceptions.all()[0]
        exc_info = cPickle.loads(str(exception.exception)).exc_info
        error_type, msg, tb = exc_info[0], exc_info[1], exc_info[2]
        self.assertEquals(error_type, ValueError)
        self.assertEquals('some unexpected error', str(msg))
        # traceback.print_exception(error_type, msg, tb)

    @patch('celery.app.task.Task.request')
    def test_generate_preset_task(self, mock_request):
        task = GeneratePresetTask()
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        celery_uid = str(uuid.uuid4())
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        succeeded_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status='RUNNING',
            name=task.name
        )
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        result = task.run(run_uid=run_uid, task_uid=succeeded_task.uid, job_name='testjob')
        expected_result = stage_dir + 'testjob_preset.xml'
        config = self.job.configs.all()[0]
        expected_path = config.upload.path
        self.assertEquals(result['result'], expected_path)
        os.remove(expected_path)

    @patch('django.core.mail.EmailMessage')
    @patch('shutil.rmtree')
    def test_finalize_run_task(self, rmtree, email):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        succeeded_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status='SUCCESS',
            name='Default Shapefile Export'
        )
        task = FinalizeRunTask()
        self.assertEquals('Finalize Export Run', task.name)
        task.run(run_uid=run_uid, stage_dir=stage_dir)
        rmtree.assert_called_once_with(stage_dir)
        msg = Mock()
        email.return_value = msg
        msg.send.assert_called_once()
        # self.assertEquals('SUCCESS', self.run.status)

    @patch('django.core.mail.EmailMessage')
    @patch('shutil.rmtree')
    @patch('os.path.isdir')
    def test_export_task_error_handler(self, isdir, rmtree, email):
        msg = Mock()
        email.return_value = msg
        celery_uid = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        succeeded_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            uid=task_id,
            celery_uid=celery_uid,
            status='FAILED',
            name='Default Shapefile Export'
        )
        task = ExportTaskErrorHandler()
        self.assertEquals('Export Task Error Handler', task.name)
        task.run(run_uid=run_uid, task_id=task_id, stage_dir=stage_dir)
        isdir.assert_any_call(stage_dir)
        rmtree.assert_called_once_with(stage_dir)
        msg.send.assert_called_once()
        run = ExportRun.objects.get(uid=run_uid)
        self.assertEquals('FAILED', run.status)
