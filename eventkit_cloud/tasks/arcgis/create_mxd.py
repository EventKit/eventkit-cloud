# This file is used to create an MXD file based on a datapack.  It needs to be run via the python application that is
# packaged with arcgis.
# For many users this is the default python, for other users they may have to specify this location
# for example ('C:\Python27\ArcGIS10.5\python create_mxd.py').

import os
import logging
import shutil
from multiprocessing import Pool
import json

try:
    input = raw_input
except NameError:
    pass

logging.basicConfig()
logger = logging.getLogger("create_mxd")

logger.warning("Creating an MXD file for your data...")


if os.getenv("LOG_LEVEL"):
    logger.setLevel(os.getenv("LOG_LEVEL"))

try:
    from django.conf import settings

    BASE_DIR = settings.BASE_DIR
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUPPORTED_VERSIONS = ["10.6.1"]
VERSIONS = ["10.6.1", "10.6", "10.5.1", "10.5", "10.4.1", "10.4"]
UNSUPPORTED_FILES = [".sqlite", ".zip"]

try:
    import arcpy
except Exception as e:
    logger.warning(e)
    input(
        "Could not import ArcPY.  ArcGIS 10.4 or 10.5 is required to run this script. "
        "Please ensure that it is installed and activated. "
        "If multiple versions of python are installed ensure that you are using python that came bundled with ArcGIS. "
        "Press any key to exit."
    )
    raise

if arcpy.GetInstallInfo().get("Version") not in SUPPORTED_VERSIONS:
    logger.warning(
        (
            "This script only supports versions {0}.  "
            "It might work for {1} but it will likely not support all of the datasets.".format(
                SUPPORTED_VERSIONS, [version for version in VERSIONS if version not in SUPPORTED_VERSIONS]
            )
        )
    )


def update_mxd_from_metadata(file_name, metadata, verify=False):
    """
    :param file_name: A path to the mxd file.
    :param metadata: The metadata providing the names, filepaths, and types to add to the mxd.
    :return: The original file.
    """
    mxd = arcpy.mapping.MapDocument(os.path.abspath(file_name))
    version = get_version()
    # Order here matters in which shows up on top, alphabetically makes sense, but it likely is more useful to layer
    # vectors over raster and raster over elevation.
    data_types = ["Elevation", "Raster", "Vector"]

    for data_type in data_types:
        if metadata.get("has_{}".format(data_type.lower())):
            group_layer = add_layer_to_mxd(data_type, get_layer_file("group", version), mxd)
            data_sources = get_data_source_by_type(data_type.lower(), metadata['data_sources'])
            add_layers_to_group(data_sources, group_layer, mxd, verify=verify)

    logger.debug("Getting dataframes...")
    data_frame = mxd.activeDataFrame

    data_frame.extent = arcpy.Extent(*metadata["bbox"])

    mxd.activeView = data_frame.name
    arcpy.RefreshActiveView()
    mxd.save()
    del mxd  # remove handle on file
    return file_name


def get_data_source_by_type(data_type, data_sources):
    sources = {}
    for layer_name, layer_info in data_sources.items():
        # A shim while we merge osm and nome into generic data types and come up with a better way to handle styles.
        layer_type = layer_info['type']
        if layer_info['type'] in ['osm', 'nome']:
            layer_type = 'vector'
        if data_type == layer_type:
            sources[layer_name] = layer_info
    return sources


