from django.conf import settings
import logging
from abc import ABCMeta, abstractmethod, abstractproperty
import requests


logger = logging.getLogger(__name__)


class GeocodeAdapter:
    """
    An abstract class to implement a new geocoding service.  Note that the UI will expect,
    each feature to have a name, countryName, adminName1, adminName2, and the bbox only
    """

    __metaclass__ = ABCMeta

    _properties = ['name', 'province', 'region', 'country']

    def __init__(self, url):
        self.url = url

    @abstractmethod
    def property_map(self):
        """
        This should be to convert a desired property to an existing property (i.e. AdminName2 -> province).
        :return: A dict of the original properties, with the aliased properties appended.
        Example:
          Input:
            {"AdminName2": "Fairfax"}
          Output:
             {"AdminName2": "Fairfax", "province": "Fairfax"}
        """
        pass

    @abstractmethod
    def add_bbox(self, update_url, data):
        """
        This takes an individual search result and tries to update it with a bbox if possible
        :param update_url: The url to check for a bbox
        :param data: A search feature
        :return: The search feature with (if available) the relevant bbox
        """
        pass

    @abstractmethod
    def get_payload(self, query):
        """
        This takes some query (e.g. "Boston"), and returns a dict representing query parameters that a specific api will expect.
        :param query: A string
        :return: A dict of API specific query paramters.
            Input:
                "Something"
            Output:
                {'maxRows': 20, 'username': 'eventkit', 'style': 'full', 'query': "Something"}
        """
        pass

    @abstractmethod
    def create_geojson(self, response):
        """
        This method takes a Requests response, and returns a GeoJSON, the returned geojson will be given as a response,
        to the user, so it should already contain the mapped properties.
        :param response: A Requests.response object.
        :return: A FeatureCollection GeoJSON.

            See GeoNames.create_geojson for an example implementation.
            In general:
                Convert each location to a GeoJSON Feature, by passing the feature, bbox, and/or properties (as a dict)
                  to get_feature.
                Add the Features to a FeatureCollection.
                Return the FeatureCollection GeoJSON
        """
        pass

    def get_data(self, query):
        """
        Handles querying the endpoint and returning a geojson (as a python dict).
        The expectation is that the concrete class will implement `get_payload`.
        :param query: A string.
        :return: A dict representing a geojson.
        """
        payload = self.get_payload(query)
        if not self.url:
            return
        response = requests.get(self.url, params=payload).json()
        assert (isinstance(response, dict))
        return self.create_geojson(response)

    def get_feature(self, feature=None, bbox=None, properties=None):
        """
        Used to prepare a feature.  It can take an original feature or create one from a bbox.  If both a feature AND
        a bbox are used the bbox will be used to update the geometry.

        The concrete class should implement property_map to ensure the information needed for the UI is returned.

        :param feature: A dict representing a geojson feature.
        :param bbox: A list representing a bounding box in EPSG:4326, [west, south, east, north].
        :param properties: A dict of properties and their values.
        :return: A feature with properties mapped.
        """
        if not feature:
            feature = {
                "type": "Feature",
                "geometry": None,
                "properties": None
            }
        if bbox and is_valid_bbox(bbox):
            # testing
            feature['bbox'] = bbox
            feature['geometry'] = self.bbox2polygon(bbox)
        return self.map_properties(feature, properties=properties)

    @staticmethod
    def get_feature_collection(features=None):
        assert (isinstance(features, list))
        max_bbox=None
        for feature in features:
            bbox = feature.get('bbox')
            if bbox:
                max_bbox = expand_bbox(max_bbox, bbox)
        feature_collection = {
            "type": "FeatureCollection",
            "features": features
        }
        if is_valid_bbox(max_bbox):
            feature_collection['bbox'] = max_bbox
        return feature_collection

    @staticmethod
    def bbox2polygon(bbox):
        try:
            (w, s, e, n) = bbox
        except KeyError:
            return
        coordinates = [
            [
                [w, s],
                [e, s],
                [e, n],
                [w, n],
                [w, s]
            ]
        ]
        return {"type": "Polygon",
                "coordinates": coordinates}

    def map_properties(self, feature, properties=None):
        props = properties or feature.get('properties')
        if props:
            for key, value in self.property_map().iteritems():
                props[key] = props.get(value)
        feature['properties'] = props
        return feature


