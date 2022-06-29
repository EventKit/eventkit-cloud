import copy
import logging
import re
import uuid
from typing import Optional

from django.conf import settings

from eventkit_cloud.feature_selection.feature_selection import slugify
from eventkit_cloud.utils.arcgis.markers import get_marker_geometry
from eventkit_cloud.utils.arcgis.types import cim_types, service_types

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)


class ArcGISLayer:
    def __init__(
        self, layer_name: str, service_specification: service_types.MapServiceSpecification, file_path: str = None
    ):
        self._layer_name = layer_name
        self._service_specification = service_specification
        self._file_path = file_path or ".\\*.gpkg"

    def get_geometry(self, service_symbol: service_types.Symbol) -> cim_types.Geometry:
        return get_marker_geometry(service_symbol)

    def get_cim_color(self, service_color: service_types.Color) -> cim_types.CIMRGBColor:
        color: cim_types.CIMRGBColor = {
            "type": "CIMRGBColor",
            "values": [service_color[0], service_color[1], service_color[2], int((service_color[3] / 255) * 100)],
        }
        return color

    def get_dash_template(self, service_symbol: service_types.Symbol) -> Optional[list[int]]:
        # The dashTemplate controls the line/spaceing (i.e. [line, space, line, space, line, space])
        match service_symbol["style"]:
            case "esriSLSDash":
                return [6, 6]
            case "esriSLSDashDot":
                return [6, 3, 1, 3]
            case "esriSLSDashDotDot":
                return [6, 3, 1, 3, 1, 3]
            case "esriSLSDot":
                return [2, 4]
            case "esriSLSLongDash":
                return [8, 4]
            case "esriSLSLongDashDot":
                return [8, 3, 1, 3]
            case "esriSLSOptional[]":
                return None
            case "esriSLSShortDash":
                return [4, 4]
            case "esriSLSShortDashDot":
                return [4, 2, 1, 2]
            case "esriSLSShortDashDotDot":
                return [4, 2, 1, 2, 1, 2]
            case "esriSLSShortDot":
                return [1, 2]
            case "esriSLSSolid":
                return None

    def get_cim_solid_stroke(self, service_symbol: service_types.Symbol) -> cim_types.CIMSolidStroke:
        line: cim_types.CIMSolidStroke = {
            "type": "CIMSolidStroke",
            "enable": True,
            "capStyle": "Round",
            "joinStyle": "Round",
            "width": service_symbol.get("width", 1),
            "color": self.get_cim_color(service_symbol.get("color", [0, 0, 0, 255])),
        }
        dash_template = self.get_dash_template(service_symbol)
        if dash_template:
            effect = {
                "type": "CIMGeometricEffectDashes",
                "dashTemplate": dash_template,
                "lineDashEnding": "NoConstraint",
                "controlPointEnding": "NoConstraint",
            }
            line["effects"] = [effect]
        return line

    def get_cim_solid_fill(self, service_symbol: service_types.Symbol) -> cim_types.CIMSolidFill:
        return {
            "type": "CIMSolidFill",
            "enable": True,
            "color": self.get_cim_color(service_symbol.get("color", [0, 0, 0, 255])),
        }

    def get_symbol_layers(self, service_symbol: service_types.Symbol) -> list[cim_types.SymbolLayer]:
        match service_symbol["type"]:
            case "esriSLS":
                return [self.get_cim_solid_stroke(service_symbol)]
            case "esriSFS":
                layers = []
                if service_symbol.get("outline"):
                    layers += [self.get_cim_solid_stroke(service_symbol.get("outline"))]
                layers += [self.get_cim_solid_fill(service_symbol)]
                return layers
            case _:
                if settings.DEBUG:
                    raise NotImplementedError()
                return []

    def get_cim_marker_graphic(self, service_symbol: service_types.Symbol) -> cim_types.CIMMarkerGraphic:
        graphic: cim_types.CIMMarkerGraphic = {
            "type": "CIMMarkerGraphic",
            "geometry": self.get_geometry(service_symbol),
            "symbol": {"type": "CIMPolygonSymbol", "symbolLayers": self.get_symbol_layers(service_symbol)},
        }
        return graphic

    def get_cim_vector_marker(self, service_symbol: service_types.Symbol) -> cim_types.CIMVectorMarker:
        marker: cim_types.CIMVectorMarker = {
            "type": "CIMVectorMarker",
            "enable": True,
            "anchorPointUnits": "Relative",
            "dominantSizeAxis3D": "Z",
            "size": 4,
            "billboardMode3D": "FaceNearPlane",
            "frame": {"xmin": -2, "ymin": -2, "xmax": 2, "ymax": 2},
            "markerGraphics": [self.get_cim_marker_graphic(service_symbol)],
            "respectFrame": True,
        }
        return marker

    def get_cim_picture_marker(self, service_symbol: service_types.Symbol) -> cim_types.CIMPictureMarker:
        marker: cim_types.CIMPictureMarker = {
            "type": "CIMPictureMarker",
            "enable": True,
            "anchorPoint": {"x": 0, "y": 0, "z": 0},
            "anchorPointUnits": "Relative",
            "dominantSizeAxis3D": "Y",
            "size": 12,
            "billboardMode3D": "FaceNearPlane",
            "invertBackfaceTexture": True,
            "scaleX": 1,
            "textureFilter": "Draft",
            "tintColor": {"type": "CIMRGBColor", "values": [255, 255, 255, 100]},
            "url": f"data:{service_symbol['contentType']};base64,{service_symbol['imageData']}",
        }
        return marker

    def get_symbol_layer(self, service_symbol: service_types.Symbol) -> cim_types.SymbolLayer:
        match service_symbol.get("type"):
            case "CIMSymbolReference":
                return self.get_symbol(service_symbol)
            case "esriSLS":
                return self.get_cim_line_symbol(service_symbol)
            case "esriSFS":
                return self.get_cim_polygon_symbol(service_symbol)
            case "esriSMS":
                return self.get_cim_vector_marker(service_symbol)
            case "esriPFS":
                return self.get_cim_polygon_symbol(service_symbol)
            case "esriPMS":
                return self.get_cim_picture_marker(service_symbol)
            case "esriTS":
                return self.get_cim_text_symbol(service_symbol)
            case _:
                logger.error("Unsupported Symbol %s was used")
                return None

    def get_cim_line_symbol(self, service_symbol: service_types.Symbol) -> cim_types.CIMLineSymbol:
        symbol: cim_types.CIMLineSymbol = {
            "type": "CIMLineSymbol",
            "symbolLayers": self.get_symbol_layers(service_symbol),
        }
        return symbol

    def get_cim_mesh_symbol(self, service_symbol: service_types.Symbol) -> cim_types.CIMMeshSymbol:
        if settings.DEBUG:
            raise NotImplementedError()
        return None

    def get_cim_point_symbol(self, service_symbol: service_types.Symbol) -> cim_types.CIMPointSymbol:
        symbol: cim_types.CIMPointSymbol = {
            "type": "CIMPointSymbol",
            "symbolLayers": [self.get_symbol_layer(service_symbol)],
            "haloSize": 1,
            "scaleX": 1,
            "angleAlignment": "Display",
        }
        return symbol

    def get_cim_polygon_symbol(self, service_symbol: service_types.Symbol) -> cim_types.CIMPolygonSymbol:
        symbol: cim_types.CIMPolygonSymbol = {
            "type": "CIMPolygonSymbol",
            "symbolLayers": self.get_symbol_layers(service_symbol),
        }
        return symbol

    def get_cim_text_symbol(self, service_symbol: service_types.Symbol) -> cim_types.CIMTextSymbol:
        symbol: cim_types.CIMTextSymbol = {
            "type": "CIMTextSymbol",
            "blockProgression": "TTB",
            "depth3D": 1,
            "extrapolateBaselines": True,
            "fontEffects": "Normal",
            "fontEncoding": "Unicode",
            "fontFamilyName": service_symbol.get("font", {}).get("family", "Tahoma"),
            "fontStyleName": "Regular",
            "fontType": "Unspecified",
            "height": service_symbol.get("font", {}).get("size", 10),
            "hinting": "Default",
            "horizontalAlignment": "Left",
            "kerning": service_symbol.get("kerning", True),
            "letterWidth": 100,
            "ligatures": True,
            "lineGapType": "ExtraLeading",
            "symbol": {
                "type": "CIMPolygonSymbol",
                "symbolLayers": [
                    {
                        "type": "CIMSolidStroke",
                        "enable": True,
                        "capStyle": "Round",
                        "joinStyle": "Round",
                        "lineStyle3D": "Strip",
                        "miterLimit": 10,
                        "width": service_symbol.get("borderLineSize") or 0,
                        "color": self.get_cim_color(service_symbol.get("borderLineColor") or [0, 0, 0, 255]),
                    },
                    {
                        "type": "CIMSolidFill",
                        "enable": True,
                        "color": self.get_cim_color(service_symbol.get("color") or [0, 0, 0, 255]),
                    },
                ],
            },
            "textCase": "Normal",
            "textDirection": "LTR",
            "verticalAlignment": "Bottom",
            "verticalGlyphOrientation": "Right",
            "wordSpacing": 100,
            "billboardMode3D": "FaceNearPlane",
        }
        if service_symbol.get("haloColor"):
            symbol.update(
                {
                    "haloSize": service_symbol.get("haloSize", 1),
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
                                "color": self.get_cim_color(service_symbol["haloColor"]),
                            },
                            {
                                "type": "CIMSolidFill",
                                "enable": True,
                                "color": self.get_cim_color(service_symbol["haloColor"]),
                            },
                        ],
                    },
                }
            )
        return symbol

    def get_cim_symbol_reference(
        self, service_symbol: Optional[service_types.Symbol]
    ) -> Optional[cim_types.CIMSymbolReference]:
        if not service_symbol:
            return None
        symbol: cim_types.CIMSymbolReference = {"type": "CIMSymbolReference", "symbol": self.get_symbol(service_symbol)}
        return symbol

    def get_symbol(self, service_symbol: Optional[service_types.Symbol]) -> Optional[cim_types.Symbol]:
        if not service_symbol:
            return None
        match service_symbol.get("type"):
            case "CIMSymbolReference":
                return self.get_symbol(service_symbol.get("symbol"))
            case "esriSLS":
                return self.get_cim_line_symbol(service_symbol)
            case "esriSFS":
                return self.get_cim_polygon_symbol(service_symbol)
            case "esriSMS":
                return self.get_cim_point_symbol(service_symbol)
            case "esriPFS":
                return self.get_cim_polygon_symbol(service_symbol)
            case "esriPMS":
                return self.get_cim_point_symbol(service_symbol)
            case "esriTS":
                return self.get_cim_text_symbol(service_symbol)
            case _:
                logger.error("Unsupported Symbol %s was used")
                return None

    def get_cim_unique_value_class(self, value_info: service_types.UniqueValueInfo) -> cim_types.CIMUniqueValueClass:
        value_class: cim_types.CIMUniqueValueClass = {
            "type": "CIMUniqueValueClass",
            "label": value_info["label"],
            "patch": "Default",
            "symbol": self.get_cim_symbol_reference(value_info["symbol"]),
            "values": [{"type": "CIMUniqueValue", "fieldValues": [str(value_info["value"])]}],
            "visible": True,
        }
        return value_class

    def get_cim_unique_value_group(self, service_renderer: service_types.Renderer) -> cim_types.CIMUniqueValueGroup:
        group: cim_types.CIMUniqueValueGroup = {
            "type": "CIMUniqueValueGroup",
            "classes": [self.get_cim_unique_value_class(info) for info in service_renderer.get("uniqueValueInfos", [])],
        }
        return group

    def get_simple_renderer(self, service_renderer: service_types.SimpleRenderer) -> cim_types.CIMSimpleRenderer:
        renderer: cim_types.CIMSimpleRenderer = {
            "type": "CIMSimpleRenderer",
            "patch": "Default",
            "symbol": self.get_cim_symbol_reference(service_renderer["symbol"]),
            "label": service_renderer["label"],
            "description": service_renderer["description"],
        }
        return renderer

    def get_unique_value_renderer(
        self, service_renderer: service_types.UniqueValueRenderer
    ) -> cim_types.CIMUniqueValueRenderer:
        fields = [
            field
            for field in [
                service_renderer.get("field1"),
                service_renderer.get("field2"),
                service_renderer.get("field3"),
            ]
            if field
        ]
        renderer: cim_types.CIMUniqueValueRenderer = {
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
            "defaultLabel": service_renderer.get("defaultLabel", "Other"),
            "defaultSymbol": self.get_cim_symbol_reference(service_renderer.get("defaultSymbol")),
            "defaultSymbolPatch": "Default",
            "fields": fields,
            "groups": [self.get_cim_unique_value_group(service_renderer)],
            "useDefaultSymbol": True,
            "polygonSymbolColorTarget": "Fill",
        }
        return renderer

    def get_cim_renderer(self, drawingInfo: service_types.DrawingInfo) -> Optional[cim_types.Renderer]:
        renderer = drawingInfo.get("renderer")
        match renderer:
            case {"type": "simple"}:
                return self.get_simple_renderer(renderer)
            case {"type": "uniqueValue"}:
                return self.get_unique_value_renderer(renderer)
            case _:
                if settings.DEBUG:
                    raise NotImplementedError("The renderer type: %s is not supported", renderer.get("type"))
                return None

    def get_cim_field_descriptions(
        self, service_spec: service_types.MapServiceSpecification
    ) -> list[cim_types.CIMFieldDescription]:
        cim_field_descriptions: list[cim_types.CIMFieldDescription] = []
        for field in service_spec.get("fields"):
            cim_field_descriptions.append(
                {
                    "type": "CIMFieldDescription",
                    "alias": field["alias"],
                    "fieldName": field["name"],
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
            )
        return cim_field_descriptions

    def get_cim_feature_table(self, service_spec: service_types.MapServiceSpecification) -> cim_types.CIMFeatureTable:
        cim_feature_table: cim_types.CIMFeatureTable = {
            "type": "CIMFeatureTable",
            "displayField": "name",
            "editable": True,
            "fieldDescriptions": self.get_cim_field_descriptions(service_spec),
            "dataConnection": {
                "type": "CIMStandardDataConnection",
                "workspaceConnectionString": f"AUTHENTICATION_MODE=OSA;DATABASE={self._file_path}",
                "workspaceFactory": "Sql",
                "dataset": f"main.\"{slugify(service_spec['name'])}\"",
                "datasetType": "esriDTFeatureClass",
            },
            "studyAreaSpatialRel": "esriSpatialRelUndefined",
            "searchOrder": "esriSearchOrderSpatial",
        }
        return cim_feature_table

    @staticmethod
    def get_cim_standard_label_placement_properties(
        label_placement: service_types.LabelPlacement,
    ) -> cim_types.CIMStandardLabelPlacementProperties:

        placement_properties: cim_types.CIMStandardLabelPlacementProperties = {
            "type": "CIMStandardLabelPlacementProperties",
        }
        match label_placement:
            case "esriServerLinePlacementAboveAfter":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPriorities", "aboveEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementAboveAlong":

                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "aboveAlong": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementAboveBefore":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "aboveStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementAboveEnd":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "aboveEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementAboveStart":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "aboveStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementBelowAfter":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "belowEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementBelowAlong":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "belowAlong": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementBelowBefore":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "belowStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementBelowEnd":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "belowEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementBelowStart":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "belowStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementCenterAfter":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "centerEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementCenterAlong":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "centerAlong": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementCenterBefore":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "centerStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementCenterEnd":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "centerEnd": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerLinePlacementCenterStart":
                placement_properties["lineLabelPriorities"] = {"type": "CIMStandardLineLabelPosition", "centerStart": 1}
                placement_properties["featureType"] = "Line"
            case "esriServerPointLabelPlacementAboveCenter":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "aboveCenter": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementAboveLeft":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "aboveLeft": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementAboveRight":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "aboveRight": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementBelowCenter":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "belowCenter": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementBelowLeft":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "belowLeft": 1,
                }

            case "esriServerPointLabelPlacementBelowRight":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "belowRight": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementCenterCenter":
                # according to the link there is no center center?
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementCenterLeft":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "centerLeft": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPointLabelPlacementCenterRight":
                placement_properties["pointPlacementPriorities"] = {
                    "type": "CIMStandardPointPlacementPriorities",
                    "centerRight": 1,
                }
                placement_properties["featureType"] = "Point"
            case "esriServerPolygonPlacementAlwaysHorizontal":
                placement_properties["polygonPlacementMethod"] = "AlwaysHorizontal"
                placement_properties["featureType"] = "Polygon"
        return placement_properties

    def get_cim_label_classes(
        self, name: str = None, label_infos: list[service_types.LabelingInfo] = None
    ) -> list[cim_types.CIMLabelClass]:
        label_classes = []
        label_class_name = copy.deepcopy(name)
        if not label_class_name:
            label_class_name = str(uuid.uuid4())
        if not label_infos:
            return label_classes
        for index, label_info in enumerate(label_infos):
            text_symbol = self.get_cim_symbol_reference(label_info["symbol"])
            if not text_symbol:
                continue
            # Doesn't account for "where" property
            label: cim_types.CIMLabelClass = {
                "type": "CIMLabelClass",
                "priority": 1,
                "expressionTitle": "Custom",
                "expression": ArcGISLayer.parse_label_expression(label_info.get("labelExpression")),
                "expressionEngine": "Python",
                "featuresToLabel": "AllVisibleFeatures",
                "textSymbol": text_symbol,
                "useCodedValue": label_info.get("useCodedValues") or True,
                "name": f"{label_class_name} {index}",
                "visibility": True,
                "minimumScale": label_info["minScale"],
                "maximumScale": label_info["maxScale"],
                "standardLabelPlacementProperties": ArcGISLayer.get_cim_standard_label_placement_properties(
                    label_info.get("labelPlacement")
                ),
            }
            label["maplexLabelPlacementProperties"] = {
                "type": "CIMMaplexLabelPlacementProperties",
                "featureType": label["standardLabelPlacementProperties"]["featureType"],
            }
            label_classes += [label]
        return label_classes

    def get_cim_feature_layer(self, service_spec: service_types.MapServiceSpecification) -> cim_types.CIMFeatureLayer:
        cim_path = f"CIMPATH=internal_map/{service_spec['name']}.xml"

        feature_layer: cim_types.CIMFeatureLayer = {
            "type": "CIMFeatureLayer",
            "name": service_spec["name"],
            "uRI": cim_path,
            "sourceModifiedTime": {"type": "TimeInstant"},
            "minScale": service_spec.get("minScale", 750000),
            "maxScale": service_spec.get("maxScale", 0),
            "useSourceMetadata": True,
            "description": service_spec.get("description"),
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
            "featureTable": self.get_cim_feature_table(service_spec),
            "htmlPopupEnabled": True,
            "selectable": True,
            "featureCacheType": "Session",
            "displayFiltersType": "ByScale",
            "featureBlendingMode": "Alpha",
            "renderer": self.get_cim_renderer(service_spec.get("drawingInfo")),
            "scaleSymbols": True,
            "snappable": True,
            "labelClasses": self.get_cim_label_classes(
                name=service_spec["name"], label_infos=service_spec.get("drawingInfo", {}).get("labelingInfo", [])
            ),
            "labelVisibility": True,
        }
        return feature_layer

    def get_cim_group_layer(
        self, name: str = None, layer: service_types.MapServiceSpecification = None
    ) -> cim_types.CIMGroupLayer:
        layer_name = name or layer["name"]
        cim_path = f"CIMPATH=internal_map/{layer_name}.xml"

        # If called with a group layer from a service, then we need the sublayers, otherwise create an arbitrary group
        # layer, and add the current layer to it.
        if layer.get("layers"):
            # If layers is present this is a root only add layers if they belong at root level (to avoid duplicates).
            sublayers = [
                self.get_cim_layer(sublayer) for sublayer in layer["layers"] if not sublayer.get("parentLayer")
            ]
        elif layer.get("subLayers"):
            sublayers = [self.get_cim_layer(sublayer) for sublayer in layer["subLayers"]]
        else:
            sublayers = [self.get_cim_layer(layer)]

        layers = []
        for sublayer in sublayers:
            if layer.get("layers", {}) and not sublayer.get("parentLayer"):
                layers.append(sublayer["uRI"])
            else:
                layers.append(sublayer["uRI"])

        return {
            "type": "CIMGroupLayer",
            "name": name or layer["name"],
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
            "serviceLayerID": layer.get("id", -1),
            "refreshRate": -1,
            "refreshRateUnit": "esriTimeUnitsSeconds",
            "blendingMode": "Alpha",
            "layers": layers,
            "layerDefinitions": sublayers,
        }

    @staticmethod
    def parse_label_expression(label_exp: str) -> str:
        """
         Parses a labelExpression from an arcgis service and converts it to a python formatted syntax string.
         @param: A string with python syntax to format the string.
        @return: if data is only alphanumeric or '_' chars.
        >>> ArcGISLayer.parse_label_expression('\"Title:\" CONCAT [field]')
        '\"Title:\" + [field]'
        >>> ArcGISLayer.parse_label_expression('\"Title:\" NEWLINE [field]')
        '\"Title:\" \\n [field]'
        >>> ArcGISLayer.parse_label_expression('\"Title:\" CONCAT NEWLINE [field]')
        '\"Title:\" + \\n [field]'
        >>> ArcGISLayer.parse_label_expression('\"Title:\" CONCAT UCASE([field])')
        '\"Title:\" + [field].upper()'
        >>> ArcGISLayer.parse_label_expression('\"Title:\" CONCAT LCASE([field])')
        '\"Title:\" + [field].lower()'
        >>> ArcGISLayer.parse_label_expression('\"Title:\" CONCAT ROUND([field], 3)')
        '\"Title:\" + round([field], 3)'
        >>> ArcGISLayer.parse_label_expression('\"Date:\" CONCAT FORMATDATETIME([field], \"YYYY\")')
        '\"Date:\" + [field]'
        """

        def reg_replace(m):
            return m.group(1)

        def round_str(m):
            number_field = m.group(1)
            integer = int(m.group(2))
            return f"round({number_field}, {integer})"

        def datetime_str(m):
            # needs to be improved to actually format date.
            return m.group(1)

        python_label: str = copy.copy(label_exp)
        keywords = {
            r"\sCONCAT\s": " + ",
            r"\sNEWLINE\s": " \n ",
            r"UCASE\((.*)\)": lambda x: f"{reg_replace(x)}.upper()",
            r"LCASE\((.*)\)": lambda x: f"{reg_replace(x)}.lower()",
            r"ROUND\((.*),(.*)\)": round_str,
            r"FORMATDATETIME\((.*),(.*)\)": datetime_str,
        }

        for regex, replacement in keywords.items():
            python_label = re.sub(regex, replacement, python_label)

        return python_label

    def get_cim_layer(
        self, service_specification: service_types.MapServiceSpecification
    ) -> Optional[cim_types.LayerDefinition]:
        match service_specification.get("type"):
            case "Group Layer":
                return self.get_cim_group_layer(service_specification["name"], layer=service_specification)
            case "Feature Layer":
                return self.get_cim_feature_layer(service_specification)
            case _:
                return None

    def flatten_layers(self, layer_group: cim_types.LayerDefinition) -> list[cim_types.LayerDefinition]:
        layers = []
        layerDefinitions = layer_group.pop("layerDefinitions", [])
        for layer in layerDefinitions:
            layers += self.flatten_layers(layer)
        layers += [layer_group]
        return layers

    def get_cim_layer_document(self) -> cim_types.CIMLayerDocument:
        layer_group = self.get_cim_group_layer(self._layer_name, self._service_specification)
        layer_definitions = self.flatten_layers(layer_group)
        # Deduplicate the layers.
        layer_definitions = list({layer["uRI"]: layer for layer in layer_definitions}.values())

        cim_document = {
            "type": "CIMLayerDocument",
            "version": "2.7.0",
            "build": 26828,
            "layers": [layer_group["uRI"]],
            "layerDefinitions": layer_definitions,
            "binaryReferences": [],
            "elevationSurfaces": [],
            "rGBColorProfile": "sRGB IEC61966-2-1 noBPC",
            "cMYKColorProfile": "U.S. Web Coated (SWOP) v2",
        }
        return cim_document
