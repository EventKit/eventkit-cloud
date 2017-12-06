from django.conf import settings
import logging
from abc import ABCMeta, abstractmethod, abstractproperty
import requests
import json


logger = logging.getLogger(__name__)




class Convert(object):


    def __init__(self):
        url = getattr(settings, 'CONVERT_API_URL')
        self.converter = self.get_converter(url)

    @property
    def map(self):
        # logger.info(object.query)
        # response = requests.get("http://localhost:3100/v1/convert?from=mgrs&to=decdeg&q=" + object)
        # logger.info(response)

        return self

    def get_converter(self, url):
        return self.map.get(url)

    def add_bbox(self, data):
        logger.info("add_bbox")
        if not self.update_url:
            return data
        return self.converter.add_bbox(self.update_url, data)

    def search(self, query):
        logger.info("hello")
        return self.converter.get_data(query)
    
    def get(self, query):
        response = requests.get("http://10.0.2.62:3100/v1/convert?from=mgrs&to=decdeg&q=12UUA8440")
        mgrsResponse = response.json()
        latitude = mgrsResponse["result"]["latitude"]
        longitude = mgrsResponse["result"]["longitude"]
        mgrsFeatures = { "type": "FeatureCollection", "features": [ { "type": "Feature", "properties":{"name":query}, "geometry":{ "type":"Point", "coordinates": [[[latitude, longitude]]] }, "bbox":[latitude-1, longitude-1, latitude+1, longitude+1]}]}
        return mgrsFeatures


def is_valid_bbox(bbox):
    logger.info("is_valid_bbox")
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
    logger.info("expand_bbox")
    if not original_bbox:
        original_bbox = list(new_bbox)
        return original_bbox
    original_bbox[0] = min(new_bbox[0], original_bbox[0])
    original_bbox[1] = min(new_bbox[1], original_bbox[1])
    original_bbox[2] = max(new_bbox[2], original_bbox[2])
    original_bbox[3] = max(new_bbox[3], original_bbox[3])
    return original_bbox
