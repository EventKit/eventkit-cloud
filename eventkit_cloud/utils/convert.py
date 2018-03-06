from django.conf import settings
import logging
from abc import ABCMeta, abstractmethod, abstractproperty
import requests
import json


logger = logging.getLogger(__name__)




class Convert(object):


    def __init__(self):

        self.converter = self.get_converter()

    @property
    def map(self):
        return self

    def get_converter(self):
        return self;

    def add_bbox(self, data):
        logger.info("add_bbox")
        if not self.update_url:
            return data
        return self.converter.add_bbox(self.update_url, data)

    def search(self, query):
        return self.converter.get_data(query)
    
    def get(self, query):
        url = getattr(settings, 'CONVERT_API_URL')
        args = { "from":"mgrs", "to":"decdeg","q":str(query)}
        response = requests.get(url, params=args)
        return response.json()


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
