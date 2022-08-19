import importlib
from typing import Dict, List, Optional

client_type_map: Dict[str, str] = {
    "arcgis-feature": "eventkit_cloud.utils.services.arcgis.ArcGIS",
    "arcgis-raster": "eventkit_cloud.utils.services.arcgis.ArcGIS",
    "wfs": "eventkit_cloud.utils.services.wfs.WFS",
    "wcs": "eventkit_cloud.utils.services.wcs.WCS",
    "wms": "eventkit_cloud.utils.services.wms.WMS",
    "osm": "eventkit_cloud.utils.services.overpass.Overpass",
    "osm-generic": "eventkit_cloud.utils.services.overpass.Overpass",
    "wmts": "eventkit_cloud.utils.services.wmts.WMTS",
    "tms": "eventkit_cloud.utils.services.tms.TMS",
    "vector-file": "eventkit_cloud.utils.services.file.FileClient",
    "raster-file": "eventkit_cloud.utils.services.file.FileClient",
    "ogcapi-process": "eventkit_cloud.utils.services.ogcapi_process.OGCAPIProcess",
    "ogcapi-process-elevation": "eventkit_cloud.utils.services.ogcapi_process.OGCAPIProcess",
    "ogcapi-process-raster": "eventkit_cloud.utils.services.ogcapi_process.OGCAPIProcess",
    "ogcapi-process-vector": "eventkit_cloud.utils.services.ogcapi_process.OGCAPIProcess",
    "default": "eventkit_cloud.utils.services.base.GisClient",
}

DEFAULT_CACHE_TIMEOUT = 60 * 30  # 30 minutes


def get_client(provider_type_name):
    provider_type_class = client_type_map.get(provider_type_name) or client_type_map.get("default")
    # instantiate the required class.
    parts: Optional[List[str]] = provider_type_class.split(".")
    module_path, class_name = ".".join(parts[:-1]), parts[-1]
    module = importlib.import_module(module_path)
    return getattr(module, class_name)
