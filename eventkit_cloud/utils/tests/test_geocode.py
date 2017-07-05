from mock import Mock, patch, call
from uuid import uuid4
from django.test import TestCase, override_settings
import logging
import requests_mock
from django.conf import settings
import json

from ..geocode import Geocode, GeocodeAdapter, expand_bbox, is_valid_bbox

logger = logging.getLogger(__name__)

class TestGeoCode(TestCase):

    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

    def geocode_test(self, api_response):
        self.mock_requests.get(settings.GEOCODING_API_URL, text=json.dumps(api_response), status_code=200)
        geocode = Geocode()
        result = geocode.search("test")
        self.assertIsNotNone(result.get("features"))
        self.assertEquals(result.get("type"), "FeatureCollection")
        self.assertIsInstance(result.get("bbox"), list)
        for feature in result.get("features"):
            self.assertIsInstance(feature.get("bbox"), list)
            properties = feature.get("properties")
            self.assertIsInstance(properties, dict)
            self.assertIsNotNone(feature.get('geometry'))
            for property in GeocodeAdapter._properties:
                self.assertTrue(property in properties)

    @override_settings(GEOCODING_API_URL="http://geonames.url/",
                       GEOCODING_API_TYPE="geonames")
    def test_geonames_success(self):
        geonames_response = {
            "totalResultsCount": 2786,
            "geonames": [{
                "countryName": "United States",
                "name": "Boston",
                "bbox": {
                    "west": -71.191155,
                    "accuracyLevel": 10,
                    "east": -70.748802,
                    "north": 42.40082,
                    "south": 42.22788
                },
                "adminName5": "",
                "adminName2": "Suffolk County",
                "adminName3": "City of Boston",
                "adminName1": "Massachusetts",
                "countryCode": "US"
            }, {
                "countryName": "United Kingdom",
                "name": "Boston",
                "bbox": {
                    "west": -0.07844180129338765,
                    "accuracyLevel": 10,
                    "east": 0.02037330885294458,
                    "north": 53.00181078171916,
                    "south": 52.94756432927841
                },
                "adminName4": "",
                "adminName5": "",
                "adminName2": "Lincolnshire",
                "adminName3": "Boston District",
                "adminName1": "England",
                "countryCode": "GB"
            }
            ]
        }

        self.geocode_test(geonames_response)

    def test_expand_bbox(self):
        original_bbox = [-1,-1,1,1]
        new_bbox = [0,0,2,2]
        expected_result = [-1,-1,2,2]

        result = expand_bbox(original_bbox, new_bbox)
        assert(expected_result, result)

        original_bbox = None
        new_bbox = [0, 0, 2, 2]
        expected_result = new_bbox

        result = expand_bbox(original_bbox, new_bbox)
        assert (expected_result, result)

    def test_is_valid_bbox(self):
        # test valid
        bbox = [0,0,1,1]
        self.assertTrue(is_valid_bbox(bbox))

        # test not valid
        bbox = [1, 1, 0, 2]
        self.assertFalse(is_valid_bbox(bbox))

        # test not valid
        bbox = [1, 1, 2, 0]
        self.assertFalse(is_valid_bbox(bbox))

        # test not valid
        bbox = None
        self.assertFalse(is_valid_bbox(bbox))

        # test not valid
        bbox = {}
        self.assertFalse(is_valid_bbox(bbox))

        # test not valid
        bbox = [0,0,1]
        self.assertFalse(is_valid_bbox(bbox))