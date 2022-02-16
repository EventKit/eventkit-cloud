import abc
from typing import Optional

import requests
from django.contrib.gis.geos import Polygon


class IGisClient(abc.ABC):
    aoi = None

    @abc.abstractmethod
    def find_layers(self, root):
        pass

    @abc.abstractmethod
    def get_layer_aoi(self, element):
        pass

    @abc.abstractmethod
    def get_layer_name(self):
        pass

    @abc.abstractmethod
    def get_layer_bbox(self, element):
        pass

    @abc.abstractmethod
    def get_response(self) -> requests.Response:
        pass

    @abc.abstractmethod
    def get_layer_geometry(self, element) -> dict:
        pass

    @abc.abstractmethod
    def download_product_geometry(self) -> Optional[Polygon]:
        pass

    @abc.abstractmethod
    def validate_response(self, response) -> bool:
        pass

    @abc.abstractmethod
    def check_response(self, head_only=False) -> requests.Response:
        pass
