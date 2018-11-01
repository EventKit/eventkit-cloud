# -*- coding: utf-8 -*-

from django.test import TestCase
from mock import patch

from eventkit_cloud.tasks.models import ExportTaskRecord
from eventkit_cloud.tasks import get_cache_value, get_cache_key, set_cache_value


class TestTasks(TestCase):

    @patch('eventkit_cloud.tasks.apps')
    def test_get_cache_key(self, mock_apps):
        uid = 'test_uid'
        attribute = 'progress'
        model_name = 'ExportTaskRecord'
        expected_cache_key = "{}.{}.{}".format('ExportTaskRecord', uid, attribute)

        mock_apps.return_value = ExportTaskRecord
        cache_key = get_cache_key(uid=uid, attribute=attribute, model_name=model_name)
        self.assertEqual(expected_cache_key, cache_key)

        etr = ExportTaskRecord(uid=uid)
        cache_key = get_cache_key(obj=etr, attribute=attribute)
        self.assertEqual(expected_cache_key, cache_key)

        invalid_attribute = 'some_attribute'
        with self.assertRaises(Exception):
            get_cache_key(uid=uid, attribute=invalid_attribute, model_name=model_name)

        with self.assertRaises(Exception):
            get_cache_key(uid=None, attribute=attribute, model_name=model_name)

    @patch('eventkit_cloud.tasks.get_cache_key')
    @patch('eventkit_cloud.tasks.cache')
    def test_get_cache_value(self, mock_cache, mock_get_cache_key):
        expected_value = "some_value"
        uid = 'test_uid'
        attribute = 'progress'
        model_name = 'ExportTaskRecord'
        default = 0
        etr = ExportTaskRecord(uid=uid)
        cache_key = "{}.{}.{}".format('ExportTaskRecord', uid, attribute)
        mock_get_cache_key.return_value = cache_key

        mock_cache.get.return_value = expected_value
        cached_value = get_cache_value(obj=etr, attribute=attribute, uid=uid, model_name=model_name, default=0)
        self.assertEquals(expected_value, cached_value)
        mock_get_cache_key.assert_called_once_with(obj=etr, attribute=attribute, uid=uid, model_name=model_name)
        mock_cache.get.assert_called_once_with(cache_key, default)

    @patch('eventkit_cloud.tasks.get_cache_key')
    @patch('eventkit_cloud.tasks.cache')
    def test_set_cache_value(self, mock_cache, mock_get_cache_key):
        value = "some_value"
        attribute = 'progress'
        model_name = 'ExportTaskRecord'
        uid = 'test_uid'
        etr = ExportTaskRecord(uid=uid)
        expiration = 1
        cache_key = "{}.{}.{}".format('ExportTaskRecord', uid, attribute)
        mock_get_cache_key.return_value = cache_key

        set_cache_value(obj=etr, attribute=attribute, uid=uid, model_name=model_name, value=value, expiration=1)
        mock_get_cache_key.assert_called_once_with(obj=etr, attribute=attribute, uid=uid, model_name=model_name)
        mock_cache.set.assert_called_once_with(cache_key, value, timeout=1)
