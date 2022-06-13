
def create_arcgis_layer_file(file_path: str, service_capabilities: dict) -> str:
    with open(file_path, "w") as layer_file:
        layer_file.write("test")
    return file_path
