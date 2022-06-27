from unittest.mock import patch

from django.test import TestCase

from eventkit_cloud.utils.generic import cacheable


class TestGeneric(TestCase):
    @patch("eventkit_cloud.utils.generic.test_cache")
    def test_cacheable(self, mock_cache):
        cached_return_value = "cached_returned_value"
        mock_cache.return_value = cached_return_value

        not_cached_return_value = "not_" "cached_returned_value"

        @cacheable()
        def mock_function():
            return

        cacheable()
