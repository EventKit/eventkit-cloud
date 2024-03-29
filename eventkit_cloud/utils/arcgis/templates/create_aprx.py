# -*- coding: utf-8 -*-

import json
import logging
import os
import shutil
from multiprocessing import Pool

import arcpy

# This file is used to create an aprx file based on a datapack.  It needs to be run via the python application that is
# packaged with arcgis.
# For many users this is the default python, for other users they may have to specify this location
# for example ('C:\Python27\ArcGIS10.5\python create_aprx.py').


logging.basicConfig()
logger = logging.getLogger("create_aprx")

arcpy.AddMessage("Creating an aprx file for your data...")

if os.getenv("LOG_LEVEL"):
    logger.setLevel(os.getenv("LOG_LEVEL"))

try:
    import arcpy
except Exception as e:
    arcpy.AddError(e)
    arcpy.AddError(
        "Could not import ArcPY.  ArcGIS Pro is required to run this script. "
        "Please ensure that it is installed and activated. "
        "If multiple versions of python are installed ensure that you are using python that came bundled with ArcGIS. "
        "Press any key to exit."
    )

CURRENT_VERSION = arcpy.GetInstallInfo().get("Version")
SUPPORTED_VERSIONS = ["2.6", "2.7"]
VERSIONS = ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7"]
UNSUPPORTED_FILES = [".sqlite", ".zip"]

if CURRENT_VERSION not in SUPPORTED_VERSIONS:
    arcpy.AddWarning(
        f"This script only supports versions {SUPPORTED_VERSIONS}. "
        f"This version is {arcpy.GetInstallInfo().get('Version')}. "
        f"It might work for {','.join([version for version in VERSIONS if version not in SUPPORTED_VERSIONS])} "
        "but it will likely not support all of the datasets."
    )


def update_aprx_from_metadata(
    file_name: str, metadata: dict, datapack_path: str, verify: bool = False, version: int = CURRENT_VERSION
):
    """
    :param file_name: A path to the aprx file.
    :param metadata: The metadata providing the names, filepaths, and types to add to the aprx.
    :return: The original file.
    """
    aprx = arcpy.mp.ArcGISProject(os.path.abspath(file_name))
    mapx = aprx.listMaps()[0]
    mapx.name = metadata["name"]
    # Order here matters in which shows up on top, alphabetically makes sense, but it likely is more useful to layer
    # vectors over raster and raster over elevation.
    data_types = ["Elevation", "Raster", "Vector"]

    for data_type in data_types:
        if metadata.get(f"has_{data_type.lower()}"):
            group_layer = add_layer_to_map(data_type, get_layer_file(datapack_path, "group", version), mapx)
            data_sources = get_data_source_by_type(data_type.lower(), metadata["data_sources"])
            add_layers_to_group(data_sources, group_layer, mapx, datapack_path, verify=verify)

    arcpy.AddMessage("Finished adding layers, Saving APRX")
    aprx.save()
    del aprx  # remove handle on file
    return file_name


def add_to_current_project(aprx_file):
    current_aprx = arcpy.mp.ArcGISProject("CURRENT")
    # mapx = arcpy.mp.ArcGISProject(os.path.abspath(aprx_file)).listMaps()[0]
    current_aprx.importDocument(aprx_file)


def get_data_source_by_type(data_type: str, data_sources: dict):
    sources = {}
    for layer_name, layer_info in data_sources.items():
        # A shim while we merge osm and nome into generic data types and come up with a better way to handle styles.
        layer_type = layer_info["type"]
        if layer_info["type"] in ["osm", "nome"]:
            layer_type = "vector"
        if data_type == layer_type:
            sources[layer_name] = layer_info
    return sources


