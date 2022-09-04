# -*- coding: utf-8 -*-


import logging
import os
from unittest.mock import MagicMock, Mock, patch

from django.test import TestCase, override_settings
from django.core.cache import cache

from eventkit_cloud.core.helpers import get_cached_model, get_id, get_model_by_params, get_or_update_session
from eventkit_cloud.core.mapped_cache import MappedCache

logger = logging.getLogger(__name__)


class TestMappedCache(TestCase):

    def setUp(self):
        self.username = "test_username"
        self.mapped_cache = MappedCache(self.username)

    def tearDown(self):
        self.mapped_cache.delete_all()

    def test_add(self):
        example_key = "key"
        example_value = "value"
        self.mapped_cache.add(example_key, example_value)
        self.assertCountEqual([example_key], cache.get(self.username))

    def test_set(self):
        example_key = "key"
        example_value = "value"
        self.mapped_cache.add(example_key, example_value)
        self.assertCountEqual([example_key], cache.get(self.username))

        example_value = "new value"
        self.mapped_cache.set(example_key, example_value)
        self.assertCountEqual([example_key], cache.get(self.username))

    def test_delete(self):
        example_key = "key"
        example_value = "value"
        self.mapped_cache.add(example_key, example_value)
        self.assertCountEqual([example_key], cache.get(self.username))

        self.mapped_cache.delete(example_key)
        self.assertCountEqual([], cache.get(self.username))

    def test_delete_all(self):
        example_keys: list = ["key1", "key2", "key3", "key4"]
        i = 0
        for key in example_keys:
            self.mapped_cache.add(key, i)
            ++i
        self.assertCountEqual(example_keys, cache.get(self.username))

        self.mapped_cache.delete_all()
        self.assertCountEqual([], cache.get(self.username))
