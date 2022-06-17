import json
from typing import Literal, Optional

import logging
from django.utils.text import slugify

from eventkit_cloud.utils.arcgis.markers import get_marker_geometry
from eventkit_cloud.utils.arcgis.types import cim_types, service_types

logger = logging.getLogger(__file__)
logging.basicConfig(level=logging.DEBUG)


def get_geometry(service_symbol: service_types.Symbol) -> cim_types.Geometry:
    return get_marker_geometry(service_symbol)

def get_cim_color(service_color: service_types.Color) -> cim_types.CIMRGBColor:
    color:cim_types.CIMRGBColor = {"type": "CIMRGBColor",
    "values": [
        service_color[0],
        service_color[1],
        service_color[2],
        int((service_color[3]/255) * 100)
    ]}
    return color

def get_symbol_layers(service_symbol: service_types.Symbol) -> list[cim_types.SymbolLayer]:
    layers = []
    outline: Optional[service_types.SimpleLineSymbol] = service_symbol.get("outline")
    if outline:
        layers += [
            {
                "type": "CIMSolidStroke",
                "enable": True,
                "capStyle": "Round",
                "joinStyle": "Round",
                "lineStyle3D": "Strip",
                "miterLimit": 10,
                "width": 0.69999999999999996,
                "color": {
                    "type": "CIMRGBColor",
                    "values": [
                        service_symbol['outline']['color'][0],
                        service_symbol['outline'][1],
                        service_symbol['outline'][2],
                        100
                    ]
                }
            }
        ]
    layers += [

    ]
def get_cim_marker_graphic(service_symbol: service_types.Symbol) -> cim_types.CIMMarkerGraphic:
    graphic: cim_types.CIMMarkerGraphic = {
                "type": "CIMMarkerGraphic",
                "geometry": get_geometry(service_symbol),
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
                            "width": 0.69999999999999996,
                            "color": {
                                "type": "CIMRGBColor",
                                "values": [
                                    service_symbol['outline']['color'][0],
                                    service_symbol['outline'][1],
                                    service_symbol['outline'][2],
                                    100
                                ]
                            }
                        },
                        {
                            "type": "CIMSolidFill",
                            "enable": True,
                            "color": {
                                "type": "CIMRGBColor",
                                "values": [
                                    130,
                                    130,
                                    130,
                                    100
                                ]
                            }
                        }
                    ]
                }
            }
    return graphic

def get_cim_vector_marker(service_symbol: service_types.Symbol) -> cim_types.CIMVectorMarker:
    marker: cim_types.CIMVectorMarker = {
        "type": "CIMVectorMarker",
        "enable": True,
        "anchorPointUnits": "Relative",
        "dominantSizeAxis3D": "Z",
        "size": 4,
        "billboardMode3D": "FaceNearPlane",
        "frame": {
            "xmin": -2,
            "ymin": -2,
            "xmax": 2,
            "ymax": 2
        },
        "markerGraphics": [get_cim_marker_graphic(service_symbol)],
        "respectFrame": True
    }
    return marker


def get_symbol_layer(service_symbol: service_types.Symbol) -> cim_types.SymbolLayer:
    match service_symbol.get("type"):
        case "CIMSymbolReference":
            return get_symbol(service_symbol.get("symbol"))
        case "esriSLS":
            return get_cim_line_symbol()
        case "esriSFS":
            return get_cim_polygon_symbol()
        case "esriSMS":
            return get_cim_vector_marker()
        case "esriPFS":
            return get_cim_polygon_symbol()
        case "esriPMS":
            return get_cim_vector_marker()
        case "esriTS":
            return get_cim_text_symbol()
        case _:
            logger.error("Unsupported Symbol %s was used")
            return {}


def get_cim_line_symbol(service_symbol: service_types.Symbol) -> cim_types.CIMLineSymbol:
    raise NotImplementedError()


def get_cim_mesh_symbol(service_symbol: service_types.Symbol) -> cim_types.CIMMeshSymbol:
    raise NotImplementedError()


def get_cim_point_symbol(service_symbol: service_types.Symbol) -> cim_types.CIMPointSymbol:
    symbol: cim_types.CIMPointSymbol = {
        "type": "CIMPointSymbol",
        "symbolLayers": [get_symbol_layer(service_symbol.get("symbol"))],
        "haloSize": 1,
        "scaleX": 1,
        "angleAlignment": "Display"
    }
    return symbol


def get_cim_polygon_symbol(service_symbol: service_types.Symbol) -> cim_types.CIMPolygonSymbol:
    raise NotImplementedError()


def get_cim_text_symbol(service_symbol: service_types.Symbol) -> cim_types.CIMTextSymbol:
    raise NotImplementedError()


