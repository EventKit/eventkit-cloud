from mock import Mock, patch, call
from uuid import uuid4
from django.test import TestCase, override_settings
import logging
import requests_mock
from django.conf import settings
import json

from ..convert import Convert

logger = logging.getLogger(__name__)

class TestConvert(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def convert_test(self, api_response):
        self.mock_requests.get(settings.CONVERT_API_URL, text=json.dumps(api_response), status_code=200)
        convert = Convert()
        result = convert.get("18S TJ 97100 03003")
        self.assertIsNotNone(result.get("geometry"))
        self.assertEquals(result.get("type"), "Feature")


    def test_geonames_success(self):
        convert_response = {
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

        self.convert_test(convert_response)
