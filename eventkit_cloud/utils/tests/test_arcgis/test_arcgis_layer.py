import doctest
import logging
from unittest.mock import Mock, patch

from django.test import TestCase

from eventkit_cloud.utils.arcgis import arcgis_layer
from eventkit_cloud.utils.arcgis.types import service_types

logger = logging.getLogger(__name__)


def load_tests(loader, tests, ignore):
    tests.addTests(doctest.DocTestSuite(arcgis_layer))
    return tests


class TestCreateArcgisLayer(TestCase):
    def setUp(self):
        self.layer_name = "TEST_LAYER"
        self.file_path = "./data.gpkg"
        self.cap_doc = {"type": "CIMLayerDocument"}
        self.arcgis_layer = arcgis_layer.ArcGISLayer(
            layer_name=self.layer_name, service_specification=self.cap_doc, file_path=self.file_path
        )

    def test_get_cim_color(self):
        self.assertEqual(
            {"type": "CIMRGBColor", "values": [1, 2, 3, 100]}, self.arcgis_layer.get_cim_color((1, 2, 3, 255))
        )

    def test_get_dash_template(self):
        cases = {
            "esriSLSDash": [6, 6],
            "esriSLSDashDot": [6, 3, 1, 3],
            "esriSLSDashDotDot": [6, 3, 1, 3, 1, 3],
            "esriSLSDot": [2, 4],
            "esriSLSLongDash": [8, 4],
            "esriSLSLongDashDot": [8, 3, 1, 3],
            "esriSLSOptional[]": None,
            "esriSLSShortDash": [4, 4],
            "esriSLSShortDashDot": [4, 2, 1, 2],
            "esriSLSShortDashDotDot": [4, 2, 1, 2, 1, 2],
            "esriSLSShortDot": [1, 2],
            "esriSLSSolid": None,
        }
        for style, result in cases.items():
            sls: service_types.SimpleLineSymbol = {
                "type": "esriSLS",
                "style": style,  # type: ignore
                "width": 1,
                "color": (1, 2, 3, 255),
            }
            self.assertEqual(result, self.arcgis_layer.get_dash_template(sls))

    def test_cim_solid_stroke(self):
        sls: service_types.SimpleLineSymbol = {
            "type": "esriSLS",
            "style": "esriSLSDash",
            "width": 3,
            "color": (1, 2, 3, 255),
        }
        expected_result = {
            "type": "CIMSolidStroke",
            "enable": True,
            "width": 3,
            "color": {"type": "CIMRGBColor", "values": [1, 2, 3, 100]},
            "effects": [
                {
                    "type": "CIMGeometricEffectDashes",
                    "dashTemplate": [6, 6],
                }
            ],
        }
        self.assertEqual(expected_result, self.arcgis_layer.get_cim_solid_stroke(sls))

    def get_cim_solid_fill(self):
        sfs: service_types.SimpleFillSymbol = {
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": (1, 2, 3, 255),
            "outline": None,
        }
        expected_result = {
            "type": "CIMSolidFill",
            "enable": True,
            "color": {"type": "CIMRGBColor", "values": [1, 2, 3, 100]},
        }
        self.assertEqual(expected_result, self.arcgis_layer.get_cim_solid_fill(sfs))

    def test_get_symbol_layers(self):
        stroke = {"type": "CIMSolidStroke"}
        fill = {"type": "CIMSolidFill"}
        self.arcgis_layer.get_cim_solid_stroke = Mock(return_value=stroke)
        self.arcgis_layer.get_cim_solid_fill = Mock(return_value=fill)
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSLS"}), [stroke])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSFS", "outline": "<SLS>"}), [stroke, fill])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriTS"}), [fill])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSMS"}), [stroke, fill])

    def test_get_cim_marker_graphic(self):
        symbol = Mock()
        symbol_layers = [Mock()]
        geometry = Mock()
        expected_marker = {
            "type": "CIMMarkerGraphic",
            "geometry": geometry,
            "symbol": {"type": "CIMPolygonSymbol", "symbolLayers": symbol_layers},
        }
        with patch("eventkit_cloud.utils.arcgis.arcgis_layer.get_marker_geometry") as mock_get_marker_geometry:
            mock_get_marker_geometry.return_value = geometry
            self.arcgis_layer.get_symbol_layers = Mock(return_value=symbol_layers)
            self.assertEqual(expected_marker, self.arcgis_layer.get_cim_marker_graphic(symbol))

    def test_get_envelope(self):
        size = 4
        xoffset = 2
        yoffset = 2
        expected_return_value = {"xmin": 0.0, "ymin": 0.0, "xmax": 4.0, "ymax": 4.0}
        self.assertEqual(expected_return_value, self.arcgis_layer.get_envelope(size, xoffset, yoffset))

    def test_get_cim_vector_marker(self):
        size = 1
        symbol = {"size": size, "xoffset": 1, "yoffset": 1}
        marker_graphic = Mock()
        self.arcgis_layer.get_cim_marker_graphic = Mock(return_value=marker_graphic)
        frame = Mock()
        self.arcgis_layer.get_envelope = Mock(return_value=frame)
        expected_return_value = {
            "type": "CIMVectorMarker",
            "enable": True,
            "size": size,
            "frame": frame,
            "markerGraphics": [marker_graphic],
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_vector_marker(symbol))

    def test_get_cim_picture_marker(self):
        size = 10
        angle = 0
        xoffset = 1
        yoffset = 2
        symbol = {
            "contentType": "ct",
            "imageData": "id",
            "height": size,
            "angle": angle,
            "xoffset": xoffset,
            "yoffset": yoffset,
        }
        expected_url = "data:ct;base64,id"
        expected_marker = {
            "type": "CIMPictureMarker",
            "enable": True,
            "anchorPoint": {"x": 0, "y": 0, "z": 0},
            "anchorPointUnits": "Relative",
            "dominantSizeAxis3D": "Y",
            "size": size,
            "rotation": angle,
            "offsetX": xoffset,
            "offsetY": yoffset,
            "billboardMode3D": "FaceNearPlane",
            "invertBackfaceTexture": True,
            "scaleX": 1,
            "textureFilter": "Draft",
            "tintColor": {"type": "CIMRGBColor", "values": [255, 255, 255, 100]},
            "url": expected_url,
        }
        self.assertEqual(expected_marker, self.arcgis_layer.get_cim_picture_marker(symbol))

    def test_get_symbol(self):
        mock_line = Mock()
        self.arcgis_layer.get_cim_line_symbol = Mock(return_value=mock_line)
        mock_polygon = Mock()
        self.arcgis_layer.get_cim_polygon_symbol = Mock(return_value=mock_polygon)
        mock_point = Mock()
        self.arcgis_layer.get_cim_point_symbol = Mock(return_value=mock_point)
        mock_text = Mock()
        self.arcgis_layer.get_cim_text_symbol = Mock(return_value=mock_text)
        symbols = {
            "CIMSymbolReference": {"type": "CIMSymbolReference"},
            "esriSLS": mock_line,
            "esriSFS": mock_polygon,
            "esriSMS": mock_point,
            "esriPFS": mock_polygon,
            "esriPMS": mock_point,
            "esriTS": mock_text,
            "any": {},
        }
        for symbol_type, value in symbols.items():
            self.assertEqual(value, self.arcgis_layer.get_symbol({"type": symbol_type}))

    def test_get_cim_line_symbol(self):
        symbol = Mock()
        symbol_layers = Mock()
        self.arcgis_layer.get_symbol_layers = Mock(return_value=symbol_layers)
        expected_return_value = {
            "type": "CIMLineSymbol",
            "symbolLayers": symbol_layers,
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_line_symbol(symbol))

    def test_get_cim_mesh_symbol(self):
        symbol = Mock()
        symbol_layers = Mock()
        self.arcgis_layer.get_symbol_layers = Mock(return_value=symbol_layers)
        expected_return_value = {
            "type": "CIMMeshSymbol",
            "symbolLayers": symbol_layers,
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_mesh_symbol(symbol))

    def test_get_cim_point_symbol(self):
        symbol = Mock()
        symbol_layers = Mock()
        self.arcgis_layer.get_symbol_layers = Mock(return_value=symbol_layers)
        expected_return_value = {
            "type": "CIMPointSymbol",
            "symbolLayers": symbol_layers,
            "haloSize": 1,
            "scaleX": 1,
            "angleAlignment": "Display",
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_point_symbol(symbol))

    def test_get_cim_polygon_symbol(self):
        symbol = Mock()
        symbol_layers = Mock()
        self.arcgis_layer.get_symbol_layers = Mock(return_value=symbol_layers)
        expected_return_value = {
            "type": "CIMPolygonSymbol",
            "symbolLayers": symbol_layers,
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_polygon_symbol(symbol))

    def test_get_font_properties(self):
        font_family = "Times New Roman"
        height = 10
        font = {"family": font_family, "size": height, "decoration": None, "style": None, "weight": "normal"}
        expected_font = {
            "type": "CIMTextSymbol",
            "fontFamilyName": font_family,
            "height": height,
        }
        self.assertEqual(expected_font, self.arcgis_layer.get_font_properties(font))
        font["decoration"] = "line-through"
        self.assertTrue(self.arcgis_layer.get_font_properties(font)["strikethrough"])
        font["decoration"] = "underline"
        self.assertTrue(self.arcgis_layer.get_font_properties(font)["underline"])
        font["style"] = "italic"
        self.assertTrue(self.arcgis_layer.get_font_properties(font)["fontStyleName"] == "Italic")
        font["style"] = "oblique"
        self.assertTrue(self.arcgis_layer.get_font_properties(font)["fontStyleName"] == "Oblique")
        font["weight"] = "bold"
        self.assertTrue(self.arcgis_layer.get_font_properties(font)["fontStyleName"] == "Bold")
