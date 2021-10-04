import abc


class IGisClient(abc.ABC):
    aoi = None

    def find_layer(self, root):
        pass

    def get_aoi_from_service(self, element):
        pass

    def get_layer_name(self):
        pass

    def get_bbox(self, element):
        pass
