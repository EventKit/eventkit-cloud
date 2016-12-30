# -*- coding: utf-8 -*-
# test cases for HOT Export Tasks
import cPickle
import logging
import os
import sys
import uuid

from celery.datastructures import ExceptionInfo
import celery.states
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone as real_timezone
from django.utils import timezone
from mock import call, Mock, PropertyMock, patch
import signal

from ...jobs import presets
from ...jobs.models import Job, Tag
from ..export_tasks import (
    ExportTaskErrorHandler, FinalizeRunTask,
    GeneratePresetTask, KmlExportTask, OSMConfTask,
    ExternalRasterServiceExportTask, GeopackageExportTask,
    OSMPrepSchemaTask, OSMToPBFConvertTask, OverpassQueryTask,
    ShpExportTask, ArcGISFeatureServiceExportTask, update_progress,
    ZipFileTask, PickUpRunTask, CancelExportProviderTask, KillTask, TaskStates
)
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTask,
    ExportTaskResult,
    ExportProviderTask
)

logger = logging.getLogger(__name__)


class ExportTaskBase(TestCase):
    def setUp(self, ):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(
            username='demo',
            email='demo@demo.com',
            password='demo'
        )
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name='TestJob',
            description='Test description',
            user=self.user,
            the_geom=the_geom
        )
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
            Tag.objects.create(name=tag_dict['key'], value=tag_dict['value'], job=self.job,
                               data_model='osm', geom_types=tag_dict['geom_types'])
        self.assertEquals(238, self.job.tags.all().count())


