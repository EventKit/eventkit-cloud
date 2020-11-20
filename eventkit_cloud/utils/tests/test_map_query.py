# -*- coding: utf-8 -*-
import logging

from eventkit_cloud.utils.map_query import ArcGISQuery
from unittest.mock import Mock
from django.test import TestCase
import json

logger = logging.getLogger(__name__)


class TestMapQuery(TestCase):
    def test_get_arcgis_geojson(self):
        layer_name = "test_layer"
        object_id = 10
        date = "10/10/10"
        arcgis_result = {
            "results": [{"layerId": 0, "layerName": layer_name, "attributes": {"OBJECTID": object_id, "date": date}}]
        }
        expected_result = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": None,
                    "properties": {"OBJECTID": object_id, "date": date, "layerId": 0, "layerName": layer_name},
                    "id": 10,
                }
            ],
        }

        response = Mock(content=json.dumps(arcgis_result))

        map_query = ArcGISQuery()
        result = map_query.get_geojson(response)
        self.assertDictEqual(json.loads(result.content), expected_result)
