# -*- coding: utf-8 -*-
# test cases for Export Tasks
import cPickle
import datetime
import logging
import os
import signal
import sys
import uuid

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from mock import call, Mock, PropertyMock, patch, MagicMock, ANY
from django.db.models.signals import post_save

from billiard.einfo import ExceptionInfo
from celery import chain
import celery
from eventkit_cloud.jobs.models import DatamodelPreset
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTaskRecord,
    FileProducingTaskResult,
    DataProviderTaskRecord
)

from ...celery import TaskPriority, app
from ...jobs.models import Job
from ...ui.helpers import get_style_files
from ..export_tasks import (
    LockingTask, export_task_error_handler, finalize_run_task,
    kml_export_task, external_raster_service_export_task, geopackage_export_task,
    shp_export_task, arcgis_feature_service_export_task, update_progress,
    zip_file_task, pick_up_run_task, cancel_export_provider_task, kill_task, TaskStates, zip_export_provider,
    bounds_export_task, parse_result, finalize_export_provider_task,
    FormatTask, wait_for_providers_task, example_finalize_run_hook_task
)


logger = logging.getLogger(__name__)


class TestLockingTask(TestCase):

    def test_locking_task(self):
        task_id = '0123'
        retries = False
        task_name = 'lock_test_task'
        expected_lock_key = 'TaskLock_{0}_{1}_{2}'.format(task_name, task_id, retries)
        expected_result = "result"

        # Create a test task...
        @app.task(base=LockingTask)
        def lock_test_task():
            return expected_result

        # ...mock the cache...
        mock_cache = MagicMock()
        mock_cache.add.side_effect = ["A Lock", None, None, None, None]

        # ...create two separate test tasks...
        lock_task = lock_task2 = lock_test_task
        lock_task.cache = lock_task2.cache = mock_cache

        # ..create a mock request...
        mock_request = Mock(task_name=task_name, id=task_id, retries=False)
        mock_request_stack = Mock()
        mock_request_stack.top = mock_request
        mock_push_request = Mock()

        # ...with duplicate requests...
        lock_task.request_stack = lock_task2.request_stack = mock_request_stack
        lock_task.push_request = lock_task2.push_request = mock_push_request

        # ...call first task ensure it returns...
        result = lock_task.__call__()
        self.assertEqual(result, expected_result)
        mock_cache.add.assert_called_with(expected_lock_key, task_id, lock_task.lock_expiration)

        # ...call a second task with duplicate id, ensure nothing returns.
        result = lock_task2.__call__()
        self.assertIsNone(result)
        mock_cache.add.assert_called_with(expected_lock_key, task_id, lock_task.lock_expiration)


class ExportTaskBase(TransactionTestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group = Group.objects.create(name="TestDefault")
        with patch('eventkit_cloud.jobs.models.Group') as mock_group:
            mock_group.objects.get.return_value = self.group
            self.user = User.objects.create(
                username='demo',
                email='demo@demo.com',
                password='demo'
            )
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertEquals(259, len(tags))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name='TestJob',
            description='Test description',
            user=self.user,
            the_geom=the_geom,
            json_tags=tags
        )
        self.job.feature_save = True
        self.job.feature_pub = True
        self.job.save()
        self.run = ExportRun.objects.create(job=self.job, user=self.user)

