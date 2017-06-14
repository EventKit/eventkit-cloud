# -*- coding: utf-8 -*-
# test cases for Export Tasks
import cPickle
import logging
import os
import sys
import uuid
import celery
import signal

from billiard.einfo import ExceptionInfo
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone as real_timezone
from django.utils import timezone
from mock import call, Mock, PropertyMock, patch, MagicMock
import datetime

from ...jobs.models import Job
from ..export_tasks import (
    LockingTask, export_task_error_handler, finalize_run_task,
    kml_export_task, osm_conf_task,
    external_raster_service_export_task, geopackage_export_task,
    osm_prep_schema_task, osm_to_pbf_convert_task, overpass_query_task,
    shp_export_task, arcgis_feature_service_export_task, update_progress, output_selection_geojson_task,
    zip_file_task, pick_up_run_task, cancel_export_provider_task, kill_task, TaskStates, zip_export_provider,
    parse_result, finalize_export_provider_task, clean_up_failure_task, bounds_export_task, osm_create_styles_task,
    FormatTask
)
from ...celery import TaskPriority, app
from eventkit_cloud.tasks.models import (
    ExportRun,
    ExportTask,
    ExportTaskResult,
    ExportProviderTask
)
from eventkit_cloud.jobs.models import DatamodelPreset

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
        mock_cache.add.assert_called_with(expected_lock_key, True, lock_task.lock_expiration)

        # ...call a second task with duplicate id, ensure nothing returns.
        result = lock_task2.__call__()
        self.assertIsNone(result)
        mock_cache.add.assert_called_with(expected_lock_key, True, lock_task.lock_expiration)


