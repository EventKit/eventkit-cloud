# -*- coding: utf-8 -*-
from osgeo import gdal, ogr
import json
import logging
import math
import os
import subprocess
from string import Template
from tempfile import NamedTemporaryFile
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


def get_area(geojson):
    """
    Given a GeoJSON string or object, return an approximation of its geodesic area in km².
    The geometry must contain a single polygon with a single ring, no holes.
    Based on Chamberlain and Duquette's algorithm: https://trs.jpl.nasa.gov/bitstream/handle/2014/41271/07-0286.pdf
    :param geojson: GeoJSON selection area
    :return: area of geojson ring in square kilometers
    """
    earth_r = 6371  # km

    def rad(d):
        return math.pi*d/180

    if isinstance(geojson, str):
        geojson = json.loads(geojson)

    if hasattr(geojson, 'geometry'):
        geojson = geojson['geometry']

    geom_type = geojson['type'].lower()
    if geom_type == 'polygon':
        polys = [geojson['coordinates']]
    elif geom_type == 'multipolygon':
        polys = geojson['coordinates']
    else:
        return RuntimeError("Invalid geometry type: %s" % geom_type)

    a = 0
    for poly in polys:
        ring = poly[0]
        if len(ring) < 4:
            continue
        ring.append(ring[-2])  # convenient for circular indexing
        for i in range(len(ring) - 2):
            a += (rad(ring[i+1][0]) - rad(ring[i-1][0])) * math.sin(rad(ring[i][1]))

    area = abs(a * (earth_r**2) / 2)
    return area


def is_envelope(geojson_path):
    """
    Given a path to a GeoJSON file, reads it and determines whether its coordinates correspond to a WGS84 bounding box,
    i.e. lat1=lat2, lon2=lon3, lat3=lat4, lon4=lon1, to tell whether there's need for an alpha layer in the output
    :param geojson_path: Path to GeoJSON selection file
    :return: True if
    """
    try:
        with open(geojson_path, "r") as gf:
            geojson = json.load(gf)
            p = geojson['coordinates'][0][0]
            if len(p) != 5 or p[4] != p[0]:
                return False
            ret = len(set([c[0] for c in p])) == len(set([c[1] for c in p])) == 2
            logger.debug("Checking if boundary is envelope: %s for %s", ret, p)
            return ret

    except (IndexError, IOError):
        # Unparseable JSON or unreadable file: play it safe
        return False


def clip_dataset(boundary=None, in_dataset=None, out_dataset=None, fmt=None, table=None, task_uid=None):
    """
    Uses gdalwarp or ogr2ogr to clip a supported dataset file to a mask.
    :param boundary: A geojson file or bbox (xmin, ymin, xmax, ymax) to serve as a cutline
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
        cmd_template = Template("gdalwarp -cutline $boundary -crop_to_cutline $dstalpha -of $fmt $type $in_ds $out_ds")
        # Geopackage raster only supports byte band type, so check for that
        if fmt.lower() == 'gpkg':
            band_type = "-ot byte"
    else:
        cmd_template = Template("ogr2ogr -f $fmt -clipsrc $boundary $out_ds $in_ds")

    temp_boundfile = None
    if isinstance(boundary, list):
        boundary = " ".join(str(i) for i in boundary)  # ogr2ogr can handle bbox as params
        if not table:  # gdalwarp needs a file
            temp_boundfile = NamedTemporaryFile()
            bounds_template = Template('{"type":"MultiPolygon","coordinates":[[[[$xmin,$ymin],'
                                       '[$xmax,$ymin],[$xmax,$ymax],[$xmin,$ymax],[$xmin,$ymin]]]]}')
            temp_boundfile.write(bounds_template.safe_substitute({
                'xmin': boundary[0],
                'ymin': boundary[1],
                'xmax': boundary[2],
                'ymax': boundary[3]
            }))
            temp_boundfile.flush()
            boundary = temp_boundfile.name

    try:
        # dstalpha = "" if is_envelope(boundary) else "-dstalpha"  # TODO: use this for ES-397 if it works
        dstalpha = "-dstalpha"
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
                                                'dstalpha': dstalpha,
                                                'type': band_type,
                                                'in_ds': in_dataset,
                                                'out_ds': out_dataset})

        logger.debug("GDAL clip cmd: %s", cmd)

        task_process = TaskProcess(task_uid=task_uid)
        task_process.start_process(cmd, shell=True, executable="/bin/bash",
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    finally:
        if temp_boundfile:
            temp_boundfile.close()

    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("Cutline process failed with return code {0}".format(task_process.exitcode))

    return out_dataset


def convert(dataset=None, fmt=None, task_uid=None):
    """
    Uses gdalwarp or ogr2ogr to convert a raster or vector dataset into another format.
    If the dataset is already in the output format, returns the unaltered original.
    :param dataset: Raster or vector file to be converted
    :param fmt: Short format (e.g. gpkg, gtiff) to convert into
    :param task_uid: A task uid to update
    :return: Converted dataset, same filename as input
    """

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

    logger.debug("GDAL convert cmd: %s", cmd)

    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(cmd, shell=True, executable="/bin/bash",
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("Conversion process failed with return code {0}".format(task_process.exitcode))

    return dataset
