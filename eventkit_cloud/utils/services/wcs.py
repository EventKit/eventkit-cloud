from eventkit_cloud.utils.services.ows import OWS


class WCS(OWS):

    def find_layer(self, root):
        raise NotImplementedError("Method is specific to provider type")

    def get_bbox(self, element):
        raise NotImplementedError("Method is specific to provider type")

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")
