import unittest
from eventkit_cloud.utils.stats.geomutils import get_estimate_cache_key


class MyTestCase(unittest.TestCase):
    def test_job_validates_estimates_by_cached_hash(self):
        cache_key_1 = get_estimate_cache_key(bbox=(1, 2, 3), srs='1234', min_zoom=2, max_zoom=10, slug='osm')
        cache_key_2 = get_estimate_cache_key(bbox=(1, 2, 3), srs='1234', min_zoom=2, max_zoom=10, slug='osm')
        self.assertEqual(cache_key_1, cache_key_2)


if __name__ == '__main__':
    unittest.main()
