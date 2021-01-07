# -*- coding: utf-8 -*-

import json
import logging
import os
import pickle
import sys
import uuid
import yaml

import celery
from billiard.einfo import ExceptionInfo
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from django.utils import timezone
from unittest.mock import Mock, PropertyMock, patch, MagicMock, ANY

from eventkit_cloud.celery import TaskPriority, app
from eventkit_cloud.jobs.models import DatamodelPreset, DataProvider, Job, DataProviderType
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.export_tasks import (
    ExportTask,
    export_task_error_handler,
    finalize_run_task,
    kml_export_task,
    mapproxy_export_task,
    geopackage_export_task,
    shp_export_task,
    arcgis_feature_service_export_task,
    pick_up_run_task,
    cancel_export_provider_task,
    kill_task,
    geotiff_export_task,
    nitf_export_task,
    bounds_export_task,
    parse_result,
    finalize_export_provider_task,
    FormatTask,
    wait_for_providers_task,
    create_zip_task,
    pbf_export_task,
    sqlite_export_task,
    gpx_export_task,
    mbtiles_export_task,
    wfs_export_task,
)
from eventkit_cloud.tasks.export_tasks import zip_files
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

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.group, created = Group.objects.get_or_create(name="TestDefault")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = self.group
            self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        bbox = Polygon.from_bbox((-10.85, 6.25, -10.62, 6.40))
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