def add_layers_to_group(
    data_sources: dict,
    group_layer: str,
    mapx: arcpy._mp.Map,
    datapack_path: str,
    verify: bool = False,
    version: int = CURRENT_VERSION,
):
    for vector_layer_name, layer_info in data_sources.items():
        for file_info in layer_info["files"]:
            # As of arcgis 10.5.1 shapefiles can't be imported as zips.
            if file_info["file_ext"] in UNSUPPORTED_FILES:
                arcpy.AddWarning(
                    f"This script can't automatically add {file_info['file_ext']} files.  "
                    "You can try to use a template in the folder or manually importing "
                    "the files."
                )
                continue
            file_path = os.path.abspath(os.path.join(datapack_path, file_info["file_path"]))
            # If possible calculate the statistics now so that they are correct when opening ArcPro.
            try:
                arcpy.AddMessage(f"Calculating statistics for the file {file_path}...")
                arcpy.management.CalculateStatistics(file_path)
            except Exception as e:
                arcpy.AddMessage(e)
            if layer_info.get("layer_file"):
                layer_file = os.path.abspath(os.path.join(datapack_path, layer_info.get("layer_file")))
            else:
                layer_file = get_layer_file(datapack_path, layer_info["type"], version)
            if not (layer_file or layer_info["type"].lower() == "vector"):
                arcpy.AddWarning(
                    f"Skipping layer {vector_layer_name} because the file type is not supported for ArcPro {version}"
                )
                continue
            vector_layer_name = (
                f"{layer_info['name']}_{file_info['projection']}{file_info['file_ext'].replace('.', '_')}"
            )
            arc_layer = None  # The arcpy bindings will throw an error instead of returning None.
            if file_info["file_ext"] in [".kml", ".kmz"]:
                # Since this will generate data by converting the KML files, we should store it with the original data.
                output_folder = os.path.join(os.path.dirname(file_path), "arcgis")
                kml_layer = os.path.join(output_folder, f"{vector_layer_name}.lyrx")
                try:
                    arcpy.AddError(f"Converting {file_path} to ArcGIS Layer")
                    arcpy.conversion.KMLToLayer(
                        in_kml_file=file_path,
                        output_folder=output_folder,
                        output_data=vector_layer_name,
                    )
                    arcpy.AddError(f"Successfully converted: {file_path}")
                except Exception as e:
                    # This could fail for various reasons including that the file already exists.
                    # If KMLs are very important to your workflow please contact us and we can make this more robust.
                    arcpy.AddWarning("Could not create a new KML layer file and gdb, it may already exist.")
                    arcpy.AddMessage(e)
                    # We couldn't create the file, try to grab the layer if it exists.
                try:
                    arc_layer = arcpy.mp.LayerFile(kml_layer)
                    if arc_layer:
                        arc_layer.name = vector_layer_name
                        arcpy.AddWarning(f"Adding {layer_info['type']} layer: {vector_layer_name}...")
                        mapx.addLayerToGroup(group_layer, arc_layer, "TOP")
                finally:
                    del arc_layer
            else:
                try:
                    if layer_file:
                        arc_layer = add_layer_to_map(
                            vector_layer_name, layer_file or "group", mapx, group_layer=group_layer
                        )
                        try:
                            arcpy.AddMessage(f"Updating layer: {arc_layer.name}...")
                            update_layer(
                                arc_layer,
                                file_path,
                                layer_info["type"],
                                projection=file_info.get("projection"),
                                verify=verify,
                            )
                        except Exception as e:
                            arcpy.AddError(f"Could not update layer {arc_layer.name}")
                            arcpy.AddError(e)
                    else:
                        # Add arbitrary vector layers.
                        vector_layer_group = add_layer_to_map(
                            vector_layer_name, get_layer_file(datapack_path, "group", version), mapx, group_layer
                        )
                        if not vector_layer_group:
                            arcpy.AddError(f"Could not create vector layer group for: {vector_layer_group.name}")
                            continue
                        create_vector_layers(
                            vector_layer_group, layer_info["layers"], file_info, mapx, datapack_path=datapack_path
                        )
                        del vector_layer_group
                except Exception as e:
                    arcpy.AddError(f"Could not add layer {vector_layer_name} from file_path {file_path}")
                    arcpy.AddError(e)
                finally:
                    del arc_layer


