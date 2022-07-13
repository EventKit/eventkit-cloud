import logging

from eventkit_cloud.utils.services.errors import MissingLayerError, UnsupportedFormatError
from eventkit_cloud.utils.services.ows import OWS
from eventkit_cloud.utils.services.types import LayersDescription

logger = logging.getLogger(__name__)


class WFS(OWS):
    def __init__(self, *args, **kwargs):
        super(WFS, self).__init__(*args, **kwargs)
        self.query["SERVICE"] = "WFS"

    def find_layers(self, root):
        """
        :param root: Name of layer to find
        :return: XML 'Layer' Element, or None if not found
        """
        feature_type_list = root.find(".//featuretypelist")
        if feature_type_list is None:
            raise UnsupportedFormatError()

        feature_types = feature_type_list.findall("featuretype")

        # Get layer names
        feature_names = [(ft, ft.find("name")) for ft in feature_types]
        logger.debug("WFS layers offered: {}".format([name.text for feature, name in feature_names if name]))
        features = [feature for feature, name in feature_names if name is not None and self.layer == name.text]

        if not features:
            raise MissingLayerError(
                f"Unable to find {self.layer} in offered WFS layers: "
                f"{[name.text for feature, name in feature_names if name]}"
            )

        return features

    def get_bbox(self, element):
        bbox_element = element.find("latlongboundingbox")

        if bbox_element is None:
            return

        bbox = [float(bbox_element.attrib[point]) for point in ["minx", "miny", "maxx", "maxy"]]
        return bbox

    def get_layer_name(self):
        raise NotImplementedError("Method is specific to provider type")

    def get_layers(self) -> LayersDescription:
        raise NotImplementedError("Method is specific to provider type")
