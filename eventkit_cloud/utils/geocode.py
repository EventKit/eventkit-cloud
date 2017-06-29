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
    def get_data(self, url):
        pass

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
    def get_feature(self, bbox=None):
        feature = {
            "type": "Feature",
            "geometry": None,
            "properties": None
        }
        if bbox:
            feature['bbox'] = bbox
            feature['geometry'] = self.bbox2polygon(bbox)
        return feature

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


class GeoNames(GeocodeAdapter):

    def get_data(self, query):
        payload = {'maxRows': 20, 'username': 'eventkit', 'style': 'full', 'q': query}
        if not self.url:
            return
        response = requests.get(self.url, params=payload).json()
        assert (isinstance(response, dict))
        features = []
        for result in response.get('geonames'):
            feature = self.get_feature(bbox=self.get_bbox(result.pop('bbox', None)))
            feature['properties'] = self.property_map(result)
            features += [feature]
        return self.get_feature_collection(features=features)

    def get_feature(self, *args, **kwargs):
        return super(GeoNames, self).get_feature(*args, **kwargs)

    def get_bbox(self, bbox=None):
        if not bbox:
            return
        try:
            return [bbox['west'], bbox['south'], bbox['east'], bbox['north']]
        except KeyError:
            return None

    def property_map(self, props):
        prop_map = {"name": "name", "province": "adminName2", "region": "adminName1", "country": "countryName"}
        for key, value in prop_map.iteritems():
            props[key] = props[value]
        return props


class Geocode(object):

    _supported_geocoders = {'geonames': GeoNames}

    def __init__(self):
        url = getattr(settings, 'GEOCODING_API_URL')
        type = getattr(settings, 'GEOCODING_API_TYPE')
        if not (url and type):
            logger.error("Both a `GEOCODING_API_URL` and a `GEOCODING_API_TYPE` must be defined in the settings.")
            raise Exception('A geocoder configuration was not provided, contact an administrator.')
        self.geocoder = self.get_geocoder(type, url)

    @property
    def map(self):
        return self._supported_geocoders

    def get_geocoder(self, name, url):
        return self.map.get(name.lower())(url)

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
        original_bbox = new_bbox
        return original_bbox
    original_bbox[0] = min(new_bbox[0], original_bbox[0])
    original_bbox[1] = min(new_bbox[1], original_bbox[1])
    original_bbox[2] = max(new_bbox[2], original_bbox[2])
    original_bbox[3] = max(new_bbox[3], original_bbox[3])
    return original_bbox