class TestExportTasks(ExportTaskBase):
    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.osmconf.OSMConfig')
    def test_run_osmconf_task(self, mock_config, mock_request):
        task = OSMConfTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        osm_conf = mock_config.return_value
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid))
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'),
            str(self.run.uid)),
            '{}.ini'.format(job_name)
        )
        osm_conf.create_osm_conf.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='osmconf')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        osm_conf.create_osm_conf.assert_called_with(stage_dir=stage_dir)
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

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
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        overpass.run_query.assert_called_once()
        overpass.filter.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

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
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        osmtopbf.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

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
                                            '{}_generic.gpkg'.format(job_name))
        prep_schema.instancemethod.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='OSM Schema Prep')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
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
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.shp.GPKGToShp')
    def test_run_shp_export_task(self, mock, mock_request):
        task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        gpkg_to_shp = mock.return_value
        job_name = self.job.name.lower()
        gpkg_to_shp.convert.return_value = '/path/to/' + job_name + '.shp'
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_shp.convert.assert_called_once()
        self.assertEquals('/path/to/' + job_name + '.shp', result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.kml.GPKGToKml')
    def test_run_kml_export_task(self, mock_kml, mock_request):
        task = KmlExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        gpkg_to_kml = mock_kml.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.kmz'.format(job_name))
        gpkg_to_kml.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='GPKGToKml')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_kml.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.geopackage.SQliteToGeopackage')
    def test_run_gpkg_export_task(self, mock_gpkg, mock_request):
        task = GeopackageExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        sqlite_to_gpkg = mock_gpkg.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}_generic.gpkg'.format(job_name))
        sqlite_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        sqlite_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.arcgis_feature_service.ArcGISFeatureServiceToGPKG')
    def test_run_arcgis_feature_service_export_task(self, mock_service, mock_request):
        task = ArcGISFeatureServiceExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        arcfs_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        arcfs_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        arcfs_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.external_service.ExternalRasterServiceToGeopackage')
    def test_run_external_raster_service_export_task(self, mock_service, mock_request):
        task = ExternalRasterServiceExportTask()
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        service_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        service_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task, status=TaskStates.PENDING.value,
                                                      name=task.name)
        result = task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        service_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.s3.upload_to_s3')
    @patch('os.makedirs')
    @patch('os.path.exists')
    @patch('shutil.copy')
    @patch('os.stat')
    @patch('django.utils.timezone')
    def test_task_on_success(self, time, os_stat, shutil_copy, exists, mkdirs, s3):
        exists.return_value = False  # download dir doesn't exist
        real_time = real_timezone.now()
        time.now.return_value = real_time
        expected_time = real_time.strftime('%Y%m%d')
        download_file = '{0}-{1}-{2}{3}'.format('file', 'osm-generic', expected_time, '.shp')
        osstat = os_stat.return_value
        s3_url = 'cloud.eventkit.dev/{},{},{}'.format(str(self.run.uid), 'osm-generic', download_file)
        s3.return_value = s3_url
        type(osstat).st_size = PropertyMock(return_value=1234567890)
        shp_export_task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status=TaskStates.RUNNING.value, name=shp_export_task.name)
        shp_export_task = ShpExportTask()
        expected_url = '/'.join([settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(self.run.uid), download_file])
        download_url = '/'.join([settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(self.run.uid),
                                 'osm-generic', 'file.shp'])
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(self.run.uid))
        shp_export_task.on_success(retval={'result': download_url}, task_id=celery_uid,
                                   args={}, kwargs={'run_uid': str(self.run.uid)})
        os_stat.assert_called_once_with(download_url)
        if not getattr(settings, "USE_S3", False):
            exists.assert_has_calls([call(run_dir)])
            mkdirs.assert_has_calls([call(run_dir)])
            shutil_copy.assert_called_once()
        task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        result = task.result
        self.assertIsNotNone(result)
        self.assertEqual(task, result.task)
        self.assertEquals(TaskStates.SUCCESS.value, task.status)
        self.assertEquals('ESRI Shapefile Format (Generic)', task.name)
        # pull out the result and test
        result = ExportTaskResult.objects.get(task__celery_uid=celery_uid)
        self.assertIsNotNone(result)
        if getattr(settings, "USE_S3", False):
            self.assertEqual(s3_url, str(result.download_url))
        else:
            self.assertEquals(expected_url, str(result.download_url))

    def test_task_on_failure(self, ):
        shp_export_task = ShpExportTask()
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status=TaskStates.RUNNING.value, name=shp_export_task.name)
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
        succeeded_task = ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                                   status=TaskStates.RUNNING.value, name=task.name)
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        result = task.run(run_uid=run_uid, task_uid=succeeded_task.uid, job_name='testjob')
        config = self.job.configs.all()[0]
        expected_path = config.upload.path
        self.assertEquals(result['result'], expected_path)
        os.remove(expected_path)

    @patch('shutil.copy')
    @patch('os.remove')
    @patch('eventkit_cloud.tasks.export_tasks.ZipFile')
    @patch('os.walk')
    @patch('eventkit_cloud.tasks.export_tasks.s3.upload_to_s3')
    def test_zipfile_task(self, s3, mock_os_walk, mock_zipfile, remove, copy):
        class MockZipFile:
            def __init__(self):
                self.files = {}

            def __iter__(self):
                return iter(self.files)

            def write(self, filename, **kw):
                arcname = kw.get('arcname', filename)
                self.files[arcname] = filename

            def __exit__(self, *args, **kw):
                pass

            def __enter__(self, *args, **kw):
                return self

        run_uid = str(self.run.uid)
        self.run.job.include_zipfile = True
        self.run.job.event = 'test'
        self.run.job.save()
        stage_dir = settings.EXPORT_STAGING_ROOT + run_uid
        zipfile = MockZipFile()
        mock_zipfile.return_value = zipfile
        mock_os_walk.return_value = [(
            '/var/lib/eventkit/exports_staging/' + run_uid + '/osm-vector',
            None,
            ['test.gpkg', 'test.om5', 'test.osm']  # om5 and osm should get filtered out
        )]
        date = timezone.now().strftime('%Y%m%d')
        fname = 'test-osm-vector-{0}.gpkg'.format(date,)
        zipfile_name = '{0}/TestJob-test-eventkit-{1}.zip'.format(run_uid, date)
        s3.return_value = "www.s3.eventkit-cloud/{}".format(zipfile_name)
        task = ZipFileTask()
        result = task.run(run_uid=run_uid, include_files=['/var/lib/eventkit/exports_staging/{0}/osm-vector/test.gpkg'.format(run_uid)])

        self.assertEqual(
            zipfile.files,
            {fname: '/var/lib/eventkit/exports_staging/{0}/osm-vector/test.gpkg'.format(run_uid),
             }
        )
        run = ExportRun.objects.get(uid=run_uid)
        if getattr(settings, "USE_S3", False):
            self.assertEqual(
                run.zipfile_url,
                "www.s3.eventkit-cloud/{}".format(zipfile_name)
            )
        else:
            self.assertEqual(
                run.zipfile_url,
                zipfile_name
            )
        assert str(run_uid) in result['result']

    @patch('eventkit_cloud.tasks.task_factory.TaskFactory')
    @patch('eventkit_cloud.tasks.export_tasks.socket')
    def test_pickup_run_task(self, socket, task_factory):
        run_uid = self.run.uid
        socket.gethostname.return_value = "test"
        task = PickUpRunTask()
        self.assertEquals('Pickup Run', task.name)
        task.run(run_uid=run_uid)
        task_factory.assert_called_once()
        task_factory.return_value.parse_tasks.assert_called_once_with(run_uid=run_uid, worker="test")

    @patch('shutil.rmtree')
    def test_finalize_run_task_after_return(self, rmtree):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status='SUCCESS', name='Default Shapefile Export')
        task = FinalizeRunTask()
        task.after_return('status', {'stage_dir': stage_dir}, run_uid, (), {}, 'Exception Info')
        rmtree.assert_called_once_with(stage_dir)

    @patch('django.core.mail.EmailMessage')
    def test_finalize_run_task(self, email):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status=TaskStates.SUCCESS.value, name='Default Shapefile Export')
        task = FinalizeRunTask()
        self.assertEquals('Finalize Export Run', task.name)
        task.run(run_uid=run_uid, stage_dir=stage_dir)
        msg = Mock()
        email.return_value = msg
        msg.send.assert_called_once()

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
        ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_id,
                                  celery_uid=celery_uid, status=TaskStates.FAILED.value,
                                  name='Default Shapefile Export')
        task = ExportTaskErrorHandler()
        self.assertEquals('Export Task Error Handler', task.name)
        task.run(run_uid=run_uid, task_id=task_id, stage_dir=stage_dir)
        isdir.assert_any_call(stage_dir)
        rmtree.assert_called_once_with(stage_dir)
        msg.send.assert_called_once()
        run = ExportRun.objects.get(uid=run_uid)
        self.assertEquals(TaskStates.INCOMPLETE.value, run.status)

    @patch('django.db.connection.close')
    @patch('eventkit_cloud.tasks.models.ExportTask')
    def test_update_progress(self, export_task, mock_close):
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task'
        )
        saved_export_task_uid = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.PENDING.value,
            name="test_task"
        ).uid
        estimated = timezone.now()
        export_task_instance = Mock(progress=0, estimated_finish=None)
        export_task.objects.get.return_value = export_task_instance
        update_progress(saved_export_task_uid, progress=50, estimated_finish=estimated)
        mock_close.assert_called_once()
        self.assertEquals(export_task_instance.progress, 50)
        self.assertEquals(export_task_instance.estimated_finish, estimated)

    @patch('eventkit_cloud.tasks.export_tasks.KillTask')
    def test_cancel_task(self, kill_task):
        worker_name = "test_worker"
        task_pid = 55
        celery_uid = uuid.uuid4()
        user = User.objects.create(username="test_user", password="test_password", email="test@email.com")
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task',
        )
        task_uid = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.PENDING.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        ).uid

        task = CancelExportProviderTask()
        self.assertEquals('Cancel Export Provider Task', task.name)
        task.run(export_provider_task.uid, user)
        kill_task.return_value.run.assert_called_once_with(celery_uid=celery_uid)
        export_task = ExportTask.objects.get(uid=task_uid)
        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task.uid)
        self.assertEquals(export_task.status, TaskStates.CANCELED.value)
        self.assertEquals(export_provider_task.status, TaskStates.CANCELED.value)

    # app.control.revoke(celery_uid, terminate=True)
    @patch('eventkit_cloud.celery.app')
    def test_kill_task(self, app):
        celery_uid = uuid.uuid4()
        task = KillTask()
        self.assertEquals('Kill Task', task.name)
        task.run(celery_uid=celery_uid)
        app.control.revoke.assert_called_once_with(str(celery_uid), terminate=True)

    # @patch('os.kill')
    # @patch('celery.result.AsyncResult')
    # def test_kill_task(self, AsyncResult):
        from uuid import uuid4
        from eventkit_cloud.celery import app
        #Ensure that kill isn't called with default.
        # task_pid = -1
        # task = KillTask()
        # self.assertEquals('Kill Task', task.name)
        # task.run(task_pid)
        # kill.assert_not_called()

        # Ensure that kill is not called with an invalid state
        # task_pid = 55
        # AsyncResult.return_value = Mock(state=celery.states.FAILURE)
        # task = KillTask()
        # self.assertEquals('Kill Task', task.name)
        # task.run(task_pid)
        # kill.assert_not_called()

        #Ensure that kill is called with a valid pid
        # task_pid = 55
        # AsyncResult.return_value = Mock(state=celery.states.STARTED)
        # task = KillTask()
        # self.assertEquals('Kill Task', task.name)
        # task.run(task_pid)
        # kill.assert_called_once_with(task_pid, signal.SIGTERM)