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
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.test.utils import override_settings

from eventkit_cloud.celery import TaskPriority, app
from eventkit_cloud.jobs.models import DatamodelPreset, DataProvider, Job
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
from eventkit_cloud.tasks.helpers import get_run_staging_dir, normalize_name
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

    @patch("celery.app.task.Task.request")
    def setUp(self, mock_request):
        self.maxDiff = None
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group, created = Group.objects.get_or_create(name="TestDefault")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = self.group
            self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        bbox = Polygon.from_bbox((1.0, 2.0, 3.0, 4.0))
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
        self.stage_dir = get_run_staging_dir(self.run.uid)


class TestExportTasks(ExportTaskBase):
    config = {}

    def get_mock_export_task_record(self, slug, data_type, label):
        self.bbox = [1.0, 2.0, 3.0, 4.0]
        self.service_url = "http://service.test/x"
        self.layers = self.layers if hasattr(self, "layers") else {slug: {"url": self.service_url}}
        job_mock = Mock(event="event", extents=self.bbox)
        job_mock.name = "job_name"
        return Mock(
            uid=str(uuid.uuid4()),
            export_provider_task=Mock(
                run=Mock(job=job_mock),
                provider=Mock(
                    slug=slug,
                    data_type=data_type,
                    label=label,
                    config=self.config,
                    url=self.service_url,
                    layers=self.layers,
                ),
            ),
        )

    def setup_mock_task(self, celery_task=None, **kwargs):
        self.task = self.get_mock_export_task_record(slug="slug", data_type="vector", label="label")
        self.task.uid = self.task.uid
        if celery_task:
            celery_task.task = self.task
            celery_task.stage_dir = self.stage_dir
            self.result.update({"source": self.input_file, "result": self.input_file})
            result = celery_task.run(
                result=self.result, task_uid=str(self.task.uid), projection=self.projection, **kwargs
            )
            self.assertEqual(self.output_file, result["result"])
            self.assertEqual(self.input_file, result["source"])
            return result

    def setUp(self):
        super().setUp()
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)

        self.request_patcher = patch("celery.app.task.Task.request", spec=True)
        mock_request = self.request_patcher.start()

        self.get_export_filepath_patcher = patch("eventkit_cloud.tasks.export_tasks.get_export_filepath", spec=True)
        self.mock_get_export_filepath = self.get_export_filepath_patcher.start()

        self.convert_patcher = patch("eventkit_cloud.tasks.export_tasks.convert", spec=True)
        self.mock_convert = self.convert_patcher.start()
        self.output_file = os.path.join(self.stage_dir, "output.ext")
        self.mock_convert.return_value = self.output_file

        self.input_file = os.path.join(self.stage_dir, "input.ext")
        self.selection = "selection.geojson"
        self.result = {"source": self.input_file, "selection": self.selection}

        self.mock_get_export_filepath.return_value = self.output_file
        self.celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=self.celery_uid)
        self.projection = 4326

        self.setup_mock_task()

    def tearDown(self) -> None:
        self.request_patcher.stop()
        self.get_export_filepath_patcher.stop()
        self.convert_patcher.stop()

    def test_shp_export_task(self):
        self.setup_mock_task(shp_export_task)
        self.mock_convert.assert_called_once_with(
            driver="ESRI Shapefile",
            input_files=self.input_file,
            output_file=self.output_file,
            boundary=self.selection,
            projection=self.projection,
            executor=self.task_process().start_process,
            skip_failures=True,
        )

    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("eventkit_cloud.tasks.export_tasks.convert_qgis_gpkg_to_kml")
    def test_kml_export_task(self, mock_qgis_convert, mock_generate_qgs_style):
        mock_generate_qgs_style.return_value = qgs_file = "/style.qgs"
        mock_qgis_convert.return_value = self.output_file

        self.setup_mock_task(kml_export_task)
        try:
            import qgis  # noqa

            mock_qgis_convert.assert_called_once_with(qgs_file, self.output_file)
        except ImportError:
            self.mock_convert.assert_called_once_with(
                driver="libkml",
                input_files=self.input_file,
                output_file=self.output_file,
                projection=self.projection,
                boundary=self.selection,
                executor=self.task_process().start_process,
            )

    def test_sqlite_export_task(self):

        self.setup_mock_task(sqlite_export_task)

        self.mock_convert.assert_called_once_with(
            driver="SQLite",
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            executor=self.task_process().start_process,
        )

    @patch("eventkit_cloud.tasks.export_tasks.os.path.exists")
    @patch("eventkit_cloud.tasks.export_tasks.download_concurrently")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    def test_wfs_export_task(
        self,
        mock_gpkg,
        mock_download_concurrently,
        mock_exists,
    ):
        self.input_file = self.output_file  # The source and the result are the same.

        mock_exists.return_value = True

        layer = "foo"
        query_url = "?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=foo&SRSNAME=EPSG:4326&BBOX=BBOX_PLACEHOLDER"
        self.layers = {layer: {"name": layer, "url": query_url}}

        mock_gpkg.check_content_exists.return_value = True
        self.setup_mock_task(wfs_export_task)

        mock_gpkg.check_content_exists.assert_called_once_with(self.output_file)

        self.setup_mock_task(wfs_export_task)

        url = self.service_url
        layer_1 = "spam"
        layer_2 = "ham"

        self.layers = {layer_1: {"name": layer_1, "url": url}, layer_2: {"name": layer_2, "url": url}}
        expected_path_1 = os.path.join(self.stage_dir, f"{layer_1}.gpkg")
        expected_path_2 = os.path.join(self.stage_dir, f"{layer_2}.gpkg")

        expected_url_1 = (
            f"{url}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer_1}"
            f"&SRSNAME=EPSG:{self.projection}&BBOX=BBOX_PLACEHOLDER"
        )
        expected_url_2 = (
            f"{url}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer_2}"
            f"&SRSNAME=EPSG:{self.projection}&BBOX=BBOX_PLACEHOLDER"
        )
        expected_layers = {
            layer_1: {
                "task_uid": ANY,
                "url": expected_url_1,
                "path": expected_path_1,
                "base_path": self.stage_dir,
                "bbox": self.bbox,
                "layer_name": layer_1,
                "projection": self.projection,
                "service_description": None,
                "level": 15,
            },
            layer_2: {
                "task_uid": ANY,
                "url": expected_url_2,
                "path": expected_path_2,
                "base_path": self.stage_dir,
                "bbox": self.bbox,
                "layer_name": layer_2,
                "projection": self.projection,
                "service_description": None,
                "level": 15,
            },
        }

        mock_download_concurrently.reset_mock()
        self.mock_convert.reset_mock()

        mock_download_concurrently.return_value = expected_layers
        self.mock_get_export_filepath.side_effect = [self.output_file, expected_path_1, expected_path_2]

        # test with multiple layers
        self.setup_mock_task(wfs_export_task)

        _, args, _ = mock_download_concurrently.mock_calls[0]
        self.assertEqual(list(args[0]), list(expected_layers.values()))
        self.assertEqual(self.mock_convert.call_count, 2)

        self.mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_1,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.bbox,
            access_mode="append",
            layer_name=layer_1,
            executor=self.task_process().start_process,
        )

        self.mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_2,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.bbox,
            access_mode="append",
            layer_name=layer_2,
            executor=self.task_process().start_process,
        )

    def test_mbtiles_export_task(self):

        self.projection = 3857
        driver = "MBTiles"

        self.mock_convert.return_value = self.output_file
        self.setup_mock_task(mbtiles_export_task)

        self.mock_convert.assert_called_once_with(
            driver=driver,
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            use_translate=True,
            executor=self.task_process().start_process,
        )

    @patch("eventkit_cloud.tasks.export_tasks.os.rename")
    def test_gpkg_export_task(self, mock_rename):

        self.setup_mock_task(geopackage_export_task)
        self.mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            executor=self.task_process().start_process,
        )
        self.input_file = "test.gpkg"
        mock_rename.return_value = self.result.pop("gpkg")  # This is prior output, need to clear gpkg to trigger rename
        self.setup_mock_task(geopackage_export_task)
        mock_rename.assert_called_once_with(self.input_file, self.output_file)

    @patch("eventkit_cloud.tasks.export_tasks.os.remove")
    @patch("eventkit_cloud.tasks.export_tasks.sqlite3.connect")
    @patch("eventkit_cloud.tasks.export_tasks.cancel_export_provider_task.run")
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
        mock_cancel_provider_task,
        mock_connect,
        mock_remove,
    ):
        example_bbox = [-1, -1, 1, 1]
        mock_geopackage.Geopackage.return_value = Mock(results=[Mock(parts=[self.output_file])])
        # Test with using overpass
        example_overpass_query = "some_query; out;"
        self.config = {"overpass_query": example_overpass_query}

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
        osm_data_collection_pipeline(self.task, self.stage_dir, bbox=example_bbox, config=self.config)
        mock_connect.assert_called_once()
        mock_remove.assert_has_calls(
            [call(expected_overpass_file) for expected_overpass_file in expected_overpass_files], any_order=True
        )
        mock_overpass.Overpass.assert_has_calls(
            [
                call(
                    bbox=[0.0, -1, 1, 0.0],
                    slug=None,
                    url=None,
                    stage_dir=self.stage_dir,
                    job_name="no_job_name_specified",
                    task_uid=self.task.uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[0]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[0.0, 0.0, 1, 1],
                    slug=None,
                    url=None,
                    stage_dir=self.stage_dir,
                    job_name="no_job_name_specified",
                    task_uid=self.task.uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[1]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[-1, 0.0, 0.0, 1],
                    slug=None,
                    url=None,
                    stage_dir=self.stage_dir,
                    job_name="no_job_name_specified",
                    task_uid=self.task.uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[2]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
                call(
                    bbox=[-1, -1, 0.0, 0.0],
                    slug=None,
                    url=None,
                    stage_dir=self.stage_dir,
                    job_name="no_job_name_specified",
                    task_uid=self.task.uid,
                    raw_data_filename=os.path.basename(expected_overpass_files[3]),
                    config={"overpass_query": "some_query; out;"},
                ),
                call().run_query(user_details=None, subtask_percentage=65, eta=None),
            ]
        )
        mock_pbf.OSMToPBF.assert_called_with(
            osm_files=expected_o5m_files,
            outfile=os.path.join(self.stage_dir, "no_job_name_specified_query.pbf"),
            task_uid=self.task.uid,
        )
        mock_feature_selection.example.assert_called_once()
        mock_cancel_provider_task.assert_not_called()

        # Test canceling the provider task on an empty geopackage.
        mock_overpass.Overpass().run_query.side_effect = expected_overpass_files
        mock_geopackage.Geopackage().run.return_value = None
        mock_pbf.OSMToPBF().convert.side_effect = convert_side_effects
        mock_pbf.OSMToPBF.reset_mock()
        osm_data_collection_pipeline(self.task, self.stage_dir, bbox=example_bbox, config=self.config)
        mock_cancel_provider_task.assert_called_once()

        mock_overpass.reset_mock()
        mock_pbf.reset_mock()
        mock_feature_selection.reset_mock()
        mock_geopackage.reset_mock()

        # Test with using pbf_file
        example_pbf_file = "test.pbf"
        self.config = {"pbf_file": example_pbf_file}
        osm_data_collection_pipeline(self.task, self.stage_dir, bbox=example_bbox, config=self.config)

        mock_overpass.Overpass.assert_not_called()
        mock_pbf.OSMToPBF.assert_not_called()
        mock_feature_selection.assert_not_called()

    @patch("eventkit_cloud.tasks.export_tasks.get_creation_options")
    def test_geotiff_export_task(self, mock_get_creation_options):
        warp_params = {"warp": "params"}
        translate_params = {"translate": "params"}
        mock_get_creation_options.return_value = warp_params, translate_params

        self.result.update({"source": self.output_file, "selection": None})
        self.setup_mock_task(geotiff_export_task)
        self.mock_convert.assert_called_once_with(
            boundary=None,
            driver="gtiff",
            input_files=self.input_file,
            output_file=self.output_file,
            warp_params=warp_params,
            translate_params=translate_params,
            executor=self.task_process().start_process,
            projection=self.projection,
            is_raster=True,
        )
        self.mock_convert.reset_mock()
        self.result.update({"source": self.output_file, "selection": self.selection, "gtiff": None})
        self.input_file = "test.tif"
        self.setup_mock_task(geotiff_export_task)
        self.mock_convert.assert_called_once_with(
            boundary=self.selection,
            driver="gtiff",
            input_files=f"GTIFF_RAW:{self.input_file}",
            output_file=self.output_file,
            warp_params=warp_params,
            translate_params=translate_params,
            executor=self.task_process().start_process,
            projection=self.projection,
            is_raster=True,
        )

        self.mock_convert.reset_mock()
        self.result.update({"gtiff": self.output_file})
        self.setup_mock_task(geotiff_export_task)
        self.mock_convert.assert_not_called()

    def test_nitf_export_task(self):
        self.setup_mock_task(nitf_export_task)
        self.mock_convert.assert_called_once_with(
            creation_options=["ICORDS=G"],
            driver="nitf",
            input_files=self.input_file,
            output_file=self.output_file,
            executor=self.task_process().start_process,
            projection=self.projection,
        )

    def test_pbf_export_task(self):
        self.result.update({"pbf": self.output_file})
        self.assertEquals(self.setup_mock_task(pbf_export_task), self.result)

    def test_gpx_export_task(self):
        self.result.update({"pbf": self.input_file})
        expected_result = {
            "pbf": self.input_file,
            "file_extension": "gpx",
            "driver": "GPX",
            "result": self.output_file,
            "source": self.input_file,
            "gpx": self.output_file,
            "selection": self.selection,
        }
        result = self.setup_mock_task(gpx_export_task)
        self.mock_convert.assert_called_once_with(
            input_files=self.input_file,
            output_file=self.output_file,
            driver="GPX",
            dataset_creation_options=["GPX_USE_EXTENSIONS=YES"],
            creation_options=["-explodecollections"],
            boundary=self.selection,
            executor=self.task_process().start_process,
        )
        self.assertEqual(result, expected_result)

    @patch("eventkit_cloud.tasks.export_tasks.os.path.exists")
    @patch("eventkit_cloud.tasks.export_tasks.make_dirs")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    @patch("eventkit_cloud.tasks.export_tasks.download_concurrently")
    def test_arcgis_feature_service_export_task(
        self, mock_download_concurrently, mock_geopackage, mock_makedirs, mock_exists
    ):
        self.input_file = self.output_file  # The source and the result are the same.
        query_string = "query?where=&outfields=*&f=json&geometry=BBOX_PLACEHOLDER"
        mock_exists.return_value = True

        # test without trailing slash
        self.setup_mock_task(arcgis_feature_service_export_task)

        mock_geopackage.check_content_exists.return_value = True

        url = self.service_url
        layer_name_1 = "foo"
        layer_name_2 = "bar"
        expected_field = "baz"
        service_description = {"name": "service"}
        self.layers = {
            layer_name_1: {"name": layer_name_1, "url": url},
            layer_name_2: {"name": layer_name_2, "url": url, "distinct_field": "OBJECTID"},
        }

        # test with trailing slash
        self.service_url = f"{self.service_url}/"
        self.setup_mock_task(arcgis_feature_service_export_task)

        self.layers = {
            layer_name_1: {"name": layer_name_1, "url": url, "service_description": service_description},
            layer_name_2: {"name": layer_name_2, "url": url, "distinct_field": expected_field},
        }

        expected_path_1 = os.path.join(self.stage_dir, f"{layer_name_1}.gpkg")
        expected_path_2 = os.path.join(self.stage_dir, f"{layer_name_2}.gpkg")
        expected_url_1 = f"{url}/{query_string}"
        expected_url_2 = f"{url}/{query_string}"
        expected_layers = {
            layer_name_1: {
                "task_uid": ANY,  # this is any because uid will be randomly assigned.
                "url": expected_url_1,
                "path": expected_path_1,
                "base_path": self.stage_dir,
                "bbox": self.bbox,
                "level": 15,
                "src_srs": self.projection,
                "service_description": service_description,
                "layer_name": layer_name_1,
                "distinct_field": None,
            },
            layer_name_2: {
                "task_uid": ANY,  # this is any because uid will be randomly assigned.
                "url": expected_url_2,
                "path": expected_path_2,
                "base_path": self.stage_dir,
                "bbox": self.bbox,
                "level": 15,
                "src_srs": self.projection,
                "service_description": None,
                "layer_name": layer_name_2,
                "distinct_field": expected_field,
            },
        }

        mock_download_concurrently.return_value = expected_layers
        self.mock_convert.reset_mock()

        self.mock_get_export_filepath.reset_mock()
        self.mock_get_export_filepath.side_effect = [self.output_file, expected_path_1, expected_path_2]
        mock_download_concurrently.reset_mock()

        # test with multiple layers
        self.setup_mock_task(arcgis_feature_service_export_task)

        _, _, kwargs = mock_download_concurrently.mock_calls[0]

        self.assertEqual(kwargs["layers"], list(expected_layers.values()))
        self.assertEqual(self.mock_convert.call_count, 2)

        self.mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_1,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            access_mode="append",
            layer_name=layer_name_1,
            executor=self.task_process().start_process,
        )

        self.mock_convert.assert_any_call(
            driver="gpkg",
            input_files=expected_path_2,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            access_mode="append",
            layer_name=layer_name_2,
            executor=self.task_process().start_process,
        )

    @patch("eventkit_cloud.tasks.export_tasks.logging_open")
    def test_output_selection_geojson_task(self, mock_open):
        user_details = {"user_id": 1}
        self.setup_mock_task(output_selection_geojson_task, user_details=user_details)
        mock_open.assert_called_once_with(self.output_file, "w", user_details=user_details)

    @patch("eventkit_cloud.tasks.export_tasks.TaskProcess")
    def test_hfa_export_task(self, mock_task_process):
        expected_result = {
            "file_extension": "img",
            "result": self.output_file,
            "driver": "hfa",
            "hfa": self.output_file,
            "selection": self.selection,
            "source": self.input_file,
        }
        self.assertEqual(expected_result, self.setup_mock_task(hfa_export_task))

    @patch("eventkit_cloud.tasks.export_tasks.wcs")
    def test_wcs_export_task(self, mock_wcs):
        self.input_file = self.output_file  # The source and the result are the same.
        mock_wcs.WCSConverter().convert.return_value = self.output_file
        self.setup_mock_task(wcs_export_task)

    @patch("eventkit_cloud.utils.mapproxy.MapproxyGeopackage")
    def test_external_raster_service_export_task(self, mock_service):
        self.input_file = self.output_file  # The source and the result are the same.
        mock_service().convert.return_value = self.output_file
        self.setup_mock_task(mapproxy_export_task)
        mock_service().convert.assert_called_once()

        mock_service().convert.side_effect = Exception("Task Failed")
        with self.assertRaises(Exception):
            self.setup_mock_task(mapproxy_export_task)

    def test_task_on_failure(self):
        # assume task is running
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider
        )
        test_export_task_record = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=self.celery_uid,
            status=TaskState.RUNNING.value,
            name=shp_export_task.name,
        )
        shp_export_task.task = test_export_task_record

        try:
            raise ValueError("some unexpected error")
        except ValueError as e:
            exc_info = sys.exc_info()
            einfo = ExceptionInfo(exc_info=exc_info)
            shp_export_task.task_failure(exc=e, einfo=einfo, args={}, kwargs={})
        task = ExportTaskRecord.objects.get(uid=test_export_task_record.uid)
        self.assertIsNotNone(task)
        exception = task.exceptions.last()
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
        zipfile_path = os.path.join(self.stage_dir, run_uid, provider_slug, "test.gpkg")
        expected_manifest_file = os.path.join("MANIFEST", "manifest.xml")
        mock_get_data_package_manifest.return_value = expected_manifest_file
        files = {
            f"{provider_slug}/file1.txt": f"data/{provider_slug}/file1.txt",
            f"{provider_slug}/file2.txt": f"data/{provider_slug}/file2.txt",
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

    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    def test_bounds_export_task(self, mock_geopackage):
        mock_geopackage.add_geojson_to_geopackage.return_value = self.output_file
        self.setup_mock_task(bounds_export_task)

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
        isdir.return_value = True
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider
        )
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=self.celery_uid,
            status="SUCCESS",
            name="Default Shapefile Export",
        )
        finalize_run_task.after_return("status", {"stage_dir": self.stage_dir}, self.run.uid, (), {}, "Exception Info")
        isdir.assert_called_with(self.stage_dir)
        rmtree.assert_called_with(self.stage_dir)

        rmtree.side_effect = IOError()
        finalize_run_task.after_return("status", {"stage_dir": self.stage_dir}, self.run.uid, (), {}, "Exception Info")

        rmtree.assert_called_with(self.stage_dir)
        self.assertRaises(IOError, rmtree)
        logger.error.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    def test_finalize_run_task(self, email):
        export_provider_task = DataProviderTaskRecord.objects.create(
            status=TaskState.SUCCESS.value, run=self.run, name="Shapefile Export", provider=self.provider
        )
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=self.celery_uid,
            status=TaskState.SUCCESS.value,
            name="Default Shapefile Export",
        )
        self.assertEqual("Finalize Run Task", finalize_run_task.name)
        finalize_run_task.run(run_uid=self.run.uid)
        email().send.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.RocketChat")
    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    @patch("shutil.rmtree")
    @patch("os.path.isdir")
    def test_export_task_error_handler(self, isdir, rmtree, email, rocket_chat):
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
            export_task_record = ExportTaskRecord.objects.create(
                export_provider_task=export_provider_task,
                uid=self.task.uid,
                celery_uid=self.celery_uid,
                status=TaskState.FAILED.value,
                name="Default Shapefile Export",
            )
            self.assertEqual("Export Task Error Handler", export_task_error_handler.name)
            export_task_error_handler.run(run_uid=self.run.uid, task_id=export_task_record.uid)
            isdir.assert_any_call(self.stage_dir)
            rmtree.assert_called_once_with(self.stage_dir)
            email().send.assert_called_once()
            rocket_chat.assert_called_once_with(**rocketchat_notifications)
            rocket_chat().post_message.assert_called_once_with(channel, message)

    @patch("eventkit_cloud.tasks.export_tasks.kill_task")
    def test_cancel_task(self, mock_kill_task):
        worker_name = "test_worker"
        task_pid = 55
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
            celery_uid=self.celery_uid,
            pid=task_pid,
            worker=worker_name,
        )

        self.assertEqual("Cancel Export Provider Task", cancel_export_provider_task.name)
        cancel_export_provider_task.run(
            data_provider_task_uid=export_provider_task.uid, canceling_username=user.username
        )
        mock_kill_task.apply_async.assert_called_once_with(
            kwargs={"result": {}, "task_pid": task_pid, "celery_uid": self.celery_uid},
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
        self.job.include_zipfile = True
        self.job.save()
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="test_provider_task", status=TaskState.COMPLETED.value, provider=self.provider
        )
        result = FileProducingTaskResult(file=self.output_file).save(write_file=False)
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.COMPLETED.value,
            name="test_task",
            celery_uid=self.celery_uid,
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
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=self.celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is not called with an invalid state
        task_pid = 55
        async_result.return_value = Mock(state=celery.states.FAILURE)
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=self.celery_uid)
        mock_progressive_kill.assert_not_called()

        # Ensure that kill is called with a valid pid
        async_result.return_value = Mock(state=celery.states.STARTED)
        self.assertEqual("Kill Task", kill_task.name)
        kill_task.run(task_pid=task_pid, celery_uid=self.celery_uid)
        mock_progressive_kill.assert_called_once_with(task_pid)

    @patch("eventkit_cloud.tasks.export_tasks.ExportRun")
    def test_wait_for_providers_task(self, mock_export_run):
        mock_provider_task = Mock(status=TaskState.SUCCESS.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().data_provider_task_records.filter.return_value = [mock_provider_task]

        callback_task = MagicMock()
        apply_args = {"arg1": "example_value"}

        wait_for_providers_task(run_uid=self.run.uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_called_once_with(**apply_args)

        callback_task.reset_mock()

        mock_provider_task = Mock(status=TaskState.RUNNING.value)
        mock_export_run.objects.filter().first.return_value = Mock()
        mock_export_run.objects.filter().first().data_provider_task_records.filter.return_value = [mock_provider_task]

        wait_for_providers_task(run_uid=self.run.uid, callback_task=callback_task, apply_args=apply_args)
        callback_task.apply_async.assert_not_called()

        with self.assertRaises(Exception):
            mock_export_run.reset_mock()
            mock_export_run.objects.filter().first().__nonzero__.return_value = False
            wait_for_providers_task(run_uid=self.run.uid, callback_task=callback_task, apply_args=apply_args)

    @patch("eventkit_cloud.tasks.export_tasks.get_arcgis_templates")
    @patch("eventkit_cloud.tasks.export_tasks.get_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.zip_files")
    @patch("eventkit_cloud.tasks.export_tasks.get_human_readable_metadata_document")
    @patch("eventkit_cloud.tasks.export_tasks.get_style_files")
    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("os.path.join", side_effect=lambda *args: args[-1])
    @patch("eventkit_cloud.tasks.export_tasks.DataProviderTaskRecord")
    def test_create_zip_task(
        self,
        mock_DataProviderTaskRecord,
        join,
        mock_generate_qgs_style,
        mock_get_style_files,
        mock_get_human_readable_metadata_document,
        mock_zip_files,
        mock_get_metadata,
        mock_get_arcgis_templates,
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
            f"{self.stage_dir}/osm/test.gpkg": "osm/test.gpkg",
            f"{self.stage_dir}/osm/osm_selection.geojson": "osm/osm_selection.geojson",
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
                    "full_file_path": f"{self.stage_dir}/osm/" "test.gpkg",
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
        mock_zip_files.return_value = self.output_file
        returned_zip = create_zip_task.run(
            task_uid=self.task.uid,
            data_provider_task_record_uids=data_provider_task_record_uids,
            run_zip_file_uid=run_zip_file.uid,
        )
        mock_generate_qgs_style.assert_called_once_with(metadata)
        mock_zip_files.assert_called_once_with(
            files=metadata["include_files"],
            run_zip_file_uid=run_zip_file.uid,
            meta_files=meta_files,
            file_path=self.output_file,
            metadata=metadata,
        )
        self.assertEqual(returned_zip, {"result": self.output_file})

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

    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    def test_vector_file_export_task(self, mock_download_data):
        self.input_file = self.output_file  # The source and the result are the same.

        self.setup_mock_task(vector_file_export_task)

        self.mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.bbox,
            layer_name="slug",
            is_raster=False,
            executor=self.task_process().start_process,
        )

        mock_download_data.assert_called_once_with(
            self.task.uid,
            self.service_url,
            self.output_file,
        )

    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    def test_raster_file_export_task(self, mock_download_data):
        self.input_file = self.output_file  # The source and the result are the same.

        self.setup_mock_task(raster_file_export_task)

        self.mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.bbox,
            is_raster=True,
            executor=self.task_process().start_process,
        )

        mock_download_data.assert_called_once_with(
            self.task.uid,
            self.task.export_provider_task.provider.url,
            self.output_file,
        )

    @patch("eventkit_cloud.tasks.export_tasks.get_tile_table_names")
    @patch("eventkit_cloud.tasks.export_tasks.os")
    @patch("eventkit_cloud.tasks.export_tasks.get_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.mapproxy.MapproxyGeopackage")
    def test_reprojection_task(self, mock_mapproxy, mock_get_metadata, mock_os, mock_get_tile_table_names):
        driver = "tif"
        self.config = {"cert_info": {"cert_path": "/path/to/cert", "cert_pass_var": "fake_pass"}}
        metadata = {"data_sources": {self.task.export_provider_task.provider.slug: {"type": "something"}}}
        mock_get_metadata.return_value = metadata
        self.mock_convert.return_value = self.output_file
        self.result = {
            "driver": driver,
            "selection": self.selection,
            "file_extension": None,
            "source": self.output_file,
        }
        mock_os.path.splitext.return_value = ["path", driver]

        self.projection = None
        self.setup_mock_task(reprojection_task)
        # test reprojection is skipped
        mock_os.rename.assert_called_once_with(self.input_file, self.output_file)

        self.projection = "3857"

        self.setup_mock_task(reprojection_task)

        # test reprojecting
        self.mock_convert.assert_called_once_with(
            driver=driver,
            input_files=f"GTIFF_RAW:{self.input_file}",
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
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
            "data_sources": {
                self.task.export_provider_task.provider.slug: {
                    "type": "raster",
                    "level_from": level_from,
                    "level_to": level_to,
                }
            }
        }
        mock_get_metadata.return_value = metadata
        mock_os.path.splitext.return_value = ["path", driver]
        self.input_file = "test.gpkg"
        self.result["driver"] = driver
        mock_mapproxy.return_value.convert.return_value = self.output_file

        self.setup_mock_task(reprojection_task)

        mock_mapproxy.assert_called_once_with(
            gpkgfile=self.output_file,
            service_url=self.output_file,
            name=normalize_name(self.task.export_provider_task.run.job.name),
            config=self.config,
            bbox=self.bbox,
            level_from=level_from,
            level_to=level_to,
            task_uid=self.task.uid,
            selection=self.selection,
            projection=self.projection,
            input_gpkg=self.input_file,
            layer=expected_layer,
        )

        mock_mapproxy().convert.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.find_in_zip")
    @patch("eventkit_cloud.tasks.export_tasks.get_geometry")
    @patch("eventkit_cloud.tasks.export_tasks.os.getenv")
    @patch("eventkit_cloud.tasks.export_tasks.get_ogcapi_data")
    def test_ogcapi_process_export_task(self, mock_get_ogcapi_data, mock_getenv, mock_get_geometry, mock_find_in_zip):
        example_format_slug = "fmt"
        self.config = {
            "ogcapi_process": {
                "id": "eventkit-test",
                "inputs": {"input": {"value": "random"}, "format": {"value": "gpkg"}},
                "outputs": {"format": {"mediaType": "application/zip"}},
                "output_file_ext": ".gpkg",
                "download_credentials": {"cred_var": "USER_PASS_ENV_VAR"},
            },
            "cred_var": "USER_PASS_ENV_VAR",
        }

        username = "user"
        password = "password"
        mock_getenv.return_value = f"{username}:{password}"

        mock_geometry = Mock()
        mock_get_geometry.return_value = mock_geometry
        mock_get_ogcapi_data.return_value = self.output_file
        mock_find_in_zip.return_value = self.input_file
        result = self.setup_mock_task(celery_task=ogcapi_process_export_task, export_format_slug=example_format_slug)

        mock_get_ogcapi_data.assert_called_with(
            export_task_record=self.task,
            bbox=self.bbox,
            stage_dir=self.stage_dir,
            export_format_slug=example_format_slug,
            selection=self.selection,
            download_path=self.output_file,
        )

        self.mock_convert.assert_not_called()
        expected_result = {"selection": self.selection, "result": self.output_file, "source": self.input_file}
        self.assertEqual(result, expected_result)

        self.mock_convert.return_value = self.input_file  # This wouldn't typically be the same but fine for test.
        result = self.setup_mock_task(celery_task=ogcapi_process_export_task)

        expected_result = {
            "driver": "gpkg",
            "file_extension": ".gpkg",
            "ogcapi_process": self.output_file,
            "source": self.input_file,
            "gpkg": self.input_file,
            "selection": self.selection,
            "result": self.output_file,
        }

        self.assertEqual(result, expected_result)
        self.mock_convert.assert_called_once_with(
            driver="gpkg",
            input_files=self.input_file,
            output_file=self.output_file,
            projection=self.projection,
            boundary=self.selection,
            executor=self.task_process().start_process,
        )

    @patch("eventkit_cloud.tasks.export_tasks.extract_metadata_files")
    @patch("eventkit_cloud.tasks.export_tasks.update_progress")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.get_geometry")
    def test_get_ogcapi_data(
        self, mock_get_geometry, mock_download_data, mock_update_progress, mock_extract_metadata_files
    ):
        example_format_slug = "fmt"

        mock_geometry = Mock()
        mock_get_geometry.return_value = mock_geometry

        example_download_url = "https://example.test/path.zip"

        mock_client = Mock()
        mock_client.get_job_results.return_value = example_download_url
        mock_session = Mock()
        mock_client.get_process_session.return_value = mock_session
        self.task.export_provider_task.provider.get_service_client.return_value = mock_client

        mock_download_data.return_value = self.output_file
        result = get_ogcapi_data(
            export_task_record=self.task,
            stage_dir=self.stage_dir,
            bbox=self.bbox,
            export_format_slug=example_format_slug,
            selection=self.selection,
            download_path=self.output_file,
        )

        self.assertEqual(result, self.output_file)

        mock_client.create_job.called_once_with(mock_geometry, file_format=example_format_slug)
        mock_download_data.assert_called_once_with(
            self.task.uid, example_download_url, self.output_file, session=mock_session
        )
        mock_extract_metadata_files.assert_called_once_with(self.output_file, self.stage_dir)


class TestFormatTasks(ExportTaskBase):
    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)
