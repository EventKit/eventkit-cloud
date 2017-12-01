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

    @override_settings(GEOCODING_API_URL="http://geonames.url/",
                       GEOCODING_API_TYPE="geonames",
                       GEOCODING_UPDATE_URL='http://geonames.url/fake-update')
    def test_geonames_add_bbox(self):
        in_result = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102.18947, 17.77036]},
            "properties": {"id": "1608462", "gid": "geonames:locality:1608462", "layer": "locality",
                           "source": "geonames", "source_id": "1608462", "name": "Nam Som", "confidence": 0.957,
                           "accuracy": "centroid", "country": "Thailand", "country_gid": "whosonfirst:country:85632293",
                           "country_a": "THA", "region": "Udon Thani", "region_gid": "whosonfirst:region:85678869",
                           "county": "Nam Som", "county_gid": "whosonfirst:county:1108731585", "locality": "Nam Som",
                           "locality_gid": "geonames:locality:1608462", "label": "Nam Som, Thailand"
            }
        }
        geocode = Geocode()
        result = geocode.add_bbox(in_result)
        self.assertEquals(result, in_result)



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

    @override_settings(GEOCODING_API_URL="http://pelias.url/",
                       GEOCODING_API_TYPE="pelias",
                       GEOCODING_UPDATE_URL='http://pelias.url/place')
    def test_pelias_add_bbox(self):
        in_result = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102.18947, 17.77036]},
            "properties": {"id": "1608462", "gid": "geonames:locality:1608462", "layer": "locality",
                "source": "geonames", "source_id": "1608462", "name": "Nam Som", "confidence": 0.957,
                "accuracy": "centroid", "country": "Thailand", "country_gid": "whosonfirst:country:85632293",
                "country_a": "THA", "region": "Udon Thani", "region_gid": "whosonfirst:region:85678869",
                "county": "Nam Som", "county_gid": "whosonfirst:county:1108731585", "locality": "Nam Som",
                "locality_gid": "geonames:locality:1608462", "label": "Nam Som, Thailand"
            }
        }

        api_response = {
            "geocoding": {
                "version": "0.2",
                "attribution": "/v1/attribution",
                "query": {
                    "ids": [{"source": "whosonfirst", "layer": "county", "id": "1108731585"}],
			        "private": False,
			        "lang": {"name": "English", "iso6391": "en", "iso6393": "eng", "defaulted": False}

                },
		        "engine": { "name": "Pelias", "author": "Mapzen", "version": "1.0" },
                "timestamp": 1510925466405
	        },
	        "type": "FeatureCollection",
	        "features": [
                { "type": "Feature", "geometry": {
				    "type": "Point",
				    "coordinates": [102.227634, 17.743244]
			    },
			    "properties": { "id": "1108731585", "gid": "whosonfirst:county:1108731585", "layer": "county",
                    "source": "whosonfirst", "source_id": "1108731585", "name": "Nam Som", "accuracy": "centroid",
                    "country": "Thailand", "country_gid": "whosonfirst:country:85632293", "country_a": "THA",
                    "region": "Udon Thani", "region_gid": "whosonfirst:region:85678869", "county": "Nam Som",
                    "county_gid": "whosonfirst:county:1108731585", "label": "Nam Som, Thailand"
			    },
			    "bbox": [102.020749821, 17.6291659858, 102.33623593, 17.8795015544]
		        }
	        ],
	        "bbox": [102.020749821, 17.6291659858, 102.33623593, 17.8795015544]
        }
        self.mock_requests.get(settings.GEOCODING_UPDATE_URL, text=json.dumps(api_response), status_code=200)
        expected_bbox = api_response.get('bbox')
        geocode = Geocode()
        result = geocode.add_bbox(in_result)
        self.assertEquals(result.get('type'), 'Feature')
        self.assertEquals(result.get('bbox'), expected_bbox)
        self.assertEquals(result.get('properties').get('bbox'), expected_bbox)

    @override_settings(GEOCODING_API_URL="http://pelias.url/",
                       GEOCODING_API_TYPE="pelias",
                       GEOCODING_UPDATE_URL="")
    def test_geocode_no_update_url(self):
        in_result = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102.18947, 17.77036]},
            "properties": {"id": "1608462", "gid": "geonames:locality:1608462", "layer": "locality",
                           "source": "geonames", "source_id": "1608462", "name": "Nam Som", "confidence": 0.957,
                           "accuracy": "centroid", "country": "Thailand", "country_gid": "whosonfirst:country:85632293",
                           "country_a": "THA", "region": "Udon Thani", "region_gid": "whosonfirst:region:85678869",
                           "county": "Nam Som", "county_gid": "whosonfirst:county:1108731585", "locality": "Nam Som",
                           "locality_gid": "geonames:locality:1608462", "label": "Nam Som, Thailand"
                           }
        }
        geocode = Geocode()
        result = geocode.add_bbox(in_result)
        self.assertEquals(result, in_result)

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