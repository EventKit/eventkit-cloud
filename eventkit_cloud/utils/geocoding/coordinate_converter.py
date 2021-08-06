import logging

import requests
from django.conf import settings

from eventkit_cloud.utils.geocoding.geocode_auth_response import GeocodeAuthResponse

logger = logging.getLogger(__name__)


class CoordinateConverter(GeocodeAuthResponse):
    def __init__(self, url=None):
        self.url = url or getattr(settings, "CONVERT_API_URL")

    def search(self, query):
        return self.get_data(query)

    def get(self, query):
        return self.get_data(query)

    def get_data(self, query):
        payload = {"from": "mgrs", "to": "decdeg", "q": str(query)}
        try:
            return self.get_response(payload).json()
        except requests.exceptions.RequestException as e:
            logger.error(e)
            return