def add_layers_to_group(data_sources, group_layer, mxd, verify=False):
    version = get_version()
    data_frame = mxd.activeDataFrame

    for vector_layer_name, layer_info in data_sources.items():
        for file_info in layer_info["files"]:
            # As of arcgis 10.5.1 shapefiles can't be imported as zips.
            if file_info["file_ext"] in UNSUPPORTED_FILES:
                logger.warning(
                    "This script can't automatically add {} files.  "
                    "You can try to use a template in the folder or manually importing "
                    "the files.".format(file_info["file_ext"])
                )
                continue
            file_path = os.path.abspath(os.path.join(BASE_DIR, file_info["file_path"]))
            # If possible calculate the statistics now so that they are correct when opening arcmap.
            try:
                logger.warning(("Calculating statistics for the file {0}...".format(file_path)))
                arcpy.CalculateStatistics_management(file_path)
            except Exception as e:
                logger.warning(e)
            layer_file = get_layer_file(layer_info["type"], version)
            if not (layer_file or layer_info["type"].lower() == "vector"):
                logger.warning(
                    (
                        "Skipping layer {0} because the file type is not supported for ArcMap {1}".format(
                            vector_layer_name, version
                        )
                    )
                )
                if version == "10.5":
                    logger.warning(
                        "However with your version of ArcMap you can still drag and drop this layer onto the Map."
                    )
                continue
            vector_layer_name = "{}_{}{}".format(layer_info["name"], file_info["projection"],
                                                 file_info["file_ext"].replace(".", "_"))
            if file_info["file_ext"] in [".kml", ".kmz"]:
                # Since this will generate data by converting the KML files, we should store it with the original data.
                output_folder = os.path.join(os.path.dirname(file_path), 'arcgis')
                kml_layer = os.path.join(output_folder, "{}.lyr".format(vector_layer_name))
                logger.error("KML LAYER: {}".format(kml_layer))
                try:
                    logger.error("Converting {} to ArcGIS Layer".format(file_path))
                    arcpy.KMLToLayer_conversion(
                        in_kml_file=file_path,
                        output_folder=os.path.join(os.path.dirname(file_path), 'arcgis'),
                        output_data=vector_layer_name
                    )
                    logger.error("Successfully converted: " + file_path)
                except Exception as e:
                    # This could fail for various reasons including that the file already exists.
                    # If KMLs are very important to your workflow please contact us and we can make this more robust.
                    logger.warning("Could not create a new KML layer file and gdb, it may already exist.")
                    logger.info(e)
                    # We couldn't create the file, try to grab the layer if it exists.
                try:
                    arc_layer = arcpy.mapping.Layer(kml_layer)
                    if arc_layer:
                        arc_layer.name = vector_layer_name
                        logger.warning(("Adding {0} layer: {1}...".format(layer_info["type"], vector_layer_name)))
                        arcpy.mapping.AddLayerToGroup(data_frame, group_layer, arc_layer, "TOP")
                finally:
                    del arc_layer
            else:
                try:
                    arc_layer = add_layer_to_mxd(vector_layer_name, layer_file or "group", mxd, group_layer=group_layer)
                    if layer_file:
                        # Get instance of layer from MXD, not the template file.
                        try:
                            logger.warning(("Updating layer: {0}...".format(arc_layer.name)))
                            update_layer(arc_layer, file_path, layer_info["type"], verify=verify)
                        except Exception as e:
                            logger.error("Could not update layer {0}".format(arc_layer.name))
                            logger.error(e)
                    else:
                        # Add arbitrary vector layers.
                        logger.warning("Adding {0} layer(s):...".format(layer_info["type"]))
                        vector_layer_group = arc_layer
                        for sublayer in layer_info["layers"]:
                            sublayer_name = "{}_{}{}".format(sublayer, file_info["projection"],
                                                                  file_info["file_ext"].replace(".", "_"))
                            logger.warning("Creating new layer for {0}...".format(sublayer_name))
                            arcpy.MakeFeatureLayer_management("{0}/{1}".format(file_path.rstrip('/'), sublayer),
                                                              sublayer_name)
                            arc_layer = arcpy.mapping.Layer(sublayer_name)
                            logger.warning("adding {} to {}".format(arc_layer.name, vector_layer_group.name))
                            # Note ordering is important here since layers are [1,2,3,4] we want to add at bottom.
                            arcpy.mapping.AddLayerToGroup(data_frame, vector_layer_group, arc_layer, "BOTTOM")
                        del vector_layer_group
                except Exception as e:
                    logger.error("Could not add layer {0}".format(arc_layer.name))
                    logger.error(e)
                finally:
                    del arc_layer


def add_layer_to_mxd(layer_name, layer_file, mxd, group_layer=None):
    """
    :param layer_name: The name of the layer as it will appear in arcmap.
    :param layer_file: The .lyr which will be used for the layer template. .
    :param data_frame:  The dataframe from the map document where the layer should be loaded.
    :return: Layer, raises exception.
    """
    data_frame = mxd.activeDataFrame
    layer_from_file = arcpy.mapping.Layer(layer_file)
    layer_from_file.name = layer_name
    logger.warning(("Creating a group layer for {0}...".format(layer_from_file.name)))
    if group_layer:
        arcpy.mapping.AddLayerToGroup(data_frame, group_layer, layer_from_file, "TOP")
        # The group layer is the first layer listed so get the second layer.
        layer = arcpy.mapping.ListLayers(group_layer)[1]
    else:
        arcpy.mapping.AddLayer(data_frame, layer_from_file, "TOP")
        layer = arcpy.mapping.ListLayers(mxd)[0]
    return layer


def get_mxd_template(version):
    """
    :param version: A version for the correct arcgis MapDocument template.
    :return: A file path to the correct arcgis MapDocument template.
    """
    if "10.6" in version:
        template_file_name = "template-10-6.mxd"
    elif "10.5" in version:
        template_file_name = "template-10-5.mxd"
    elif "10.4" in version:
        template_file_name = "template-10-4.mxd"
    template_file = os.path.abspath(os.path.join(BASE_DIR, "arcgis", "templates", template_file_name))
    if not os.path.isfile(template_file):
        logger.warning("This script requires an mxd template file which was not found.")
        raise Exception("File Not Found: {0}".format(template_file))
    return template_file


