import json
import logging

import requests_mock
from django.conf import settings
from django.test import TestCase, override_settings

from eventkit_cloud.utils.geocoding.coordinate_converter import CoordinateConverter

logger = logging.getLogger(__name__)
mockURL = "http://test.test"


@override_settings(GEOCODING_AUTH_URL=None)
class TestConvert(TestCase):
    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        settings.CONVERT_API_URL = mockURL

    def test_convert_success(self):
        convert_response_success = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-112.61869345019069, 50.00105275281522]},
            "properties": {"name": "12UUA8440", "from": "mgrs", "to": "decdeg"},
        }

        self.mock_requests.get(mockURL, text=json.dumps(convert_response_success), status_code=200)
        convert = CoordinateConverter()
        result = convert.get("18S TJ 97100 03003")
        self.assertIsNotNone(result.get("geometry"))
        self.assertEqual(result.get("type"), "Feature")
        properties = result.get("properties")
        geometry = result.get("geometry")
        self.assertIsInstance(properties, dict)
        self.assertIsInstance(geometry, dict)
        self.assertEqual(geometry.get("type"), "Point")
        self.assertIsInstance(geometry.get("coordinates"), list)

    def test_convert_fail(self):
        convert_response_fail = {"properties": {"name": "12UUA844", "from": "mgrs", "to": "decdeg"}}

        with self.assertRaises(Exception):
            self.mock_requests.get(mockURL, text=json.dumps(convert_response_fail), status_code=500)
            CoordinateConverter().get_data()
