# -*- coding: utf-8 -*-

import json
import logging
import requests_mock
import signal

from django.test import TestCase
from django.conf import settings
from django.utils import timezone
from mock import patch, call, Mock, MagicMock, ANY
import os
import signal
from eventkit_cloud.tasks.helpers import get_style_files, get_file_paths, get_last_update, get_metadata_url, \
    get_osm_last_update, cd, get_arcgis_metadata, get_metadata, get_message_count, \
    get_all_rabbitmq_objects, delete_rabbit_objects, get_download_filename
from eventkit_cloud.tasks.enumerations import TaskStates

from eventkit_cloud.tasks.helpers import progressive_kill
from unittest import skip

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

    @patch('eventkit_cloud.tasks.helpers.sleep')
    @patch('eventkit_cloud.tasks.helpers.os')
    def test_progessive_kill(self, mock_os, mock_sleep):
        pid = 1
        # Test no PID.
        mock_os.kill.side_effect = [OSError()]
        progressive_kill(pid)
        mock_os.reset_mock

        # Test kill with SIGTERM
        mock_os.kill.side_effect = [None, OSError()]
        progressive_kill(pid)
        mock_os.kill.has_calls([call(pid, signal.SIGTERM)])
        mock_os.reset_mock

        # Test kill with SIGKILL
        mock_os.kill.side_effect = [None, None]
        progressive_kill(pid)
        mock_os.kill.has_calls([call(pid, signal.SIGTERM), call(pid, signal.SIGTERM)])
        mock_os.reset_mock

    def test_get_style_files(self):
        for file in get_style_files():
            self.assertTrue(os.path.isfile(file))

    def test_get_file_paths(self):
        self.assertTrue(os.path.abspath(__file__) in get_file_paths(os.path.dirname(__file__)))

    @patch('eventkit_cloud.tasks.helpers.get_osm_last_update')
    def test_get_last_update(self, mock_get_osm_last_update):
        test_url = "https://test"
        test_type = "osm"
        test_slug = "slug"
        get_last_update(test_url, test_type, cert_var=test_slug)
        mock_get_osm_last_update.assert_called_once_with(test_url, cert_var=test_slug)

    @patch('eventkit_cloud.tasks.helpers.auth_requests')
    def test_get_osm_last_update(self, mock_auth_requests):
        test_url = "https://test/interpreter"
        test_slug = "slug"
        expected_url = "https://test/timestamp"
        expected_time = "2017-12-29T13:09:59Z"

        mock_auth_requests.get.return_value.content.decode.return_value = expected_time
        returned_time = get_osm_last_update(test_url, cert_var=test_slug)
        mock_auth_requests.get.assert_called_once_with(expected_url, cert_var=test_slug)
        self.assertEqual(expected_time, returned_time)

        mock_auth_requests.get.side_effect = Exception("FAIL")
        returned_time = get_osm_last_update(test_url, cert_var=test_slug)
        self.assertIsNone(returned_time)

    def test_get_metadata_url(self):
        test_url = "https://test"

        expected_value = "https://test?request=GetCapabilities"
        returned_value = get_metadata_url(test_url, 'wcs')
        self.assertEqual(expected_value, returned_value)

        returned_value = get_metadata_url(test_url, 'arcgis-raster')
        self.assertEqual(test_url, returned_value)

    @patch('eventkit_cloud.tasks.helpers.get_cached_model')
    def test_get_download_filename(self, mock_get_cached_model):
        name = "test_datapack"
        date = timezone.now()
        ext = ".gpkg"
        descriptors = ["osm"]
        data_provider_slug = "osm"
        label = "testlabel"

        expected_date = date.strftime("%Y%m%d")
        expected_descriptors_string = "-".join(filter(None, descriptors))

        mocked_data_provider = MagicMock()
        mocked_data_provider.label = "testlabel"
        mock_get_cached_model.return_value = mocked_data_provider

        expected_value = f"{name}-{expected_descriptors_string}-{label}-{expected_date}{ext}"
        returned_value = get_download_filename(
            name=name,
            time=date,
            ext=ext,
            additional_descriptors=descriptors,
            data_provider_slug=data_provider_slug
        )

        self.assertEqual(expected_value, returned_value)

    @patch('eventkit_cloud.tasks.helpers.get_download_filename')
    @patch('os.path.isfile')
    @patch('eventkit_cloud.tasks.helpers.create_license_file')
    @patch('eventkit_cloud.tasks.helpers.get_metadata_url')
    @patch('eventkit_cloud.tasks.helpers.get_last_update')
    @patch('eventkit_cloud.tasks.helpers.DataProvider')
    @patch('eventkit_cloud.tasks.helpers.DataProviderTaskRecord')
    def test_get_metadata(self, mock_DataProviderTaskRecord, mock_DataProvider, mock_get_last_update,
                          mock_get_metadata_url, mock_create_license_file, mock_isfile, mock_get_download_filename):
        run_uid = '1234'
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

        mock_create_license_file.return_value = expected_license_file = "/license.txt"
        mock_isfile.return_value = True
        mock_get_metadata_url.return_value = expected_metadata_url = "https://some.url/metadata"
        # Fill out the behavior for mocked ExportRun by adding a provider task with
        # subtasks for each file in all_file_list

        mock_get_last_update.return_value = expected_last_update = "2018-10-29T04:35:02Z\n"
        mocked_provider_subtasks = []
        sample_file = 'F1.gpkg'
        for fname in [sample_file]:
            mps = MagicMock()
            mps.result.filename = fname
            mps.status = TaskStates.COMPLETED.value
            mocked_provider_subtasks.append(mps)

        mocked_provider_task = MagicMock()
        mocked_provider_task.name = expected_provider_task_name = "example_name"
        mocked_provider_task.status = TaskStates.COMPLETED.value
        mocked_provider_task.provider.slug = expected_provider_slug = 'example_slug'
        mocked_provider_task.tasks.all.return_value = mocked_provider_subtasks
        mocked_provider_task.uid = expected_provider_task_uid = '5678'
        mock_DataProviderTaskRecord.objects.get.return_value = mocked_provider_task

        mocked_data_provider = MagicMock()
        mocked_data_provider.slug = expected_provider_slug
        mocked_data_provider.export_provider_type.type_name = 'osm'
        mocked_data_provider.service_copyright = expected_copyright = "mocked_copyright"
        mocked_data_provider.config = F"cert_var: {expected_provider_slug}"

        mocked_data_provider.service_description = expected_data_provider_desc = 'example_description'
        mock_DataProvider.objects.get.return_value = mocked_data_provider

        mocked_run = MagicMock()
        mocked_run.uid = run_uid
        mocked_run.job.uid = expected_job_uid = '7890'
        mocked_run.job.include_zipfile = True
        mocked_run.job.name = expected_job_name = 'mocked_job_name'
        mocked_run.job.bounds_geojson = expected_aoi = 'mocked_job_aoi'
        mocked_run.job.extents = expected_extents = [-1, -1, 0, 0]
        mocked_run.job.event = expected_project_name = 'mocked_project_name'
        mocked_run.job.description = expected_job_desc = 'mocked_job_desc'

        mocked_run.provider_tasks.all.return_value = [mocked_provider_task]
        mocked_provider_task.run = mocked_run

        expected_date = timezone.now().strftime("%Y%m%d")
        split_file = os.path.splitext(sample_file)

        expected_download_filename = "{}-{}-{}{}".format(split_file[0],
                                                        expected_provider_slug,
                                                        expected_date,
                                                        split_file[1]
                                                        )
        mock_get_download_filename.return_value = expected_download_filename

        expected_metadata = {
            "aoi": expected_aoi,
            "bbox": expected_extents,
            "data_sources": {
                "example_slug": {
                    "copyright": expected_copyright,
                    "description": expected_data_provider_desc,
                    "files": [{"file_path": "data/{}/{}-{}-{}{}".format(expected_provider_slug, split_file[0],
                                                                        expected_provider_slug, expected_date,
                                                                        split_file[1]),
                               "file_ext": split_file[1],
                               "full_file_path": os.path.join(stage_dir, expected_provider_slug,
                                                              sample_file),
                               }],
                    "last_update": expected_last_update,
                    "metadata": expected_metadata_url,
                    "name": expected_provider_task_name,
                    "slug": expected_provider_slug,
                    "type": "osm",
                    "uid": expected_provider_task_uid
                }
            },
            "date": expected_date,
            "description": expected_job_desc,
            "has_elevation": False,
            "has_raster": False,
            "include_files": [
                os.path.join(stage_dir, expected_provider_slug, 'preview.jpg'),
                os.path.join(stage_dir, expected_provider_slug, sample_file),
                expected_license_file,
            ],
            "name": expected_job_name,
            "project": expected_project_name,
            "projections": [],
            "run_uid": run_uid,
            "url": "{}/status/{}".format(getattr(settings, 'SITE_URL'), expected_job_uid)
        }
        returned_metadata = get_metadata(mocked_provider_task.uid)
        self.maxDiff = None
        self.assertEqual(expected_metadata, returned_metadata)

    def test_get_arcgis_metadata(self):
        example_metadata = {
            'stuff': 'test',
            'include_files': 'files',
            'data_sources': {
                'osm': {
                    'files': [
                        {
                            'data': 'here',
                            'full_file_path': 'here'
                        }
                    ]
                }
            }
        }
        expected_metadata = {
            'stuff': 'test',
            'data_sources': {
                'osm':  {
                    'files': [
                        {
                            'data': 'here',
                        }
                    ]
                }
            }
        }
        self.assertEqual(expected_metadata, get_arcgis_metadata(example_metadata))

    @requests_mock.Mocker()
    def test_get_all_rabbitmq_objects(self, requests_mocker):
        example_api = "http://example/api/"
        queues = "queues"
        expected_queues = [{"name": "queue1"}, {"name": "queue2"}]
        res1 = {"page_count": 2, "page": 1, "items": [{"name": "queue1"}]}
        res2 = {"page_count": 2, "page": 2, "items": [{"name": "queue2"}]}

        requests_mocker.get(example_api + queues + "?page=1&page_size=100&pagination=true", text=json.dumps(res1))
        requests_mocker.get(example_api + queues + "?page=2&page_size=100&pagination=true", text=json.dumps(res2))
        result = get_all_rabbitmq_objects(example_api, queues)
        self.assertEqual(result, expected_queues)

        with self.assertRaises(Exception):
            requests_mocker.get(example_api + queues + "?page=1&page_size=100&pagination=true", text="ERROR")
            get_all_rabbitmq_objects(example_api, "WRONG")

    @patch('eventkit_cloud.tasks.helpers.get_all_rabbitmq_objects')
    def test_delete_rabbit_objects(self, mock_get_all_rabbitmq_objects):
        example_api = "https://example/api"
        example_vhost = "abcd_vhost"
        example_queues = [{"name": "queue1", "consumers": 0, "messages": 0, "vhost": example_vhost},
                          {"name": "queue2", "consumers": 1, "messages": 1, "vhost": example_vhost}]
        example_exchanges = [{"name": "exchange1", "vhost": example_vhost},
                             {"name": "exchange2", "vhost": example_vhost}]

        return_values = {'queues': example_queues, 'exchanges': example_exchanges}

        mock_get_all_rabbitmq_objects.side_effect = lambda api, rabbit_class: return_values[rabbit_class]

        # Deletes only the empty queue
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            delete_rabbit_objects(example_api)
            mock_get_all_rabbitmq_objects.assert_called_once_with(example_api, 'queues')
            self.assertEquals(requests_mocker.call_count, 1)
            mock_get_all_rabbitmq_objects.reset_mock()

        # Deletes only the empty queue and exchanges
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            requests_mocker.delete(f"{example_api}/exchanges/{example_vhost}/{example_exchanges[0]['name']}")
            requests_mocker.delete(f"{example_api}/exchanges/{example_vhost}/{example_exchanges[1]['name']}")
            delete_rabbit_objects(example_api, rabbit_classes=['queues', 'exchanges'])
            mock_get_all_rabbitmq_objects.assert_has_calls([call(example_api, 'queues'), call(example_api, 'exchanges')])
            self.assertEquals(requests_mocker.call_count, 3)
            mock_get_all_rabbitmq_objects.reset_mock()

        # Deletes all queues
        with requests_mock.Mocker() as requests_mocker:
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[0]['name']}")
            requests_mocker.delete(f"{example_api}/queues/{example_vhost}/{example_queues[1]['name']}")
            delete_rabbit_objects(example_api, force=True)
            mock_get_all_rabbitmq_objects.assert_called_once_with(example_api, 'queues')
            self.assertEquals(requests_mocker.call_count, 2)
            mock_get_all_rabbitmq_objects.reset_mock()


    @patch('eventkit_cloud.tasks.helpers.get_all_rabbitmq_objects')
    def test_get_message_count(self, mock_get_all_rabbitmq_objects):
        queue = "queue2"
        expected_queues = [{"name": "queue1"}, {"name": "queue2", "messages": "5"}]
        expected_messages = "5"
        mock_get_all_rabbitmq_objects.return_value = expected_queues
        messages = get_message_count(queue)
        self.assertEqual(messages, expected_messages)
