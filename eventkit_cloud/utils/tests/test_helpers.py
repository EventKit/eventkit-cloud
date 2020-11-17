from unittest.mock import patch

from django.test import TestCase

from eventkit_cloud.utils.helpers import clear_mapproxy_config_cache
from eventkit_cloud.utils.mapproxy import mapproxy_config_keys_index


class TestHelpers(TestCase):
    @patch("eventkit_cloud.utils.helpers.cache")
    def test_clear_mapproxy_config_cache(self, cache_mock):
        mapproxy_config_keys = cache_mock.get_or_set.return_value = {"key-a", "key-b"}
        clear_mapproxy_config_cache()
        cache_mock.get_or_set.assert_called_with(mapproxy_config_keys_index, set())
        cache_mock.delete_many.assert_called_with(list(mapproxy_config_keys))