class ExportTaskBase(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        Group.objects.create(name='TestDefaultExportExtentGroup')
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
    @patch('eventkit_cloud.utils.osmconf.OSMConfig')
    def test_run_osmconf_task(self, mock_config, mock_request):
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
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=osm_conf_task.name)
        # This makes it easy to see where the audit logging entries came from.
        user_details = {'username': 'test_run_osmconf_task'}
        result = osm_conf_task.run(
            task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name, user_details=user_details)
        expected_user_details = {'username': 'test_run_osmconf_task'}
        osm_conf.create_osm_conf.assert_called_with(stage_dir=stage_dir, user_details=expected_user_details)
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.overpass.Overpass')
    def test_run_overpass_task(self, overpass, mock_request):
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
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=overpass_query_task.name)
        result = overpass_query_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
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
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        osmtopbf = mock_overpass.return_value
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.pbf'.format(job_name))
        osmtopbf.convert.return_value = expected_output_path
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='OSM2PBF')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=osm_to_pbf_convert_task.name)
        result = osm_to_pbf_convert_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                             job_name=job_name)
        osmtopbf.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.osmparse.OSMParser')
    def test_run_osmprepschema_task(self, mock_parser, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        prep_schema = mock_parser.return_value
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='OSM Schema Prep')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=osm_prep_schema_task.name)
        result = osm_prep_schema_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        prep_schema.create_geopackage.assert_called_once()
        prep_schema.create_default_schema_gpkg.assert_called_once()
        prep_schema.update_zindexes.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.shp.GPKGToShp')
    def test_run_shp_export_task(self, mock, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        gpkg_to_shp = mock.return_value
        job_name = self.job.name.lower()
        gpkg_to_shp.convert.return_value = '/path/to/' + job_name + '.shp'
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=shp_export_task.name)
        result = shp_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_shp.convert.assert_called_once()
        self.assertEquals('/path/to/' + job_name + '.shp', result['result'])
        # test tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
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
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='GPKGToKml')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=kml_export_task.name)
        result = kml_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name)
        gpkg_to_kml.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.os.path.isfile')
    @patch('__builtin__.open')
    def test_output_selection_geojson_task(self, mock_open, mock_isfile):
        import json

        selection = {"data": "example"}
        stage_dir = "/stage"
        provider_slug = "provider"
        expected_file = os.path.join(stage_dir,
                                     "{0}_selection.geojson".format(provider_slug))

        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='GeoJSONTask')
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=output_selection_geojson_task.name)

        result = output_selection_geojson_task.run(task_uid=saved_export_task.uid, stage_dir=stage_dir, provider_slug=provider_slug)
        self.assertEqual(result, {'result': None})

        mock_isfile.return_value = False
        result = output_selection_geojson_task.run(task_uid=saved_export_task.uid, selection=json.dumps(selection), stage_dir=stage_dir,
                                                   provider_slug=provider_slug)
        self.assertEqual(result['selection'], expected_file)
        mock_isfile.assert_called_once_with(expected_file)
        mock_open.assert_called_once_with(expected_file, 'w')

    @patch('eventkit_cloud.tasks.export_tasks.geopackage.clip_geopackage')
    @patch('celery.app.task.Task.request')
    def test_run_gpkg_export_task(self, mock_request, mock_clip):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))

        previous_task_result = {'result': expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=geopackage_export_task.name)
        result = geopackage_export_task.run(result=previous_task_result, task_uid=str(saved_export_task.uid),
                                            stage_dir=stage_dir, job_name=job_name)
        mock_clip.assert_not_called()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

        mock_clip.return_value = expected_output_path
        expected_geojson = "test.geojson"
        previous_task_result = {'result': expected_output_path, "selection": expected_geojson}
        result = geopackage_export_task.run(result=previous_task_result, task_uid=str(saved_export_task.uid),
                                            stage_dir=stage_dir, job_name=job_name)
        mock_clip.assert_called_once_with(geojson_file=expected_geojson, gpkg=expected_output_path,
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
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=arcgis_feature_service_export_task.name)
        result = arcgis_feature_service_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                        job_name=job_name)
        arcfs_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.logger')
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.models.ExportProviderTask')
    @patch('eventkit_cloud.tasks.export_tasks.zip_file_task')
    @patch('celery.app.task.Task.request')
    def test_run_zip_export_provider(self, mock_request, mock_zip_file, mock_export_provider_task, mock_isfile, mock_logger):
        file_names = ('file1', 'file2', 'file3')
        tasks = (Mock(result=Mock(filename=file_names[0])),
                 Mock(result=Mock(filename=file_names[1])),
                 Mock(result=Mock(filename=file_names[2])))
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid), "slug")

        expected_file_names = [os.path.join(stage_dir, file_name) for file_name in file_names]
        mock_all = Mock()
        mock_all.return_value = tasks
        mock_export_provider_task.objects.get.return_value = Mock(slug="slug", status=TaskStates.SUCCESS.value, tasks=Mock(all=mock_all))
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)

        job_name = self.job.name.lower()

        expected_output_path = os.path.join(stage_dir,
                                            '{}.zip'.format(job_name))
        mock_zip_file.run.return_value = {'result': expected_output_path}
        mock_isfile.return_value = True


        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=zip_export_provider.name)
        result = zip_export_provider.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                        job_name=job_name, run_uid=self.run.uid)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
        mock_zip_file.run.assert_called_once_with(adhoc=True, run_uid=self.run.uid, include_files=expected_file_names,
                                           file_name=os.path.join(stage_dir, "{0}.zip".format(job_name)))

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



    @patch('celery.app.task.Task.request')
    @patch('eventkit_cloud.utils.external_service.ExternalRasterServiceToGeopackage')
    def test_run_external_raster_service_export_task(self, mock_service, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        service_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(self.run.uid)),
                                            '{}.gpkg'.format(job_name))
        service_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=external_raster_service_export_task.name)
        result = external_raster_service_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                         job_name=job_name)
        service_to_gpkg.convert.assert_called_once()
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
        service_to_gpkg.convert.side_effect = Exception("Task Failed")
        with self.assertRaises(Exception):
            external_raster_service_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                                    job_name=job_name)

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
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=bounds_export_task.name)
        result = bounds_export_task.run(run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                        provider_slug=job_name)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)

    @patch('eventkit_cloud.tasks.export_tasks.timezone')
    @patch('celery.app.task.Task.request')
    @patch('audit_logging.file_logging.logging_open')
    def test_run_osm_create_styles_task(self, mock_logging_open, mock_request, mock_timezone):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        provider_slug = 'example_provider'
        bbox = [-1, -1, 1, 1]
        mock_timezone.now.return_value = datetime.datetime(2017, 1, 2, 3, 4, 5)
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + '/'
        style_file = os.path.join(stage_dir, '{0}-osm-{1}.qgs'.format(job_name, '20170102'))
        expected_output_path = style_file
        export_provider_task = ExportProviderTask.objects.create(run=self.run)
        saved_export_task = ExportTask.objects.create(export_provider_task=export_provider_task,
                                                      status=TaskStates.PENDING.value,
                                                      name=osm_create_styles_task.name)
        result = osm_create_styles_task.run(task_uid=str(saved_export_task.uid), stage_dir=stage_dir,
                                            job_name=job_name, provider_slug=provider_slug, bbox=bbox)
        self.assertEquals(expected_output_path, result['result'])
        # test the tasks update_task_state method
        run_task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEquals(TaskStates.RUNNING.value, run_task.status)
        mock_logging_open.assert_called_once_with(style_file, 'w', user_details=None)

    @patch('eventkit_cloud.tasks.export_tasks.s3.upload_to_s3')
    @patch('os.makedirs')
    @patch('os.path.isdir')
    @patch('shutil.copy')
    @patch('os.stat')
    @patch('django.utils.timezone')
    def test_task_on_success(self, time, os_stat, shutil_copy, isdir, mkdirs, s3):
        isdir.return_value = False  # download dir doesn't exist
        real_time = real_timezone.now()
        time.now.return_value = real_time
        expected_time = real_time.strftime('%Y%m%d')
        download_file = '{0}-{1}-{2}{3}'.format('file', 'osm-generic', expected_time, '.shp')
        osstat = os_stat.return_value
        s3_url = 'cloud.eventkit.dev/{0},{0},{0}'.format(str(self.run.uid), 'osm-generic', download_file)
        s3.return_value = s3_url
        type(osstat).st_size = PropertyMock(return_value=1234567890)
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status=TaskStates.RUNNING.value, name=shp_export_task.name)
        expected_url = '/'.join([settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(self.run.uid), download_file])
        download_url = '/'.join([settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(self.run.uid),
                                 'osm-generic', 'file.shp'])
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(self.run.uid))
        shp_export_task.on_success(retval={'result': download_url}, task_id=celery_uid,
                                   args={}, kwargs={'run_uid': str(self.run.uid)})
        os_stat.assert_has_calls([call(download_url)])
        if not getattr(settings, "USE_S3", False):
            isdir.assert_has_calls([call(run_dir)])
            mkdirs.assert_has_calls([call(run_dir)])
            shutil_copy.assert_called_once()
        task = ExportTask.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        result = task.result
        self.assertIsNotNone(result)
        self.assertEqual(task, result.task)
        self.assertEquals(TaskStates.SUCCESS.value, task.status)
        self.assertEquals('ESRI Shapefile Format', task.name)
        # pull out the result and test
        result = ExportTaskResult.objects.get(task__celery_uid=celery_uid)
        self.assertIsNotNone(result)
        if getattr(settings, "USE_S3", False):
            self.assertEqual(s3_url, str(result.download_url))
        else:
            self.assertEquals(expected_url, str(result.download_url))

    def test_task_on_failure(self,):
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
        mock_os_walk.return_value = [(
            '/var/lib/eventkit/exports_staging/' + run_uid + '/osm-vector',
            None,
            ['test.gpkg', 'test.om5', 'test.osm']  # om5 and osm should get filtered out
        )]
        date = timezone.now().strftime('%Y%m%d')
        fname = 'test-osm-vector-{0}.gpkg'.format(date,)
        zipfile_name = '{0}/TestJob-test-eventkit-{1}.zip'.format(run_uid, date)
        s3.return_value = "www.s3.eventkit-cloud/{}".format(zipfile_name)
        result = zip_file_task.run(run_uid=run_uid, include_files=[
            '/var/lib/eventkit/exports_staging/{0}/osm-vector/test.gpkg'.format(run_uid)])

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
        self.assertEquals('Pickup Run', pick_up_run_task.name)
        pick_up_run_task.run(run_uid=run_uid, user_details={'username': 'test_pickup_run_task'})
        task_factory.assert_called_once()
        expected_user_details = {'username': 'test_pickup_run_task'}
        task_factory.return_value.parse_tasks.assert_called_once_with(
            run_uid=run_uid, user_details=expected_user_details, worker="test"
        )

    @patch('eventkit_cloud.tasks.export_tasks.logger')
    @patch('shutil.rmtree')
    def test_finalize_run_task_after_return(self, rmtree, logger):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(self.run.uid))
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status='SUCCESS', name='Default Shapefile Export')
        finalize_run_task.after_return('status', {'stage_dir': stage_dir}, run_uid, (), {}, 'Exception Info')
        rmtree.assert_called_with(stage_dir)

        celery_uid = str(uuid.uuid4())
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
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
        export_provider_task = ExportProviderTask.objects.create(status=TaskStates.SUCCESS.value, run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, celery_uid=celery_uid,
                                  status=TaskStates.SUCCESS.value, name='Default Shapefile Export')
        self.assertEquals('Finalize Export Run', finalize_run_task.name)
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
        export_provider_task = ExportProviderTask.objects.create(run=self.run, name='Shapefile Export')
        ExportTask.objects.create(export_provider_task=export_provider_task, uid=task_id,
                                  celery_uid=celery_uid, status=TaskStates.FAILED.value,
                                  name='Default Shapefile Export')
        self.assertEquals('Export Task Error Handler', export_task_error_handler.name)
        export_task_error_handler.run(run_uid=run_uid, task_id=task_id, stage_dir=stage_dir)
        isdir.assert_any_call(stage_dir)
        rmtree.assert_called_once_with(stage_dir)
        email().send.assert_called_once()
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

    @patch('eventkit_cloud.tasks.export_tasks.kill_task')
    def test_cancel_task(self, mock_kill_task):
        worker_name = "test_worker"
        task_pid = 55
        celery_uid = uuid.uuid4()
        user = User.objects.create(username="test_user", password="test_password", email="test@email.com")
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task',
        )
        export_task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.PENDING.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        )

        self.assertEquals('Cancel Export Provider Task', cancel_export_provider_task.name)
        cancel_export_provider_task.run(export_provider_task_uid=export_provider_task.uid, canceling_user=user)
        mock_kill_task.apply_async.assert_called_once_with(kwargs={"task_pid": task_pid, "celery_uid": celery_uid},
                                                           queue="{0}.cancel".format(worker_name),
                                                           priority=TaskPriority.CANCEL.value,
                                                           routing_key="{0}.cancel".format(worker_name))
        export_task = ExportTask.objects.get(uid=export_task.uid)
        export_provider_task = ExportProviderTask.objects.get(uid=export_provider_task.uid)
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

    @patch('eventkit_cloud.tasks.export_tasks.finalize_export_provider_task')
    def test_clean_up_failure_task(self, finalize_export_provider_task):
        worker_name = "test_worker"
        task_pid = 55
        celery_uid = uuid.uuid4()
        run_uid = self.run.uid
        canceled_export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task',
            status=TaskStates.CANCELED.value,
            slug='test_provider_task_slug'
        )
        ExportTask.objects.create(
            export_provider_task=canceled_export_provider_task,
            status=TaskStates.CANCELED.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        )
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task',
            status=TaskStates.PENDING.value,
            slug='test_provider_task_slug'
        )
        task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.PENDING.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        )
        export_provider_task_uids = [canceled_export_provider_task.uid, export_provider_task.uid]
        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(run_uid))
        clean_up_failure_task.run(export_provider_task_uids=export_provider_task_uids, run_uid=run_uid,
                                  run_dir=run_dir, worker=worker_name)
        updated_task = ExportTask.objects.get(uid=task.uid)
        self.assertEqual(updated_task.status, TaskStates.CANCELED.value)
        finalize_export_provider_task.si.assert_any_call(export_provider_task_uid=canceled_export_provider_task.uid,
                  run_uid=run_uid, worker=worker_name)
        finalize_export_provider_task.si.assert_any_call(export_provider_task_uid=export_provider_task.uid,
                                                             run_uid=run_uid, worker=worker_name)
        finalize_export_provider_task.si().set.assert_any_call(queue=worker_name, routing_key=worker_name)
        finalize_export_provider_task.si().set().apply_async.assert_any_call(interval=1, max_retries=10,
                                                                             priority=TaskPriority.FINALIZE_PROVIDER.value,
                                                                             queue=worker_name, routing_key=worker_name)

    @patch('eventkit_cloud.tasks.export_tasks.finalize_run_task')
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.export_tasks.zip_file_task')
    def test_finalize_export_provider_task(self, zip_file_task, isfile, finalize_run_task):
        worker_name = "test_worker"
        task_pid = 55
        filename = 'test.gpkg'
        celery_uid = uuid.uuid4()
        run_uid = self.run.uid
        self.job.include_zipfile = True
        self.job.save()
        export_provider_task = ExportProviderTask.objects.create(
            run=self.run,
            name='test_provider_task',
            status=TaskStates.COMPLETED.value,
            slug='test_provider_task_slug'
        )
        task = ExportTask.objects.create(
            export_provider_task=export_provider_task,
            status=TaskStates.COMPLETED.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name
        )
        ExportTaskResult.objects.create(task=task, filename=filename, size=10)

        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/')
        run_dir = os.path.join(download_root, str(run_uid))
        finalize_export_provider_task.run(run_uid=self.run.uid, export_provider_task_uid=export_provider_task.uid,
                                          run_dir=run_dir)
        full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                      export_provider_task.slug, filename)
        isfile.assert_called_once_with(full_file_path)
        zip_file_task.run.assert_called_with(run_uid=run_uid, include_files=[full_file_path])
        finalize_run_task.si.called_once_with(run_uid=run_uid,
                                              stage_dir=run_dir)
        finalize_run_task.si().set.called_once_with(queue=worker_name, routing_key=worker_name)
        finalize_run_task.si().set().apply_async.called_once_with(interval=1,
                                                                  max_retries=10,
                                                                  queue=worker_name,
                                                                  routing_key=worker_name,
                                                                  priority=TaskPriority.FINALIZE_RUN.value)

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


class TestFormatTasks(ExportTaskBase):

    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)
