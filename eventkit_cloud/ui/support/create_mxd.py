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
import argparse

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
def get_temp_mxd(gpkg, verify=False):
    temp_file = tempfile.NamedTemporaryFile(mode='rb', delete=False)
    temp_file.close()
    temp_file.name = "{0}.mxd".format(temp_file.name)
    ext = arcpy.Extent(0, 0, 0, 0)  # default to global
    try:
        try:
            version = arcpy.GetInstallInfo().get('Version')
        except:
            print('Unable to determine ArcGIS version.  This script only supports versions 10.4 and 10.5.')
            raise
        if '10.5' in version:
            template_file_name = "template-10-5.mxd"
        elif '10.4' in version:
            template_file_name = "template-10-4.mxd"
        else:
            print('The current version of ArcGIS is {0} however this script only supports versions 10.4 and 10.5.'.format(version))
            raise Exception("Invalid Version")
        template_file = os.path.abspath(os.path.join(BASE_DIR, "support", template_file_name))
        print('Opening MXD: {0}'.format(template_file))
        print('Updating with new filepath: {0}'.format(gpkg))
        if not os.path.isfile(template_file):
            print('This script requires an mxd template file which was not found.')
            raise Exception("File Not Found: {0}".format(template_file))
        # logger.debug('Opening MXD: {0}'.format(template_file))
        # logger.debug('Updating with new filepath: {0}'.format(gpkg))
        shutil.copyfile(template_file, temp_file.name)
        mxd = arcpy.mapping.MapDocument(temp_file.name)
        logger.debug('Gettings Layers...')
        boundary_layer = None
        for lyr in arcpy.mapping.ListLayers(mxd):
            if lyr.supports("DATASOURCE"):
                try:
                    logging.debug("layer: {0}".format(lyr))
                    logger.debug("removing old layer workspacePath: {0}".format(lyr.workspacePath))
                except Exception:
                    # Skip layers that don't have paths.
                    continue
                try:
                    # Try to update the extents based on the layers
                    lyr.findAndReplaceWorkspacePath(lyr.workspacePath, gpkg, verify)
                    if lyr.isFeatureLayer:
                        logger.debug(arcpy.RecalculateFeatureClassExtent_management(lyr).getMessages())
                        lyr_ext = lyr.getExtent()
                        if lyr_ext:
                            ext = expand_extents(ext, lyr_ext)
                except AttributeError as ae:
                    raise
                # except Exception as e:
                #     logger.warning(e)
                #     raise e
            if lyr.name != "main.boundary":
                boundary_layer = lyr
        logger.debug('Getting dataframes...')
        df = mxd.activeDataFrame
        # if extent not updated then use global bounds
        if extent2bbox(ext) == [0, 0, 0, 0]:
            ext = arcpy.Extent(-180, -90, 180, 90)
        df.extent
        if boundary_layer:
            df.extent = boundary_layer.getExtent()
        # df.zoomToSelectedFeatures()
        mxd.activeView = df.name
        arcpy.RefreshActiveView()
        mxd.save()
        del mxd  # remove handle on file
        yield temp_file.name
    finally:
        temp_file.close()
        try:
            os.unlink(temp_file.name)
        except Exception:
            logger.warn("Could not delete the tempfile, possibly already removed.")


def create_mxd(mxd=None, gpkg=None, verify=False):
    """
    Updates the template mxd with a new gpkg datasource. If an mxd is provided the result is written to that file.
    :param mxd: An mxd to write the result to (optional).
    :param gpkg: The geopackage file to use for updating the mxd.
    :param verify: Raise an exception if there is an error in the MXD after adding the new gpkg.
    :return: The contents (binary) of the mxd file.
    """
    with get_temp_mxd(gpkg, verify=verify) as temp_mxd_file:
        # copy temp file to permanent file if specified.
        if mxd:
            print("writing file to {0}".format(mxd))
            shutil.copy(temp_mxd_file, mxd)
            return mxd
        with open(temp_mxd_file, 'rb') as open_mxd_file:
            print("reading file to {0}".format(mxd))
            return open_mxd_file.read()


def create_mxd_process(mxd=None, gpkg=None, verify=False):
    """
    This wraps create_mxd to overcome issues with licensing by running in a unique process.
    Updates the template mxd with a new gpkg datasource. If an mxd is provided the result is written to that file.
    :param mxd: An mxd to write the result to (optional).
    :param gpkg: The geopackage file to use for updating the mxd.
    :param verify: Raise an exception if there is an error in the MXD after adding the new gpkg.
    :return: The contents (binary) of the mxd file.
    """
    pool = Pool()
    result = pool.apply_async(create_mxd, kwds={"mxd": mxd, "gpkg": gpkg, "verify": verify})
    mxd = result.get()
    return mxd


def expand_extents(original_bbox, new_bbox):
    return bbox2ext(expand_bbox(extent2bbox(original_bbox), extent2bbox(new_bbox)))


def extent2bbox(ext):
    bounds = json.loads(ext.JSON)
    return [val for k, val in bounds.iteritems()]


def bbox2ext(bbox):
    return arcpy.Extent(*bbox)


def expand_bbox(original_bbox, new_bbox):
    """
    Takes two bboxes and returns a new bbox containing the original two.
    :param bbox: A list representing [west, south, east, north]
    :param new_bbox: A list representing [west, south, east, north]
    :return: A list containing the two original lists.
    """
    if not original_bbox:
        original_bbox = list(new_bbox)
        return original_bbox
    original_bbox[0] = min(new_bbox[0], original_bbox[0])
    original_bbox[1] = min(new_bbox[1], original_bbox[1])
    original_bbox[2] = max(new_bbox[2], original_bbox[2])
    original_bbox[3] = max(new_bbox[3], original_bbox[3])
    return original_bbox


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
        # gpkg_path = os.path.abspath(metadata['data_sources']['osm']['file_path']))
        gpkg_path = os.path.join(os.path.dirname(__file__), metadata['data_sources']['osm']['file_path'])
        create_mxd(mxd=mxd_output, gpkg=gpkg_path, verify=True)
    except Exception as e:
        try:
            raw_input("Press enter to exit.")
        except Exception:
            input("Press enter to exit.")
        raise