def get_layer_file(type, version):
    """

    :param type: Type of templace (i.e. raster, osm...)
    :param version: arcgis version (i.e. 10.5)
    :return: The file path to the correct layer.
    """
    # Temporarily patch the version
    if "10.6" in version:
        version = "10.6"
    layer_basename = "{0}-{1}.lyr".format(type, version.replace(".", "-"))
    layer_file = os.path.abspath(os.path.join(BASE_DIR, "arcgis", "templates", layer_basename))
    if os.path.isfile(layer_file):
        logger.warning(("Fetching layer template: {0}".format(layer_file)))
        return layer_file
    return None


def get_version():
    """
    :return: Returns the version of arcmap that is installed.
    """

    try:
        version = arcpy.GetInstallInfo().get("Version")
        if version in VERSIONS:
            return version
        raise Exception("UNSUPPORTED VERSION")
    except Exception:
        logger.warning(
            (
                "Unable to determine ArcGIS version.  This script only supports versions {0}".format(
                    str(SUPPORTED_VERSIONS)
                )
            )
        )
        raise


def update_layer(layer, file_path, type, verify=False):
    """
    :param layer: An Arc Layer object to be updated.
    :param file_path: A new datasource.
    :param verify:  If true will validate the datasource after the layer is updated.
    :return: The updated ext.
    """
    for lyr in arcpy.mapping.ListLayers(layer):
        if lyr.supports("DATASOURCE"):
            try:
                logger.debug("layer: {0}".format(lyr))
                logger.debug("removing old layer workspacePath: {0}".format(lyr.workspacePath))
            except Exception:
                # Skip layers that don't have paths.
                continue
            try:
                # Try to update the extents based on the layers
                logger.debug("Updating layers from {0} to {1}".format(lyr.workspacePath, file_path))
                if type == "raster" and os.path.splitext(file_path)[1] != ".gpkg":
                    logger.debug("Replacing Datasource")
                    lyr.replaceDataSource(
                        os.path.dirname(file_path), "RASTER_WORKSPACE", os.path.basename(file_path), verify
                    )
                elif type == "elevation":
                    logger.debug("updating elevation")
                    lyr.replaceDataSource(os.path.dirname(file_path), "NONE", os.path.basename(file_path), verify)
                else:
                    logger.debug("updating raster or vector gpkg")
                    logger.debug("Replacing WorkSpace Path")
                    lyr.findAndReplaceWorkspacePath(lyr.workspacePath, file_path, verify)
                if lyr.isFeatureLayer:
                    logger.debug(arcpy.RecalculateFeatureClassExtent_management(lyr).getMessages())
            except Exception as e:
                logger.error(e)
                raise


def create_mxd(mxd=None, metadata=None, verify=False):
    """
    Updates the template mxd with a new gpkg datasource. If an mxd is provided the result is written to that file.
    :param mxd: An mxd to write the result to (optional).
    :param metadata: The metadata file to use for updating the mxd.
    :param verify: Raise an exception if there is an error in the MXD after adding the new gpkg.
    :return: The contents (binary) of the mxd file.
    """
    template_file = get_mxd_template(get_version())
    # with get_temp_mxd(metadata, verify=verify) as temp_mxd_file:
    # copy temp file to permanent file if specified.
    if mxd:
        logger.warning(("writing file to {0}".format(mxd)))
        shutil.copy(template_file, mxd)
        # return mxd
    update_mxd_from_metadata(mxd, metadata, verify=verify)
    with open(mxd, "rb") as open_mxd_file:
        return open_mxd_file.read()


def create_mxd_process(mxd=None, metadata=None, verify=False):
    """
    This wraps create_mxd to overcome issues with licensing by running in a unique process.
    Updates the template mxd with a new gpkg datasource. If an mxd is provided the result is written to that file.
    :param mxd: An mxd to write the result to (optional).
    :param metadata: The metadata file to use for updating the mxd.
    :param verify: Raise an exception if there is an error in the MXD after adding the new gpkg.
    :return: The contents (binary) of the mxd file.
    """
    pool = Pool()
    result = pool.apply_async(create_mxd, kwds={"mxd": mxd, "metadata": metadata, "verify": verify})
    mxd = result.get()
    return mxd


if __name__ == "__main__":

    try:
        metadata_file = os.path.join(os.path.dirname(__file__), "metadata.json")

        with open(metadata_file, "r") as open_metadata_file:
            metadata = json.load(open_metadata_file)

        mxd_output = os.path.join(os.path.dirname(__file__), "{0}.mxd".format(metadata["name"]))
        create_mxd(mxd=mxd_output, metadata=metadata, verify=True)
    except Exception as e:
        logger.warning(e)
    input("Press enter to exit.")
