# -*- coding: utf-8 -*-

import json
import logging
import os
import signal
from unittest.mock import MagicMock, Mock, call, patch

import requests
import requests_mock
from django.conf import settings
from django.test import TestCase
from django.utils import timezone

from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.tasks.helpers import (
    cd,
    delete_rabbit_objects,
    find_in_zip,
    get_all_rabbitmq_objects,
    get_arcgis_metadata,
    get_data_package_manifest,
    get_file_paths,
    get_last_update,
    get_message_count,
    get_metadata,
    get_metadata_url,
    get_osm_last_update,
    get_style_files,
    progressive_kill,
    update_progress,
)

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):
    """
    Test Task Helpers
    """

    def test_cd(self):
        current_path = os.getcwd()
        parent_path = os.path.dirname(current_path)
        with cd(parent_path):
            self.assertEqual(parent_path, os.getcwd())
        self.assertEqual(current_path, os.getcwd())

    @patch("eventkit_cloud.tasks.helpers.time.sleep")
    @patch("eventkit_cloud.tasks.helpers.os")
    def test_progressive_kill(self, mock_os, mock_sleep):
        pid = 1
        # Test no PID.
        mock_os.killpg.side_effect = [OSError()]
        progressive_kill(pid)
        mock_os.reset_mock

        # Test kill with SIGTERM
        mock_os.killpg.side_effect = [None, OSError()]
        progressive_kill(pid)
        mock_os.killpg.has_calls([call(pid, signal.SIGTERM)])
        mock_os.reset_mock

        # Test kill with SIGKILL
        mock_os.killpg.side_effect = [None, None]
        progressive_kill(pid)
        mock_os.killpg.has_calls([call(pid, signal.SIGTERM), call(pid, signal.SIGTERM)])
        mock_os.reset_mock

    def test_get_style_files(self):
        for file in get_style_files():
            self.assertTrue(os.path.isfile(file))

    def test_get_file_paths(self):
        self.assertTrue(os.path.abspath(__file__) in get_file_paths(os.path.dirname(__file__)))

    @patch("eventkit_cloud.tasks.helpers.get_osm_last_update")
    def test_get_last_update(self, mock_get_osm_last_update):
        test_url = "https://test"
        test_type = "osm"
        get_last_update(test_url, test_type)
        mock_get_osm_last_update.assert_called_once_with(test_url, cert_info=None)

    @patch.object(requests.Session, "get")
    def test_get_osm_last_update(self, mock_get):
        test_url = "https://test/interpreter"
        expected_url = "https://test/timestamp"
        expected_time = "2017-12-29T13:09:59Z"

        mock_get.return_value.content.decode.return_value = expected_time
        returned_time = get_osm_last_update(test_url)
        mock_get.assert_called_once_with(expected_url)
        self.assertEqual(expected_time, returned_time)

        mock_get.side_effect = Exception("FAIL")
        returned_time = get_osm_last_update(test_url)
        self.assertIsNone(returned_time)

    def test_get_metadata_url(self):
        test_url = "https://test"

        expected_value = "https://test?request=GetCapabilities"
        returned_value = get_metadata_url(test_url, "wcs")
        self.assertEqual(expected_value, returned_value)

        returned_value = get_metadata_url(test_url, "arcgis-raster")
        self.assertEqual(test_url, returned_value)

    @patch("os.path.isfile")
    @patch("eventkit_cloud.tasks.helpers.create_license_file")
    @patch("eventkit_cloud.tasks.helpers.get_metadata_url")
    @patch("eventkit_cloud.tasks.helpers.get_last_update")
    @patch("eventkit_cloud.tasks.helpers.DataProviderTaskRecord")
    def test_get_metadata(
        self,
        mock_DataProviderTaskRecord,
        mock_get_last_update,
        mock_get_metadata_url,
        mock_create_license_file,
        mock_isfile,
    ):
        run_uid = "1234"
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))
        example_layers = {
            "layer1": {"name": "layer1", "url": "https://some.url/layer1"},
            "layer2": {"name": "layer2", "url": "https://some.url/layer2"},
        }
        expected_layers = [lyr_name for lyr_name, lyr in example_layers.items()]
        expected_type = "vector"
        mock_create_license_file.return_value = expected_license_file = {"/license.txt": "/license.txt"}
        mock_isfile.return_value = True
        mock_get_metadata_url.return_value = expected_metadata_url = "https://some.url/metadata"
        # Fill out the behavior for mocked ExportRun by adding a provider task with
        # subtasks for each file in all_file_list

        mock_get_last_update.return_value = expected_last_update = "2018-10-29T04:35:02Z\n"
        mocked_provider_subtasks = []
        sample_file = "F1.gpkg"

        mocked_provider_task = MagicMock()
        mocked_provider_task.name = expected_provider_task_name = "example_name"
        mocked_provider_task.status = TaskState.COMPLETED.value
        mocked_provider_task.provider.slug = expected_provider_slug = "example_slug"
        mocked_provider_task.tasks.filter.return_value = mocked_provider_subtasks
        mocked_provider_task.uid = expected_provider_task_uid = "5678"
        expected_stage_preview_file = f"{stage_dir}/{expected_provider_slug}/preview.jpg"
        expected_archive_preview_file = f"data/{expected_provider_slug}/preview.jpg"
        mocked_provider_task.preview.get_file_path.side_effect = [
            expected_archive_preview_file,
            expected_stage_preview_file,
        ]

        mps = MagicMock()
        mps.result.filename = sample_file
        mps.name = "something EPSG:4326"
        mps.status = TaskState.COMPLETED.value
        mocked_provider_subtasks.append(mps)

        expected_stage_file = f"{stage_dir}/{expected_provider_slug}/{sample_file}"
        expected_archive_file = f"data/{expected_provider_slug}/{sample_file}"
        # This is *look* backwards because the value will get called and resolved before the key in the method.
        mps.result.get_file_path.side_effect = [expected_stage_file, expected_archive_file]
        mocked_data_provider = MagicMock()
        mocked_data_provider.slug = expected_provider_slug
        mocked_data_provider.export_provider_type.type_name = "osm"
        mocked_data_provider.service_copyright = expected_copyright = "mocked_copyright"
        mocked_data_provider.config = {"cert_var": expected_provider_slug}
        mocked_data_provider.service_description = expected_data_provider_desc = "example_description"
        mocked_data_provider.layers = example_layers
        mocked_data_provider.get_data_type.return_value = expected_type
        mocked_data_provider.level_from = expected_level_from = 0
        mocked_data_provider.level_to = expected_level_to = 12

        mocked_provider_task.provider = mocked_data_provider

        mocked_queryset = MagicMock()
        mocked_queryset.return_value = [mocked_provider_task]
        mocked_queryset.first.return_value = mocked_provider_task
        mocked_queryset.__iter__.return_value = [mocked_provider_task]
        mock_DataProviderTaskRecord.objects.select_related().prefetch_related().prefetch_related().filter.return_value = (  # NOQA
            mocked_queryset
        )

        mocked_run = MagicMock()
        mocked_run.uid = run_uid
        mocked_run.job.uid = expected_job_uid = "7890"
        mocked_run.job.include_zipfile = True
        mocked_run.job.name = expected_job_name = "mocked_job_name"
        mocked_run.job.bounds_geojson = expected_aoi = "mocked_job_aoi"
        mocked_run.job.extents = expected_extents = [-1, -1, 0, 0]
        mocked_run.job.event = expected_project_name = "mocked_project_name"
        mocked_run.job.description = expected_job_desc = "mocked_job_desc"
        mocked_run.job.projections.all.return_value = [Mock(srid=4326)]

        mocked_run.data_provider_task_records.all.return_value = [mocked_provider_task]
        mocked_provider_task.run = mocked_run

        expected_date = timezone.now().strftime("%Y%m%d")
        file_ext = os.path.splitext(sample_file)[1]

        include_files = {
            expected_stage_preview_file: expected_archive_preview_file,
            expected_stage_file: expected_archive_file,
        }
        include_files.update(expected_license_file)

        expected_metadata = {
            "aoi": expected_aoi,
            "bbox": expected_extents,
            "data_sources": {
                "example_slug": {
                    "copyright": expected_copyright,
                    "description": expected_data_provider_desc,
                    "files": [
                        {
                            "file_path": f"data/{expected_provider_slug}/{sample_file}",
                            "file_ext": file_ext,
                            "full_file_path": os.path.join(stage_dir, expected_provider_slug, sample_file),
                            "projection": "4326",
                        }
                    ],
                    "last_update": expected_last_update,
                    "metadata": expected_metadata_url,
                    "name": expected_provider_task_name,
                    "slug": expected_provider_slug,
                    "type": expected_type,
                    "uid": expected_provider_task_uid,
                    "layers": expected_layers,
                    "level_from": expected_level_from,
                    "level_to": expected_level_to,
                }
            },
            "date": expected_date,
            "description": expected_job_desc,
            "has_elevation": False,
            "has_raster": False,
            "has_vector": True,
            "include_files": include_files,
            "name": expected_job_name,
            "project": expected_project_name,
            "projections": [4326],
            "run_uid": run_uid,
            "url": f"{getattr(settings, 'SITE_URL')}/status/{expected_job_uid}",
        }
        returned_metadata = get_metadata([mocked_provider_task.uid])
        self.maxDiff = None
        self.assertEqual(expected_metadata, returned_metadata)

    def test_get_arcgis_metadata(self):
        example_metadata = {
            "stuff": "test",
            "include_files": "files",
            "data_sources": {"osm": {"files": [{"data": "here", "full_file_path": "here"}]}},
        }
        expected_metadata = {"stuff": "test", "data_sources": {"osm": {"files": [{"data": "here"}]}}}
        self.assertEqual(expected_metadata, get_arcgis_metadata(example_metadata))

    @requests_mock.Mocker()
    def test_get_all_rabbitmq_objects(self, requests_mocker):
        example_api = "http://example/api/"
        queues = "queues"
        expected_queues = {"queue1": {"name": "queue1"}, "queue2": {"name": "queue2"}}
        res1 = {"page_count": 2, "page": 1, "items": [{"name": "queue1"}]}
        res2 = {"page_count": 2, "page": 2, "items": [{"name": "queue2"}]}

        requests_mocker.get(example_api + queues + "?page=1&page_size=100&pagination=true", text=json.dumps(res1))
        requests_mocker.get(example_api + queues + "?page=2&page_size=100&pagination=true", text=json.dumps(res2))
        result = get_all_rabbitmq_objects(example_api, queues)
        self.assertEqual(result, expected_queues)

        with self.assertRaises(Exception):
            requests_mocker.get(example_api + queues + "?page=1&page_size=100&pagination=true", text="ERROR")
            get_all_rabbitmq_objects(example_api, "WRONG")

    @patch("eventkit_cloud.tasks.helpers.get_all_rabbitmq_objects")
    def test_delete_rabbit_objects(self, mock_get_all_rabbitmq_objects):
        example_api = "https://example/api"
        example_vhost = "abcd_vhost"
        example_queues = [
            {"name": "queue1", "consumers": 0, "messages": 0, "vhost": example_vhost},
            {"name": "queue2", "consumers": 1, "messages": 1, "vhost": example_vhost},
        ]
        example_exchanges = [
            {"name": "exchange1", "vhost": example_vhost},
            {"name": "exchange2", "vhost": example_vhost},
        ]

        return_values = {"queues": example_queues, "exchanges": example_exchanges}

        mock_get_all_rabbitmq_objects.side_effect = lambda api, rabbit_class: return_values[rabbit_class]

        # Deletes only the empty queue
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            delete_rabbit_objects(example_api)
            mock_get_all_rabbitmq_objects.assert_called_once_with(example_api, "queues")
            self.assertEquals(requests_mocker.call_count, 1)
            mock_get_all_rabbitmq_objects.reset_mock()

        # Deletes only the empty queue and exchanges
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            requests_mocker.delete(f"{example_api}/exchanges/{example_vhost}/{example_exchanges[0]['name']}")
            requests_mocker.delete(f"{example_api}/exchanges/{example_vhost}/{example_exchanges[1]['name']}")
            delete_rabbit_objects(example_api, rabbit_classes=["queues", "exchanges"])
            mock_get_all_rabbitmq_objects.assert_has_calls(
                [call(example_api, "queues"), call(example_api, "exchanges")]
            )
            self.assertEquals(requests_mocker.call_count, 3)
            mock_get_all_rabbitmq_objects.reset_mock()

        # Deletes all queues
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[1]['name']}")
            delete_rabbit_objects(example_api, force=True)
            mock_get_all_rabbitmq_objects.assert_called_once_with(example_api, "queues")
            self.assertEquals(requests_mocker.call_count, 2)
            mock_get_all_rabbitmq_objects.reset_mock()

    @patch("eventkit_cloud.tasks.helpers.get_all_rabbitmq_objects")
    def test_get_message_count(self, mock_get_all_rabbitmq_objects):
        queue = "queue2"
        expected_queues = [{"name": "queue1"}, {"name": "queue2", "messages": "5"}]
        expected_messages = "5"
        mock_get_all_rabbitmq_objects.return_value = expected_queues
        messages = get_message_count(queue)
        self.assertEqual(messages, expected_messages)

    @patch("builtins.open")
    def get_data_package_manifest(self, mock_open):
        example_name = "example_name"
        example_uid = "97f0d96a-ee1f-482e-9fe8-e6f716ed3144"
        example_file_path = "data/osm_tiles/test-4326-osm_tiles-20201112-u.gpkg"
        example_ignored_file = "ignore/me.txt"
        # TODO: Use lxml tools if installing in the future to make this diff be based on structure not text value.
        expected_xml = f"""<MissionPackageManifest version="2">
   <Configuration>
      <Parameter name="uid" value="{example_uid}"/>
      <Parameter name="name" value="{example_name}"/>
   </Configuration>
   <Contents>
      <Content ignore="false" zipEntry="{example_file_path}">
         <Parameter name="contentType" value="External Native Data"/>
      </Content>
      <Content ignore="true" zipEntry="{example_ignored_file}"/>
      <Content ignore="false" zipEntry="manifest/manifest.xml"/>
   </Contents>
</MissionPackageManifest>"""
        example_metadata = {
            "name": example_name,
            "url": "http://host.docker.internal/status/b4e7e799-8eb6-4d52-98b4-3fcaed619cc9",
            "description": "test",
            "project": "test",
            "projections": [4326],
            "date": "20201112",
            "run_uid": example_uid,
            "data_sources": {
                "osm_tiles": {
                    "uid": "cce7742e-8916-4b69-b5fe-d30baec09199",
                    "slug": "osm_tiles",
                    "name": "OpenStreetMap Tiles",
                    "files": [
                        {
                            "file_path": example_file_path,
                            "full_file_path": f"/{example_file_path}",
                            "file_ext": ".gpkg",
                            "projection": "4326",
                        }
                    ],
                    "type": "raster",
                    "description": "OSM Description",
                    "last_update": None,
                    "metadata": "https://osm.url/tiles/default_pc/{z}/{x}/{y}.png",
                    "copyright": "OpenStreetMap Contributors",
                }
            },
            "bbox": (1, 1, 1.5, 1.5),
            "aoi": '{"type": "FeatureCollection", "crs": {"type": "name", "properties": {"name": "EPSG:4326"}}, '
            '"features": []}',
            "has_raster": True,
            "has_elevation": False,
            "include_files": [example_ignored_file],
        }
        get_data_package_manifest(example_metadata, ignore_files=[example_ignored_file])
        expected_output_file = os.path.join(settings.EXPORT_STAGING_ROOT, str(example_uid), "manifest.xml")
        mock_open.assert_called_once_with(expected_output_file, "w")
        mock_open().__enter__().write.assert_called_once_with(expected_xml)

    @patch("eventkit_cloud.tasks.helpers.set_cache_value")
    @patch("django.db.connection.close")
    def test_update_progress(self, mock_close, mock_set_cache_value):
        uid = "1234"
        estimated = timezone.now()
        update_progress(uid, progress=50, estimated_finish=estimated)
        mock_close.assert_called_once()
        mock_set_cache_value.assert_has_calls(
            [
                call(uid=uid, attribute="progress", model_name="ExportTaskRecord", value=50),
                call(uid=uid, attribute="estimated_finish", model_name="ExportTaskRecord", value=estimated),
            ]
        )

    @patch("eventkit_cloud.tasks.helpers.get_meta")
    def test_find_in_zip(self, mock_get_meta):
        mock_get_meta.return_value = {"srs": 4326}
        zip_filepath = os.path.join(os.path.dirname(__file__), "files/test_zip_1.zip")
        found_files = find_in_zip(
            zip_filepath=zip_filepath,
            stage_dir="example/dir",
            extension="json",
            archive_extension="zip",
            matched_files=[],
            extract=False,
        )
        self.assertEqual(found_files, [f"/vsizip/{zip_filepath}/test_geojson.json"])

    def test_find_in_zip_no_extension(self):
        zip_filepath = os.path.join(os.path.dirname(__file__), "files/test_zip_1.zip")
        found_files = find_in_zip(
            zip_filepath=zip_filepath, stage_dir="example/dir", archive_extension="zip", matched_files=[], extract=False
        )
        self.assertEqual(found_files, [f'/vsizip/{zip_filepath}/test_geojson.json'])

    def test_find_in_zip_no_extension_nested_folder(self):
        zip_filepath = os.path.join(os.path.dirname(__file__), "files/test_zip_2.zip")
        found_files = find_in_zip(
            zip_filepath=zip_filepath, stage_dir="example/dir", archive_extension="zip", matched_files=[], extract=False
        )
        self.assertEqual(found_files, [f"/vsizip/{zip_filepath}/inner/inner_inner/inner_inner_inner/test_geojson.json"])
