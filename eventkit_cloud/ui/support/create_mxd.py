from __future__ import absolute_import

# This file is used to create an MXD file based on a datapack.  It needs to be run via the python application that is
# packaged with arcgis.  For many users this is the default python, for other users they may have to specify this location
# for example ('C:\Python27\ArcGIS10.5\python create_mxd.py').
print("Creating an MXD file for your osm data...")

import os
import logging
import tempfile
import shutil
from contextlib import contextmanager
from multiprocessing import Pool
import json
# import argparse

logger = logging.getLogger('create_mxd')

if os.getenv('LOG_LEVEL'):
    logger.setLevel(os.getenv('LOG_LEVEL'))

try:
    from django.conf import settings

    BASE_DIR = settings.BASE_DIR
except Exception:
    BASE_DIR = os.path.dirname(__file__)

try:
    import arcpy
except Exception:
    print("Could not import ArcPY.  ArcGIS 10.4 or 10.5 is required to run this script.  Please ensure that it is installed.  If multiple versions of python are installed ensure that you are using python that came bundled with ArcGIS.")
    raise


@contextmanager
def get_temp_mxd(metadata, verify=False):
    temp_file = tempfile.NamedTemporaryFile(mode='rb', delete=False)
    temp_file.close()
    temp_file.name = "{0}.mxd".format(temp_file.name)

    try:
        template_file = get_mxd_template(get_version())

        # Create a copy of the mxd to avoid single use locking issues.
        shutil.copyfile(template_file, temp_file.name)
        update_mxd_from_metadata(temp_file.name, metadata, verify=False)
        yield temp_file.name
    finally:
        temp_file.close()
        try:
            os.unlink(temp_file.name)
        except Exception:
            logger.warn("Could not delete the tempfile, possibly already removed.")


def update_mxd_from_metadata(file_name, metadata, verify=False):
    """

    :param file_name: A path to the mxd file.
    :param metadata: The metadata providing the names, filepaths, and types to add to the mxd.
    :return: The original file.
    """
    mxd = arcpy.mapping.MapDocument(file_name)
    df = mxd.activeDataFrame
    for layer_name, layer_info in metadata['data_sources'].iteritems():
        file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), layer_info['file_path']))
        layer_from_file = arcpy.mapping.Layer(get_layer_file(layer_info['type'], get_version()))
        layer_from_file.name = layer_info['name']
        print('Adding layer: {0}...'.format(layer_from_file.name))
        arcpy.mapping.AddLayer(df, layer_from_file, "TOP")
        # Get instance of layer from MXD, not the template file.
        layer = arcpy.mapping.ListLayers(mxd)[0]
        ext = update_layers(layer, file_path)
        del layer
    logger.debug('Getting dataframes...')
    df = mxd.activeDataFrame

    df.extent = arcpy.Extent(*metadata['bbox'])

    # df.zoomToSelectedFeatures()
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
    if '10.5' in version:
        template_file_name = "template-10-5.mxd"
    elif '10.4' in version:
        template_file_name = "template-10-4.mxd"
    else:
        print('The current version of ArcGIS is {0} however this script only supports versions 10.4 and 10.5.'.format(
            version))
        raise Exception("Invalid Version")
    template_file = os.path.abspath(os.path.join(BASE_DIR, "support", template_file_name))
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
    if '10.5' in version:
        layer_basename = "{0}-10-5.lyr".format(type)
    else:
        layer_basename = "{0}-10-4.lyr".format(type)
    layer_file = os.path.abspath(os.path.join(BASE_DIR, "support", layer_basename))
    if not os.path.isfile(layer_file):
        print('This script requires a lyr template file which was not found.')
        raise Exception("File Not Found: {0}".format(layer_file))
    return layer_file


def get_version():
    """

    :return: Returns the version of arcmap that is installed.
    """

    try:
        return arcpy.GetInstallInfo().get('Version')
    except:
        print('Unable to determine ArcGIS version.  This script only supports versions 10.4 and 10.5.')
        raise


def update_layers(layer, file_path):
    """
    :param layer: An Arc Layer object to be updated.
    :param file_path: A new datasource.
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
                lyr.findAndReplaceWorkspacePath(lyr.workspacePath, file_path, True)
                if lyr.isFeatureLayer:
                    # print arcpy.RecalculateFeatureClassExtent_management(lyr).getMessages()
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
    with get_temp_mxd(metadata, verify=verify) as temp_mxd_file:
        # copy temp file to permanent file if specified.
        if mxd:
            print("writing file to {0}".format(mxd))
            shutil.copy(temp_mxd_file, mxd)
            # return mxd
        with open(temp_mxd_file, 'rb') as open_mxd_file:
            print("reading file {0}".format(mxd))
            return open_mxd_file.read()


def create_mxd_process(mxd=None, gpkg=None, verify=False):
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

        # mxd_output = os.path.abspath('{0}.mxd'.format(metadata['name']))
        mxd_output = os.path.join(os.path.dirname(__file__), '{0}.mxd'.format(metadata['name']))
        # gpkg_path = os.path.join(os.path.dirname(__file__), metadata['data_sources']['osm']['file_path'])
        create_mxd(mxd=mxd_output, metadata=metadata, verify=True)
        raw_input("Press enter to exit.")
    except Exception as e:
        print e
        try:
            raw_input("Press enter to exit.")
        except Exception:
            input("Press enter to exit.")