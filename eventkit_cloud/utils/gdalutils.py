# -*- coding: utf-8 -*-
from osgeo import gdal, ogr
import logging
import os
import subprocess
from string import Template
from ..tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


def open_ds(ds_path):
    """
    Given a path to a raster or vector dataset, returns an opened GDAL or OGR dataset.
    The caller has the responsibility of closing/deleting the dataset when finished.
    :param ds_path: Path to dataset
    :return: Handle to open dataset
    """

    # TODO: Can be a DB Connection
    #if not os.path.isfile(ds_path):
    #    raise Exception("Could not find file {}".format(ds_path))

    # Attempt to open as gdal dataset (raster)
    use_exceptions = gdal.GetUseExceptions()
    gdal.UseExceptions()

    try:
        gdal_dataset = gdal.Open(ds_path)
        if gdal_dataset:
            return gdal_dataset
    except RuntimeError as ex:
        if ('not recognized as a supported file format' not in ex.message) or \
                ('Error browsing database for PostGIS Raster tables' in ex.message):
            raise ex
    finally:
        if not use_exceptions:
            gdal.DontUseExceptions()

    # Attempt to open as ogr dataset (vector)
    # ogr.UseExceptions doesn't seem to work reliably, so just check for Open returning None
    ogr_dataset = ogr.Open(ds_path)

    if not ogr_dataset:
        logger.debug("Unknown file format: {0}".format(ds_path))
        return None

    return ogr_dataset


def cleanup_ds(ds):
    """
    Given an input gdal.Dataset or ogr.DataSource, destroy it.
    NB: referring to this object's members after destruction will crash the Python interpreter.
    :param ds: Dataset / DataSource to destroy
    """
    if type(ds) == ogr.DataSource:
        ds.Destroy()
    elif type(ds) == gdal.Dataset:
        del ds


def driver_for(ds_path):
    """
    Given a path to a raster or vector dataset, return the appropriate driver type.
    :param ds_path: String: Path to dataset
    :return: Tuple: (Short name of GDAL driver for dataset, True if dataset is a raster type)
    """

    ds = None
    try:
        ds = open_ds(ds_path)

        if isinstance(ds, gdal.Dataset):
            ret = (ds.GetDriver().ShortName, True)
        elif isinstance(ds, ogr.DataSource):
            ret = (ds.GetDriver().GetName(), False)
        else:
            ret = (None, None)

        if ret[0]:
            logger.debug("Identified dataset {0} as {1}".format(ds_path, ret[0]))
        else:
            logger.debug("Could not identify dataset {0}".format(ds_path))

        return ret

    finally:
        cleanup_ds(ds)


def is_raster(ds_path):
    """
    Given a path to a dataset, indicates whether that dataset is a raster format.
    Throws exception if the path is invalid or the dataset cannot be identified.
    :param ds_path: Path to a dataset
    :return: True if dataset is a raster type, False if vector
    """
    _, raster = driver_for(ds_path)
    return raster


def clip_dataset(boundary=None, in_dataset=None, out_dataset=None, fmt=None, table=None, task_uid=None):
    """
    Uses gdalwarp or ogr2ogr to clip a supported dataset file to a mask.
    :param boundary: A geojson file or bbox to serve as a cutline
    :param in_dataset: A raster or vector file to be clipped
    :param out_dataset: The dataset to put the clipped output in (if not specified will use in_dataset)
    :param fmt: Short name of output driver to use (defaults to input format)
    :param table: Table name in database for in_dataset
    :param task_uid: A task uid to update
    :return: Filename of clipped dataset
    """

    if not boundary:
        raise Exception("Could not open boundary mask file: {0}".format(boundary))

    if not in_dataset:
        raise Exception("Could not open input dataset: {0}".format(in_dataset))

    if not out_dataset:
        out_dataset = in_dataset

    if out_dataset == in_dataset:
        in_dataset = os.path.join(os.path.dirname(out_dataset), "old_{0}".format(os.path.basename(out_dataset)))
        logger.info("Renaming '{}' to '{}'".format(out_dataset, in_dataset))
        os.rename(out_dataset, in_dataset)

    (driver, raster) = driver_for(in_dataset)

    if not fmt:
        fmt = driver or 'gpkg'

    band_type = ""
    if table:
        cmd_template = Template("ogr2ogr -update -f $fmt -clipsrc $boundary $out_ds $in_ds $table")
    elif raster:
        cmd_template = Template("gdalwarp -cutline $boundary -crop_to_cutline -dstalpha -of $fmt $type $in_ds $out_ds")
        # Geopackage raster only supports byte band type, so check for that
        if fmt.lower() == 'gpkg':
            band_type = "-ot byte"
    else:
        cmd_template = Template("ogr2ogr -f $fmt -clipsrc $boundary $out_ds $in_ds")

    if isinstance(boundary, list):
        boundary = " ".join(str(i) for i in boundary)

    if table:
        cmd = cmd_template.safe_substitute({'boundary': boundary,
                                            'fmt': fmt,
                                            'type': band_type,
                                            'in_ds': in_dataset,
                                            'out_ds': out_dataset,
                                            'table': table})
    else:
        cmd = cmd_template.safe_substitute({'boundary': boundary,
                                            'fmt': fmt,
                                            'type': band_type,
                                            'in_ds': in_dataset,
                                            'out_ds': out_dataset})

    logger.debug(cmd)

    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(cmd, shell=True, executable="/bin/bash",
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("Cutline process failed with return code {0}".format(task_process.exitcode))

    return out_dataset


def convert(dataset=None, fmt=None, task_uid=None):

    if not dataset:
        raise Exception("Could not open input file: {0}".format(dataset))

    (driver, raster) = driver_for(dataset)

    if not fmt or not driver or driver.lower() == fmt.lower():
        return dataset

    in_ds = os.path.join(os.path.dirname(dataset), "old_{0}".format(os.path.basename(dataset)))
    os.rename(dataset, in_ds)

    band_type = ""
    if raster:
        cmd_template = Template("gdalwarp -of $fmt $type $in_ds $out_ds")
        # Geopackage raster only supports byte band type, so check for that
        if fmt.lower() == 'gpkg':
            band_type = "-ot byte"
    else:
        cmd_template = Template("ogr2ogr -f $fmt $out_ds $in_ds")

    cmd = cmd_template.safe_substitute({'fmt': fmt,
                                        'type': band_type,
                                        'in_ds': in_ds,
                                        'out_ds': dataset})

    logger.debug(cmd)

    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(cmd, shell=True, executable="/bin/bash",
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("Conversion process failed with return code {0}".format(task_process.exitcode))

    return dataset
