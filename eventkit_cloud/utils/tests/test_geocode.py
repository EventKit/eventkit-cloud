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

    @override_settings(GEOCODING_API_URL="http://pelias.url/",
                       GEOCODING_API_TYPE="pelias")
    def test_pelias_success(self):
        pelias_response = {"geocoding": {"version": "0.2", "attribution": "127.0.0.1:/v1/attribution",
                                         "query": {"text": "Boston", "size": 10, "private": False,
                                                   "lang": {"name": "English", "iso6391": "en", "iso6393": "eng",
                                                            "defaulted": False}, "querySize": 20},
                                         "engine": {"name": "Pelias", "author": "Mapzen", "version": "1.0"},
                                         "timestamp": 1499345535894}, "type": "FeatureCollection", "features": [
            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-71.048611, 42.355492]},
             "properties": {"id": "85950361", "gid": "whosonfirst:locality:85950361", "layer": "locality",
                            "source": "whosonfirst", "source_id": "85950361", "name": "Boston", "confidence": 0.947,
                            "accuracy": "centroid", "country": "United States",
                            "country_gid": "whosonfirst:country:85633793", "country_a": "USA",
                            "region": "Massachusetts", "region_gid": "whosonfirst:region:85688645", "region_a": "MA",
                            "county": "Suffolk County", "county_gid": "whosonfirst:county:102084423",
                            "localadmin": "Boston", "localadmin_gid": "whosonfirst:localadmin:404476573",
                            "locality": "Boston", "locality_gid": "whosonfirst:locality:85950361",
                            "label": "Boston, MA, USA"},
             "bbox": [-71.1912490997, 42.227911131, -70.9227798807, 42.3969775021]},
            {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-71.078909, 42.31369]},
             "properties": {"id": "404476573", "gid": "whosonfirst:localadmin:404476573", "layer": "localadmin",
                            "source": "whosonfirst", "source_id": "404476573", "name": "Boston", "confidence": 0.947,
                            "accuracy": "centroid", "country": "United States",
                            "country_gid": "whosonfirst:country:85633793", "country_a": "USA",
                            "region": "Massachusetts", "region_gid": "whosonfirst:region:85688645", "region_a": "MA",
                            "county": "Suffolk County", "county_gid": "whosonfirst:county:102084423",
                            "localadmin": "Boston", "localadmin_gid": "whosonfirst:localadmin:404476573",
                            "label": "Boston, MA, USA"}, "bbox": [-71.191155, 42.22788, -70.9235839844, 42.397398]}, ],
                           "bbox": [-85.311933, 7.91601, 126.27843, 52.9924044449]}

        self.geocode_test(pelias_response)

    @override_settings(GEOCODING_API_URL="",
                       GEOCODING_API_TYPE="")
    def test_geocode_error(self):
        response = {}

        with self.assertRaises(Exception):
            self.geocode_test(response)

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