# -*- coding: utf-8 -*-
import copy
import logging
from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.test import TransactionTestCase

from eventkit_cloud.utils.services.arcgis import ArcGIS

logger = logging.getLogger(__name__)


class TestArcGIS(TransactionTestCase):

    maxDiff = None
    # @patch("eventkit_cloud.utils.generic.cache")
    def test_get_capabilities(self):
        url = "http://arcgis.test"
        arcgis = ArcGIS(url, None)
        arcgis.session = MagicMock()

        layer_1 = {"id": 1, "type": "Feature Layer", "description": "test", "subLayers": []}
        layer_0 = {"id": 0, "type": "Group Layer", "description": "test", "subLayers": [{"id": 1}]}
        root_doc = {"layers": [{"id": 0}, {"id": 1}]}
        arcgis.session.get().json.side_effect = [root_doc, layer_0, layer_1]

        # Test using just the root url.
        expected_layer_1 = copy.deepcopy(layer_1)
        expected_layer_1["url"] = f"{url}/{str(layer_1['id'])}"
        expected_layer_0 = copy.deepcopy(layer_0)
        expected_layer_0.update({"subLayers": [expected_layer_1], "url": f"{url}/{str(layer_0['id'])}"})
        expected_result = copy.deepcopy(root_doc)
        expected_result["layers"] = [expected_layer_0, expected_layer_1]
        expected_result["url"] = url
        result = arcgis.get_capabilities()
        self.assertEqual(expected_result, result)

        # Test using the root url with a layer defined.
        arcgis = ArcGIS(url, 0)
        arcgis.session = MagicMock()

        layer_1 = {"id": 1, "type": "Feature Layer", "description": "test", "subLayers": []}
        layer_0 = {"id": 0, "type": "Group Layer", "description": "test", "subLayers": [{"id": 1}]}
        arcgis.session.get().json.side_effect = [layer_0, layer_1]

        expected_layer_1 = copy.deepcopy(layer_1)
        expected_layer_1["url"] = f"{url}/{str(layer_1['id'])}"
        expected_result = copy.deepcopy(layer_0)
        expected_result.update({"subLayers": [expected_layer_1], "url": f"{url}/{str(layer_0['id'])}"})
        result = arcgis.get_capabilities()
        self.assertEqual(expected_result, result)
