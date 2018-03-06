from mock import Mock, patch, call
from uuid import uuid4
from django.test import TestCase, override_settings
import logging
import requests_mock
from django.conf import settings
import json

from ..convert import Convert

logger = logging.getLogger(__name__)
mockURL = "http://192.168.20.1"

class TestConvert(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)
        
        settings.CONVERT_API_URL = mockURL

    def convert_test_success(self, api_response):
        
        self.mock_requests.get(mockURL, text=json.dumps(api_response), status_code=200)
        convert = Convert()
        result = convert.get("18S TJ 97100 03003")
        self.assertIsNotNone(result.get("geometry"))
        self.assertEquals(result.get("type"), "Feature")
        properties = result.get("properties")
        geometry = result.get("geometry")
        self.assertIsInstance(properties, dict)
        self.assertIsInstance(geometry, dict)
        self.assertEquals(geometry.get("type"), "Point")
        self.assertIsInstance(geometry.get("coordinates"), list)

    def test_convert_success(self):
        convert_response_success = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                -112.61869345019069,
                50.00105275281522
                ]
            },
            "properties": {
                "name": "12UUA8440",
                "from": "mgrs",
                "to": "decdeg"
            }        
        }

        self.convert_test_success(convert_response_success)

    def convert_test_fail(self, api_response):
        self.mock_requests.get(mockURL, text=json.dumps(api_response), status_code=200)
        convert = Convert()
        result = convert.get("12UUA844")
        self.assertIsNone(result.get("geometry"))
        properties = result.get("properties")
        self.assertIsInstance(properties, dict)

    def test_convert_fail(self):
        convert_response_fail = {
            "properties": {
                "name": "12UUA844",
                "from": "mgrs",
                "to": "decdeg"
            }        
        }

        self.convert_test_fail(convert_response_fail)

