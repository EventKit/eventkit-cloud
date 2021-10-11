from typing import Optional, List

from eventkit_cloud.utils.services.errors import UnsupportedFormatError, MissingLayerError, ServiceError
from eventkit_cloud.utils.services.ows import OWS
from logging import getLogger

logger = getLogger("__name__")


class WMTS(OWS):
    def __init__(self, *args, **kwargs):
        super(WMTS, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WMTS"

    def find_layer(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        contents = root.find(".//contents")
        if contents is None:
            raise UnsupportedFormatError()

        # Flatten nested layers to single list
        layers = contents.findall("layer")
        sublayers = layers
        while sublayers:
            sublayers = [layer for layer in sublayers for layer in layer.findall("layer")]
            layers.extend(sublayers)

        # Get layer names
        layer_names = [(layer, layer.find("identifier")) for layer in layers]
        logger.debug("WMTS layers offered: {}".format([name.text for layer, name in layer_names if name is not None]))

        requested_layer = self.get_layer_name()
        layer = [layer for layer, name in layer_names if name is not None and requested_layer == name.text]
        if not layer:
            raise MissingLayerError("Unable to find WMTS layer in layer names list")

        layer = layer[0]
        return layer

    def get_bbox(self, element) -> Optional[List[float]]:

        bbox_element = element.find("wgs84boundingbox")

        if bbox_element is None:
            return

        southwest = bbox_element.find("lowercorner").text.split()[::-1]
        northeast = bbox_element.find("uppercorner").text.split()[::-1]

        bbox = list(map(float, southwest + northeast))
        return bbox

    def get_layer_name(self) -> str:

        try:
            layer_name = (
                self.config.get("sources", {})
                .get("default", {})
                .get("req", {})
                .get("layers")  # TODO: Can there be more than one layer name in the WMS/WMTS config?
            )
        except AttributeError:
            logger.error("Unable to get layer name from provider configuration.")
            raise ServiceError()

        if layer_name is None:
            raise MissingLayerError("Unable to find WMTS layer, no layer name found in config")

        layer_name = layer_name.lower()
        return layer_name
