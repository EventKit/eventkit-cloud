# -*- coding: utf-8 -*-

import json
import logging
import os
import pickle
import sys
import uuid
from unittest.mock import ANY, MagicMock, Mock, PropertyMock, call, patch

import celery
from billiard.einfo import ExceptionInfo
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon, fromstr, MultiPolygon
from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone

from eventkit_cloud.celery import TaskPriority, app
from eventkit_cloud.jobs.models import DatamodelPreset, DataProvider, DataProviderType, Job
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.export_tasks import (
    ExportTask,
    FormatTask,
    arcgis_feature_service_export_task,
    bounds_export_task,
    cancel_export_provider_task,
    create_zip_task,
    export_task_error_handler,
    finalize_export_provider_task,
    finalize_run_task,
    geopackage_export_task,
    geotiff_export_task,
    get_ogcapi_data,
    gpx_export_task,
    hfa_export_task,
    kill_task,
    kml_export_task,
    mapproxy_export_task,
    mbtiles_export_task,
    nitf_export_task,
    ogcapi_process_export_task,
    osm_data_collection_pipeline,
    output_selection_geojson_task,
    parse_result,
    pbf_export_task,
    pick_up_run_task,
    raster_file_export_task,
    reprojection_task,
    shp_export_task,
    sqlite_export_task,
    vector_file_export_task,
    wait_for_providers_task,
    wcs_export_task,
    wfs_export_task,
    zip_files,
)
from eventkit_cloud.tasks.helpers import default_format_time
from eventkit_cloud.tasks.models import (
    DataProviderTaskRecord,
    ExportRun,
    ExportTaskRecord,
    FileProducingTaskResult,
    RunZipFile,
)
from eventkit_cloud.tasks.task_base import LockingTask

logger = logging.getLogger(__name__)

test_cert_info = """
    cert_info:
        cert_path: '/path/to/fake/cert'
        cert_pass_var: 'fakepass'
"""

expected_cert_info = {"cert_path": "/path/to/fake/cert", "cert_pass_var": "fakepass"}


class TestLockingTask(TestCase):
    def test_locking_task(self):
        task_id = "0123"
        retries = False
        task_name = "lock_test_task"
        expected_lock_key = f"TaskLock_{task_name}_{task_id}_{retries}"
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


class ExportTaskBase(TestCase):
    fixtures = ("osm_provider.json", "datamodel_presets.json")

    def setUp(self):
        self.maxDiff = None
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group, created = Group.objects.get_or_create(name="TestDefault")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = self.group
            self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        bbox = Polygon.from_bbox((1, 2, 3, 4))
        tags = DatamodelPreset.objects.get(name="hdm").json_tags
        self.assertEqual(259, len(tags))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(
            name="TestJob", description="Test description", user=self.user, the_geom=the_geom, json_tags=tags
        )
        self.job.feature_save = True
        self.job.feature_pub = True
        self.job.save()
        self.run = ExportRun.objects.create(job=self.job, user=self.user)
        self.provider = DataProvider.objects.first()

        self.task_process_patcher = patch("eventkit_cloud.tasks.export_tasks.TaskProcess")
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)


