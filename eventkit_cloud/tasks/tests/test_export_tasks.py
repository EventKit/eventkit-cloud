# -*- coding: utf-8 -*-
# test cases for Export Tasks
import cPickle
import logging
import os
import sys
import uuid

import celery
from billiard.einfo import ExceptionInfo
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from mock import Mock, PropertyMock, patch, MagicMock

from eventkit_cloud.celery import TaskPriority, app
from eventkit_cloud.jobs.models import DatamodelPreset, Job
from eventkit_cloud.tasks.export_tasks import (
    LockingTask, export_task_error_handler, finalize_run_task,
    kml_export_task, external_raster_service_export_task, geopackage_export_task,
    shp_export_task, arcgis_feature_service_export_task, update_progress,
    zip_files, pick_up_run_task, cancel_export_provider_task, kill_task, TaskStates,
    bounds_export_task, parse_result, finalize_export_provider_task,
    FormatTask, wait_for_providers_task, create_zip_task, default_format_time
)
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTaskRecord,
    FileProducingTaskResult,
    DataProviderTaskRecord
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
        self.group, created = Group.objects.get_or_create(name="TestDefault")
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
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
        shp_export_task.update_task_state(task_status=TaskStates.RUNNING.value, task_uid=str(saved_export_task.uid))
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
        kml_export_task.update_task_state(task_status=TaskStates.RUNNING.value, task_uid=str(saved_export_task.uid))
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
        geopackage_export_task.update_task_state(task_status=TaskStates.RUNNING.value,
                                                 task_uid=str(saved_export_task.uid))
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
        arcgis_feature_service_export_task.update_task_state(task_status=TaskStates.RUNNING.value,
                                                             task_uid=str(saved_export_task.uid))
        result = arcgis_feature_service_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                        job_name=job_name)
        arcfs_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

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
        external_raster_service_export_task.update_task_state(task_status=TaskStates.RUNNING.value,
                                                             task_uid=str(saved_export_task.uid))
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
        test_export_task_record = ExportTaskRecord.objects.create(export_provider_task=export_provider_task,
                                                                  celery_uid=celery_uid,
                                                                  status=TaskStates.RUNNING.value,
                                                                  name=shp_export_task.name)
        try:
            raise ValueError('some unexpected error')
        except ValueError as e:
            exc = e
            exc_info = sys.exc_info()
        einfo = ExceptionInfo(exc_info=exc_info)
        shp_export_task.task_failure(exc, task_id=test_export_task_record.uid, einfo=einfo,
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
    @patch('os.path.getsize')
    @patch('eventkit_cloud.tasks.export_tasks.s3.upload_to_s3')
    def test_zipfile_task(self, s3, os_path_getsize, mock_os_walk, mock_zipfile, remove, copy):
        os_path_getsize.return_value = 20

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

        expected_archived_files = {'data/osm/file1-osm-{0}.txt'.format(default_format_time(timezone.now())): 'osm/file1.txt',
                                   'data/osm/file2-osm-{0}.txt'.format(default_format_time(timezone.now())): 'osm/file2.txt'}
        run_uid = str(self.run.uid)
        self.run.job.include_zipfile = True
        self.run.job.event = 'test'
        self.run.job.save()
        zipfile = MockZipFile()
        mock_zipfile.return_value = zipfile
        stage_dir = settings.EXPORT_STAGING_ROOT
        provider_slug = 'osm'
        zipfile_path = os.path.join(stage_dir,'{0}'.format(run_uid), provider_slug, 'test.gpkg')
        include_files = ['{0}/file1.txt'.format(provider_slug), '{0}/file2.txt'.format(provider_slug)]
        mock_os_walk.return_value = [(
            os.path.join(stage_dir, run_uid, provider_slug),
            None,
            ['test.gpkg', 'test.om5', 'test.osm']  # om5 and osm should get filtered out
        )]
        date = timezone.now().strftime('%Y%m%d')
        zipfile_name = os.path.join('/downloads', '{0}'.format(run_uid), 'testjob-test-eventkit-{0}.zip'.format(date))
        s3.return_value = "www.s3.eventkit-cloud/{}".format(zipfile_name)
        result = zip_files(include_files=include_files, file_path=zipfile_path )
        self.assertEqual(zipfile.files, expected_archived_files)
        self.assertEquals(result, zipfile_path)

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
        bounds_export_task.update_task_state(task_status=TaskStates.RUNNING.value, task_uid=str(saved_export_task.uid))
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
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
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
        cancel_export_provider_task.run(data_provider_task_uid=export_provider_task.uid,
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
        finalize_export_provider_task.run(result={'status': TaskStates.SUCCESS.value}, run_uid=self.run.uid,
                                          data_provider_task_uid=export_provider_task.uid,
                                          run_dir=run_dir, status=TaskStates.COMPLETED.value)
        export_provider_task.refresh_from_db()
        self.assertEqual(export_provider_task.status, TaskStates.COMPLETED.value)

    @patch('eventkit_cloud.tasks.export_tasks.progressive_kill')
    @patch('eventkit_cloud.tasks.export_tasks.AsyncResult')
    def test_kill_task(self, async_result, mock_progressive_kill):
        # Ensure that kill isn't called with default.
        task_pid = -1
        celery_uid = uuid.uuid4()
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is not called with an invalid state
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.FAILURE)
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is called with a valid pid
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.STARTED)
        self.assertEquals('Kill Task', kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_called_once_with(task_pid)

    @patch('eventkit_cloud.tasks.models.ExportRun')
    def test_wait_for_providers_task(self, mock_export_run):
        mock_run_uid = str(uuid.uuid4())

        mock_provider_task = Mock(status=TaskStates.SUCCESS.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().provider_tasks.filter.return_value = [mock_provider_task]

        callback_task = MagicMock()
        apply_args = {"arg1": "example_value"}

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_called_once_with(**apply_args)

        callback_task.reset_mock()

        mock_provider_task = Mock(status=TaskStates.RUNNING.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().provider_tasks.filter.return_value = [mock_provider_task]

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_not_called()

        with self.assertRaises(Exception):
            mock_export_run.reset_mock()
            mock_export_run.objects.filter().first().__nonzero__.return_value = False
            wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)

    @patch('eventkit_cloud.tasks.export_tasks.create_license_file')
    @patch('eventkit_cloud.tasks.export_tasks.get_data_type_from_provider')
    @patch('eventkit_cloud.tasks.export_tasks.zip_files')
    @patch('eventkit_cloud.tasks.export_tasks.get_human_readable_metadata_document')
    @patch('eventkit_cloud.tasks.export_tasks.get_style_files')
    @patch('eventkit_cloud.tasks.export_tasks.json')
    @patch('__builtin__.open')
    @patch('eventkit_cloud.tasks.export_tasks.generate_qgs_style')
    @patch('os.path.join', side_effect=lambda *args: args[-1])
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.models.DataProviderTaskRecord')
    def test_create_zip_task(self, mock_DataProviderTaskRecord, isfile, join, mock_generate_qgs_style, mock_open,
                             mock_json, mock_get_style_files, mock_get_human_readable_metadata_document,
                             mock_zip_files, mock_get_data_type_from_provider, mock_create_license_file):

        # This doesn't need to be valid with ExportRun mocked
        mock_run_uid = str(uuid.uuid4())
        mock_job_name = 'test'
        mock_get_data_type_from_provider.return_value = 'osm'
        expected_zip = "{0}.zip".format(mock_job_name)
        mock_zip_files.return_value = expected_zip
        expected_style_files = ['test.svg']
        mock_get_style_files.return_value = expected_style_files
        style_file = "style.qgs"
        mock_generate_qgs_style.return_value = style_file
        metadata_file = "ReadMe.txt"
        mock_get_human_readable_metadata_document.return_value = metadata_file
        license_file = "license.txt"
        mock_create_license_file.return_value = license_file

        expected_file_list = ['e1', 'e2', 'e3', style_file, license_file, 'metadata.json', metadata_file]
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
        mocked_provider_task.slug = 'dummy_slug'
        mocked_provider_task.run.uid = mock_run_uid
        mocked_provider_task.run.job.include_zipfile = True
        mocked_provider_task.run.job.name = mock_job_name
        mocked_provider_task.run.provider_tasks.all.return_value = [mocked_provider_task]

        mock_DataProviderTaskRecord.objects.get.return_value = mocked_provider_task

        returned_zip = create_zip_task.run(data_provider_task_uid=mock_run_uid)
        mock_generate_qgs_style.assert_called_once_with(run_uid=mock_run_uid)
        mock_open.assert_called_once()
        mock_zip_files.assert_called_once_with(file_path=expected_zip,
                                               include_files=set(expected_file_list),
                                               static_files=expected_style_files,
                                               )
        mock_json.dump.assert_called_once()
        self.assertEqual(returned_zip, {'result': expected_zip})



        sys.stdout.flush()

    def test_zip_file_task_invalid_params(self):

        with self.assertRaises(Exception):
            include_files = []
            file_path = '/test/path.zip'
            res = zip_files(include_files, file_path=file_path)
            self.assertIsNone(res)

        with self.assertRaises(Exception):
            include_files = ['test1', 'test2']
            file_path = ''
            res = zip_files(include_files, file_path=file_path)
            self.assertIsNone(res)


class TestFormatTasks(ExportTaskBase):

    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)