class TestExportTasks(ExportTaskBase):
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_run_shp_export_task(self, mock_request, mock_convert):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "osm-generic"
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{expected_provider_slug}-{date}_shp"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=shp_export_task.name
        )
        shp_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = shp_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="ESRI Shapefile",
            input_file=expected_output_path,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            boundary=None,
            projection=4326,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("eventkit_cloud.tasks.export_tasks.convert_qgis_gpkg_to_kml")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_run_kml_export_task(self, mock_request, mock_convert, mock_qgis_convert, mock_generate_qgs_style):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "osm-generic"
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{expected_provider_slug}-{date}.kml"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_generate_qgs_style.return_value = qgs_file = "/style.qgs"
        mock_convert.return_value = mock_qgis_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=kml_export_task.name
        )
        kml_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = kml_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
        )
        try:
            import qgis  # noqa

            mock_qgis_convert.assert_called_once_with(qgs_file, expected_output_path, stage_dir=stage_dir)
        except ImportError:
            mock_convert.assert_called_once_with(
                driver="libkml",
                input_file=expected_output_path,
                output_file=expected_output_path,
                task_uid=str(saved_export_task.uid),
                projection=4326,
                boundary=None,
            )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_run_sqlite_export_task(self, mock_request, mock_convert):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "osm-generic"
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{expected_provider_slug}-{date}.sqlite"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=sqlite_export_task.name
        )
        sqlite_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = sqlite_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="SQLite",
            input_file=expected_output_path,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=None,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.download_layers_concurrently")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    @patch("celery.app.task.Task.request")
    def test_run_wfs_export_task(
        self, mock_request, mock_gpkg, mock_convert, mock_download_data, mock_download_layers_concurrently
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "wfs-service"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="wfs")
        self.provider.slug = expected_provider_slug
        self.provider.config = None
        self.provider.save()
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{expected_provider_slug}-{date}.gpkg"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )
        layer = "foo"
        service_url = "https://abc.gov/WFSserver/"
        expected_input_path = (
            f"{service_url}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME={layer}&SRSNAME=EPSG:{projection}"
        )

        mock_convert.return_value = expected_output_path
        mock_download_data.return_value = expected_input_path

        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=wfs_export_task.name
        )
        wfs_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        mock_gpkg.check_content_exists.return_value = True
        result = wfs_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=service_url,
            layer=layer,
        )
        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_file=expected_output_path,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=projection,
            boundary=None,
            layer_name=expected_provider_slug,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])
        mock_gpkg.check_content_exists.assert_called_once_with(expected_output_path)

        result_b = wfs_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=f"{service_url}/",
        )

        self.assertEqual(expected_output_path, result_b["result"])
        self.assertEqual(expected_output_path, result_b["source"])

        url_1 = "https://abc.gov/wfs/services/x"
        url_2 = "https://abc.gov/wfs/services/y"
        layer_1 = "spam"
        layer_2 = "ham"

        config = f"""
        vector_layers:
            - name: '{layer_1}'
              url: '{url_1}'
            - name: '{layer_2}'
              url: '{url_2}'
        """
        configuration = yaml.safe_load(config)
        expected_input_file_1 = "1"
        expected_input_file_2 = "2"

        expected_layers = [
            {"name": layer_1, "url": url_1, "path": expected_input_file_1},
            {"name": layer_2, "url": url_2, "path": expected_input_file_2},
        ]

        mock_download_layers_concurrently.return_value = expected_layers
        mock_convert.reset_mock()

        # test with multiple layers
        result_c = wfs_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=service_url,
            layer=layer,
            config=config,
        )

        mock_download_layers_concurrently.assert_called_once_with(
            configuration, None, stage_dir, job_name, projection, expected_provider_slug, "gpkg"
        )

        self.assertEqual(mock_convert.call_count, 2)

        mock_convert.assert_any_call(
            driver="gpkg",
            input_file=expected_input_file_1,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=None,
            access_mode="append",
            layer_name=layer_1,
        )

        mock_convert.assert_any_call(
            driver="gpkg",
            input_file=expected_input_file_2,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=None,
            access_mode="append",
            layer_name=layer_2,
        )

        self.assertEqual(expected_output_path, result_c["result"])
        self.assertEqual(expected_output_path, result_c["source"])

        # test downloads with certs
        mock_download_data.reset_mock()

        wfs_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=service_url,
            layer=layer,
            config='cert_var: "test2"',
        )
        mock_download_data.assert_any_call(expected_input_path, ANY, "test2")

    @patch("eventkit_cloud.utils.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_mbtiles_export_task(self, mock_request, mock_convert):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        input_projection = 4326
        output_projection = 3857
        driver = "MBTiles"
        ext = "mbtiles"
        expected_provider_slug = "osm-generic"
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{output_projection}-{expected_provider_slug}-{date}.{ext}"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_convert.return_value = expected_output_path
        sample_input = "example.gpkg"
        previous_task_result = {"source": sample_input}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=mbtiles_export_task.name
        )
        mbtiles_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = mbtiles_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=output_projection,
        )
        mock_convert.assert_called_once_with(
            driver=driver,
            input_file=sample_input,
            output_file=expected_output_path,
            src_srs=input_projection,
            task_uid=str(saved_export_task.uid),
            projection=output_projection,
            boundary=None,
            use_translate=True,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(sample_input, result["source"])

    @patch("eventkit_cloud.utils.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_run_gpkg_export_task(self, mock_request, mock_convert):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "osm-generic"
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{expected_provider_slug}-{date}.gpkg"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_convert.return_value = expected_output_path
        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=geopackage_export_task.name
        )
        geopackage_export_task.update_task_state(
            task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid)
        )
        result = geopackage_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_file=expected_output_path,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=None,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_creation_options")
    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils")
    def test_geotiff_export_task(self, mock_gdalutils, mock_get_export_task_record, mock_get_creation_options):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        example_geotiff = "example.tif"
        example_result = {"source": example_geotiff}
        task_uid = "1234"
        warp_params = {"warp": "params"}
        translate_params = {"translate": "params"}
        mock_get_creation_options.return_value = warp_params, translate_params
        provider_slug = "osm-generic"
        mock_get_export_task_record.return_value = Mock(export_provider_task=Mock(provider=Mock(slug=provider_slug)))
        date = default_format_time(timezone.now())
        expected_outfile = f"stage/job-4326-{provider_slug}-{date}.tif"
        geotiff_export_task(result=example_result, task_uid=task_uid, stage_dir="stage", job_name="job")
        mock_gdalutils.convert.return_value = expected_outfile
        mock_gdalutils.convert.assert_called_once_with(
            boundary=None,
            driver="gtiff",
            input_file=f"GTIFF_RAW:{example_geotiff}",
            output_file=expected_outfile,
            task_uid=task_uid,
            warp_params=warp_params,
            translate_params=translate_params,
        )
        mock_gdalutils.reset_mock()
        geotiff_export_task(result=example_result, task_uid=task_uid, stage_dir="stage", job_name="job")
        mock_gdalutils.convert.assert_called_once_with(
            boundary=None,
            driver="gtiff",
            input_file=f"GTIFF_RAW:{example_geotiff}",
            output_file=expected_outfile,
            task_uid=task_uid,
            warp_params=warp_params,
            translate_params=translate_params,
        )
        mock_gdalutils.reset_mock()
        example_result = {"source": example_geotiff, "selection": "selection"}
        mock_gdalutils.convert.return_value = expected_outfile
        geotiff_export_task(result=example_result, task_uid=task_uid, stage_dir="stage", job_name="job")
        mock_gdalutils.convert.assert_called_once_with(
            boundary="selection",
            driver="gtiff",
            input_file=f"GTIFF_RAW:{example_geotiff}",
            output_file=expected_outfile,
            task_uid=task_uid,
            warp_params=warp_params,
            translate_params=translate_params,
        )

    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils")
    def test_nitf_export_task(self, mock_gdalutils, mock_get_export_task_record):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        example_nitf = "example.nitf"
        example_result = {"source": example_nitf}
        task_uid = "1234"
        provider_slug = "osm-generic"
        mock_get_export_task_record.return_value = Mock(export_provider_task=Mock(provider=Mock(slug=provider_slug)))
        date = default_format_time(timezone.now())
        expected_outfile = f"stage/job-4326-{provider_slug}-{date}.nitf"
        nitf_export_task(result=example_result, task_uid=task_uid, stage_dir="stage", job_name="job")
        mock_gdalutils.convert.return_value = expected_outfile
        mock_gdalutils.convert.assert_called_once_with(
            creation_options=["ICORDS=G"],
            driver="nitf",
            input_file=example_nitf,
            output_file=expected_outfile,
            task_uid=task_uid,
        )
        mock_gdalutils.reset_mock()
        nitf_export_task(result=example_result, task_uid=task_uid, stage_dir="stage", job_name="job")
        mock_gdalutils.convert.assert_called_once_with(
            creation_options=["ICORDS=G"],
            driver="nitf",
            input_file=example_nitf,
            output_file=expected_outfile,
            task_uid=task_uid,
        )

    def test_pbf_export_task(self):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        example_pbf = "example.pbf"
        example_result = {"pbf": example_pbf}
        expected_result = {"file_extension": "pbf", "driver": "OSM", "pbf": example_pbf, "result": example_pbf}
        returned_result = pbf_export_task(example_result)
        self.assertEquals(expected_result, returned_result)

    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_sqlite_export_task(self, mock_request, mock_convert, mock_get_export_task_record):
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        provider_slug = "osm"
        mock_get_export_task_record.return_value = Mock(export_provider_task=Mock(provider=Mock(slug=provider_slug)))
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        date = default_format_time(timezone.now())
        expected_outfile = f"{job_name}-{projection}-{provider_slug}-{date}.sqlite"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), expected_outfile
        )

        mock_convert.return_value = expected_output_path

        previous_task_result = {"source": expected_output_path}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=sqlite_export_task.name
        )
        sqlite_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = sqlite_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
        )
        mock_convert.assert_called_once_with(
            driver="SQLite",
            input_file=expected_output_path,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=None,
        )

        self.assertEqual(expected_output_path, result["result"])
        self.assertEqual(expected_output_path, result["source"])

    @patch("eventkit_cloud.tasks.export_tasks.get_export_task_record")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils")
    def test_gpx_export_task(self, mock_gdalutils, mock_get_export_task_record):
        # TODO: This can be setup as a way to test the other ExportTasks without all the boilerplate.
        ExportTask.__call__ = lambda *args, **kwargs: celery.Task.__call__(*args, **kwargs)
        provider_slug = "osm-generic"
        mock_get_export_task_record.return_value = Mock(export_provider_task=Mock(provider=Mock(slug=provider_slug)))
        example_source = "example.pbf"
        example_geojson = "example.geojson"
        task_uid = "1234"
        example_result = {"pbf": example_source, "selection": example_geojson}
        date = default_format_time(timezone.now())
        stage_dir = "stage"
        expected_outfile = f"{stage_dir}/job-4326-{provider_slug}-{date}.gpx"
        mock_gdalutils.convert.return_value = expected_outfile
        expected_result = {
            "pbf": example_source,
            "file_extension": "gpx",
            "driver": "GPX",
            "result": expected_outfile,
            "gpx": expected_outfile,
            "selection": example_geojson,
        }
        returned_result = gpx_export_task(result=example_result, task_uid=task_uid, stage_dir=stage_dir, job_name="job")
        mock_gdalutils.convert.assert_called_once_with(
            input_file=example_source,
            output_file=expected_outfile,
            driver="GPX",
            dataset_creation_options=["GPX_USE_EXTENSIONS=YES"],
            boundary=example_geojson,
        )
        self.assertEqual(returned_result, expected_result)

    @patch("eventkit_cloud.tasks.export_tasks.download_layers_concurrently")
    @patch("eventkit_cloud.tasks.export_tasks.download_data")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.convert")
    @patch("celery.app.task.Task.request")
    def test_run_arcgis_feature_service_export_task(
        self, mock_request, mock_convert, mock_download_data, mock_download_layers_concurrently
    ):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        projection = 4326
        expected_provider_slug = "arcgis-feature-service"
        self.provider.export_provider_type = DataProviderType.objects.get(type_name="arcgis-feature")
        self.provider.slug = expected_provider_slug
        self.provider.config = None
        self.provider.save()
        date = default_format_time(timezone.now())
        outpath = f"{job_name}-{projection}-{expected_provider_slug}-{date}"
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), f"{outpath}.gpkg"
        )
        expected_esrijson = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), f"{outpath}.json"
        )
        service_url = "https://abc.gov/arcgis/services/x"
        bbox = [1, 2, -3, 4]
        query_string = "query?where=objectid=objectid&outfields=*&geometry=1%2C+2%2C+-3%2C+4&f=json"
        expected_input_url = f"{service_url}/{query_string}"
        mock_convert.return_value = expected_output_path
        mock_download_data.return_value = expected_esrijson

        previous_task_result = {"source": expected_input_url}
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )

        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.PENDING.value,
            name=arcgis_feature_service_export_task.name,
        )

        arcgis_feature_service_export_task.update_task_state(
            task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid)
        )
        # test without trailing slash
        result_a = arcgis_feature_service_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=service_url,
            bbox=bbox,
        )

        mock_download_data.assert_called_once_with(expected_input_url, expected_esrijson, None)

        mock_convert.assert_called_once_with(
            driver="gpkg",
            input_file=expected_esrijson,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            layer_name=expected_provider_slug,
            boundary=bbox,
        )

        self.assertEqual(expected_output_path, result_a["result"])
        self.assertEqual(expected_output_path, result_a["source"])

        # test with trailing slash
        result_b = arcgis_feature_service_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=f"{service_url}/",
            bbox=bbox,
        )

        self.assertEqual(expected_output_path, result_b["result"])
        self.assertEqual(expected_output_path, result_b["source"])

        url_1 = "https://abc.gov/arcgis/services/x"
        url_2 = "https://abc.gov/arcgis/services/y"

        layer_name_1 = "foo"
        layer_name_2 = "bar"

        config = f"""
        vector_layers:
            - name: '{layer_name_1}'
              url: '{url_1}'
            - name: '{layer_name_2}'
              url: '{url_2}'
        """
        configuration = yaml.safe_load(config)

        expected_input_file_1 = "1"
        expected_input_file_2 = "2"

        expected_layers = [
            {"name": layer_name_1, "url": url_1, "path": expected_input_file_1},
            {"name": layer_name_2, "url": url_2, "path": expected_input_file_2},
        ]

        mock_download_layers_concurrently.return_value = expected_layers
        mock_convert.reset_mock()
        mock_download_data.reset_mock()

        # test with multiple layers
        result_c = arcgis_feature_service_export_task.run(
            run_uid=self.run.uid,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir=stage_dir,
            job_name=job_name,
            projection=projection,
            service_url=f"{service_url}/",
            bbox=bbox,
            config=config,
        )

        mock_download_layers_concurrently.assert_called_once_with(
            configuration, bbox, stage_dir, job_name, projection, expected_provider_slug, "json"
        )

        self.assertEqual(mock_convert.call_count, 2)

        mock_convert.assert_any_call(
            driver="gpkg",
            input_file=expected_input_file_1,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=bbox,
            access_mode="append",
            layer_name=layer_name_1,
        )

        mock_convert.assert_any_call(
            driver="gpkg",
            input_file=expected_input_file_2,
            output_file=expected_output_path,
            task_uid=str(saved_export_task.uid),
            projection=4326,
            boundary=bbox,
            access_mode="append",
            layer_name=layer_name_2,
        )

        self.assertEqual(expected_output_path, result_c["result"])
        self.assertEqual(expected_output_path, result_c["source"])

        # test downloads with certs
        mock_download_data.reset_mock()

        arcgis_feature_service_export_task.run(
            run_uid=123,
            result=previous_task_result,
            task_uid=str(saved_export_task.uid),
            stage_dir="dir",
            job_name="job",
            projection=projection,
            service_url=url_1,
            bbox=bbox,
            config='cert_var: "test1"',
        )
        mock_download_data.assert_called_once_with(expected_input_url, ANY, "test1")

    @patch("celery.app.task.Task.request")
    @patch("eventkit_cloud.utils.mapproxy.MapproxyGeopackage")
    def test_run_external_raster_service_export_task(self, mock_service, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        service_to_gpkg = mock_service.return_value
        job_name = self.job.name.lower()
        expected_output_path = os.path.join(
            os.path.join(settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid)), "{}.gpkg".format(job_name)
        )
        service_to_gpkg.convert.return_value = expected_output_path
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, status=TaskState.PENDING.value, provider=self.provider
        )
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=mapproxy_export_task.name
        )
        mapproxy_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = mapproxy_export_task.run(
            run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name
        )
        service_to_gpkg.convert.assert_called_once()

        self.assertEqual(expected_output_path, result["result"])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEqual(TaskState.RUNNING.value, run_task.status)
        service_to_gpkg.convert.side_effect = Exception("Task Failed")
        with self.assertRaises(Exception):
            mapproxy_export_task.run(
                run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir, job_name=job_name
            )

    def test_task_on_failure(self,):
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
            exc, task_id=test_export_task_record.uid, einfo=einfo, args={}, kwargs={"run_uid": str(self.run.uid)}
        )
        task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(task)
        exception = task.exceptions.all()[0]
        exc_info = pickle.loads(exception.exception.encode()).exc_info
        error_type, msg = exc_info[0], exc_info[1]
        self.assertEqual(error_type, ValueError)
        self.assertEqual("some unexpected error", str(msg))

    @patch("eventkit_cloud.tasks.export_tasks.get_data_package_manifest")
    @patch("eventkit_cloud.tasks.export_tasks.gdalutils.retry")
    @patch("shutil.copy")
    @patch("os.remove")
    @patch("eventkit_cloud.tasks.export_tasks.ZipFile")
    @patch("os.walk")
    @patch("os.path.getsize")
    @patch("eventkit_cloud.tasks.export_tasks.s3.upload_to_s3")
    def test_zipfile_task(
        self, s3, os_path_getsize, mock_os_walk, mock_zipfile, remove, copy, mock_retry, mock_get_data_package_manifest
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
        stage_dir = settings.EXPORT_STAGING_ROOT
        provider_slug = "osm"
        zipfile_path = os.path.join(stage_dir, "{0}".format(run_uid), provider_slug, "test.gpkg")
        expected_manifest_file = os.path.join("MANIFEST", "manifest.xml")
        mock_get_data_package_manifest.return_value = expected_manifest_file
        include_files = ["{0}/file1.txt".format(provider_slug), "{0}/file2.txt".format(provider_slug)]
        mock_os_walk.return_value = [
            (
                os.path.join(stage_dir, run_uid, provider_slug),
                None,
                ["test.gpkg", "test.om5", "test.osm"],  # om5 and osm should get filtered out
            )
        ]
        date = timezone.now().strftime("%Y%m%d")
        zipfile_name = os.path.join("/downloads", "{0}".format(run_uid), "testjob-test-eventkit-{0}.zip".format(date))
        s3.return_value = "www.s3.eventkit-cloud/{}".format(zipfile_name)
        result = zip_files(include_files=include_files, run_zip_file_uid=run_zip_file.uid, file_path=zipfile_path)
        self.assertEqual(zipfile.files, expected_archived_files)
        self.assertEqual(result, zipfile_path)
        mock_get_data_package_manifest.assert_called_once()

        zipfile.testzip = Exception("Bad Zip")
        with self.assertRaises(Exception):
            zip_files(include_files=include_files, file_path=zipfile_path)

    @patch("celery.app.task.Task.request")
    @patch("eventkit_cloud.tasks.export_tasks.geopackage")
    def test_run_bounds_export_task(self, mock_geopackage, mock_request):
        celery_uid = str(uuid.uuid4())
        type(mock_request).id = PropertyMock(return_value=celery_uid)
        job_name = self.job.name.lower()
        provider_slug = "provider_slug"
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid) + "/"
        mock_geopackage.add_geojson_to_geopackage.return_value = os.path.join(
            settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid), "{}_bounds.gpkg".format(provider_slug)
        )
        expected_output_path = os.path.join(
            settings.EXPORT_STAGING_ROOT.rstrip("\/"), str(self.run.uid), "{}_bounds.gpkg".format(provider_slug)
        )
        export_provider_task = DataProviderTaskRecord.objects.create(run=self.run, provider=self.provider)
        saved_export_task = ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task, status=TaskState.PENDING.value, name=bounds_export_task.name
        )
        bounds_export_task.update_task_state(task_status=TaskState.RUNNING.value, task_uid=str(saved_export_task.uid))
        result = bounds_export_task.run(
            run_uid=self.run.uid, task_uid=str(saved_export_task.uid), stage_dir=stage_dir, provider_slug=job_name
        )
        self.assertEqual(expected_output_path, result["result"])
        # test the tasks update_task_state method
        run_task = ExportTaskRecord.objects.get(celery_uid=celery_uid)
        self.assertIsNotNone(run_task)
        self.assertEqual(TaskState.RUNNING.value, run_task.status)

    @patch("eventkit_cloud.tasks.task_factory.TaskFactory")
    @patch("eventkit_cloud.tasks.export_tasks.socket")
    def test_pickup_run_task(self, socket, task_factory):
        run_uid = self.run.uid
        socket.gethostname.return_value = "test"
        self.assertEqual("Pickup Run", pick_up_run_task.name)
        pick_up_run_task.run(run_uid=run_uid, user_details={"username": "test_pickup_run_task"})
        task_factory.assert_called_once()
        expected_user_details = {"username": "test_pickup_run_task"}
        task_factory.return_value.parse_tasks.assert_called_once_with(
            run_uid=run_uid,
            user_details=expected_user_details,
            worker="test",
            data_provider_slugs=None,
            run_zip_file_slug_sets=None,
        )

    @patch("eventkit_cloud.tasks.export_tasks.logger")
    @patch("shutil.rmtree")
    @patch("os.path.isdir")
    def test_finalize_run_task_after_return(self, isdir, rmtree, logger):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(self.run.uid))
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
        finalize_run_task.after_return("status", {"stage_dir": stage_dir}, run_uid, (), {}, "Exception Info")
        isdir.assert_called_with(stage_dir)
        rmtree.assert_called_with(stage_dir)

        celery_uid = str(uuid.uuid4())
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="Shapefile Export", provider=self.provider
        )
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            celery_uid=celery_uid,
            status="SUCCESS",
            name="Default Shapefile Export",
        )
        rmtree.side_effect = IOError()
        finalize_run_task.after_return("status", {"stage_dir": stage_dir}, run_uid, (), {}, "Exception Info")

        rmtree.assert_called_with(stage_dir)
        self.assertRaises(IOError, rmtree)
        logger.error.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    def test_finalize_run_task(self, email):
        celery_uid = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
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
        finalize_run_task.run(run_uid=run_uid, stage_dir=stage_dir)
        email().send.assert_called_once()

    @patch("eventkit_cloud.tasks.export_tasks.RocketChat")
    @patch("eventkit_cloud.tasks.export_tasks.EmailMultiAlternatives")
    @patch("shutil.rmtree")
    @patch("os.path.isdir")
    def test_export_task_error_handler(self, isdir, rmtree, email, rocket_chat):
        celery_uid = str(uuid.uuid4())
        task_id = str(uuid.uuid4())
        run_uid = self.run.uid
        stage_dir = settings.EXPORT_STAGING_ROOT + str(self.run.uid)
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
            export_task_error_handler.run(run_uid=run_uid, task_id=task_id, stage_dir=stage_dir)
            isdir.assert_any_call(stage_dir)
            rmtree.assert_called_once_with(stage_dir)
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
            kwargs={"task_pid": task_pid, "celery_uid": celery_uid},
            queue="{0}.priority".format(worker_name),
            priority=TaskPriority.CANCEL.value,
            routing_key="{0}.priority".format(worker_name),
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
        run_uid = self.run.uid
        self.job.include_zipfile = True
        self.job.save()
        export_provider_task = DataProviderTaskRecord.objects.create(
            run=self.run, name="test_provider_task", status=TaskState.COMPLETED.value, provider=self.provider
        )
        result = FileProducingTaskResult.objects.create(filename=filename, size=10)
        ExportTaskRecord.objects.create(
            export_provider_task=export_provider_task,
            status=TaskState.COMPLETED.value,
            name="test_task",
            celery_uid=celery_uid,
            pid=task_pid,
            worker=worker_name,
            result=result,
        )

        download_root = settings.EXPORT_DOWNLOAD_ROOT.rstrip("\/")
        run_dir = os.path.join(download_root, str(run_uid))
        finalize_export_provider_task.run(
            result={"status": TaskState.SUCCESS.value},
            run_uid=self.run.uid,
            data_provider_task_uid=export_provider_task.uid,
            run_dir=run_dir,
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

    @patch("eventkit_cloud.tasks.export_tasks.get_arcgis_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.get_metadata")
    @patch("eventkit_cloud.tasks.export_tasks.zip_files")
    @patch("eventkit_cloud.tasks.export_tasks.get_human_readable_metadata_document")
    @patch("eventkit_cloud.tasks.export_tasks.get_style_files")
    @patch("eventkit_cloud.tasks.export_tasks.json")
    @patch("builtins.open")
    @patch("eventkit_cloud.tasks.export_tasks.generate_qgs_style")
    @patch("os.path.join", side_effect=lambda *args: args[-1])
    @patch("eventkit_cloud.tasks.export_tasks.DataProviderTaskRecord")
    def test_create_zip_task(
        self,
        mock_DataProviderTaskRecord,
        join,
        mock_generate_qgs_style,
        mock_open,
        mock_json,
        mock_get_style_files,
        mock_get_human_readable_metadata_document,
        mock_zip_files,
        mock_get_metadata,
        mock_get_arcgis_metadata,
    ):
        mock_get_style_files.return_value = style_files = ["/styles.png"]
        mock_get_human_readable_metadata_document.return_value = human_metadata_doc = "/human_metadata.txt"
        mock_generate_qgs_style.return_value = qgis_file = "/style.qgs"

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
            "include_files": [
                human_metadata_doc,
                qgis_file,
                "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/test.gpkg",
                "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/osm_selection.geojson",
            ],
            "name": "test",
            "project": "Test",
            "run_uid": "7fadf34e-58f9-4bb8-ab57-adc1015c4269",
            "url": "http://cloud.eventkit.test/status/2010025c-6d61-4a0b-8d5d-ff9c657259eb",
        }
        data_provider_task_record_uids = ["0d08ddf6-35c1-464f-b271-75f6911c3f78"]
        mock_get_metadata.return_value = metadata
        run_zip_file = RunZipFile.objects.create(run=self.run)
        expected_zip = f"{metadata['name']}-{run_zip_file.uid}.zip"
        mock_zip_files.return_value = expected_zip

        returned_zip = create_zip_task.run(
            data_provider_task_record_uids=data_provider_task_record_uids, run_zip_file_uid=run_zip_file.uid
        )
        mock_generate_qgs_style.assert_called_once_with(metadata)
        mock_open.assert_called_once()
        mock_zip_files.assert_called_once_with(
            include_files=list(set(metadata["include_files"])),
            run_zip_file_uid=run_zip_file.uid,
            file_path=expected_zip,
            static_files=style_files,
            metadata=metadata,
        )
        mock_json.dump.assert_called_once()
        mock_get_arcgis_metadata.assert_called_once_with(metadata)
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


class TestFormatTasks(ExportTaskBase):
    def test_ensure_display(self):
        self.assertTrue(FormatTask.display)
