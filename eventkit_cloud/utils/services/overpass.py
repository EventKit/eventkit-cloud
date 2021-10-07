import requests

from eventkit_cloud.utils.services.base import GisClient


class Overpass(GisClient):
    aoi = None

    def find_layer(self, root):
        raise NotImplementedError("Method is specific to service type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to service type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to service type")

    def get_response(self) -> requests.Response:
        query = "out meta;"

        response = self.session.post(url=self.service_url, data=query, timeout=self.timeout)

        if not response.ok:
            # Workaround for https://bugs.python.org/issue27777
            query = {"data": query}
            response = self.session.post(url=self.service_url, data=query, timeout=self.timeout)

        return response