def create_vector_layers(
    vector_layer_group: arcpy._mp.Layer, layers: list, file_info: dict, mapx: arcpy._mp.Map, datapack_path: str
):
    """
    :param vector_layer_group: The Layer which will host the sub layers created here.
    :param layer_info: The .lyr which will be used for the layer template.
    A dictionary include a list of layer names as "layers".
       example:
        ["layer1", "layer2"]
    :param file_info:  A dictionary containing formation about each of the files to be converted...
       example:
       [
            {
                "file_path": "data/osm_tiles/tahoe-4326-osm_tiles-u-20210118.gpkg",
                "file_ext": ".gpkg",
                "projection": "4326"
            },
            {
                "file_path": "data/osm_tiles/tahoe-4326-osm_tiles-u-20210118.tif",
                "file_ext": ".tif",
                "projection": "4326"
            }
        ]
    :param mapx:  The Map document hosting the layers.
    :return: None
    """
    file_path = os.path.abspath(os.path.join(datapack_path, file_info["file_path"]))
    output_folder = os.path.join(os.path.dirname(file_path), "arcgis")
    for sublayer in layers:
        file_ext_slug = file_info["file_ext"].replace(".", "_")
        sublayer_name = f"{sublayer}_{file_info['projection']}{file_ext_slug}"
        arcpy.AddMessage(f"Creating new layer for {sublayer_name}...")
        try:
            arcpy.management.MakeFeatureLayer(f"{file_path.rstrip('/')}/{sublayer}", sublayer_name)
        except Exception as e:
            arcpy.AddError(e)
            arcpy.AddError(f"Could got create a feature layer for {sublayer}")
            continue
        layer_file_path = os.path.abspath(os.path.join(output_folder, f"{sublayer_name}.lyrx"))
        try:
            arcpy.management.SaveToLayerFile(sublayer_name, layer_file_path, "RELATIVE")
        except Exception:
            arcpy.AddWarning(f"Could not create a new layer file: {layer_file_path}, it may already exist.")
        arc_layer = None
        try:
            arc_layer = arcpy.mp.LayerFile(layer_file_path)
            arcpy.AddMessage(f"adding {sublayer_name} to {vector_layer_group.name}")
            # Note ordering is important here since layers are [1,2,3,4] we want to add at bottom.
            mapx.addLayerToGroup(vector_layer_group, arc_layer, "BOTTOM")
        except Exception as e:
            arcpy.AddError(e)
            arcpy.AddError(f"Could not add layer: {arc_layer} to {vector_layer_group} using name {sublayer_name}")
        finally:
            del arc_layer
        if os.path.exists(layer_file_path):
            os.unlink(layer_file_path)


def update_labels(layer):
    if hasattr(layer, "supports") and layer.supports("SHOWLABELS"):
        for lblClass in layer.listLabelClasses():
            lblClass.visible = True
        layer.save()


def add_layer_to_map(
    layer_name: str, layer_path: str, mapx: arcpy._mp.Map, group_layer: arcpy.mp.LayerFile = None
) -> arcpy._mp.Layer:
    """
    :param layer_name: The name of the layer as it will appear in ArcPro.
    :param layer_path: The .lyr which will be used for the layer template.
    :param data_frame:  The dataframe from the map document where the layer should be loaded.
    :return: Layer, raises exception.
    """
    arcpy.AddMessage(f"Creating a group layer for {layer_name}...")
    arcpy.AddMessage(f"From layer_path...{layer_path}")
    layer_file = arcpy.mp.LayerFile(layer_path)
    if group_layer:
        mapx.addLayerToGroup(group_layer, layer_file, "TOP")
        layer = group_layer.listLayers()[0]
    else:
        mapx.addLayer(layer_file, "TOP")
        layer = mapx.listLayers()[0]
    layer.name = layer_name
    update_labels(layer_file)
    return layer


def get_aprx_template(datapack_path):
    """
    :return: A file path to the correct arcgis project template.
    """
    template_file_name = "template-2-7.aprx"
    template_file = os.path.abspath(os.path.join(datapack_path, "arcgis", "templates", template_file_name))
    if not os.path.isfile(template_file):
        arcpy.AddError("This script requires an aprx template file which was not found.")
        raise Exception(f"File Not Found: {template_file}")
    return template_file


def get_layer_file(datapack_path, type, version=CURRENT_VERSION):
    """

    :param type: Type of template (i.e. raster, osm...)
    :param version: arcgis pro version (i.e. 2.7)
    :return: The file path to the correct layer.
    """
    # Use the arcmap 10.6 templates for now.
    version = "10.6"
    for lyr_ext in ["lyrx", "lyr"]:
        layer_basename = f"{type}-{version.replace('.', '-')}.{lyr_ext}"
        layer_file = os.path.abspath(os.path.join(datapack_path, "arcgis", "templates", layer_basename))
        if os.path.isfile(layer_file):
            arcpy.AddMessage(f"Fetching layer template: {layer_file}")
            return layer_file
    return None


