import importlib

client_type_map = {
    "arcgis-feature": "eventkit_cloud.utils.services.arcgis.ArcGIS",
    "arcgis-raster": "eventkit_cloud.utils.services.arcgis.ArcGIS",
    "default": "eventkit_cloud.utils.services.base.GisClient",
}


def get_client(provider_type_name):
    provider_type_class = client_type_map.get(provider_type_name) or client_type_map.get("default")
    # instantiate the required class.
    parts = provider_type_class.split(".")
    module_path, class_name = ".".join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    return getattr(module, class_name)