class TestExportTasks(ExportTaskBase):
    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.shp.GPKGToShp')
    def test_run_shp_export_task(self, mock, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        gpkg_to_shp = mock.return_value
        job_name = self.job.name.lower()
        gpkg_to_shp.convert.return_value = '/path/to/' + job_name + '.shp'
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='Shapefile Export',
                                                                     status=TaskStates.PENDING.value)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=shp_export_task.name)
        result = shp_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_shp.convert.assert_called_once()
        self.assertEquals('/path/to/' + job_name + '.shp', result['result'])
        # test tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.kml.GPKGToKml')
    def test_run_kml_export_task(self, mock_kml, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        gpkg_to_kml = mock_kml.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.kmz'.format(job_name))
        gpkg_to_kml.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='GPKGToKml',
                                                                     status=TaskStates.PENDING.value)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=kml_export_task.name)
        result = kml_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_kml.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.add_metadata_task')
    @patch('eventkit_cloud.utils.gdalutils.convert')
    @patch('eventkit_cloud.utils.gdalutils.clip_dataset')
    @patch('celery.app.task.Task.request')
    def test_run_gpkg_export_task(self, mock_request, mock_clip, mock_convert, mock_add_metadata_task):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        expected_provider_slug = "slug"
        mock_convert.return_value = expected_output_path

        previous_task_result = {'result': expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run,
                                                                     status=TaskStates.PENDING.value,
                                                                     slug=expected_provider_slug)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=geopackage_export_task.name)
        result = geopackage_export_task.run(run_uid=self.run.uid, result=previous_task_result, task_uid=str(saved_export_task.uid),
                                            stage_dir=stage_dir, job_name=job_name)
        mock_add_metadata_task.assert_called_once_with(result=result, job_uid=self.run.job.uid, provider_slug=expected_provider_slug)
        mock_clip.assert_not_called()
        mock_convert.assert_called_once_with(dataset=expected_output_path, fmt='gpkg',
                                             task_uid=str(saved_export_task.uid))
        mock_convert.reset_mock()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

        mock_clip.return_value = expected_output_path
        expected_geojson = "test.geojson"
        previous_task_result = {'result': expected_output_path, "selection": expected_geojson}
        result = geopackage_export_task.run(run_uid=self.run.uid, result=previous_task_result,
                                            task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        mock_clip.assert_called_once_with(boundary=expected_geojson, in_dataset=expected_output_path,
                                          fmt=None)
        mock_convert.assert_called_once_with(dataset=expected_output_path, fmt='gpkg',
                                             task_uid=str(saved_export_task.uid))
        self.assertEquals(expected_output_path, result['result'])
        self.assertEquals(expected_output_path, result['geopackage'])

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.arcgis_feature_service.ArcGISFeatureServiceToGPKG')
    def test_run_arcgis_feature_service_export_task(self, mock_service, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        arcfs_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        arcfs_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run,
                                                                     status=TaskStates.PENDING.value)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=arcgis_feature_service_export_task.name)
        result = arcgis_feature_service_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                        job_name=job_name)
        arcfs_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.generate_qgs_style')
    @patch('eventkit_cloud.tasks.export_tasks.logger')
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.models.DataProviderTaskRecord')
    @patch('eventkit_cloud.tasks.export_tasks.zip_file_task')
    @patch('celery.app.task.Task.request')
    def test_run_zip_export_provider(self, mock_request, mock_zip_file, mock_export_provider_task, mock_isfile,
                                     mock_logger, mock_qgs_file):
        file_names = ('file1', 'file2', 'file3')
        tasks = (Mock(result=Mock(filename=file_names[0])),
                 Mock(result=Mock(filename=file_names[1])),
                 Mock(result=Mock(filename=file_names[2])))
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid), "slug")

        mock_all = Mock()
        mock_all.return_value = tasks
        mock_export_provider_task.objects.get.return_value = Mock(slug="slug", status=TaskStates.SUCCESS.value,
                                                                  tasks=Mock(all=mock_all))
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)

        job_name = self.job.name.lower()

        expected_output_path = os.path.join(stage_dir,
                                            '{}.zip'.format(job_name))
        mock_zip_file.run.return_value = {'result': expected_output_path}
        mock_isfile.return_value = True

        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run,
                                                                     status=TaskStates.PENDING.value)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=zip_export_provider.name)
        result = zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                         job_name=job_name, run_uid=self.run.uid)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
        mock_zip_file.run.assert_called_once_with(adhoc=True, run_uid=self.run.uid, include_files=ANY,
                                                  file_name=os.path.join(stage_dir, "{0}.zip".format(job_name)),
                                                  static_files=get_style_files())

        # Check that an exception is raised if no zip file is returned.
        mock_zip_file.run.return_value = None
        with self.assertRaises(Exception):
            zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                    job_name=job_name, run_uid=self.run.uid)

        # Check that an exception is raised if no files can be zipped.
        mock_zip_file.run.return_value = {'result': expected_output_path}
        mock_export_provider_task.objects.get.return_value = Mock(slug="slug", status=TaskStates.FAILED.value,
                                                                  tasks=Mock(all=mock_all))
        with self.assertRaises(Exception):
            zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                    job_name=job_name, run_uid=self.run.uid)

        # Check that errors are logged for missing files.
        mock_logger.reset_mock()
        tasks = (Mock(result=Mock(filename=file_names[0])),
                 Mock(result=None),
                 Mock(result=Mock(filename=file_names[2])))
        mock_all = Mock()
        mock_all.return_value = tasks
        mock_export_provider_task.objects.get.return_value = Mock(slug="slug", status=TaskStates.SUCCESS.value,
                                                                  tasks=Mock(all=mock_all))

        zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                job_name=job_name, run_uid=self.run.uid)
        mock_logger.error.assert_called_once()

        mock_logger.reset_mock()
        tasks = (Mock(result=Mock(filename=file_names[0])),
                 Mock(result=Mock(filename=file_names[1])),
                 Mock(result=Mock(filename=file_names[2])))
        mock_all = Mock()
        mock_all.return_value = tasks
        mock_export_provider_task.objects.get.return_value = Mock(slug="slug", status=TaskStates.SUCCESS.value,
                                                                  tasks=Mock(all=mock_all))

        mock_isfile.side_effect = [True, True, False]
        zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                job_name=job_name, run_uid=self.run.uid)

        mock_logger.error.assert_called_once()


    @patch('eventkit_cloud.tasks.export_tasks.add_metadata_task')
    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.external_service.ExternalRasterServiceToGeopackage')
    def test_run_external_raster_service_export_task(self, mock_service, mock_request, mock_add_metadata_task):
        celery_uid = str(uuid.uuid4())
        expected_provider_slug = "slug"
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        service_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        service_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run,
                                                                     status=TaskStates.PENDING.value,
                                                                     slug=expected_provider_slug)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=external_raster_service_export_task.name)
        result = external_raster_service_export_task.run(run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                         job_name=job_name)
        service_to_gpkg.convert.assert_called_once()
        mock_add_metadata_task.assert_called_once_with(result=result, job_uid=self.run.job.uid, provider_slug=expected_provider_slug)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
        service_to_gpkg.convert.side_effect = Exception("Task Failed")
        with self.assertRaises(Exception):
            external_raster_service_export_task.run(run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                    job_name=job_name)

    def test_task_on_failure(self,):
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='Shapefile Export')
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                        status=TaskStates.RUNNING.value, name=shp_export_task.name)
        try:
            raise ValueError('some unexpected error')
        except ValueError as e:
            exc = e
            exc_info = sys.exc_info()
        einfo = ExceptionInfo(exc_info=exc_info)
        shp_export_task.on_failure(exc, task_id=celery_uid, einfo=einfo,
                                   args={}, kwargs={'run_uid': str(self.run.uid)})
        task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        exception = task.exceptions.all()[0]
        exc_info = cPickle.loads(str(exception.exception)).exc_info
        error_type, msg, tb = exc_info[0], exc_info[1], exc_info[2]
        self.assertEquals(error_type, ValueError)
        self.assertEquals('some unexpected error', str(msg))
        # traceback.print_exception(error_type, msg, tb)

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
        zipfile = MockZipFile()
        mock_zipfile.return_value = zipfile
        stage_dir = settings.EXPORT_STAGING_ROOT
        mock_os_walk.return_value = [(
            os.path.join(stage_dir, run_uid, 'osm-vector'),
            None,
            ['test.gpkg', 'test.om5', 'test.osm']  # om5 and osm should get filtered out
        )]
        date = timezone.now().strftime('%Y%m%d')
        fname = os.path.join('data', 'osm-vector', 'test-osm-vector-{0}.gpkg'.format(date,))
        zipfile_name = os.path.join('{0}'.format(run_uid),'testjob-test-eventkit-{0}.zip'.format(date))
        s3.return_value = "www.s3.eventkit-cloud/{}".format(zipfile_name)
        result = zip_file_task.run(run_uid=run_uid, include_files=[
            os.path.join(stage_dir,'{0}'.format(run_uid),'osm-vector','test.gpkg')])

        self.assertEqual(
            zipfile.files,
            {fname: os.path.join(stage_dir,'{0}'.format(run_uid),'osm-vector','test.gpkg'),
             }
        )
        run = ExportRun.objects.get(uid=run_uid)
        if getattr(settings, "USE_S3", False):
            self.assertEqual(
                run.zipfile_url,
                "www.s3.eventkit-cloud/{0}".format(zipfile_name)
            )
        else:
            self.assertEqual(
                run.zipfile_url,
                zipfile_name
            )
        assert str(run_uid) in result['result']

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.tasks.export_tasks.geopackage')
    def test_run_bounds_export_task(self, mock_geopackage, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        provider_slug = "provider_slug"
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        mock_geopackage.add_geojson_to_geopackage.return_value = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'),
                                                                              str(self.run.uid),
                                                                              '{}_bounds.gpkg'.format(provider_slug))
        expected_output_path = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid),
                                            '{}_bounds.gpkg'.format(provider_slug))
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run)
        saved_export_task = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                            status=TaskStates.PENDING.value,
                                                            name=bounds_export_task.name)
        result = bounds_export_task.run(run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                        provider_slug=job_name)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
    @patch('eventkit_cloud.tasks.task_factory.TaskFactory')
    @patch('eventkit_cloud.tasks.export_tasks.socket')
    def test_pickup_run_task(self, socket, task_factory):
        run_uid = self.run.uid
        socket.gethostname.return_value = "test"
        self.assertEquals('Pickup Run', pick_up_run_task.name)
        pick_up_run_task.run(run_uid=run_uid, user_details={'username': 'test_pickup_run_task'})
        task_factory.assert_called_once()
        expected_user_details = {'username': 'test_pickup_run_task'}
        task_factory.return_value.parse_tasks.assert_called_once_with(
            run_uid=run_uid, user_details=expected_user_details, worker="test"
        )

    @patch('eventkit_cloud.tasks.export_tasks.logger')
    @patch('shutil.rmtree')
    @patch('os.path.isdir')
    def test_finalize_run_task_after_return(self, isdir, rmtree, logger):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(self.run.uid))
        isdir.return_value = True
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='Shapefile Export')
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                        status='SUCCESS', name='Default Shapefile Export')
        finalize_run_task.after_return('status', {'stage_dir': stage_dir}, run_uid, (), {}, 'Exception Info')
        isdir.assert_called_with(stage_dir)
        rmtree.assert_called_with(stage_dir)

        celery_uid = str(uuid.uuid4())
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='Shapefile Export')
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                        status='SUCCESS', name='Default Shapefile Export')
        rmtree.side_effect = IOError()
        finalize_run_task.after_return('status', {'stage_dir': stage_dir}, run_uid, (), {}, 'Exception Info')

        rmtree.assert_called_with(stage_dir)
        self.assertRaises(IOError, rmtree)
        logger.error.assert_called_once()

    @patch('eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives')
    def test_finalize_run_task(self, email):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = DataProviderTaskRecord.objects.create(status=TaskStates.SUCCESS.value, run=self.run, name='Shapefile Export')
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                        status=TaskStates.SUCCESS.value, name='Default Shapefile Export')
        self.assertEquals('Finalize Run Task', finalize_run_task.name)
        finalize_run_task.run(run_uid=run_uid, stage_dir=stage_dir)
        email().send.assert_called_once()

    @patch('eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives')
    @patch('shutil.rmtree')
    @patch('os.path.isdir')
    def test_export_task_error_handler(self, isdir, rmtree, email):
        celery_uid = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, name='Shapefile Export')
        ExportTaskRecord.objects.create(export_provider_task=export_provider_task, uid=task_id,
                                        celery_uid=celery_uid, status=TaskStates.FAILED.value,
                                        name='Default Shapefile Export')
        self.assertEquals('Export Task Error Handler', export_task_error_handler.name)
        export_task_error_handler.run(run_uid=run_uid, task_id=task_id, stage_dir=stage_dir)
        isdir.assert_any_call(stage_dir)
        rmtree.assert_called_once_with(stage_dir)
        email().send.assert_called_once()

    @patch('django.db.connection.close')
    @patch('eventkit_cloud.tasks.models.ExportTaskRecord')
    def test_update_progress(self, export_task, mock_close):
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run,
            name='test_provider_task'
        )
        saved_export_task_uid = ExportTaskRecord.objects.create(
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

    @patch('eventkit_cloud.tasks.export_tasks.kill_task')
    def test_cancel_task(self, mock_kill_task):
        worker_name = "test_worker"
        task_pid = 55
        celery_uid = uuid.uuid4()
        with patch('eventkit_cloud.jobs.models.Group') as mock_group:
            mock_group.objects.get.return_value = self.group
            user = User.objects.create(username="test_user", password="test_password", email="test@email.com")
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run,
            name='test_provider_task',
            status=TaskStates.PENDING.value
        )
        export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.PENDING.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        )

        self.assertEquals('Cancel Export Provider Task', cancel_export_provider_task.name)
        cancel_export_provider_task.run(export_provider_task_uid=export_provider_task.uid,
                                        canceling_username=user.username)
        mock_kill_task.apply_async.assert_called_once_with(kwargs={"task_pid": task_pid, "celery_uid": celery_uid},
                                                           queue="{0}.cancel".format(worker_name),
                                                           priority=TaskPriority.CANCEL.value,
                                                           routing_key="{0}.cancel".format(worker_name))
        export_task = ExportTaskRecord.objects.get(uid=export_task.uid)
        export_provider_task = DataProviderTaskRecord.objects.get(uid=export_provider_task.uid)
        self.assertEquals(export_task.status, TaskStates.CANCELED.value)
        self.assertEquals(export_provider_task.status, TaskStates.CANCELED.value)

    def test_parse_result(self):
        result = parse_result(None, None)
        self.assertIsNone(result)

        task_result = [{"test": True}]
        expected_result = True
        returned_result = parse_result(task_result, "test")
        self.assertEqual(expected_result, returned_result)

        task_result = {"test": True}
        expected_result = True
        returned_result = parse_result(task_result, "test")
        self.assertEqual(expected_result, returned_result)

    def test_finalize_export_provider_task(self):
        worker_name = "test_worker"
        task_pid = 55
        filename = 'test.gpkg'
        celery_uid = uuid.uuid4()
        run_uid = self.run.uid
        self.job.include_zipfile = True
        self.job.save()
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run,
            name='test_provider_task',
            status=TaskStates.COMPLETED.value,
            slug='test_provider_task_slug'
        )
        result = FileProducingTaskResult.objects.create(filename=filename, size=10)
        task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.COMPLETED.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name,
            result=result,
        )

        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(run_uid))
        finalize_export_provider_task.run(run_uid=self.run.uid, export_provider_task_uid=export_provider_task.uid,
                                                run_dir=run_dir, status=TaskStates.COMPLETED.value)
        export_provider_task.refresh_from_db()
        self.assertEqual(export_provider_task.status, TaskStates.COMPLETED.value)

    @patch('os.kill')
    @patch('eventkit_cloud.tasks.export_tasks.AsyncResult')
    def test_kill_task(self, async_result, kill):
        # Ensure that kill isn't called with default.
        task_pid = -1
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid)
        kill.assert_not_called()

        # Ensure that kill is not called with an invalid state
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.FAILURE)
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid)
        kill.assert_not_called()

        # Ensure that kill is called with a valid pid
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.STARTED)
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid)
        kill.assert_called_once_with(task_pid, signal.SIGTERM)

    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_wait_for_providers_task(self, mock_export_run):
        mock_run_uid = str(uuid.uuid4())

        mock_provider_task = Mock(status=TaskStates.SUCCESS.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().provider_tasks.all.return_value = [mock_provider_task]

        callback_task = MagicMock()
        apply_args = {"arg1": "example_value"}

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_called_once_with(**apply_args)

        callback_task.reset_mock()

        mock_provider_task = Mock(status=TaskStates.RUNNING.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().provider_tasks.all.return_value = [mock_provider_task]

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_not_called()

        with self.assertRaises(Exception):
            mock_export_run.reset_mock()
            mock_export_run.objects.filter().first().__nonzero__.return_value = False
            wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)

    @patch('eventkit_cloud.tasks.export_tasks.generate_qgs_style')
    @patch('os.path.join', side_effect=lambda *args: args[-1])
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_prepare_for_export_zip_task(self, ExportRun, isfile, join, mock_generate_qgs_style):

        from eventkit_cloud.tasks.export_tasks import prepare_for_export_zip_task

        # This doesn't need to be valid with ExportRun mocked
        mock_run_uid = str(uuid.uuid4())

        style_file = "style.qgs"
        mock_generate_qgs_style.return_value = style_file
        expected_file_list = ['e1', 'e2', 'e3', style_file]
        missing_file_list = ['e4']
        all_file_list = expected_file_list + missing_file_list

        def fake_isfile(fname):
            if fname in expected_file_list:
                return True
            else:
                return False
        isfile.side_effect = fake_isfile

        # Fill out the behavior for mocked ExportRun by adding a provider task with
        # subtasks for each file in all_file_list
        mocked_provider_subtasks = []
        for fname in all_file_list:
            mps = MagicMock()
            mps.result.filename = fname
            mocked_provider_subtasks.append(mps)

        mocked_provider_task = MagicMock()
        mocked_provider_task.status = TaskStates.COMPLETED.value
        mocked_provider_task.tasks.all.return_value = mocked_provider_subtasks

        mocked_run = MagicMock()
        mocked_run.job.include_zipfile = True
        mocked_run.provider_tasks.all.return_value = [mocked_provider_task]

        ExportRun.objects.get.return_value = mocked_run

        include_files = prepare_for_export_zip_task.run(run_uid=mock_run_uid)
        mock_generate_qgs_style.assert_called_once_with(run_uid=mock_run_uid)

        self.assertEqual(include_files, set(expected_file_list))

    def test_zip_file_task_no_files_to_zip(self):
        include_files = []
        res = zip_file_task(include_files)
        self.assertEqual(res, {'result': None})


class TestFormatTasks(ExportTaskBase):

    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)