def update_layer(layer: arcpy._mp.Layer, file_path: str, type: str, projection: str = None, verify: bool = False):
    """
    :param layer: An Arc Layer object to be updated.
    :param file_path: A new datasource.
    :param verify:  If true will validate the datasource after the layer is updated.
    :return: The updated ext.
    """
    layers = layer.listLayers()
    for lyr in layers:
        try:
            if lyr.supports("DATASOURCE"):
                try:
                    logger.debug(f"layer: {lyr}")
                    logger.debug(f"removing old layer workspacePath: {lyr.dataSource}")
                except Exception:
                    # Skip layers that don't have paths.
                    continue
                try:
                    # Try to update the extents based on the layers
                    logger.debug(f"Updating layers from {lyr.dataSource} to {file_path}")
                    # https://pro.arcgis.com/en/pro-app/latest/arcpy/mapping/updatingandfixingdatasources.htm
                    connection_properties = lyr.connectionProperties
                    logger.debug(f"Updating connection_properties: {connection_properties}")
                    if type == "raster" and os.path.splitext(file_path)[1] != ".gpkg":
                        logger.debug("Replacing Datasource")
                        connection_properties["connection_info"]["database"] = os.path.dirname(file_path)
                        connection_properties["dataset"] = os.path.basename(file_path)
                        connection_properties["workspace_factory"] = "Raster"
                    elif type == "elevation":
                        logger.debug("updating elevation")
                        connection_properties["connection_info"]["database"] = os.path.dirname(file_path)
                        connection_properties["dataset"] = os.path.basename(file_path)
                    else:
                        logger.debug("updating raster or vector gpkg")
                        connection_properties["connection_info"]["database"] = file_path
                        connection_properties["connection_info"]["authentication_mode"] = "OSA"
                    arcpy.AddMessage(lyr.connectionProperties)
                    try:
                        lyr.updateConnectionProperties(lyr.connectionProperties, connection_properties, validate=verify)
                    except Exception as e:
                        arcpy.AddError(f"Invalid connection_properties {connection_properties}.")
                        arcpy.AddError(e)
                    if lyr.isFeatureLayer:
                        try:
                            arcpy.management.RecalculateFeatureClassExtent(lyr)
                        except Exception as e:
                            arcpy.AddWarning(e)
                            arcpy.AddWarning(f"Could not update the extent for {lyr.name} in {file_path}")
                    arcpy.AddMessage(connection_properties)
                except Exception as e:
                    arcpy.AddError(e)
                    raise
        finally:
            del lyr


def create_aprx(datapack_path: str, aprx=None, metadata: dict = None, verify=True):
    """
    Updates the template aprx with a new gpkg datasource. If an aprx is provided the result is written to that file.
    :param aprx: An aprx to write the result to (optional).
    :param metadata: The metadata dict to use for updating the aprx.
    :param verify: Raise an exception if there is an error in the aprx after adding the new gpkg.
    :return: The contents (binary) of the aprx file.
    """
    template_file = get_aprx_template(datapack_path)
    # with get_temp_aprx(metadata, verify=verify) as temp_aprx_file:
    # copy temp file to permanent file if specified.
    if not aprx:
        aprx = get_aprx_file_name(datapack_path)
    arcpy.AddMessage(f"writing file to {aprx}")
    shutil.copy(template_file, aprx)
    try:
        update_aprx_from_metadata(aprx, metadata, datapack_path, verify=verify)
    except Exception as e:
        arcpy.AddError(e)
        raise e
    with open(aprx, "rb") as open_aprx_file:
        return open_aprx_file.read()


def get_aprx_file_name(file_path=None):
    if os.path.splitext(file_path)[1] == ".aprx":
        return os.path.abspath(file_path)
    # User didn't specify an APRX file so do our best to guess where the user wants the file, they will confirm later.
    if os.path.isdir(file_path):
        directory = file_path
    elif os.path.isfile(file_path):
        directory = os.path.dirname(file_path)
    else:
        directory = os.path.dirname(__file__)
    try:
        metadata = load_metadata(directory)
        return os.path.join(directory, f"{metadata['name']}.aprx")
    except Exception:
        return os.path.join(directory, "eventkit.aprx")


