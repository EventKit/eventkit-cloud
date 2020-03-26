import logging

import requests
from django.conf import settings


logger = logging.getLogger(__name__)


class CoordinateConverter(object):

    def __init__(self):
        self.converter = self.get_converter()

    @property
    def map(self):
        return self

    def get_converter(self):
        return self

    def add_bbox(self, data):
        logger.info("add_bbox")
        if not self.update_url:
            return data
        return self.converter.add_bbox(self.update_url, data)

    def search(self, query):
        return self.converter.get_data(query)

    def get(self, query):
        return self.get_data(query)

    def get_data(self, query):
        url = getattr(settings, 'CONVERT_API_URL')
        args = {"from": "mgrs", "to": "decdeg", "q": str(query)}
        try:
            return self.get_response(url, args).json()
        except requests.exceptions.RequestException as e:
            logger.error(e)
            return
