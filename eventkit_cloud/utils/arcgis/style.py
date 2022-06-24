import json

from eventkit_cloud.utils.arcgis.arcgis_utils import get_cim_layer_document


def create_arcgis_layer_file(file_path: str, layer: str, service_capabilities: dict) -> str:
    doc = get_cim_layer_document(layer, service_capabilities)
    with open(file_path, "w") as layer_file:
        layer_file.write(json.dumps(doc))
    return file_path
