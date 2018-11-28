

# This file is used to create an MXD file based on a datapack.  It needs to be run via the python application that is
# packaged with arcgis.  For many users this is the default python, for other users they may have to specify this location
# for example ('C:\Python27\ArcGIS10.5\python create_mxd.py').
print("Creating an MXD file for your osm data...")

import os
import logging
import shutil
from multiprocessing import Pool
import json

try:
    input = raw_input
except NameError:
    pass

# import argparse

logger = logging.getLogger('create_mxd')

if os.getenv('LOG_LEVEL'):
    logger.setLevel(os.getenv('LOG_LEVEL'))

try:
    from django.conf import settings

    BASE_DIR = settings.BASE_DIR
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SUPPORTED_VERSIONS = ["10.5.1"]
VERSIONS = ["10.6", "10.5.1", "10.5", "10.4.1", "10.4"]

try:
    import arcpy
except Exception as e:
    print(e)
    input(
        "Could not import ArcPY.  ArcGIS 10.4 or 10.5 is required to run this script. "
        "Please ensure that it is installed and activated. "
        "If multiple versions of python are installed ensure that you are using python that came bundled with ArcGIS. "
        "Press any key to exit.")
    raise

version = arcpy.GetInstallInfo().get('Version')
if arcpy.GetInstallInfo().get('Version') not in SUPPORTED_VERSIONS:
    print((
        "This script only supports versions {0}.  "
        "It might work for {1} but it will likely not support all of the datasets.".format(
            SUPPORTED_VERSIONS, [version for version in VERSIONS if version not in SUPPORTED_VERSIONS])))


def update_mxd_from_metadata(file_name, metadata, verify=False):
    """
    :param file_name: A path to the mxd file.
    :param metadata: The metadata providing the names, filepaths, and types to add to the mxd.
    :return: The original file.
    """
    mxd = arcpy.mapping.MapDocument(os.path.abspath(file_name))
    df = mxd.activeDataFrame
    version = get_version()
    for layer_name, layer_info in metadata['data_sources'].items():
        file_path = os.path.abspath(os.path.join(BASE_DIR, layer_info['file_path']))
        # If possible calculate the statistics now so that they are correct when opening arcmap.
        try:
            print(("Calculating statistics for the file {0}...".format(file_path)))
            arcpy.CalculateStatistics_management(file_path)
        except Exception as e:
            print(e)
        layer_file = get_layer_file(layer_info['type'], version)
        if not layer_file:
            print((
                "Skipping layer {0} because the file type is not supported for ArcMap {1}".format(layer_name, version)))
            if version == '10.5':
                print("However with your version of ArcMap you can still drag and drop this layer onto the Map.")
            continue
        layer_from_file = arcpy.mapping.Layer(layer_file)
        layer_from_file.name = layer_info['name']
        print(('Adding layer: {0}...'.format(layer_from_file.name)))
        arcpy.mapping.AddLayer(df, layer_from_file, "TOP")
        # Get instance of layer from MXD, not the template file.
        del layer_from_file
        layer = arcpy.mapping.ListLayers(mxd)[0]
        update_layer(layer, file_path, verify=verify)

    logger.debug('Getting dataframes...')
    df = mxd.activeDataFrame

    df.extent = arcpy.Extent(*metadata['bbox'])

    mxd.activeView = df.name
    arcpy.RefreshActiveView()
    mxd.save()
    del mxd  # remove handle on file
    return file_name


def get_mxd_template(version):
    """
    :param version: A version for the correct arcgis MapDocument template.
    :return: A file path to the correct arcgis MapDocument template.
    """
    if '10.6' in version:
        template_file_name = "template-10-6.mxd"
    elif '10.5' in version:
        template_file_name = "template-10-5.mxd"
    elif '10.4' in version:
        template_file_name = "template-10-4.mxd"
    template_file = os.path.abspath(os.path.join(BASE_DIR, "arcgis", "templates", template_file_name))
    if not os.path.isfile(template_file):
        print('This script requires an mxd template file which was not found.')
        raise Exception("File Not Found: {0}".format(template_file))
    return template_file


def get_layer_file(type, version):
    """

    :param type: Type of templace (i.e. raster, osm...)
    :param version: arcgis version (i.e. 10.5)
    :return: The file path to the correct layer.
    """
    layer_basename = "{0}-{1}.lyr".format(type, version.replace('.', '-'))
    layer_file = os.path.abspath(os.path.join(BASE_DIR, "arcgis", "templates", layer_basename))
    print(("Fetching layer template: {0}".format(layer_file)))
    if os.path.isfile(layer_file):
        return layer_file
    return None


def get_version():
    """
    :return: Returns the version of arcmap that is installed.
    """

    try:
        version = arcpy.GetInstallInfo().get('Version')
        if version in VERSIONS:
            return version
        raise Exception("UNSUPPORTED VERSION")
    except:
        print(('Unable to determine ArcGIS version.  This script only supports versions {0}'.format(
            str(SUPPORTED_VERSIONS))))
        raise


def update_layer(layer, file_path, verify=False):
    """
    :param layer: An Arc Layer object to be updated.
    :param file_path: A new datasource.
    :param verify:  If true will validate the datasource after the layer is updated.
    :param mxd: Pass a reference to an MXD document if the layer is in an mxd, needed
    due to a bug with saving layers in a windows USERPROFILE directory.
    :return: The updated ext.
    """
    for lyr in arcpy.mapping.ListLayers(layer):
        if lyr.supports("DATASOURCE"):
            try:
                logging.debug("layer: {0}".format(lyr))
                logger.debug("removing old layer workspacePath: {0}".format(lyr.workspacePath))
            except Exception:
                # Skip layers that don't have paths.
                continue
            try:
                # Try to update the extents based on the layers
                logger.debug("Updating layers from {0} to {1}".format(lyr.workspacePath, file_path))
                # For the tif file we want the workspace path to be the directory not the DB name.
                if os.path.splitext(file_path)[1] == '.tif':
                    lyr.replaceDataSource(os.path.dirname(file_path), "NONE", os.path.basename(file_path))
                else:
                    lyr.findAndReplaceWorkspacePath(lyr.workspacePath, file_path, verify)
                if lyr.isFeatureLayer:
                    logger.debug(arcpy.RecalculateFeatureClassExtent_management(lyr).getMessages())
            except AttributeError as ae:
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
        print(("writing file to {0}".format(mxd)))
        shutil.copy(template_file, mxd)
        # return mxd
    update_mxd_from_metadata(mxd, metadata, verify=verify)
    with open(mxd, 'rb') as open_mxd_file:
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
    #  parser = argparse.ArgumentParser(description='Process some integers.')
    #  parser.add_argument('--mxd', help='an mxd file to write the result to')
    #  parser.add_argument('--gpkg', help='a gpkg of data')
    #  parser.add_argument('--verify', default=False, type=bool, help='verify if the mxd is valid after adding the gpkg')
    #  parser.add_argument('--metadata', default='metadata.json', type=bool, help='a metadata file to provide information')

    #  args = parser.parse_args()
    try:
        metadata_file = os.path.join(os.path.dirname(__file__), 'metadata.json')

        with open(metadata_file, 'r') as open_metadata_file:
            metadata = json.load(open_metadata_file)

        mxd_output = os.path.join(os.path.dirname(__file__), '{0}.mxd'.format(metadata['name']))
        create_mxd(mxd=mxd_output, metadata=metadata, verify=True)
    except Exception as e:
        print(e)
    input("Press enter to exit.")