def get_cim_symbol_reference(service_symbol: service_types.Symbol) -> cim_types.CIMSymbolReference:
    symbol: cim_types.CIMSymbolReference = {
        "type": "CIMSymbolReference",
        "symbol": get_symbol(service_symbol)
    }
    return symbol


def get_symbol(service_symbol: service_types.Symbol) -> cim_types.Symbol:
    match service_symbol.get("type"):
        case "CIMSymbolReference":
            return get_symbol(service_symbol.get("symbol"))
        case "esriSLS":
            return get_cim_line_symbol(service_symbol)
        case "esriSFS":
            return get_cim_polygon_symbol(service_symbol)
        case "esriSMS":
            return get_cim_point_symbol(service_symbol)
        case "esriPFS":
            return get_cim_polygon_symbol(service_symbol)
        case "esriPMS":
            return get_cim_point_symbol(service_symbol)
        case "esriTS":
            return get_cim_text_symbol(service_symbol)
        case _:
            logger.error("Unsupported Symbol %s was used")
            return {}

def get_cim_unique_value_class(value_info: service_types.UniqueValueInfo) -> cim_types.CIMUniqueValueClass:
    value_class: cim_types.CIMUniqueValueClass = {
                "type" : "CIMUniqueValueClass",
                "label" : value_info['label'],
                "patch" : "Default",
                "symbol" : get_cim_symbol_reference(value_info['symbol']),
                "values" : [
                  {
                    "type" : "CIMUniqueValue",
                    "fieldValues" : [str(value_info['value'])]
                  }
                ],
                "visible" : True
              }
    return value_class

def get_cim_unique_value_group(service_renderer: service_types.Renderer) -> cim_types.CIMUniqueValueGroup:
    group: cim_types.CIMUniqueValueGroup = {
            "type" : "CIMUniqueValueGroup",
            "classes" : [get_cim_unique_value_class(info) for info in service_renderer.get("uniqueValueInfos", [])],
            "heading" : "HEADING!"
          }
    return group



def get_simple_renderer(service_renderer: service_types.Renderer) -> cim_types.CIMSimpleRenderer:
    raise NotImplementedError()
    return {}


def get_unique_value_renderer(service_renderer: service_types.Renderer) -> cim_types.CIMUniqueValueRenderer:
    fields = [field for field in
              [service_renderer.get("field1"), service_renderer.get("field2"), service_renderer.get("field3")] if field]
    renderer: cim_types.CIMUniqueValueRenderer = {
        "type": "CIMUniqueValueRenderer",
        "colorRamp": {
            "type": "CIMRandomHSVColorRamp",
            "colorSpace": {
                "type": "CIMICCColorSpace",
                "url": "Default RGB"
            },
            "maxH": 360,
            "minS": 15,
            "maxS": 30,
            "minV": 99,
            "maxV": 100,
            "minAlpha": 100,
            "maxAlpha": 100
        },
        "defaultLabel": service_renderer.get("defaultLabel", "Other"),
        "defaultSymbol": get_cim_symbol_reference(service_renderer.get("defaultSymbol")),
        "defaultSymbolPatch": "Default",
        "fields": fields,
        "groups": [get_cim_unique_value_group(service_renderer)],
        "useDefaultSymbol": True,
        "polygonSymbolColorTarget": "Fill"
    }
    return renderer


def get_cim_renderer(drawingInfo: service_types.DrawingInfo) -> cim_types.Renderer:
    renderers = {"simple": get_simple_renderer, "uniqueValue": get_unique_value_renderer}
    service_renderer = drawingInfo.get("renderer", {})
    return renderers.get(service_renderer.get("type")) or {}


def get_cim_field_descriptions(service_spec: service_types.MapServiceSpecification) -> list[
    cim_types.CIMFieldDescription]:
    cim_field_descriptions: list[cim_types.CIMFieldDescription] = []
    for field in service_spec.get("fields"):
        cim_field_descriptions.append({
            "type": "CIMFieldDescription",
            "alias": field['alias'],
            "fieldName": field['name'],
            "numberFormat": {
                "type": "CIMNumericFormat",
                "alignmentOption": "esriAlignRight",
                "alignmentWidth": 0,
                "roundingOption": "esriRoundNumberOfDecimals",
                "roundingValue": 6
            },
            "visible": True,
            "searchMode": "Exact"
        })
    return cim_field_descriptions


