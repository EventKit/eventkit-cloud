import copy
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

    def test_get_cim_solid_stroke(self):
        sls: service_types.SimpleLineSymbol = {
            "type": "esriSLS",
            "style": "esriSLSDash",
            "width": 3,
            "color": (1, 2, 3, 255),
        }
        expected_sls_result = {
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
        self.assertEqual(expected_sls_result, self.arcgis_layer.get_cim_solid_stroke(sls))
        ts: service_types.TextSymbol = {"type": "esriTS", "borderLineSize": 5, "borderLineColor": (2, 3, 4, 255)}
        expected_ts_result = {
            "type": "CIMSolidStroke",
            "enable": True,
            "width": 5,
            "color": {"type": "CIMRGBColor", "values": [2, 3, 4, 100]},
        }
        self.assertEqual(expected_ts_result, self.arcgis_layer.get_cim_solid_stroke(ts))

        sms: service_types.SimpleMarkerSymbol = {"type": "esriSMS", "outline": sls}

        expected_sms_result = copy.deepcopy(expected_sls_result)
        self.assertEqual(expected_sms_result, self.arcgis_layer.get_cim_solid_stroke(sms))

        pfs: service_types.PictureFillSymbol = {"type": "esriPFS", "outline": sls}

        expected_pfs_result = copy.deepcopy(expected_sls_result)
        self.assertEqual(expected_pfs_result, self.arcgis_layer.get_cim_solid_stroke(pfs))

        not_supported = {"type": "notSupported"}
        expected_not_supported_result = {
            "type": "CIMSolidStroke",
            "enable": True,
            "width": 1,
            "color": {"type": "CIMRGBColor", "values": [0, 0, 0, 100]},
        }
        self.assertEqual(expected_not_supported_result, self.arcgis_layer.get_cim_solid_stroke(not_supported))

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

    def test_get_cim_solid_fill(self):
        expected_solid_fill = {
            "type": "CIMSolidFill",
            "enable": True,
            "color": {
                "type": "CIMRGBColor",
                "values": [0, 0, 0, 100],
            },
        }
        self.assertEqual(expected_solid_fill, self.arcgis_layer.get_cim_solid_fill({}))

    def test_get_symbol_layers(self):
        stroke = {"type": "CIMSolidStroke"}
        fill = {"type": "CIMSolidFill"}
        vector_marker = {"type": "CIMVectorMarker"}
        self.arcgis_layer.get_cim_solid_stroke = Mock(return_value=stroke)
        self.arcgis_layer.get_cim_solid_fill = Mock(return_value=fill)
        self.arcgis_layer.get_cim_vector_marker = Mock(return_value=vector_marker)
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSLS"}), [stroke])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSFS", "outline": "<SLS>"}), [stroke, fill])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriTS"}), [fill])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "esriSMS"}), [vector_marker])
        self.assertEqual(self.arcgis_layer.get_symbol_layers({"type": "bad"}), [])
        with self.settings(DEBUG=True), self.assertRaises(NotImplementedError):
            self.arcgis_layer.get_symbol_layers({"type": "bad"})

    def test_get_cim_marker_graphic(self):
        symbol = Mock()
        mock_solid_stroke = Mock()
        mock_solid_fill = Mock()
        geometry = Mock()
        expected_marker = {
            "type": "CIMMarkerGraphic",
            "geometry": geometry,
            "symbol": {"type": "CIMPolygonSymbol", "symbolLayers": [mock_solid_stroke, mock_solid_fill]},
        }
        with patch("eventkit_cloud.utils.arcgis.arcgis_layer.get_marker_geometry") as mock_get_marker_geometry:
            mock_get_marker_geometry.return_value = geometry
            self.arcgis_layer.get_cim_solid_stroke = Mock(return_value=mock_solid_stroke)
            self.arcgis_layer.get_cim_solid_fill = Mock(return_value=mock_solid_fill)
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
        with self.settings(DEBUG=True), self.assertRaises(NotImplementedError):
            self.arcgis_layer.get_cim_mesh_symbol({"type": "bad"})

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

    def test_get_cim_text_symbol(self):
        halo_color = Mock()
        self.arcgis_layer.get_cim_color = Mock(return_value=halo_color)
        horizontal_alignment = "left"
        service_symbol = {"horizontalAlignment": horizontal_alignment, "haloColor": "color", "font": "<font>"}
        mock_stroke = Mock()
        self.arcgis_layer.get_cim_solid_stroke = Mock(return_value=mock_stroke)
        mock_fill = Mock()
        self.arcgis_layer.get_cim_solid_fill = Mock(return_value=mock_fill)
        expected_font = {"font": "font"}
        self.arcgis_layer.get_font_properties = Mock(return_value=expected_font)
        expected_symbol = {
            "type": "CIMTextSymbol",
            "blockProgression": "TTB",
            "depth3D": 1,
            "extrapolateBaselines": True,
            "fontEffects": "Normal",
            "fontEncoding": "Unicode",
            "fontType": "Unspecified",
            "hinting": "Default",
            "horizontalAlignment": horizontal_alignment.capitalize(),
            "kerning": service_symbol.get("kerning") or True,
            "letterWidth": 100,
            "ligatures": True,
            "lineGapType": "ExtraLeading",
            "symbol": {
                "type": "CIMPolygonSymbol",
                "symbolLayers": [mock_stroke, mock_fill],
            },
            "textCase": "Normal",
            "textDirection": "LTR",
            "verticalAlignment": "Bottom",
            "verticalGlyphOrientation": "Right",
            "wordSpacing": 100,
            "billboardMode3D": "FaceNearPlane",
            "haloSize": 1,
            "haloSymbol": {
                "type": "CIMPolygonSymbol",
                "symbolLayers": [
                    {
                        "type": "CIMSolidStroke",
                        "enable": True,
                        "capStyle": "Round",
                        "joinStyle": "Round",
                        "lineStyle3D": "Strip",
                        "miterLimit": 10,
                        "width": 0,
                        "color": halo_color,
                    },
                    {
                        "type": "CIMSolidFill",
                        "enable": True,
                        "color": halo_color,
                    },
                ],
            },
            **expected_font,
        }
        self.assertEqual(expected_symbol, self.arcgis_layer.get_cim_text_symbol(service_symbol))

    def test_get_cim_symbol_reference(self):
        sym_ref = {"type": "CIMSymbolReference"}
        self.assertEqual(sym_ref, self.arcgis_layer.get_cim_symbol_reference(sym_ref))
        symbol = {"type": "CIMLineSymbol"}
        self.arcgis_layer.get_symbol = Mock(return_value=symbol)
        self.assertEqual(
            {"type": "CIMSymbolReference", "symbol": symbol}, self.arcgis_layer.get_cim_symbol_reference(symbol)
        )

    def test_get_cim_unique_value_class(self):
        symbol = Mock()
        self.arcgis_layer.get_cim_symbol_reference = Mock(return_value=symbol)
        value_info = {"value": "<value>", "label": "LABEL", "symbol": "<symbol>"}
        expected_return_value = {
            "type": "CIMUniqueValueClass",
            "label": value_info["label"],
            "patch": "Default",
            "symbol": symbol,
            "values": [{"type": "CIMUniqueValue", "fieldValues": [str(value_info["value"])]}],
            "visible": True,
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_unique_value_class(value_info))

    def test_get_cim_unique_value_group(self):
        value_info = Mock()
        self.arcgis_layer.get_cim_unique_value_class = Mock(return_value=value_info)
        unique_value_infos = [{"value": "<value>"}]
        renderer = {"uniqueValueInfos": unique_value_infos}
        expected_return_value = {
            "type": "CIMUniqueValueGroup",
            "classes": [self.arcgis_layer.get_cim_unique_value_class(info) for info in unique_value_infos],
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_unique_value_group(renderer))

    def test_get_simple_renderer(self):
        service_renderer = {"label": "LABEL", "description": "DESCRIPTION", "symbol": "<symbol>"}
        symbol = Mock()
        self.arcgis_layer.get_cim_symbol_reference = Mock(return_value=symbol)
        expected_return_value = {
            "type": "CIMSimpleRenderer",
            "patch": "Default",
            "symbol": symbol,
            "label": service_renderer["label"],
            "description": service_renderer["description"],
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_simple_renderer(service_renderer))

    def test_get_unique_value_renderer(self):
        fields = {"field1": "field1", "field2": "field2", "field3": "field3"}
        service_renderer = {"defaultSymbol": "<symbol>", **fields}
        default_symbol = Mock()
        self.arcgis_layer.get_cim_symbol_reference = Mock(return_value=default_symbol)
        group = Mock()
        self.arcgis_layer.get_cim_unique_value_group = Mock(return_value=group)
        expected_renderer = {
            "type": "CIMUniqueValueRenderer",
            "colorRamp": {
                "type": "CIMRandomHSVColorRamp",
                "colorSpace": {"type": "CIMICCColorSpace", "url": "Default RGB"},
                "maxH": 360,
                "minS": 15,
                "maxS": 30,
                "minV": 99,
                "maxV": 100,
                "minAlpha": 100,
                "maxAlpha": 100,
            },
            "defaultLabel": "Other",
            "defaultSymbol": default_symbol,
            "defaultSymbolPatch": "Default",
            "fields": list(fields.values()),
            "groups": [group],
            "useDefaultSymbol": bool(default_symbol),
            "polygonSymbolColorTarget": "Fill",
        }
        self.maxDiff = None
        self.assertEqual(expected_renderer, self.arcgis_layer.get_unique_value_renderer(service_renderer))

    def test_get_cim_renderer(self):
        simple_renderer = Mock()
        self.arcgis_layer.get_simple_renderer = Mock(return_value=simple_renderer)
        self.assertEqual(simple_renderer, self.arcgis_layer.get_cim_renderer({"type": "simple"}))

        unique_value_renderer = Mock()
        self.arcgis_layer.get_unique_value_renderer = Mock(return_value=unique_value_renderer)
        self.assertEqual(unique_value_renderer, self.arcgis_layer.get_cim_renderer({"type": "uniqueValue"}))

        self.assertIsNone(self.arcgis_layer.get_cim_renderer({"type": "notSupported"}))
        with self.settings(DEBUG=True), self.assertRaises(NotImplementedError):
            self.arcgis_layer.get_cim_renderer({"type": "notSupported"})

    def test_get_cim_field_descriptions(self):
        alias = "test_alias"
        name = "test_name"
        spec = {"fields": [{"alias": alias, "name": name}]}
        expected_field_descriptions = [
            {
                "type": "CIMFieldDescription",
                "alias": alias,
                "fieldName": name,
                "numberFormat": {
                    "type": "CIMNumericFormat",
                    "alignmentOption": "esriAlignRight",
                    "alignmentWidth": 0,
                    "roundingOption": "esriRoundNumberOfDecimals",
                    "roundingValue": 6,
                },
                "visible": True,
                "searchMode": "Exact",
            }
        ]
        self.assertEqual(expected_field_descriptions, self.arcgis_layer.get_cim_field_descriptions(spec))

    def test_get_cim_feature_table(self):
        self.maxDiff = None
        field_descriptions = Mock()
        self.arcgis_layer.get_cim_field_descriptions = Mock(return_value=field_descriptions)
        name = "test_name"
        spec = {"name": name}
        expected_return_value = {
            "type": "CIMFeatureTable",
            "displayField": "name",
            "editable": True,
            "fieldDescriptions": field_descriptions,
            "dataConnection": {
                "type": "CIMStandardDataConnection",
                "workspaceConnectionString": f"AUTHENTICATION_MODE=OSA;DATABASE={self.file_path}",
                "workspaceFactory": "Sql",
                "dataset": f'main."{name}"',
                "datasetType": "esriDTFeatureClass",
            },
            "studyAreaSpatialRel": "esriSpatialRelUndefined",
            "searchOrder": "esriSearchOrderSpatial",
        }
        self.assertEqual(expected_return_value, self.arcgis_layer.get_cim_feature_table(spec))

    def test_get_cim_standard_label_placement_properties(self):
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "aboveEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementAboveAfter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "aboveAlong": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementAboveAlong"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "aboveStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementAboveBefore"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "aboveEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementAboveEnd"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "aboveStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementAboveStart"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "belowEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementBelowAfter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "belowAlong": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementBelowAlong"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "belowStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementBelowBefore"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "belowEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementBelowEnd"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "belowStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementBelowStart"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "centerEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementCenterAfter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "centerAlong": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementCenterAlong"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "centerStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementCenterBefore"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "centerEnd": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementCenterEnd"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "lineLabelPriorities": {"type": "CIMStandardLineLabelPriorities", "centerStart": 1},
                "featureType": "Line",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerLinePlacementCenterStart"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "aboveCenter": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementAboveCenter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "aboveLeft": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementAboveLeft"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "aboveRight": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementAboveRight"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "belowCenter": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementBelowCenter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "belowLeft": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementBelowLeft"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "belowRight": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementBelowRight"),
        )
        self.assertEqual(
            {"type": "CIMStandardLabelPlacementProperties", "featureType": "Point"},
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementCenterCenter"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "centerLeft": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementCenterLeft"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "pointPlacementPriorities": {"type": "CIMStandardPointPlacementPriorities", "centerRight": 1},
                "featureType": "Point",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPointLabelPlacementCenterRight"),
        )
        self.assertEqual(
            {
                "type": "CIMStandardLabelPlacementProperties",
                "polygonPlacementMethod": "AlwaysHorizontal",
                "featureType": "Polygon",
            },
            self.arcgis_layer.get_cim_standard_label_placement_properties("esriServerPolygonPlacementAlwaysHorizontal"),
        )

    def test_get_cim_label_classes(self):
        self.maxDiff = None
        self.assertEqual([], self.arcgis_layer.get_cim_label_classes())
        with patch("eventkit_cloud.utils.arcgis.arcgis_layer.uuid.uuid4") as mock_uuid4:
            expression = Mock()
            self.arcgis_layer.parse_label_expression = Mock(return_value=expression)
            min_scale = Mock()
            max_scale = Mock()
            text_symbol = Mock()
            self.arcgis_layer.get_cim_symbol_reference = Mock(return_value=text_symbol)
            feature_type = "polygon"
            label_placement = {"featureType": feature_type}
            self.arcgis_layer.get_cim_standard_label_placement_properties = Mock(return_value=label_placement)
            test_uuid = Mock()
            mock_uuid4.return_value = test_uuid
            label_infos = [
                {
                    "labelExpression": Mock(),
                    "symbol": Mock(),
                    "minScale": min_scale,
                    "maxScale": max_scale,
                    "labelPlacement": Mock(),
                }
            ]

            expected_label_class = {
                "type": "CIMLabelClass",
                "priority": 1,
                "expressionTitle": "Custom",
                "expression": expression,
                "expressionEngine": "Python",
                "featuresToLabel": "AllVisibleFeatures",
                "textSymbol": text_symbol,
                "useCodedValue": True,
                "name": f"{test_uuid} 0",
                "visibility": True,
                "minimumScale": min_scale,
                "maximumScale": max_scale,
                "standardLabelPlacementProperties": label_placement,
                "maplexLabelPlacementProperties": {
                    "type": "CIMMaplexLabelPlacementProperties",
                    "featureType": feature_type,
                },
            }
            self.assertEqual([expected_label_class], self.arcgis_layer.get_cim_label_classes(label_infos=label_infos))

    def test_get_cim_feature_layer(self):
        self.maxDiff = None
        name = "test_name"
        description = "test_description"
        service_spec = {"name": name, "description": description, "drawingInfo": {"renderer": "Renderer"}}
        cim_path = f"CIMPATH=internal_map/{name}.xml"
        feature_table = Mock()
        self.arcgis_layer.get_cim_feature_table = Mock(return_value=feature_table)
        renderer = Mock()
        self.arcgis_layer.get_cim_renderer = Mock(return_value=renderer)
        label_classes = Mock()
        self.arcgis_layer.get_cim_label_classes = Mock(return_value=label_classes)
        expected_feature_layer = {
            "type": "CIMFeatureLayer",
            "name": name,
            "uRI": cim_path,
            "sourceModifiedTime": {"type": "TimeInstant"},
            "minScale": 750000,
            "maxScale": 0,
            "useSourceMetadata": True,
            "description": description,
            "layerElevation": {
                "type": "CIMLayerElevationSurface",
                "mapElevationID": "{752ADD4F-A4BC-44F1-8B73-D03138DD2020}",
            },
            "expanded": True,
            "layerType": "Operational",
            "showLegends": True,
            "visibility": True,
            "displayCacheType": "Permanent",
            "maxDisplayCacheAge": 5,
            "showPopups": True,
            "serviceLayerID": -1,
            "refreshRate": -1,
            "refreshRateUnit": "esriTimeUnitsSeconds",
            "blendingMode": "Alpha",
            "autoGenerateFeatureTemplates": True,
            "featureElevationExpression": "0",
            "featureTable": feature_table,
            "htmlPopupEnabled": True,
            "selectable": True,
            "featureCacheType": "Session",
            "displayFiltersType": "ByScale",
            "featureBlendingMode": "Alpha",
            "renderer": renderer,
            "scaleSymbols": True,
            "snappable": True,
            "labelClasses": label_classes,
            "labelVisibility": True,
        }
        self.assertEqual(expected_feature_layer, self.arcgis_layer.get_cim_feature_layer(service_spec))

    def test_get_cim_group_layer(self):
        self.maxDiff = None
        layer_uri = Mock()
        mock_layer = {"uRI": layer_uri}
        self.arcgis_layer.get_cim_layer = Mock(return_value=mock_layer)

        layer_name = "test_name"
        layer = {"name": layer_name}
        cim_path = f"CIMPATH=internal_map/{layer_name}.xml"
        uris = [layer_uri]
        expected_layer = {
            "type": "CIMGroupLayer",
            "name": layer_name,
            "uRI": cim_path,
            "sourceModifiedTime": {"type": "TimeInstant"},
            "useSourceMetadata": True,
            "layerElevation": {
                "type": "CIMLayerElevationSurface",
                "mapElevationID": "{752ADD4F-A4BC-44F1-8B73-D03138DD2020}",
            },
            "expanded": True,
            "layerType": "Operational",
            "showLegends": True,
            "visibility": True,
            "displayCacheType": "Permanent",
            "maxDisplayCacheAge": 5,
            "showPopups": True,
            "serviceLayerID": -1,
            "refreshRate": -1,
            "refreshRateUnit": "esriTimeUnitsSeconds",
            "blendingMode": "Alpha",
            "layers": uris,
            "layerDefinitions": [mock_layer],
        }
        self.assertEqual(expected_layer, self.arcgis_layer.get_cim_group_layer(layer=layer))

    def test_get_cim_layer(self):
        mock_group_layer = Mock()
        self.arcgis_layer.get_cim_group_layer = Mock(return_value=mock_group_layer)
        self.assertEqual(mock_group_layer, self.arcgis_layer.get_cim_layer({"name": "test", "type": "Group Layer"}))
        mock_feature_layer = Mock()
        self.arcgis_layer.get_cim_feature_layer = Mock(return_value=mock_feature_layer)
        self.assertEqual(mock_feature_layer, self.arcgis_layer.get_cim_layer({"type": "Feature Layer"}))
        self.assertIsNone(self.arcgis_layer.get_cim_layer({}))

    def test_flatten_layers(self):
        group = {
            "name": "test1",
            "layerDefinitions": [
                {"name": "test2", "layerDefinitions": [{"name": "test3", "layerDefinitions": []}, {"name": "test4"}]}
            ],
        }
        expected_group = [{"name": "test1"}, {"name": "test2"}, {"name": "test3"}, {"name": "test4"}]
        self.assertCountEqual(expected_group, self.arcgis_layer.flatten_layers(group))
