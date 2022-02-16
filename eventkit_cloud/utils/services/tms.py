from eventkit_cloud.utils.services.base import GisClient


class TMS(GisClient):
    def __init__(self, service_url, *args, **kwargs):
        """
        Initialize this TMS object with a service URL and layer.
        :param service_url: URL of provider, if applicable. Query string parameters are ignored.
        """
        super(TMS, self).__init__(service_url, *args, **kwargs)
        self.service_url = self.service_url.format(z="0", y="0", x="0")

    def find_layers(self, root):
        raise NotImplementedError("Method is specific to provider type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to provider type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")
