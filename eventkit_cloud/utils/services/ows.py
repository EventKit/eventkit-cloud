import re

from eventkit_cloud.utils.services.base import GisClient

class OWS(GisClient):

    def __init__(self, *args, **kwargs):
        """
        Initialize this OWSProviderCheck object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        :param layer: Layer or coverage to check for
        :param aoi_geojson: (Optional) AOI to check for layer intersection
        """
        super(OWS, self).__init__(*args, **kwargs)

        self.query = {"VERSION": "1.0.0", "REQUEST": "GetCapabilities"}
        # Amended with "SERVICE" parameter by subclasses

        # If service or version parameters are left in query string, it can lead to a protocol error and false negative
        self.service_url = re.sub(r"(?i)(version|service|request)=.*?(&|$)", "", self.service_url)

        self.layer = self.layer.lower()

    def find_layer(self, root):
        raise NotImplementedError("Method is specific to provider type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to provider type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")