class FinalizeRunHookTaskTests(ExportTaskBase):
    def setUp(self):
        from eventkit_cloud.tasks import FinalizeRunHookTask
        from eventkit_cloud.celery import app

        @app.task(bind=True, base=FinalizeRunHookTask)
        def finalize_hook_file1(self, new_zip_filepaths=[], run_uid=None):
            return ['file1']

        @app.task(bind=True, base=FinalizeRunHookTask)
        def finalize_hook_file2(self, new_zip_filepaths=[], run_uid=None):
            return ['file2']

        @app.task(bind=True, base=FinalizeRunHookTask)
        def finalize_hook_file3(self, new_zip_filepaths=[], run_uid=None):
            return ['file3']

        self.finalize_hook_file1 = finalize_hook_file1
        self.finalize_hook_file2 = finalize_hook_file2
        self.finalize_hook_file3 = finalize_hook_file3

    @patch('eventkit_cloud.tasks.export_tasks.shutil.copy')
    @patch('eventkit_cloud.tasks.export_tasks.os.path.getsize')
    @patch('eventkit_cloud.tasks.models.FileProducingTaskResult.objects.create')
    @patch('eventkit_cloud.tasks.models.FinalizeRunHookTaskRecord.objects.get')
    @patch('eventkit_cloud.tasks.export_tasks.FinalizeRunHookTask.record_task_state')
    def test_new_files_in_chain_result(self, record_task_state, frhtr_get, fptr_create, os_getsize, shutil_copy):
        """ Check that expected new files appear in the result & the new files are recorded in
            FileProducingTaskResult.
        """
        os_getsize.return_value = 0

        # With record_task_state mocked there doesn't need to be an ExportRun instance with this id.
        run_uid = str(uuid.uuid4())
        fh1_sig = self.finalize_hook_file1.si(run_uid=run_uid)
        fh2_sig = self.finalize_hook_file2.s(run_uid=run_uid)
        fh3_sig = self.finalize_hook_file3.s(run_uid=run_uid)

        pf_chain = chain(fh1_sig, fh2_sig, fh3_sig)
        eager_res = pf_chain.apply()

        fh3_uid = eager_res.as_tuple()[0][0]
        fh2_uid = eager_res.as_tuple()[0][1][0][0]
        fh1_uid = eager_res.as_tuple()[0][1][0][1][0][0]

        res = eager_res.get()

        # 2 calls per task run
        self.assertEqual(record_task_state.call_count, 6)
        self.assertEqual(res, ['file1', 'file2', 'file3'])

        expected_url_path = lambda x: os.path.join(settings.EXPORT_MEDIA_ROOT, run_uid, x)

        expected_create_calls = [
            call(download_url=expected_url_path('file1'), filename='file1', size=0),
            call(download_url=expected_url_path('file2'), filename='file2', size=0),
            call(download_url=expected_url_path('file3'), filename='file3', size=0),
        ]
        fptr_create.assert_has_calls(expected_create_calls, any_order=True)

        expected_get_calls = [call(celery_uid=fh1_uid), call(celery_uid=fh2_uid), call(celery_uid=fh3_uid)]
        frhtr_get.assert_has_calls(expected_get_calls, any_order=True)

    @patch('eventkit_cloud.tasks.export_tasks.shutil.copy')
    @patch('eventkit_cloud.tasks.export_tasks.os.path.getsize')
    @patch('eventkit_cloud.tasks.models.FinalizeRunHookTaskRecord.objects.get')
    @patch('eventkit_cloud.tasks.export_tasks.FinalizeRunHookTask.record_task_state')
    def test_manually_passed_files_in_chain_result(self, record_task_state, frhtr_get, os_getsize, shutil_copy):
        os_getsize.return_value = 0

        manual_filepath_list = ['my_file_a', 'my_file_b']
        # With record_task_state mocked there doesn't need to be an ExportRun instance with this id.
        run_uid = str(uuid.uuid4())
        pf1_sig = self.finalize_hook_file1.s(manual_filepath_list, run_uid=run_uid)
        pf2_sig = self.finalize_hook_file2.s(run_uid=run_uid)

        pf_chain = chain(pf1_sig, pf2_sig)
        eager_res = pf_chain.apply()
        res = eager_res.get()

        # 2 calls per task run
        self.assertEqual(record_task_state.call_count, 4)
        self.assertEqual(res, ['my_file_a', 'my_file_b', 'file1', 'file2'])

    def test_none_uid_raises_error(self):
        run_uid = None
        pf1_sig = self.finalize_hook_file1.s(run_uid=run_uid)

        expected_ex_msg = '"run_uid" is a required kwarg for tasks subclassed from FinalizeRunHookTask'
        self.assertRaisesRegexp(ValueError, expected_ex_msg, pf1_sig.apply, throw=True)


    @patch('eventkit_cloud.tasks.export_tasks.AsyncResult')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    @patch('eventkit_cloud.tasks.models.FinalizeRunHookTaskRecord.objects.get_or_create')
    def test_record_task_state(self, get_or_create_mock, ExportRunMock, AsyncResultMock):
        # With ExportRun mocked this uid doesn't need a corresponding instance.
        run_uid = str(uuid.uuid4())

        def reset_mocks():
            get_or_create_mock.reset_mock()
            get_or_create_mock.return_value = (MagicMock(), None)
            ExportRunMock.reset_mock()
            AsyncResultMock.reset_mock()

        reset_mocks()

        # --- When neither started_at nor finished_at are provided a record is created/retrieved but that's it.
        self.finalize_hook_file1.record_task_state(testing_run_uid=run_uid)
        get_or_create_mock.assert_called_once()
        frhtr_instance, _ = get_or_create_mock.return_value
        frhtr_instance.save.assert_not_called()
        # Check that no value has been assigned to started_at or finished_at
        self.assertIsInstance(frhtr_instance.started_at, MagicMock)
        self.assertIsInstance(frhtr_instance.finished_at, MagicMock)
        reset_mocks()

        # --- When started_at is provided it should be set & FinalizeRunHookTaskRecord saved.
        started_at = datetime.datetime.now()

        self.finalize_hook_file1.record_task_state(started_at=started_at, testing_run_uid=run_uid)
        get_or_create_mock.assert_called_once()
        frhtr_instance, _ = get_or_create_mock.return_value
        self.assertEqual(frhtr_instance.started_at, started_at)
        frhtr_instance.save.assert_called_once_with()
        reset_mocks()

        # --- When finished_at is provided it should be set & FinalizeRunHookTaskRecord saved.
        finished_at = datetime.datetime.now()
        self.finalize_hook_file1.record_task_state(finished_at=finished_at, testing_run_uid=run_uid)
        get_or_create_mock.called_once_with()
        frhtr_instance, _ = get_or_create_mock.return_value
        self.assertEqual(frhtr_instance.finished_at, finished_at)
        frhtr_instance.save.assert_called_once_with()
        reset_mocks()

        # --- When started_at and finished_at are provided, both should be set & FinalizeRunHookTaskRecord saved.
        started_at = datetime.datetime.now()
        finished_at = datetime.datetime.now() + datetime.timedelta(hours=1)
        self.finalize_hook_file1.record_task_state(
            started_at=started_at, finished_at=finished_at, testing_run_uid=run_uid)
        get_or_create_mock.assert_called_once()
        frhtr_instance, _ = get_or_create_mock.return_value
        self.assertEqual(frhtr_instance.started_at, started_at)
        self.assertEqual(frhtr_instance.finished_at, finished_at)
        frhtr_instance.save.assert_called_once_with()

    @patch('eventkit_cloud.tasks.models.FinalizeRunHookTaskRecord.objects.get')
    @patch('eventkit_cloud.tasks.export_tasks.FinalizeRunHookTask.record_task_state')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_example_finalize_run_hook_task(self, ExportRun, record_task_state, frhtr_get):
        mock_run_uid = str(uuid.uuid4())
        example_finalize_run_hook_task(run_uid=mock_run_uid)
        frhtr_get.assert_called_once_with(celery_uid=None)

    @patch('eventkit_cloud.tasks.export_tasks.FinalizeRunHookTask.record_task_state')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_finalize_run_hook_task_call_nonsequence_arg(self, ExportRun, record_task_state):
        mock_run_uid = str(uuid.uuid4())
        non_sequence_arg = {}
        self.assertRaises(Exception, example_finalize_run_hook_task, non_sequence_arg, run_uid=mock_run_uid)

    @patch('eventkit_cloud.tasks.export_tasks.FinalizeRunHookTask.record_task_state')
    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_finalize_run_hook_task_record_task_state_no_run_uid(self, ExportRun, record_task_state):
        self.assertRaises(ValueError, example_finalize_run_hook_task)
