from unittest import TestCase
from unittest.mock import Mock, patch

from eventkit_cloud.utils.services.interface import IGisClient


class TestInterface(TestCase):
    @patch.multiple(IGisClient, __abstractmethods__=set())
    def test_interface(self):
        root = Mock()
        element = Mock()
        response = Mock()
        client = IGisClient()
        client.find_layers(root)
        client.get_layer_aoi(element)
        client.get_layer_name()
        client.get_layer_bbox(element)
        client.get_response()
        client.get_layer_geometry(element)
        client.download_product_geometry()
        client.validate_response(response)
        client.check_response()
        with self.assertRaises(NotImplementedError):
            client.get_capabilities()
        with self.assertRaises(NotImplementedError):
            client.get_layers()
