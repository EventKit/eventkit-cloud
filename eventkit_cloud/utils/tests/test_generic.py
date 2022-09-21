from django.test import TestCase

from eventkit_cloud.feature_selection.feature_selection import slugify
from eventkit_cloud.utils.generic import serialize_arguments
from eventkit_cloud.utils.services.arcgis import ArcGIS


class TestGeneric(TestCase):
    def test_serialize_arguments(self):

        self.assertEqual(serialize_arguments(None, "test"), "test")
        self.assertEqual(serialize_arguments(None, slugify), "slugify")
        arcgis = ArcGIS(service_url="http://site.test", layer=None)
        self.assertEqual(serialize_arguments(arcgis, "service_url"), "http://site.test")
        self.assertEqual(serialize_arguments(arcgis, ArcGIS), "ArcGIS")
