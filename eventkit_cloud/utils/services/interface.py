import abc

import requests


class IGisClient(abc.ABC):
    aoi = None

    @abc.abstractmethod
    def find_layer(self, root):
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
