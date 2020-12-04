from unittest.mock import patch

from django.core.cache import caches
from django.test import TestCase

from eventkit_cloud.utils.fallback_cache import get_cache


class TestFallbackCache(TestCase):
    def test_get_cache(self):
        with patch.object(caches.__getitem__("primary_cache"), "get") as mock_get_cache:
            # Test that we use the primary cache.
            mock_get_cache.return_value = True
            cache = get_cache()
            self.assertEqual(cache, caches["primary_cache"])

            # Test that we use the fallback cache.
            mock_get_cache.return_value = False
            cache = get_cache()
            self.assertEqual(cache, caches["fallback_cache"])
