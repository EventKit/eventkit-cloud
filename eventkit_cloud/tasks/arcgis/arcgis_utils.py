import json

renderers = {"simple": "SimpleRenderer"}
base_symbols = {"esriSLSSolid": "Highway"}

def updateRenderer(layer, drawing_info):
    renderers = {"simple": "SimpleRenderer"}
    base_symbols = {"esriSLSSolid": "Highway"}
    sym = layer.symbology
    sym.updateRenderer(renderers.get(drawing_info['renderer']['type']))
    sym.renderer.symbol.applySymbolFromGallery(base_symbols.get(drawing_info['renderer']['symbol']['type']))
    #set the color
    layer.symbology = sym

def set_renderer(layer, renderer_type):
    renderer = renderers.get(renderer_type)
    if renderer:
        sym = layer.symbology
        sym.updateRenderer(renderer)
        layer.symbology = sym

def set_symbol(layer, symbol_json):
    sym = layer.symbology

    sym.renderer.symbol.applySymbolFromGallery(base_symbols.get(symbol_json[]))
    sym_style = sym_json["style"]
    symbol = base_symbols.get(sym_style)
    color = sym_json['color']
    width = sym_json['width']


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




# f = open(filepath)
# f_str = f.read()
# parse_json(f_str)