class GeoNames(GeocodeAdapter):

    def get_payload(self, query):
        return {'maxRows': 20, 'username': 'eventkit', 'style': 'full', 'q': query}

    def create_geojson(self, response):
        logger.error(response)
        features = []
        for result in response.get('geonames'):
            feature = self.get_feature(bbox=self.get_bbox(result.pop('bbox', None)), properties=result)
            features += [feature]
        return self.get_feature_collection(features=features)

    def get_bbox(self, bbox=None):
        if not bbox:
            return
        try:
            return [bbox['west'], bbox['south'], bbox['east'], bbox['north']]
        except KeyError:
            return None

    def property_map(self):
        return {"name": "name", "province": "adminName2", "region": "adminName1", "country": "countryName"}

    def add_bbox(self, update_url, data):
        return data


class Pelias(GeocodeAdapter):

    def get_payload(self, query):
        return {'text': query}

    def create_geojson(self, response):
        features = []
        for feature in response.get('features'):
            feature = self.get_feature(feature=feature, bbox=feature.get('bbox'))
            features += [feature]
        return self.get_feature_collection(features=features)

    def property_map(self):
        return {"name": "name", "province": "county", "region": "region", "country": "country"}

    def add_bbox(self, update_url, data):
        # the different gid levels that should be checked for a bbox
        ids = ['neighbourhood_gid', 'locality_gid', 'county_gid', 'region_gid', 'country_gid']
        search_id = ''
        for id in ids:
            gid = data.get(id, data.get('properties', None).get(id, None))
            # use the gid if it exists and its not gid of the data in question
            # (if it is the gid of the data then we should already have a bbox if its available at that level)
            if gid and gid != data.get('gid'):
                search_id = gid
                break

        if search_id:
            response = requests.get(update_url, params={'ids': search_id}).json()
            features = response.get('features', [])
            if len(features):
                feature = features[0]
                bbox = feature.get('bbox', None)
                if bbox:
                    data['bbox'] = bbox
                    data['properties']['bbox'] = bbox
        return data


class Geocode(object):

    _supported_geocoders = {'geonames': GeoNames, 'pelias': Pelias}

    def __init__(self):
        url = getattr(settings, 'GEOCODING_API_URL')
        type = getattr(settings, 'GEOCODING_API_TYPE')
        self.update_url = getattr(settings, 'GEOCODING_UPDATE_URL')
        if not (url and type):
            logger.error("Both a `GEOCODING_API_URL` and a `GEOCODING_API_TYPE` must be defined in the settings.")
            raise Exception('A geocoder configuration was not provided, contact an administrator.')
        self.geocoder = self.get_geocoder(type, url)

    @property
    def map(self):
        return self._supported_geocoders

    def get_geocoder(self, name, url):
        return self.map.get(name.lower())(url)

    def add_bbox(self, data):
        if not self.update_url:
            return data
        return self.geocoder.add_bbox(self.update_url, data)

    def search(self, query):
        return self.geocoder.get_data(query)


def is_valid_bbox(bbox):
    if not isinstance(bbox, list) or len(bbox) != 4:
        return False
    if bbox[0] < bbox[2] and bbox[1] < bbox[3]:
        return True
    else:
        return False


def expand_bbox(original_bbox, new_bbox):
    """
    Takes two bboxes and returns a new bbox containing the original two.
    :param bbox: A list representing [west, south, east, north]
    :param new_bbox: A list representing [west, south, east, north]
    :return: A list containing the two original lists.
    """
    if not original_bbox:
        original_bbox = list(new_bbox)
        return original_bbox
    original_bbox[0] = min(new_bbox[0], original_bbox[0])
    original_bbox[1] = min(new_bbox[1], original_bbox[1])
    original_bbox[2] = max(new_bbox[2], original_bbox[2])
    original_bbox[3] = max(new_bbox[3], original_bbox[3])
    return original_bbox
