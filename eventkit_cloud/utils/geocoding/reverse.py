import logging
from abc import ABCMeta, abstractmethod

import requests
from django.conf import settings

from eventkit_cloud.utils.geocoding.geocode import AuthenticationError
from eventkit_cloud.utils.geocoding.geocode_auth import get_auth_headers, authenticate

logger = logging.getLogger(__name__)


class ReverseGeocodeAdapter(metaclass=ABCMeta):
    """
    An abstract class to implement a new reverse geocoding service.  Note that the UI will expect,
    each feature to have a name, countryName, adminName1, adminName2, and the bbox only
    """

    _properties = ["name", "context_name"]

    def __init__(self, url):
        self.url = url

    @abstractmethod
    def add_name(self, feature):
        """
        This should be used to add the full name of a feature to be displayed as the nane of the feature.
        For example the "name" of the feature might be 5th Ave.  But the full name might be,
        5th Ave, New York, NY, USA.  This value needs to be used as a field "display_name" in the returned,
        geojson.  The feature would appear as 5th Ave, and underneath it would be the display_name of the feature,
        underneath it.
        :return: A string of the name (i.e. a short name).
        """
        pass

    @abstractmethod
    def add_context_name(self, feature):
        """
        This should be used to add the full name of a feature to be displayed under the "short name".
        For example the "name" of the feature might be 5th Ave.  But the context name might be,
        New York, NY, USA, to describe where the name occurs.  This value needs to be used as a
        field "context_name" in the returned geojson.
        :return: A string of the full name.
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
        This takes some query (e.g. "38, -77"), and returns a dict representing query parameters that a specific
        api will expect.
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

    def get_response(self, payload):
        response = requests.get(self.url, params=payload, headers=get_auth_headers())
        if response.status_code in [401, 403]:
            authenticate()
            response = requests.get(self.url, params=payload, headers=get_auth_headers())
            if not response.ok:
                error_message = "EventKit was not able to authenticate to the Geocoding service."
                logger.error(error_message)
                raise AuthenticationError(error_message)
        return response

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
        response = self.get_response(payload)
        if response.status_code in [401, 403]:
            authenticate()
            response = self.get_response(payload)
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
            feature = {"type": "Feature", "geometry": None, "properties": None}
        if bbox and is_valid_bbox(bbox):
            # testing
            feature["bbox"] = bbox
            feature["geometry"] = self.bbox2polygon(bbox)
        self.add_name(feature)
        self.add_context_name(feature)
        return feature

    @staticmethod
    def get_feature_collection(features=None):
        assert isinstance(features, list)
        max_bbox = None
        for feature in features:
            bbox = feature.get("bbox")
            if bbox:
                max_bbox = expand_bbox(max_bbox, bbox)
        feature_collection = {"type": "FeatureCollection", "features": features}
        if is_valid_bbox(max_bbox):
            feature_collection["bbox"] = max_bbox
        return feature_collection

    @staticmethod
    def bbox2polygon(bbox):
        try:
            (w, s, e, n) = bbox
        except KeyError:
            return
        coordinates = [[[w, s], [e, s], [e, n], [w, n], [w, s]]]
        return {"type": "Polygon", "coordinates": coordinates}

    def map_properties(self, feature, properties=None):
        props = properties or feature.get("properties")
        if props:
            feature["properties"] = props
        return feature


class Nominatim(ReverseGeocodeAdapter):
    def get_payload(self, query):
        return {"lat": query["lat"], "lon": query["lon"], "format": "json", "polygon_geojson": 1}

    def create_geojson(self, response):
        result = response.json()
        if not response:
            raise Exception("Geocoder did not return any results in the response")
        features = []
        logger.error(response)

        bbox = result.pop("boundingbox", None)
        feature = self.get_feature(result=result, bbox=self.get_bbox(bbox=bbox), properties=result)
        features += [feature]
        return self.get_feature_collection(features=features)

    def get_bbox(self, bbox=None):
        if not bbox:
            return
        try:
            return list(map(float, [bbox[2], bbox[0], bbox[3], bbox[1]]))
        except KeyError:
            return None

    def get_feature(self, result=None, bbox=None, properties=None):
        """
        Used to prepare a feature.  It can take an original feature or create one from a bbox.  If both a feature AND
        a bbox are used the bbox will be used to update the geometry.

        :param feature: A dict representing a geojson feature.
        :param bbox: A list representing a bounding box in EPSG:4326, [west, south, east, north].
        :param properties: A dict of properties and their values.
        :return: A feature with properties mapped.
        """
        feature = {"type": "Feature", "geometry": result.pop("geojson", None), "properties": None}
        for prop, value in result.pop("address", {}).items():
            properties[prop] = value
        if bbox and is_valid_bbox(bbox):
            feature["bbox"] = bbox
            if not feature.get("geometry"):
                feature["geometry"] = self.bbox2polygon(bbox)
        properties["source"] = "osm"
        # Can't have type because front end confuses it as a geojson type
        properties["class_type"] = properties.pop("type", None)
        self.map_properties(feature, properties=result)
        self.add_name(feature)
        self.add_context_name(feature)
        return feature

    def add_name(self, feature):
        feature["properties"]["name"] = feature["properties"]["display_name"].split(",")[0]
        return feature

    def add_context_name(self, feature):
        feature["properties"]["context_name"] = ",".join(feature["properties"]["display_name"].split(",")[1:])
        return feature

    def add_bbox(self, update_url, data):
        return data


class Pelias(ReverseGeocodeAdapter):
    def get_payload(self, query):
        return {"point.lat": query["lat"], "point.lon": query["lon"]}

    def create_geojson(self, response):
        features = []
        for feature in response.json().get("features"):
            feature = self.get_feature(feature=feature, bbox=feature.get("bbox"))
            features += [feature]
        return self.get_feature_collection(features=features)

    def add_name(self, feature):
        """Nothing to do Pelias already has a 'name' field."""
        return feature

    def add_context_name(self, feature):
        mapping = ["county", "region", "country"]
        name = []
        for prop in mapping:
            value = feature["properties"].get(prop)
            if value:
                name.append(value)
        feature["properties"]["context_name"] = ", ".join(name)
        return feature

    def add_bbox(self, update_url, data):
        # the different gid levels that should be checked for a bbox
        ids = [
            "neighbourhood_gid",
            "locality_gid",
            "county_gid",
            "region_gid",
            "country_gid",
        ]
        search_id = ""
        for id in ids:
            gid = data.get(id, data.get("properties", None).get(id, None))
            # use the gid if it exists and its not gid of the data in question
            # (if it is the gid of the data then we should already have a bbox if its available at that level)
            if gid and gid != data.get("gid"):
                search_id = gid
                break

        if search_id:
            response = requests.get(update_url, params={"ids": search_id}).json()
            features = response.get("features", [])
            if len(features):
                feature = features[0]
                bbox = feature.get("bbox", None)
                if bbox:
                    data["bbox"] = bbox
                    data["properties"]["bbox"] = bbox
        return data


class ReverseGeocode(object):

    _supported_geocoders = {"pelias": Pelias, "nominatim": Nominatim}

    def __init__(self):
        url = getattr(settings, "REVERSE_GEOCODING_API_URL")
        type = getattr(settings, "REVERSE_GEOCODING_API_TYPE")
        self.update_url = getattr(settings, "GEOCODING_UPDATE_URL")
        if not (url and type):
            logger.error(
                "Both a `REVERSE_GEOCODING_API_URL` and a `REVERSE_GEOCODING_API_TYPE` must be defined in the settings."
            )
            raise Exception("A geocoder configuration was not provided, contact an administrator.")
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
        logger.info(query)
        return self.geocoder.get_data(query)


# TODO: This is redundant code to what is in geocode.py additionally these functions
# can probably be handled by existing dependencies.
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