def get_cim_feature_table(service_spec: service_types.MapServiceSpecification) -> cim_types.CIMFeatureTable:
    cim_feature_table: cim_types.CIMFeatureTable = {"type": "CIMFeatureTable",
                                                    "displayField": "name",
                                                    "editable": True,
                                                    "fieldDescriptions": get_cim_field_descriptions(service_spec),
                                                    "dataConnection": {
                                                        "type": "CIMStandardDataConnection",
                                                        "workspaceConnectionString": "AUTHENTICATION_MODE=OSA;DATABASE=data\\data\\template.gpkg",
                                                        "workspaceFactory": "Sql",
                                                        "dataset": f"main.{slugify(service_spec['name'])}",
                                                        "datasetType": "esriDTFeatureClass"
                                                    },
                                                    "studyAreaSpatialRel": "esriSpatialRelUndefined",
                                                    "searchOrder": "esriSearchOrderSpatial"
                                                    }
    return cim_feature_table


def get_cim_feature_layer(service_spec: service_types.MapServiceSpecification) -> dict[str, cim_types.CIMFeatureLayer]:
    cim_path = f"internal_map/{service_spec['name']}"
    cim_feature_layer: cim_types.CIMFeatureLayer = {cim_path: {
        "type": Literal["CIMFeatureLayer"],
        "name": service_spec["name"],
        "uRI": cim_path,
        "sourceModifiedTime": {
            "type": "TimeInstant"
        },
        "minScale": service_spec.get("minScale", 750000),
        "maxScale": service_spec.get("maxScale", 0),
        # "metadataURI": "CIMPATH=Metadata/17c09fe7552f53d41973af1ecb1d6b1f.xml",
        "useSourceMetadata": True,
        "description": service_spec.get("description"),
        "layerElevation": {
            "type": "CIMLayerElevationSurface",
            "mapElevationID": "{752ADD4F-A4BC-44F1-8B73-D03138DD2020}"
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
        "featureTable": get_cim_feature_table(service_spec),
        "htmlPopupEnabled": True,
        "selectable": True,
        "featureCacheType": "Session",
        "displayFiltersType": "ByScale",
        "featureBlendingMode": "Alpha",
        "renderer": {
            "type": "CIMSimpleRenderer",
            "patch": "Default",
            "symbol": {
                "type": "CIMSymbolReference",
                "symbol": {
                    "type": "CIMPointSymbol",
                    "symbolLayers": [
                        {
                            "type": "CIMPictureMarker",
                            "enable": True,
                            "anchorPoint": {
                                "x": 0,
                                "y": 0,
                                "z": 0
                            },
                            "anchorPointUnits": "Relative",
                            "dominantSizeAxis3D": "Y",
                            "size": 12,
                            "billboardMode3D": "FaceNearPlane",
                            "invertBackfaceTexture": True,
                            "scaleX": 1,
                            "textureFilter": "Draft",
                            "tintColor": {
                                "type": "CIMRGBColor",
                                "values": [
                                    255,
                                    255,
                                    255,
                                    100
                                ]
                            },
                            "url": ""
                        }
                    ],
                    "haloSize": 1,
                    "scaleX": 1,
                    "angleAlignment": "Display"
                }
            }
        },
        "scaleSymbols": True,
        "snappable": True}
    }
    return cim_feature_layer


def get_cim_group_layer(name: str = None, layer: service_types.MapServiceSpecification = None) -> dict[
                                                                                                  str: cim_types.CIMGroupLayer]:
    layer_name = name or layer["name"]
    cim_path = f"CIMPATH={layer_name}Group.xml"
    cim_group_layer = {cim_path: {"type": "CIMGroupLayer",
                                  "name": name or layer["name"],
                                  "uRI": cim_path,
                                  "sourceModifiedTime": {
                                      "type": "TimeInstant"
                                  },
                                  # "metadataURI": "CIMPATH=Metadata/fa1f8760f6c9e4a003427e63495e5627.xml",
                                  "useSourceMetadata": True,
                                  "layerElevation": {
                                      "type": "CIMLayerElevationSurface",
                                      "mapElevationID": "{752ADD4F-A4BC-44F1-8B73-D03138DD2020}"
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
                                  "layers": []
                                  }}
    return cim_group_layer


def get_cim_layer(service_specification: service_types.MapServiceSpecification):
    match service_specification.get("type"):
        case "Group Layer":
            return get_cim_group_layer(service_specification)
        case "Feature Layer":
            return get_cim_feature_layer(service_specification)


def get_cim_layer_document(layer_name: str,
                           service_specification: service_types.MapServiceSpecification) -> cim_types.CIMLayerDocument:
    layers = get_cim_group_layer(layer_name, service_specification)
    cim_document = {
        "type": "CIMLayerDocument",
        "version": "2.7.0",
        "build": 26828,
        "layers": list(layers.keys()),
        "layerDefinitions": list(layers.values()),
        "binaryReferences": [],
        "elevationSurfaces": [],
        "rGBColorProfile": "sRGB IEC61966-2-1 noBPC",
        "cMYKColorProfile": "U.S. Web Coated (SWOP) v2"
    }
    return cim_document