def load_metadata(path):
    # Try the users intended directory then back out one to try parent directory incase user selects subdirectory.
    metadata_file = find_file(os.path.join("arcgis", "metadata.json"), path) or find_file(
        os.path.join("arcgis", "metadata.json"), os.path.dirname(path)
    )
    if metadata_file:
        with open(metadata_file, "r") as open_metadata_file:
            return json.load(open_metadata_file)


def find_file(name, path):
    for root, dirs, files in os.walk(path):
        for file in files:
            if name in os.path.join(root, file):
                return os.path.join(root, os.path.basename(name))
    arcpy.AddError(f"Could not find file {name} in {path}")


def create_aprx_process(datapack_path, aprx=None, metadata: dict = None, verify=False):
    """
    This wraps create_aprx to overcome issues with licensing by running in a unique process.
    Updates the template aprx with a new gpkg datasource. If an aprx is provided the result is written to that file.
    :param aprx: An aprx to write the result to (optional).
    :param metadata: The metadata dict for updating the aprx.
    :param verify: Raise an exception if there is an error in the aprx after adding the new gpkg.
    :return: The contents (binary) of the aprx file.
    """
    pool = Pool()
    result = pool.apply_async(
        create_aprx, args=(datapack_path,), kwds={"aprx": aprx, "metadata": metadata, "verify": verify}
    )
    aprx = result.get()
    return aprx


class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the name of the toolbox is the name of the
        .pyt file)."""
        self.label = "EventKit Tools"
        self.alias = ""

        # List of tool classes associated with this toolbox
        self.tools = [CreateAPRX]


class CreateAPRX(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Create APRX for EventKit DataPack"
        self.description = "A tool to create an APRX file using data from an EventKit datapack."
        self.canRunInBackground = False

    def getParameterInfo(self):
        """Define parameter definitions"""

        datapack_param = arcpy.Parameter(
            displayName="Path to datapack.",
            name="datapack_path",
            datatype="DEFolder",
            parameterType="Required",
            direction="Input",
        )

        aprx_param = arcpy.Parameter(
            displayName="Path to the APRX result.",
            name="aprx_path",
            datatype="DEFile",
            parameterType="Required",
            direction="Output",
        )

        add_to_map_param = arcpy.Parameter(
            displayName="Add Map to Current Project", name="add_to_map", datatype="GPBoolean", parameterType="Optional"
        )

        return [datapack_param, aprx_param, add_to_map_param]

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        if all([parameters[0].altered, not parameters[1].altered, load_metadata(str(parameters[0].value))]):
            parameters[1].value = get_aprx_file_name(str(parameters[0].value))
        if (parameters[1].valueAsText is not None) and (not os.path.splitext(parameters[1].valueAsText)[0] == ".aprx"):
            parameters[1].value = os.path.splitext(parameters[1].valueAsText)[0] + ".aprx"
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        if not load_metadata(str(parameters[0].value)):
            parameters[0].setErrorMessage("Location is not a datapack location, or datapack has errors.")
        return

    def execute(self, parameters, messages):
        """The source code of the tool."""

        try:
            datapack_path = str(parameters[0].value)
            if not datapack_path:
                arcpy.AddError("Cannot create an APRX file without a valid datapack path.")
                return
            metadata = load_metadata(datapack_path)
            if not metadata:
                arcpy.AddError(
                    f"The provided datapack directory {datapack_path} is missing the correct metadata files."
                )
                return
            aprx_output = str(parameters[1].value)
            arcpy.AddMessage(f"Using metadata from: {datapack_path}")
            create_aprx(datapack_path, aprx=aprx_output, metadata=metadata, verify=True)
            if parameters[2] and parameters[2].value:
                add_to_current_project(aprx_output)
        except Exception as e:
            arcpy.AddError(e)
            raise e


if __name__ == "__main__" and os.getenv("DEBUG"):
    import sys

    print(f"Running create aprx with {sys.argv[1:]}", flush=True)
    _, datapack_path = sys.argv
    metadata = load_metadata(datapack_path)

    create_aprx_process(datapack_path, metadata=metadata)
