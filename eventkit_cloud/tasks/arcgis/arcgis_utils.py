def updateRenderer(layer, drawing_info):
    renderers = {"simple": "SimpleRenderer"}
    symbols = {"esriSLSSolid": "Highway"}
    layer.symbology
    sym = layer.symbology
    sym.updateRenderer(renderers.get(drawing_info['renderer']['type']))
    sym.renderer.symbol.applySymbolFromGallery(symbols.get(drawing_info['renderer']['symbol']['type']))
    #set the color
    layer.symbology = sym

def parse_json(obj_str):
    import json
    data = json.loads(obj_str)


# f = open(filepath)
# f_str = f.read()
# parse_json(f_str)