import logging

from eventkit_cloud.utils.services.errors import MissingLayerError, UnsupportedFormatError, ServiceError
from eventkit_cloud.utils.services.ows import OWS

logger = logging.getLogger(__name__)


class WMS(OWS):
    def __init__(self, *args, **kwargs):
        super(WMS, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WMS"

        # 1.3.0 will work as well, if that's returned. 1.0.0 isn't widely supported.
        self.query["VERSION"] = "1.1.1"

    def find_layers(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        capability = root.find(".//capability")
        if capability is None:
            raise UnsupportedFormatError()

        # Flatten nested layers to single list
        layers = capability.findall("layer")
        sublayers = layers
        while len(sublayers) > 0:
            sublayers = [layer for layer in sublayers for layer in layer.findall("layer")]
            layers.extend(sublayers)

        # Get layer names
        layer_names = [(layer, layer.find("name")) for layer in layers]
        logger.debug("WMS layers offered: {}".format([name.text for layer, name in layer_names if name]))

        requested_layer = self.get_layer_name()
        layers = [layer for layer, name in layer_names if name is not None and requested_layer == name.text]

        # TODO: Verify this fix is correct
        if not layers:
            raise MissingLayerError(
                f"Unable to find requested WMS layer '{requested_layer}'"
                f" in layer list: {' '.join(str(ln.text) for ln, _ in layer_names)}"
            )

        return layers

    def get_bbox(self, element):
        bbox_element = element.find("latlonboundingbox") or element.find("boundingbox")
        if bbox_element is not None:
            bbox = [float(bbox_element.attrib[point]) for point in ["minx", "miny", "maxx", "maxy"]]
            return bbox

        bbox_element = element.find("ex_geographicboundingbox")
        if bbox_element is not None:
            points = ["westboundlongitude", "southboundlatitude", "eastboundlongitude", "northboundlatitude"]
            bbox = [float(bbox_element.findtext(point)) for point in points]
            return bbox

    def get_layer_name(self):
        try:
            layer_name = (
                self.config.get("sources", {})
                .get("default", {})
                .get("req", {})
                .get("layers")  # TODO: Can there be more than one layer name in the WMS/WMTS config?
            )
        except AttributeError:
            logger.error("Unable to get layer name from provider configuration.")
            logger.info(self.config)
            raise ServiceError()

        if layer_name is None:
            raise MissingLayerError("Unable to find WMS layer, no layer name found in config")

        layer_name = str(layer_name).lower()
        return layer_name