class TestExportTasks(ExportTaskBase):
    stage_dir = "/stage"

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_run_shp_export_task(self, mock_request, mock_convert, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"

        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=shp_export_task.name
        )
        shp_export_task.task = saved_export_task
        shp_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        self.task_process.return_value = Mock(exitcode=0)
        result = shp_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="ESRI Shapefile",
            input_files=expected_output_path,
            output_file=expected_output_path,
            boundary=None,
            projection=4326,
            executor=self.task_process().start_process,
            skip_failures=True,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("eventkit_cloud.tasks.export_tasks.convert_qgis_gpkg_to_kml")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_run_kml_export_task(
        self, mock_request, mock_convert, mock_qgis_convert, mock_generate_qgs_style, mock_get_export_filepath
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_generate_qgs_style.return_value = qgs_file = "/style.qgs"
        mock_convert.return_value = mock_qgis_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=kml_export_task.name
        )
        kml_export_task.task = saved_export_task
        kml_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        self.task_process.return_value = Mock(exitcode=0)
        result = kml_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
        )
        try:
            import qgis  # noqa

            mock_qgis_convert.assert_called_once_with(qgs_file, expected_output_path, stage_dir=self.stage_dir)
        except ImportError:
            mock_convert.assert_called_once_with(
                driver="libkml",
                input_files=expected_output_path,
                output_file=expected_output_path,
                projection=4326,
                boundary=None,
                executor=self.task_process().start_process,
            )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_run_sqlite_export_task(self, mock_request, mock_convert, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=sqlite_export_task.name
        )
        sqlite_export_task.task = saved_export_task
        sqlite_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        self.task_process.return_value = Mock(exitcode=0)
        result = sqlite_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="SQLite",
            input_files=expected_output_path,
            output_file=expected_output_path,
            projection=4326,
            boundary=None,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.models.DataProvider.layers", new_callable=PropertyMock)
    @patch("eventkit_cloud.tasks.export_tasks.os.path.exists")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.download_concurrently")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    @patch("celery.app.task.Task.request")
    def test_run_wfs_export_task(
        self,
        mock_request,
        mock_gpkg,
        mock_convert,
        mock_download_concurrently,
        mock_get_export_filepath,
        mock_exists,
        mock_layers,
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        expected_provider_slug = "wfs-service"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="wfs")
        self.provider.slug = expected_provider_slug
        self.provider.config = dict()
        self.provider.save()

        expected_base_path = "/path/to"
        expected_outfile = os.path.join(expected_base_path, "file.ext")
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        mock_get_export_filepath.return_value = expected_output_path
        mock_exists.return_value = True

        layer = "foo"
        service_url = "https://abc.gov/WFSserver/"
        query_url = "?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=foo&SRSNAME=EPSG:4326&BBOX=BBOX_PLACEHOLDER"
        mock_layers.return_value = {layer: {"name": layer, "url": query_url}}
        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=wfs_export_task.name
        )
        polygon: MultiPolygon = MultiPolygon(fromstr(Polygon.from_bbox([1, 2, 3, 4])))
        saved_export_task.export_provider_task.run.job.the_geom = polygon
        wfs_export_task.task = saved_export_task
        wfs_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        mock_gpkg.check_content_exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)
        result = wfs_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=service_url,
            layer=layer,
            bbox=polygon.extent,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])
        mock_gpkg.check_content_exists.assert_called_once_with(expected_output_path)

        result_b = wfs_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=f"{service_url}/",
            bbox=polygon.extent,
        )

        self.assertEqual(expected_output_path, result_b["result"])
        self.assertEqual(expected_output_path, result_b["source"])

        url_1 = "https://abc.gov/wfs/services/x"
        url_2 = "https://abc.gov/wfs/services/y"
        layer_1 = "spam"
        layer_2 = "ham"

        mock_layers.return_value = {layer_1: {"name": layer_1, "url": url_1}, layer_2: {"name": layer_2, "url": url_2}}
        expected_path_1 = os.path.join(expected_base_path, f"{layer_1}.gpkg")
        expected_path_2 = os.path.join(expected_base_path, f"{layer_2}.gpkg")

        expected_url_1 = (
            f"{url_1}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer_1}"
            f"&SRSNAME=EPSG:{projection}&BBOX=BBOX_PLACEHOLDER"
        )
        expected_url_2 = (
            f"{url_2}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer_2}"
            f"&SRSNAME=EPSG:{projection}&BBOX=BBOX_PLACEHOLDER"
        )
        expected_layers = {
            layer_1: {
                "task_uid": str(saved_export_task.uid),
                "url": expected_url_1,
                "path": expected_path_1,
                "base_path": expected_base_path,
                "bbox": polygon.extent,
                "layer_name": layer_1,
                "projection": projection,
                "level": 15,
            },
            layer_2: {
                "task_uid": str(saved_export_task.uid),
                "url": expected_url_2,
                "path": expected_path_2,
                "base_path": expected_base_path,
                "bbox": polygon.extent,
                "layer_name": layer_2,
                "projection": projection,
                "level": 15,
            },
        }

        mock_download_concurrently.reset_mock()
        mock_convert.reset_mock()
        mock_get_export_filepath.reset_mock()

        mock_download_concurrently.return_value = expected_layers
        mock_get_export_filepath.side_effect = [expected_output_path, expected_path_1, expected_path_2]

        # test with multiple layers
        result_c = wfs_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=service_url,
            layer=layer,
            bbox=polygon.extent,
        )

        _, args, _ = mock_download_concurrently.mock_calls[0]
        self.assertEqual(list(args[0]), list(expected_layers.values()))
        self.assertEqual(mock_convert.call_count, 2)

        mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_1,
            output_file=expected_output_path,
            projection=4326,
            boundary=polygon.extent,
            access_mode="append",
            layer_name=layer_1,
            executor=self.task_process().start_process,
        )

        mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_2,
            output_file=expected_output_path,
            projection=4326,
            boundary=polygon.extent,
            access_mode="append",
            layer_name=layer_2,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result_c["result"])
        self.assertEqual(expected_output_path, result_c["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_mbtiles_export_task(self, mock_request, mock_convert, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        output_projection = 3857
        driver = "MBTiles"
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path
        sample_input = "example.gpkg"
        previous_task_result = {"source": sample_input}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=mbtiles_export_task.name
        )
        mbtiles_export_task.task = saved_export_task
        mbtiles_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        self.task_process.return_value = Mock(exitcode=0)
        result = mbtiles_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=output_projection,
        )
        mock_convert.assert_called_once_with(
            driver=driver,
            input_files=sample_input,
            output_file=expected_output_path,
            projection=output_projection,
            boundary=None,
            use_translate=True,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(sample_input, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.os.rename")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_run_gpkg_export_task(self, mock_request, mock_convert, mock_rename, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.gpkg"

        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        mock_rename.return_value = expected_output_path
        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=geopackage_export_task.name
        )
        self.task_process.return_value = Mock(exitcode=0)

        mock_convert.return_value = expected_output_path
        result = geopackage_export_task(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
        )
        mock_rename.assert_called_once_with(expected_output_path, expected_output_path)
        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

        example_input_file = "test.tif"
        previous_task_result = {"source": example_input_file}

        result = geopackage_export_task(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
        )

        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=example_input_file,
            output_file=expected_output_path,
            projection=4326,
            boundary=None,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(example_input_file, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.os.remove")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("eventkit_cloud.tasks.export_tasks.sqlite3.connect")
    @patch("eventkit_cloud.tasks.export_tasks.cancel_export_provider_task.run")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.update_progress")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    @patch("eventkit_cloud.tasks.export_tasks.FeatureSelection")
    @patch("eventkit_cloud.tasks.export_tasks.pbf")
    @patch("eventkit_cloud.tasks.export_tasks.overpass")
    def test_osm_data_collection_pipeline(
        self,
        mock_overpass,
        mock_pbf,
        mock_feature_selection,
        mock_geopackage,
        mock_update_progress,
        mock_get_export_task_record,
        mock_get_export_filepath,
        mock_cancel_provider_task,
        mock_connect,
        mock_convert,
        mock_remove,
    ):
        example_export_task_record_uid = "1234"
        example_bbox = [-1, -1, 1, 1]
        mock_get_export_filepath.return_value = example_gpkg = "/path/to/file.gpkg"
        mock_geopackage.Geopackage.return_value = Mock(results=[Mock(parts=[example_gpkg])])
        # Test with using overpass
        example_overpass_query = "some_query; out;"
        example_config = {"overpass_query": example_overpass_query}
        self.task_process.return_value = Mock(exitcode=0)
        expected_overpass_files = [
            os.path.join(self.stage_dir, f"no_job_name_specified_{num}_query.osm") for num in range(1, 5)
        ]
        expected_o5m_files = [
            f"{os.path.splitext(expected_overpass_file)[0]}.o5m" for expected_overpass_file in expected_overpass_files
        ]
        mock_overpass.Overpass().run_query.side_effect = expected_overpass_files
        mock_overpass.Overpass.reset_mock()
        convert_side_effects = expected_o5m_files + [os.path.join(self.stage_dir, "no_job_name_specified_query.pbf")]
        mock_pbf.OSMToPBF().convert.side_effect = convert_side_effects
        mock_pbf.OSMToPBF.reset_mock()
        osm_data_collection_pipeline(
            example_export_task_record_uid,
            self.stage_dir,
            bbox=example_bbox,
            config=example_config,
        )
        mock_connect.assert_called_once()
        mock_remove.assert_has_calls(
            [call(expected_overpass_file) for expected_overpass_file in expected_overpass_files], any_order=True
        )
        mock_overpass.Overpass.assert_has_calls(
            [
                call(
                    bbox=[0.0, -1, 1, 0.0],
                    stage_dir="/stage",
                    slug=None,
                    url=None,
                    job_name="no_job_name_specified",
                    task_uid=example_export_task_record_uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[0]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[0.0, 0.0, 1, 1],
                    stage_dir="/stage",
                    slug=None,
                    url=None,
                    job_name="no_job_name_specified",
                    task_uid=example_export_task_record_uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[1]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[-1, 0.0, 0.0, 1],
                    stage_dir="/stage",
                    slug=None,
                    url=None,
                    job_name="no_job_name_specified",
                    task_uid=example_export_task_record_uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[2]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[-1, -1, 0.0, 0.0],
                    stage_dir="/stage",
                    slug=None,
                    url=None,
                    job_name="no_job_name_specified",
                    task_uid=example_export_task_record_uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[3]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
            ]
        )
        mock_pbf.OSMToPBF.assert_called_with(
            osm_files=expected_o5m_files,
            outfile=os.path.join(self.stage_dir, "no_job_name_specified_query.pbf"),
            task_uid=example_export_task_record_uid,
        )
        mock_feature_selection.example.assert_called_once()
        mock_cancel_provider_task.assert_not_called()

        # Test canceling the provider task on an empty geopackage.
        mock_overpass.Overpass().run_query.side_effect = expected_overpass_files
        mock_geopackage.Geopackage().run.return_value = None
        mock_pbf.OSMToPBF().convert.side_effect = convert_side_effects
        mock_pbf.OSMToPBF.reset_mock()
        osm_data_collection_pipeline(
            example_export_task_record_uid,
            self.stage_dir,
            bbox=example_bbox,
            config=example_config,
        )
        mock_cancel_provider_task.assert_called_once()

        mock_overpass.reset_mock()
        mock_pbf.reset_mock()
        mock_feature_selection.reset_mock()
        mock_geopackage.reset_mock()

        # Test with using pbf_file
        example_pbf_file = "test.pbf"
        example_config = {"pbf_file": example_pbf_file}
        osm_data_collection_pipeline(
            example_export_task_record_uid,
            self.stage_dir,
            bbox=example_bbox,
            config=example_config,
        )

        mock_overpass.Overpass.assert_not_called()
        mock_pbf.OSMToPBF.assert_not_called()
        mock_feature_selection.assert_not_called()

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_creation_options")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    def test_geotiff_export_task(
        self, mock_convert, mock_get_export_task_record, mock_get_creation_options, mock_get_export_filepath
    ):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        example_geotiff = "example.tif"
        example_result = {"source": example_geotiff}
        task_uid = "1234"
        warp_params = {"warp": "params"}
        translate_params = {"translate": "params"}
        mock_get_creation_options.return_value = warp_params, translate_params
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="geotiff-generic", data_type="elevation", label="label"),
            )
        )

        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        self.task_process.return_value = Mock(exitcode=0)
        geotiff_export_task.task_uid = task_uid
        geotiff_export_task.stage_dir = self.stage_dir
        geotiff_export_task.task = mock_get_export_task_record
        geotiff_export_task(result=example_result)
        mock_convert.return_value = expected_outfile
        mock_convert.assert_called_once_with(
            boundary=None,
            driver="gtiff",
            input_files=f"GTIFF_RAW:{example_geotiff}",
            output_file=expected_outfile,
            warp_params=warp_params,
            translate_params=translate_params,
            executor=self.task_process().start_process,
            projection=4326,
            is_raster=True,
        )

        mock_convert.reset_mock()
        example_result = {"source": example_geotiff, "selection": "selection"}
        mock_convert.return_value = expected_outfile
        geotiff_export_task(result=example_result)
        mock_convert.assert_called_once_with(
            boundary="selection",
            driver="gtiff",
            input_files=f"GTIFF_RAW:{example_geotiff}",
            output_file=expected_outfile,
            warp_params=warp_params,
            translate_params=translate_params,
            executor=self.task_process().start_process,
            projection=4326,
            is_raster=True,
        )

        mock_convert.reset_mock()
        example_result = {"gtiff": expected_outfile}
        geotiff_export_task(result=example_result, task_uid=task_uid, stage_dir=self.stage_dir)
        mock_convert.assert_not_called()

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    def test_nitf_export_task(self, mock_convert, mock_get_export_task_record, mock_get_export_filepath):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="nitf-generic", data_type="vector", label="label"),
            )
        )
        nitf_export_task.task = mock_get_export_task_record
        example_nitf = "example.nitf"
        example_result = {"source": example_nitf}
        task_uid = "1234"
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        nitf_export_task(result=example_result, task_uid=task_uid, stage_dir=self.stage_dir)
        mock_convert.return_value = expected_outfile
        mock_convert.assert_called_once_with(
            creation_options=["ICORDS=G"],
            driver="nitf",
            input_files=example_nitf,
            output_file=expected_outfile,
            executor=self.task_process().start_process,
            projection=4326,
        )
        mock_convert.reset_mock()
        nitf_export_task(result=example_result, task_uid=task_uid, stage_dir=self.stage_dir)
        mock_convert.assert_called_once_with(
            creation_options=["ICORDS=G"],
            driver="nitf",
            input_files=example_nitf,
            output_file=expected_outfile,
            executor=self.task_process().start_process,
            projection=4326,
        )

    def test_pbf_export_task(self):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        example_pbf = "example.pbf"
        example_result = {"pbf": example_pbf}
        expected_result = {"file_extension": "pbf", "driver": "OSM", "pbf": example_pbf, "result": example_pbf}
        returned_result = pbf_export_task(example_result)
        self.assertEquals(expected_result, returned_result)

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_sqlite_export_task(
        self, mock_request, mock_convert, mock_get_export_task_record, mock_get_export_filepath
    ):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="sqlite-generic", data_type="vector", label="label"),
            )
        )
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"

        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=sqlite_export_task.name
        )
        sqlite_export_task.task = saved_export_task
        sqlite_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        self.task_process.return_value = Mock(exitcode=0)
        result = sqlite_export_task.run(
            result=previous_task_result,
            projection=4326,
        )
        mock_convert.assert_called_once_with(
            driver="SQLite",
            input_files=expected_output_path,
            output_file=expected_output_path,
            projection=4326,
            boundary=None,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    def test_gpx_export_task(self, mock_convert, mock_get_export_task_record, mock_get_export_filepath):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="gpx-generic", data_type="vector", label="label"),
            )
        )
        example_source = "example.pbf"
        example_geojson = "example.geojson"
        task_uid = "1234"
        example_result = {"pbf": example_source, "selection": example_geojson}

        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        mock_convert.return_value = expected_output_path
        expected_result = {
            "pbf": example_source,
            "file_extension": "gpx",
            "driver": "GPX",
            "result": expected_output_path,
            "gpx": expected_output_path,
            "selection": example_geojson,
        }
        self.task_process.return_value = Mock(exitcode=0)
        returned_result = gpx_export_task(result=example_result, task_uid=task_uid, stage_dir=self.stage_dir)
        mock_convert.assert_called_once_with(
            input_files=example_source,
            output_file=expected_output_path,
            driver="GPX",
            dataset_creation_options=["GPX_USE_EXTENSIONS=YES"],
            creation_options=["-explodecollections"],
            boundary=example_geojson,
            executor=self.task_process().start_process,
        )
        self.assertEqual(returned_result, expected_result)

    @patch("eventkit_cloud.tasks.models.DataProvider.layers", new_callable=PropertyMock)
    @patch("eventkit_cloud.tasks.export_tasks.os.path.exists")
    @patch("eventkit_cloud.tasks.export_tasks.make_dirs")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    @patch("eventkit_cloud.tasks.export_tasks.download_concurrently")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_run_arcgis_feature_service_export_task(
        self,
        mock_request,
        mock_convert,
        mock_download_concurrently,
        mock_geopackage,
        mock_get_export_filepath,
        mock_makedirs,
        mock_exists,
        mock_layers,
    ):
        selection = "selection.geojson"
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        expected_provider_slug = "arcgis-feature-service"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="arcgis-feature")
        self.provider.slug = expected_provider_slug
        self.provider.config = dict()
        self.provider.save()

        expected_base_path = "/path/to"
        expected_outfile = os.path.join(expected_base_path, "file.ext")
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        mock_get_export_filepath.return_value = expected_output_path

        service_url = "https://abc.gov/arcgis/services/x"
        bbox = Polygon.from_bbox((1, 2, 3, 4)).extent
        query_string = "query?where=objectid=objectid&outfields=*&f=json&geometry=BBOX_PLACEHOLDER"
        expected_input_url = (
            "https://abc.gov/arcgis/services/x/query?where=objectid=objectid&"
            "outfields=*&f=json&geometry=2.0%2C%202.0%2C%203.0%2C%203.0"
        )
        mock_convert.return_value = expected_output_path
        mock_exists.return_value = True

        previous_task_result = {"source": expected_input_url, "selection": selection}

        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )

        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.PENDING.value,
            name=arcgis_feature_service_export_task.name,
        )
        arcgis_feature_service_export_task.task = saved_export_task
        mock_geopackage.check_content_exists.return_value = True
        self.task_process.return_value = Mock(exitcode=0)

        # Need to override layers so that we don't make external call.
        url_1 = "https://abc.gov/arcgis/services/x"
        url_2 = "https://abc.gov/arcgis/services/y"

        layer_name_1 = "foo"
        layer_name_2 = "bar"
        expected_field = "baz"

        mock_layers.return_value = {
            layer_name_1: {"name": layer_name_1, "url": url_1},
            layer_name_2: {"name": layer_name_2, "url": url_2},
        }

        # test without trailing slash
        result_a = arcgis_feature_service_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=service_url,
            bbox=bbox,
        )

        self.assertEqual(expected_output_path, result_a["result"])
        self.assertEqual(expected_output_path, result_a["source"])

        # test with trailing slash
        result_b = arcgis_feature_service_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=f"{service_url}/",
            bbox=bbox,
        )

        self.assertEqual(expected_output_path, result_b["result"])
        self.assertEqual(expected_output_path, result_b["source"])

        vector_layers = {
            layer_name_1: {"name": layer_name_1, "url": url_1},
            layer_name_2: {"name": layer_name_2, "url": url_2, "distinct_field": expected_field},
        }

        mock_layers.return_value = vector_layers

        expected_path_1 = os.path.join(expected_base_path, f"{layer_name_1}.gpkg")
        expected_path_2 = os.path.join(expected_base_path, f"{layer_name_2}.gpkg")
        expected_url_1 = f"{url_1}/{query_string}"
        expected_url_2 = f"{url_2}/{query_string}"
        expected_layers = {
            layer_name_1: {
                "task_uid": str(saved_export_task.uid),
                "url": expected_url_1,
                "path": expected_path_1,
                "base_path": expected_base_path,
                "bbox": bbox,
                "level": 15,
                "projection": projection,
                "layer_name": layer_name_1,
                "distinct_field": "OBJECTID",
            },
            layer_name_2: {
                "task_uid": str(saved_export_task.uid),
                "url": expected_url_2,
                "path": expected_path_2,
                "base_path": expected_base_path,
                "bbox": bbox,
                "level": 15,
                "projection": projection,
                "layer_name": layer_name_2,
                "distinct_field": expected_field,
            },
        }

        mock_download_concurrently.return_value = expected_layers
        mock_convert.reset_mock()

        mock_get_export_filepath.reset_mock()
        mock_get_export_filepath.side_effect = [expected_output_path, expected_path_1, expected_path_2]
        mock_convert.return_value = expected_output_path
        mock_download_concurrently.reset_mock()

        # test with multiple layers
        result_c = arcgis_feature_service_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=f"{service_url}/",
            bbox=bbox,
        )

        _, _, kwargs = mock_download_concurrently.mock_calls[0]

        self.assertEqual(kwargs["layers"], list(expected_layers.values()))
        self.assertEqual(mock_convert.call_count, 2)

        mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_1,
            output_file=expected_output_path,
            projection=4326,
            boundary=selection,
            access_mode="append",
            layer_name=layer_name_1,
            executor=self.task_process().start_process,
        )

        mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_2,
            output_file=expected_output_path,
            projection=4326,
            boundary=selection,
            access_mode="append",
            layer_name=layer_name_2,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result_c["result"])
        self.assertEqual(expected_output_path, result_c["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.logging_open")
    @patch("celery.app.task.Task.request")
    def test_output_selection_geojson_task(
        self, mock_request, mock_open, mock_get_export_task_record, mock_get_export_filepath
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        file_path = "/path/file.geojson"
        mock_get_export_filepath.return_value = file_path
        expected_result = {"result": file_path, "selection": file_path}
        self.assertEqual(expected_result, output_selection_geojson_task.run(selection='{"geojson": "here"}'))

    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("eventkit_cloud.tasks.export_tasks.TaskProcess")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.parse_result")
    @patch("celery.app.task.Task.request")
    def test_hfa_export_task(
        self,
        mock_request,
        mock_parse_result,
        mock_get_export_task_record,
        mock_get_export_filepath,
        mock_task_process,
        mock_convert,
    ):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        file_path = "/path/file.img"
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="hfa-generic", data_type="vector", label="label"),
            )
        )
        hfa_export_task.task = mock_get_export_task_record
        mock_parse_result.return_value = file_path
        mock_convert.return_value = file_path
        expected_result = {"file_extension": "img", "result": file_path, "driver": "hfa", "hfa": file_path}
        self.assertEqual(expected_result, hfa_export_task.run())

    @patch("eventkit_cloud.tasks.export_tasks.wcs")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.parse_result")
    @patch("celery.app.task.Task.request")
    def test_wcs_export_task(
        self,
        mock_request,
        mock_parse_result,
        mock_get_export_task_record,
        mock_get_export_filepath,
        mock_wcs,
    ):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        file_path = "/path/file.tif"
        mock_get_export_task_record.return_value = Mock(
            export_provider_task=Mock(
                run=Mock(job=Mock(event="event")),
                provider=Mock(slug="wcs-generic", data_type="vector", label="label"),
            )
        )
        wcs_export_task.task = mock_get_export_task_record
        mock_parse_result.return_value = file_path
        mock_wcs.WCSConverter().convert.return_value = file_path
        expected_result = {"source": file_path, "result": file_path}
        self.assertEqual(expected_result, wcs_export_task.run())

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("celery.app.task.Task.request")
    @patch("eventkit_cloud.utils.mapproxy.MapproxyGeopackage")
    def test_run_external_raster_service_export_task(self, mock_service, mock_request, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        service_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()

        service_to_gpkg.convert.return_value = expected_output_path = os.path.join(self.stage_dir, f"{job_name}.gpkg")
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=mapproxy_export_task.name
        )
        mapproxy_export_task.task = saved_export_task
        mapproxy_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = mapproxy_export_task.run(task_uid=str(saved_export_task.uid), stage_dir=self.stage_dir)
        service_to_gpkg.convert.assert_called_once()

        self.assertEqual(expected_output_path, result["result"])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEqual(TaskState.RUNNING.value, run_task.status)
        service_to_gpkg.convert.side_effect = Exception("Task Failed")
        with self.assertRaises(Exception):
            mapproxy_export_task.run(
                run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=self.stage_dir, job_name=job_name
            )

    def test_task_on_failure(self):
        celery_uid = str(uuid.uuid4())
        # assume task is running
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider
        )
        test_export_task_record = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status=TaskState.RUNNING.value,
            name=shp_export_task.name,
        )
        try:
            raise ValueError("some unexpected error")
        except ValueError as e:
            exc = e
            exc_info = sys.exc_info()
        einfo = ExceptionInfo(exc_info=exc_info)
        shp_export_task.task_failure(
            task_id=test_export_task_record.uid, einfo=einfo, args={}, kwargs={"run_uid": str(self.run.uid)}
        )
        task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        exception = task.exceptions.all()[0]
        exc_info = pickle.loads(exception.exception.encode()).exc_info
        error_type, msg = exc_info[0], exc_info[1]
        self.assertEqual(error_type, ValueError)
        self.assertEqual("some unexpected error", str(msg))

    @patch("eventkit_cloud.tasks.export_tasks.get_data_package_manifest")
    @patch("eventkit_cloud.tasks.export_tasks.retry")
    @patch("shutil.copy")
    @patch("os.remove")
    @patch("eventkit_cloud.tasks.export_tasks.ZipFile")
    @patch("os.walk")
    @patch("os.path.getsize")
    def test_zipfile_task(
        self, os_path_getsize, mock_os_walk, mock_zipfile, remove, copy, mock_retry, mock_get_data_package_manifest
    ):
        os_path_getsize.return_value = 20

        class MockZipFile:
            def __init__(self):
                self.files = {}

            def __iter__(self):
                return iter(self.files)

            def write(self, filename, **kw):
                arcname = kw.get("arcname", filename)
                self.files[arcname] = filename

            def __exit__(self, *args, **kw):
                pass

            def __enter__(self, *args, **kw):
                return self

            def testzip(self):
                return None

        expected_archived_files = {
            "MANIFEST/manifest.xml": "MANIFEST/manifest.xml",
            "data/osm/file1.txt": "osm/file1.txt",
            "data/osm/file2.txt": "osm/file2.txt",
        }
        run_uid = str(self.run.uid)
        self.run.job.include_zipfile = True
        self.run.job.event = "test"
        self.run.job.save()
        run_zip_file = RunZipFile.objects.create(run=self.run)
        zipfile = MockZipFile()
        mock_zipfile.return_value = zipfile
        provider_slug = "osm"
        zipfile_path = os.path.join(self.stage_dir, "{0}".format(run_uid), provider_slug, "test.gpkg")
        expected_manifest_file = os.path.join("MANIFEST", "manifest.xml")
        mock_get_data_package_manifest.return_value = expected_manifest_file
        files = {
            "{0}/file1.txt".format(provider_slug): "data/{0}/file1.txt".format(provider_slug),
            "{0}/file2.txt".format(provider_slug): "data/{0}/file2.txt".format(provider_slug),
        }

        mock_os_walk.return_value = [
            (
                os.path.join(self.stage_dir, run_uid, provider_slug),
                None,
                ["test.gpkg", "test.om5", "test.osm"],  # om5 and osm should get filtered out
            )
        ]
        result = zip_files(files=files, run_zip_file_uid=run_zip_file.uid, file_path=zipfile_path)
        self.assertEqual(zipfile.files, expected_archived_files)
        self.assertEqual(result, zipfile_path)
        mock_get_data_package_manifest.assert_called_once()

        zipfile.testzip = Exception("Bad Zip")
        with self.assertRaises(Exception):
            zip_files(files=files, file_path=zipfile_path)

    @patch("celery.app.task.Task.request")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    def test_run_bounds_export_task(self, mock_geopackage, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        # job_name = self.job.name.lower()
        provider_slug = "provider_slug"
        mock_geopackage.add_geojson_to_geopackage.return_value = os.path.join(
            self.stage_dir, "{}_bounds.gpkg".format(provider_slug)
        )
        expected_output_path = os.path.join(self.stage_dir, "{}_bounds.gpkg".format(provider_slug))
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, provider=self.provider)
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=bounds_export_task.name
        )
        bounds_export_task.task = saved_export_task
        bounds_export_task.stage_dir = self.stage_dir
        bounds_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = bounds_export_task.run(run_uid=self.run.uid)
        self.assertEqual(expected_output_path, result["result"])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEqual(TaskState.RUNNING.value, run_task.status)

    @override_settings(CELERY_GROUP_NAME="test")
    @patch("eventkit_cloud.tasks.task_factory.TaskFactory")
    @patch("eventkit_cloud.tasks.export_tasks.ExportRun")
    @patch("eventkit_cloud.tasks.export_tasks.socket")
    def test_pickup_run_task(self, socket, mock_export_run, task_factory):

        mock_run = MagicMock()
        mock_run.uid = self.run.uid
        mock_run.status = TaskState.SUBMITTED.value
        # This would normally return providers.
        mock_run.data_provider_task_records.exclude.return_value = True
        mock_export_run.objects.get.return_value = mock_run
        socket.gethostname.return_value = "test"
        self.assertEqual("Pickup Run", pick_up_run_task.name)
        pick_up_run_task.run(run_uid=mock_run.uid, user_details={"username": "test_pickup_run_task"})
        task_factory.assert_called_once()
        expected_user_details = {"username": "test_pickup_run_task"}
        task_factory.return_value.parse_tasks.assert_called_once_with(
            run_uid=mock_run.uid,
            user_details=expected_user_details,
            worker="test",
            run_zip_file_slug_sets=None,
            session_token=None,
            queue_group="test",
        )
        mock_run.download_data.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.logger")
    @patch("shutil.rmtree")
    @patch("os.path.isdir")
    def test_finalize_run_task_after_return(self, isdir, rmtree, logger):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        isdir.return_value = True
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider
        )
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status="SUCCESS",
            name="Default Shapefile Export",
        )
        finalize_run_task.after_return("status", {"stage_dir": self.stage_dir}, run_uid, (), {}, "Exception Info")
        isdir.assert_called_with(self.stage_dir)
        rmtree.assert_called_with(self.stage_dir)

        rmtree.side_effect = IOError()
        finalize_run_task.after_return("status", {"stage_dir": self.stage_dir}, run_uid, (), {}, "Exception Info")

        rmtree.assert_called_with(self.stage_dir)
        self.assertRaises(IOError, rmtree)
        logger.error.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    def test_finalize_run_task(self, email):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        export_provider_task = DataProviderTaskRecord.objects.create(
            status=TaskState.SUCCESS.value, run=self.run, name="Shapefile Export", provider=self.provider
        )
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status=TaskState.SUCCESS.value,
            name="Default Shapefile Export",
        )
        self.assertEqual("Finalize Run Task", finalize_run_task.name)
        finalize_run_task.run(run_uid=run_uid, stage_dir=self.stage_dir)
        email().send.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.RocketChat")
    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    @patch("shutil.rmtree")
    @patch("os.path.isdir")
    def test_export_task_error_handler(self, isdir, rmtree, email, rocket_chat):
        celery_uid = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        run_uid = self.run.uid
        site_url = settings.SITE_URL
        url = "{0}/status/{1}".format(site_url.rstrip("/"), self.run.job.uid)
        os.environ["ROCKETCHAT_NOTIFICATIONS"] = json.dumps(
            {"auth_token": "auth_token", "user_id": "user_id", "channels": ["channel"], "url": "http://api.example.dev"}
        )
        with self.settings(
            ROCKETCHAT_NOTIFICATIONS={
                "auth_token": "auth_token",
                "user_id": "user_id",
                "channels": ["channel"],
                "url": "http://api.example.dev",
            }
        ):
            rocketchat_notifications = settings.ROCKETCHAT_NOTIFICATIONS
            channel = rocketchat_notifications["channels"][0]
            message = f"@here: A DataPack has failed during processing. {url}"
            export_provider_task = DataProviderTaskRecord.objects.create(
                run=self.run, name="Shapefile Export", provider=self.provider
            )
            ExportTaskRecord.objects.create(
                export_provider_task=export_provider_task,
                uid=task_id,
                celery_uid=celery_uid,
                status=TaskState.FAILED.value,
                name="Default Shapefile Export",
            )
            self.assertEqual("Export Task Error Handler", export_task_error_handler.name)
            export_task_error_handler.run(run_uid=run_uid, task_id=task_id, stage_dir=self.stage_dir)
            isdir.assert_any_call(self.stage_dir)
            rmtree.assert_called_once_with(self.stage_dir)
            email().send.assert_called_once()
            rocket_chat.assert_called_once_with(**rocketchat_notifications)
            rocket_chat().post_message.assert_called_once_with(channel, message)

    @patch("eventkit_cloud.tasks.export_tasks.kill_task")
    def test_cancel_task(self, mock_kill_task):
        worker_name = "test_worker"
        task_pid = 55
        celery_uid = uuid.uuid4()
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = self.group
            user = User.objects.create(username="test_user", password="test_password", email="test@email.com")
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="test_provider_task", provider=self.provider, status=TaskState.PENDING.value
        )
        export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.PENDING.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name,
        )

        self.assertEqual("Cancel Export Provider Task", cancel_export_provider_task.name)
        cancel_export_provider_task.run(
            data_provider_task_uid=export_provider_task.uid, canceling_username=user.username
        )
        mock_kill_task.apply_async.assert_called_once_with(
            kwargs={"result": {}, "task_pid": task_pid, "celery_uid": celery_uid},
            queue=f"{self.run.uid}.priority",
            priority=TaskPriority.CANCEL.value,
            routing_key=f"{self.run.uid}.priority",
        )
        export_task = ExportTaskRecord.objects.get(uid=export_task.uid)
        export_provider_task = DataProviderTaskRecord.objects.get(uid=export_provider_task.uid)
        self.assertEqual(export_task.status, TaskState.CANCELED.value)
        self.assertEqual(export_provider_task.status, TaskState.CANCELED.value)

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
        filename = "test.gpkg"
        celery_uid = uuid.uuid4()
        self.job.include_zipfile = True
        self.job.save()
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="test_provider_task", status=TaskState.COMPLETED.value, provider=self.provider
        )
        result = FileProducingTaskResult(file=filename).save(write_file=False)
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.COMPLETED.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name,
            result=result,
        )

        finalize_export_provider_task.run(
            result={"status": TaskState.SUCCESS.value},
            run_uid=self.run.uid,
            data_provider_task_uid=export_provider_task.uid,
            status=TaskState.COMPLETED.value,
        )
        export_provider_task.refresh_from_db()
        self.assertEqual(export_provider_task.status, TaskState.COMPLETED.value)

    @patch("eventkit_cloud.tasks.export_tasks.progressive_kill")
    @patch("eventkit_cloud.tasks.export_tasks.AsyncResult")
    def test_kill_task(self, async_result, mock_progressive_kill):
        # Ensure that kill isn't called with default.
        task_pid = -1
        celery_uid = uuid.uuid4()
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is not called with an invalid state
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.FAILURE)
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is called with a valid pid
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.STARTED)
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=celery_uid)
        mock_progressive_kill.assert_called_once_with(task_pid)

    @patch("eventkit_cloud.tasks.export_tasks.ExportRun")
    def test_wait_for_providers_task(self, mock_export_run):
        mock_run_uid = str(uuid.uuid4())

        mock_provider_task = Mock(status=TaskState.SUCCESS.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().data_provider_task_records.filter.return_value = [mock_provider_task]

        callback_task = MagicMock()
        apply_args = {"arg1": "example_value"}

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_called_once_with(**apply_args)

        callback_task.reset_mock()

        mock_provider_task = Mock(status=TaskState.RUNNING.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().data_provider_task_records.filter.return_value = [mock_provider_task]

        wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_not_called()

        with self.assertRaises(Exception):
            mock_export_run.reset_mock()
            mock_export_run.objects.filter().first().__nonzero__.return_value = False
            wait_for_providers_task(run_uid=mock_run_uid, callback_task=callback_task, apply_args=apply_args)

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_arcgis_templates")
    @patch("eventkit_cloud.tasks.export_tasks.get_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.zip_files")
    @patch("eventkit_cloud.tasks.export_tasks.get_human_readable_metadata_document")
    @patch("eventkit_cloud.tasks.export_tasks.get_style_files")
    @patch("eventkit_cloud.tasks.export_tasks.json")
    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("os.path.join", side_effect=lambda *args: args[-1])
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.DataProviderTaskRecord")
    def test_create_zip_task(
        self,
        mock_DataProviderTaskRecord,
        mock_get_export_task_record,
        join,
        mock_generate_qgs_style,
        mock_json,
        mock_get_style_files,
        mock_get_human_readable_metadata_document,
        mock_zip_files,
        mock_get_metadata,
        mock_get_arcgis_templates,
        mock_get_export_filepath,
    ):
        meta_files = {}
        mock_get_style_files.return_value = style_files = {"/styles.png": "icons/styles.png"}
        meta_files.update(style_files)
        mock_get_arcgis_templates.return_value = arcgis_files = {"/arcgis/create_aprx.py": "arcgis/create_aprx.pyt"}
        meta_files.update(arcgis_files)
        mock_get_human_readable_metadata_document.return_value = human_metadata_doc = {
            "/human_metadata.txt": "/human_metadata.txt"
        }
        meta_files.update(human_metadata_doc)
        mock_generate_qgs_style.return_value = qgis_file = {"/style.qgs": "/style.qgs"}
        meta_files.update(qgis_file)

        include_files = {
            "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/test.gpkg": "osm/test.gpkg",
            "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/osm_selection.geojson": "osm/osm_selection.geojson",  # NOQA
        }
        include_files.update(meta_files)
        metadata = {
            "aoi": "AOI",
            "bbox": [-1, -1, 1, 1],
            "data_sources": {
                "osm": {
                    "copyright": None,
                    "description": "OpenStreetMap vector data provided in a custom thematic schema. \r\n\t\r\n\t"
                    "Data is grouped into separate tables (e.g. water, roads...).",
                    "file_path": "data/osm/test-osm-20181101.gpkg",
                    "file_type": ".gpkg",
                    "full_file_path": "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/"
                    "test.gpkg",
                    "last_update": "2018-10-29T04:35:02Z\n",
                    "metadata": "https://overpass-server.com/overpass/interpreter",
                    "name": "OpenStreetMap Data (Themes)",
                    "slug": "osm",
                    "type": "osm",
                    "uid": "0d08ddf6-35c1-464f-b271-75f6911c3f78",
                }
            },
            "date": "20181101",
            "description": "Test",
            "has_elevation": False,
            "has_raster": True,
            "include_files": include_files,
            "name": "test",
            "project": "Test",
            "run_uid": "7fadf34e-58f9-4bb8-ab57-adc1015c4269",
            "url": "http://host.docker.internal/status/2010025c-6d61-4a0b-8d5d-ff9c657259eb",
        }
        data_provider_task_record_uids = ["0d08ddf6-35c1-464f-b271-75f6911c3f78"]
        mock_get_metadata.return_value = metadata
        run_zip_file = RunZipFile.objects.create(run=self.run)
        expected_zip = f"{metadata['name']}.zip"
        mock_get_export_filepath.return_value = expected_zip
        mock_zip_files.return_value = expected_zip
        returned_zip = create_zip_task.run(
            task_uid="UID",
            data_provider_task_record_uids=data_provider_task_record_uids,
            run_zip_file_uid=run_zip_file.uid,
        )
        mock_generate_qgs_style.assert_called_once_with(metadata)
        mock_zip_files.assert_called_once_with(
            files=metadata["include_files"],
            run_zip_file_uid=run_zip_file.uid,
            meta_files=meta_files,
            file_path=expected_zip,
            metadata=metadata,
        )
        mock_get_export_task_record.assert_called_once()
        self.assertEqual(returned_zip, {"result": expected_zip})

    def test_zip_file_task_invalid_params(self):

        with self.assertRaises(Exception):
            include_files = []
            file_path = "/test/path.zip"
            res = zip_files(include_files, file_path=file_path)
            self.assertIsNone(res)

        with self.assertRaises(Exception):
            include_files = ["test1", "test2"]
            file_path = ""
            res = zip_files(include_files, file_path=file_path)
            self.assertIsNone(res)

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_vector_file_export_task(self, mock_request, mock_convert, mock_download_data, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        expected_provider_slug = "vector-file"
        service_url = "https://abc.gov/file.geojson"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="vector-file")
        self.provider.slug = expected_provider_slug
        self.provider.config = dict()
        self.provider.url = service_url
        self.provider.save()

        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path
        mock_download_data.return_value = service_url

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=vector_file_export_task.name
        )
        vector_file_export_task.task = saved_export_task
        vector_file_export_task.update_task_state(
            task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid)
        )
        self.task_process.return_value = Mock(exitcode=0)
        result = vector_file_export_task.run(
            result=previous_task_result,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=expected_output_path,
            output_file=expected_output_path,
            projection=projection,
            boundary=Polygon.from_bbox((1, 2, 3, 4)).extent,
            layer_name=expected_provider_slug,
            is_raster=False,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])
        self.assertEqual(expected_output_path, result["gpkg"])

        mock_download_data.assert_called_once_with(
            saved_export_task.uid,
            service_url,
            expected_output_path,
        )

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_raster_file_export_task(self, mock_request, mock_convert, mock_download_data, mock_get_export_filepath):
        celery_uid = str(uuid.uuid4())
        service_url = "https://abc.gov/file.geojson"
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        expected_provider_slug = "raster-file"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="raster-file")
        self.provider.slug = expected_provider_slug
        self.provider.config = dict()
        self.provider.url = service_url
        self.provider.save()
        mock_get_export_filepath.return_value = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)

        mock_convert.return_value = expected_output_path
        mock_download_data.return_value = service_url

        previous_task_result = {"source": expected_output_path}
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=raster_file_export_task.name
        )
        raster_file_export_task.task = saved_export_task
        raster_file_export_task.update_task_state(
            task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid)
        )

        self.task_process.return_value = Mock(exitcode=0)
        result = raster_file_export_task.run(
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=self.stage_dir,
            projection=projection,
            service_url=service_url,
        )
        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=expected_output_path,
            output_file=expected_output_path,
            projection=projection,
            boundary=Polygon.from_bbox((1, 2, 3, 4)).extent,
            is_raster=True,
            executor=self.task_process().start_process,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])
        self.assertEqual(expected_output_path, result["gpkg"])

        mock_download_data.assert_called_once_with(
            saved_export_task.uid,
            service_url,
            expected_output_path,
        )

    @patch("eventkit_cloud.tasks.export_tasks.get_tile_table_names")
    @patch("eventkit_cloud.tasks.export_tasks.parse_result")
    @patch("eventkit_cloud.tasks.export_tasks.os")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.get_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("eventkit_cloud.tasks.export_tasks.mapproxy.MapproxyGeopackage")
    def test_reprojection_task(
        self,
        mock_mapproxy,
        mock_gdal_convert,
        mock_get_metadata,
        mock_get_export_filepath,
        mock_os,
        mock_parse_result,
        mock_get_tile_table_names,
    ):
        job_name = self.job.name.lower()
        in_projection = "4326"
        out_projection = "3857"
        expected_provider_slug = "some_provider"
        config = {"cert_info": {"cert_path": "/path/to/cert", "cert_pass_var": "fake_pass"}}
        self.provider.slug = expected_provider_slug
        self.provider.config = config
        self.provider.save()
        date = default_format_time(timezone.now())
        driver = "tif"
        mock_get_export_filepath.return_value = expected_infile = expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        expected_input_path = os.path.join(self.stage_dir, expected_infile)
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        export_provider_task.name = "testjob"
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=reprojection_task.name
        )
        reprojection_task.task = saved_export_task
        task_uid = saved_export_task.uid
        selection = "selection.geojson"
        metadata = {"data_sources": {expected_provider_slug: {"type": "something"}}}
        mock_get_metadata.return_value = metadata
        mock_gdal_convert.return_value = expected_output_path
        mock_parse_result.side_effect = [driver, selection, None, expected_infile]
        mock_get_export_filepath.return_value = expected_output_path
        mock_os.path.splitext.return_value = ["path", driver]
        previous_task_result = {"source": expected_output_path}

        reprojection_task.run(
            result=previous_task_result,
            projection=None,
        )
        # test reprojection is skipped
        mock_os.rename.assert_called_once_with(expected_infile, expected_output_path)

        mock_parse_result.side_effect = [driver, selection, None, expected_input_path]
        self.task_process.return_value = Mock(exitcode=0)
        reprojection_task.run(
            result=previous_task_result,
            projection=out_projection,
        )

        # test reprojecting
        mock_gdal_convert.assert_called_once_with(
            driver=driver,
            input_files=f"GTIFF_RAW:{expected_input_path}",
            output_file=expected_output_path,
            projection=out_projection,
            boundary=selection,
            warp_params=ANY,
            translate_params=ANY,
            executor=self.task_process().start_process,
        )

        # test reprojecting raster geopackages
        expected_layer = "imagery"
        mock_get_tile_table_names.return_value = [expected_layer]
        driver = "gpkg"
        level_from = 0
        level_to = 12
        metadata = {
            "data_sources": {expected_provider_slug: {"type": "raster", "level_from": level_from, "level_to": level_to}}
        }
        mock_get_metadata.return_value = metadata
        expected_infile = f"{job_name}-{in_projection}-{expected_provider_slug}-{date}.{driver}"
        expected_input_path = os.path.join(self.stage_dir, expected_infile)
        mock_os.path.splitext.return_value = ["path", driver]
        mock_parse_result.side_effect = [driver, selection, None, expected_input_path]
        reprojection_task.run(
            result=previous_task_result,
            projection=out_projection,
        )

        mock_mapproxy.assert_called_once_with(
            gpkgfile=expected_output_path,
            service_url=expected_output_path,
            name=job_name,
            config=config,
            bbox=ANY,
            level_from=level_from,
            level_to=level_to,
            task_uid=task_uid,
            selection=selection,
            projection=out_projection,
            input_gpkg=expected_input_path,
            layer=expected_layer,
        )

        mock_mapproxy().convert.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.get_export_filepath")
    @patch("eventkit_cloud.tasks.export_tasks.find_in_zip")
    @patch("eventkit_cloud.tasks.export_tasks.get_geometry")
    @patch("eventkit_cloud.tasks.export_tasks.os.getenv")
    @patch("eventkit_cloud.tasks.export_tasks.get_ogcapi_data")
    @patch("eventkit_cloud.tasks.export_tasks.convert")
    @patch("celery.app.task.Task.request")
    def test_ogcapi_process_export_task(
        self,
        mock_request,
        mock_convert,
        mock_get_ogcapi_data,
        mock_getenv,
        mock_get_geometry,
        mock_find_in_zip,
        mock_get_export_filepath,
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        projection = 4326
        bbox = Polygon.from_bbox((1, 2, 3, 4)).extent
        example_geojson = "/path/to/geo.json"
        example_result = {"selection": example_geojson}
        expected_provider_slug = "ogc_api_proc"
        example_format_slug = "fmt"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="ogcapi-process")
        self.provider.slug = expected_provider_slug
        self.provider.config = {
            "ogcapi_process": {
                "id": "eventkit-test",
                "inputs": {"input": {"value": "random"}, "format": {"value": "gpkg"}},
                "outputs": {"format": {"mediaType": "application/zip"}},
                "output_file_ext": ".gpkg",
                "download_credentials": {"cred_var": "USER_PASS_ENV_VAR"},
            },
            "cred_var": "USER_PASS_ENV_VAR",
        }
        self.provider.save()

        expected_outfile = "/path/to/file.ext"
        expected_output_path = os.path.join(self.stage_dir, expected_outfile)
        expected_outzip = "/path/to/file.zip"
        expected_outzip_path = os.path.join(self.stage_dir, expected_outzip)

        source_file = "foo.gpkg"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.PENDING.value,
            name=ogcapi_process_export_task.name,
        )
        username = "user"
        password = "password"
        mock_getenv.return_value = f"{username}:{password}"
        task_uid = saved_export_task.uid
        ogcapi_process_export_task.task = saved_export_task
        ogcapi_process_export_task.stage_dir = self.stage_dir
        ogcapi_process_export_task.task.export_provider_task.provider.slug = example_format_slug
        ogcapi_process_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=task_uid)

        mock_geometry = Mock()
        mock_get_geometry.return_value = mock_geometry
        mock_get_ogcapi_data.return_value = expected_outzip_path
        mock_convert.return_value = expected_output_path
        mock_find_in_zip.return_value = source_file
        mock_get_export_filepath.side_effect = [expected_output_path, expected_outzip_path]

        result = ogcapi_process_export_task.run(
            result=example_result,
            projection=projection,
        )

        mock_get_ogcapi_data.assert_called_with(
            task_uid=task_uid,
            stage_dir=self.stage_dir,
            bbox=bbox,
            export_format_slug=example_format_slug,
            selection=example_geojson,
            download_path=expected_outzip_path,
        )

        mock_convert.assert_not_called()
        expected_result = {"selection": example_geojson, "result": expected_outzip_path}
        self.assertEqual(result, expected_result)

        example_source_data = "source_path"
        mock_find_in_zip.return_value = example_source_data

        mock_convert.return_value = expected_output_path
        mock_get_export_filepath.side_effect = [expected_output_path, expected_outzip_path]

        self.task_process.return_value = Mock(exitcode=0)
        ogcapi_process_export_task.task.export_provider_task.provider.slug = None
        result = ogcapi_process_export_task.run(
            result=example_result,
            projection=projection,
        )

        expected_result = {
            "driver": "gpkg",
            "file_extension": ".gpkg",
            "ogcapi_process": expected_outzip_path,
            "source": expected_output_path,
            "gpkg": expected_output_path,
            "selection": example_geojson,
            "result": expected_outzip_path,
        }

        self.assertEqual(result, expected_result)

        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=example_source_data,
            output_file=expected_output_path,
            projection=projection,
            boundary=example_geojson,
            executor=self.task_process().start_process,
        )

    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.extract_metadata_files")
    @patch("eventkit_cloud.tasks.export_tasks.update_progress")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.get_geometry")
    def test_get_ogcapi_data(
        self,
        mock_get_geometry,
        mock_download_data,
        mock_update_progress,
        mock_extract_metadata_files,
        mock_get_export_task_record,
    ):
        bbox = Polygon.from_bbox((1, 2, 3, 4)).extent
        example_geojson = "/path/to/geo.json"
        example_format_slug = "fmt"

        task_uid = "1234"
        mock_geometry = Mock()
        mock_get_geometry.return_value = mock_geometry

        # config = {
        #     "ogcapi_process": {
        #         "id": "eventkit",
        #         "inputs": {"input": {"value": "random"}, "format": {"value": "gpkg"}},
        #         "outputs": {"format": {"mediaType": "application/zip"}},
        #         "output_file_ext": ".gpkg",
        #         "download_credentials": {"cert_info": {"cert_path": "something", "cert_pass": "something"}},
        #     },
        #     "cert_info": {"cert_path": "something", "cert_pass": "something"},
        # }
        # service_url = "http://example.test/v1/"
        # session_token = "_some_token_"
        example_download_url = "https://example.test/path.zip"
        example_download_path = "/example/file.gpkg"
        mock_client = MagicMock()
        mock_client.get_job_results.return_value = example_download_url
        mock_get_export_task_record().export_provider_task.provider.get_service_client.return_value = mock_client
        mock_session = Mock()
        mock_client.get_process_session.return_value = mock_session
        mock_download_data.return_value = example_download_path
        result = get_ogcapi_data(
            task_uid=task_uid,
            stage_dir=self.stage_dir,
            bbox=bbox,
            export_format_slug=example_format_slug,
            selection=example_geojson,
            download_path=example_download_path,
        )

        self.assertEqual(result, example_download_path)

        mock_client.create_job.called_once_with(mock_geometry, file_format=example_format_slug)
        mock_download_data.assert_called_once_with(
            task_uid, example_download_url, example_download_path, session=mock_session
        )
        mock_extract_metadata_files.assert_called_once_with(example_download_path, self.stage_dir)


class TestFormatTasks(ExportTaskBase):
    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)
