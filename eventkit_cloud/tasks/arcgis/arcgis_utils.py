import json

from eventkit_cloud.tasks.arcgis.types import CIMSimpleRenderer

renderers = {"simple": "CIMSimpleRenderer",
             "uniqueValue": "CIMUniqueValueRenderer"}
base_symbols = {"esriSLSSolid": "Highway",
                "esriSMSCircle": "Circle3",
                "esriSFSSolid": 'square',
                "esriSLSDashDot": 'dashed with one dot',
                "esriTS": 'text marker',
                "esriSLSDash": 'dashed 2:2',
                "esriPMS": '?????',
}

def set_renderer(layer, renderer_type):
    renderer = renderers.get(renderer_type)
    if renderer:
        sym = layer.symbology
        sym.updateRenderer(renderer)
        layer.symbology = sym

def set_symbol(layer, symbol_json):
    sym = layer.symbology
    sym.renderer.symbol.applySymbolFromGallery(base_symbols.get(symbol_json["style"]))
    color = symbol_json['color']
    width = symbol_json['width']
    sym.renderer.symbol.color = {'RGB': color}
    sym.renderer.symbol.size = width
    layer.symbology = sym


def update_layer_symbology(layer, layer_json):
    data = json.loads(layer_json)
    draw_json = data["drawingInfo"]
    if draw_json:
        render_json = draw_json["renderer"]
        render_type = render_json["type"]
        set_renderer(layer, render_type)
        if render_type == "simple":
            set_symbol(layer, render_json["symbol"])
        elif render_type == "uniqueValue":
            symbols = render_json["uniqueValueInfos"]
            for symbol in symbols:
                set_symbol(layer, symbol)

def get_renderer_json():
    renderer: CIMSimpleRenderer = {
        "type": "CIMSimpleRenderer",
        "patch": "Default",
        "symbol": {
          "type": "CIMSymbolReference",
          "symbol": {
            "type": "CIMLineSymbol",
            "symbolLayers": [
              {
                "type" : "CIMSolidStroke",
                "enable" : True,
                "capStyle" : "Round",
                "joinStyle" : "Round",
                "lineStyle3D" : "Strip",
                "miterLimit" : 10,
                "width" : 1,
                "color" : {
                  "type" : "CIMRGBColor",
                  "values" : [
                    45.090000000000003,
                    173.40000000000001,
                    156.30000000000001,
                    100
                  ]
                }
              }
            ]
          }
        }
      }
    return renderer

# f = open(filepath)
# f_str = f.read()
# parse_json(f_str)