# -*- coding: utf-8 -*-
import copy
import logging
from unittest.mock import MagicMock

from django.test import TransactionTestCase

from eventkit_cloud.utils.services.arcgis import ArcGIS

logger = logging.getLogger(__name__)


class TestArcGIS(TransactionTestCase):
    maxDiff = None

    def test_get_capabilities(self):
        url = "http://arcgis.test"
        arcgis = ArcGIS(url, None)
        arcgis.session = MagicMock()

        layer_1 = {
            "id": 1,
            "type": "Feature Layer",
            "description": "test",
            "subLayers": [],
            "minScale": 10000,
            "maxScale": 0,
        }
        layer_0 = {
            "id": 0,
            "type": "Group Layer",
            "description": "test",
            "subLayers": [{"id": 1}],
            "minScale": 20000,
            "maxScale": 5000,
        }
        root_doc = {"layers": [{"id": 0}, {"id": 1}]}
        arcgis.session.get().json.side_effect = [root_doc, layer_0, layer_1]

        # Test using just the root url.
        expected_layer_1 = copy.deepcopy(layer_1)
        expected_layer_1.update({"url": f"{url}/{str(layer_1['id'])}", "level": 16})
        expected_layer_0 = copy.deepcopy(layer_0)
        expected_layer_0.update({"subLayers": [expected_layer_1], "url": f"{url}/{str(layer_0['id'])}", "level": 15})
        expected_result = copy.deepcopy(root_doc)
        expected_result["level"] = 10
        expected_result["layers"] = [expected_layer_0, expected_layer_1]
        expected_result["url"] = url
        result = arcgis.get_capabilities()
        self.assertEqual(expected_result, result)

        # Test using the root url with a layer defined.
        arcgis = ArcGIS(url, 0)
        arcgis.session = MagicMock()

        layer_1 = {
            "id": 1,
            "type": "Feature Layer",
            "description": "test",
            "subLayers": [],
            "minScale": 10000,
            "maxScale": 0,
        }
        layer_0 = {
            "id": 0,
            "type": "Group Layer",
            "description": "test",
            "subLayers": [{"id": 1}],
            "minScale": 20000,
            "maxScale": 5000,
        }
        arcgis.session.get().json.side_effect = [layer_0, layer_1]

        expected_layer_1 = copy.deepcopy(layer_1)
        expected_layer_1.update({"url": f"{url}/{str(layer_1['id'])}", "level": 16})
        expected_result = copy.deepcopy(layer_0)
        expected_result.update({"subLayers": [expected_layer_1], "url": f"{url}/{str(layer_0['id'])}", "level": 15})
        result = arcgis.get_capabilities()
        self.assertEqual(expected_result, result)
