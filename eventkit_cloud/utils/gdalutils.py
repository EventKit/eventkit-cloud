# -*- coding: utf-8 -*-
import json
import logging
import math
import billiard
import os
import subprocess
import time
from string import Template
from tempfile import NamedTemporaryFile
from functools import wraps


from osgeo import gdal, ogr, osr

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)

MAX_DB_CONNECTION_RETRIES = 5
MAX_DB_CONNECTION_DELAY = 5

# The retry here is an attempt to mitigate any possible dropped connections. We chose to do a limited number of
# retries as retrying forever would cause the job to never finish in the event that the database is down. An
# improved method would perhaps be to see if there are connection options to create a more reliable connection.
# We have used this solution for now as I could not find options supporting this in the ogr2ogr or gdalwarp
# documentation.


def retry(f):
    @wraps(f)
    def wrapper(*args, **kwds):
        attempts = MAX_DB_CONNECTION_RETRIES
        exc = None
        while attempts:
            try:
                return_value = f(*args, **kwds)
                if not return_value:
                    logger.error("The function {0} failed to return any values.".format(getattr(f, '__name__')))
                    raise Exception("The process failed to return any data, please contact an administrator.")
                return return_value
            except Exception as e:
                logger.error("The function {0} threw an error.".format(getattr(f, '__name__')))
                logger.error(str(e))
                exc = e
                attempts -= 1
                time.sleep(MAX_DB_CONNECTION_DELAY)
                if attempts:
                    logger.error("Retrying {0} times.".format(str(attempts)))
        raise exc
    return wrapper


def open_ds(ds_path):
    """
    Given a path to a raster or vector dataset, returns an opened GDAL or OGR dataset.
    The caller has the responsibility of closing/deleting the dataset when finished.
    :param ds_path: Path to dataset
    :return: Handle to open dataset
    """

    # TODO: Can be a DB Connection
    # if not os.path.isfile(ds_path):
    #    raise Exception("Could not find file {}".format(ds_path))

    # Attempt to open as gdal dataset (raster)
    use_exceptions = gdal.GetUseExceptions()
    gdal.UseExceptions()

    logger.info("Opening the dataset: {}".format(ds_path))
    try:
        gdal_dataset = gdal.Open(ds_path)
        if gdal_dataset:
            return gdal_dataset
    except RuntimeError as ex:
        if ('not recognized as a supported file format' not in str(ex)) or \
                ('Error browsing database for PostGIS Raster tables' in str(ex)):
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


def cleanup_ds(resources):
    """
    Given an input gdal.Dataset or ogr.DataSource, destroy it.
    NB: referring to this object's members after destruction will crash the Python interpreter.
    :param ds: Dataset / DataSource to destroy
    """
    logger.info("Closing the resources: {}.".format(resources))
    # https://trac.osgeo.org/gdal/wiki/PythonGotchas#CertainobjectscontainaDestroymethodbutyoushouldneveruseit
    del resources


@retry
def get_meta(ds_path):
    """
    This function is a wrapper for the get_gdal metadata because if there is a database diconnection there is no obvious
    way to clean up and free those resources therefore it is put on a separate process and if it fails it can just be
    tried again.

    This is using GDAL 2.2.4 this should be checked again to see if it can be simplified in a later version.
    :param ds_path: String: Path to dataset
    :return: Metadata dict
        driver: Short name of GDAL driver for dataset
        is_raster: True if dataset is a raster type
        nodata: NODATA value for all bands if all bands have the same one, otherwise None (raster sets only)
    """

    multiprocess_queue = billiard.Queue()
    proc = billiard.Process(target=get_gdal_metadata, daemon=True, args=(ds_path, multiprocess_queue,))
    proc.start()
    proc.join()
    return multiprocess_queue.get()


def get_gdal_metadata(ds_path, multiprocess_queue):
    """
    Don't call this directly use get_meta.

    Given a path to a raster or vector dataset, return the appropriate driver type.

    :param ds_path: String: Path to dataset
    :param A multiprocess queue.
    :return: None.
    """

    ds = None
    ret = {'driver': None,
           'is_raster': None,
           'nodata': None}

    try:
        ds = open_ds(ds_path)
        if isinstance(ds, gdal.Dataset):
            ret['driver'] = ds.GetDriver().ShortName
            ret['is_raster'] = True
            if ds.RasterCount:
                bands = list(set([ds.GetRasterBand(i+1).GetNoDataValue() for i in range(ds.RasterCount)]))
                if len(bands) == 1:
                    ret['nodata'] = bands[0]

        elif isinstance(ds, ogr.DataSource):
            ret['driver'] = ds.GetDriver().GetName()
            ret['is_raster'] = False

        if ret['driver']:
            logger.debug("Identified dataset {0} as {1}".format(ds_path, ret['driver']))
        else:
            logger.debug("Could not identify dataset {0}".format(ds_path))

        multiprocess_queue.put(ret)

    finally:
        cleanup_ds(ds)


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
    :return: True if the given geojson is an envelope/bounding box, with one polygon and one ring.
    """
    try:
        geojson = ""
        if not os.path.isfile(geojson_path) and isinstance(geojson_path, str):
            geojson = json.loads(geojson_path)
        else:
            with open(geojson_path, "r") as gf:
                geojson = json.load(gf)

        geom_type = geojson['type'].lower()
        if geom_type == 'polygon':
            polys = [geojson['coordinates']]
        elif geom_type == 'multipolygon':
            polys = geojson['coordinates']
        else:
            return False  # Points/lines aren't envelopes

        if len(polys) != 1:
            return False  # Multipolygons aren't envelopes

        poly = polys[0]
        if len(poly) != 1:
            return False  # Polygons with multiple rings aren't envelopes

        ring = poly[0]
        if len(ring) != 5 or ring[4] != ring[0]:
            return False  # Envelopes need exactly four valid coordinates

        # Envelopes will have exactly two unique coordinates, for both x and y, out of those four
        ret = len(set([coord[0] for coord in ring])) == len(set([coord[1] for coord in ring])) == 2
        return ret

    except (IndexError, IOError, ValueError):
        # Unparseable JSON or unreadable file: play it safe
        return False

@retry
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

    # don't operate on the original file.  If the renamed file already exists,
    # then don't try to rename, since that file may not exist if this is a retry.
    if out_dataset == in_dataset:
        in_dataset = os.path.join(os.path.dirname(out_dataset), "old_{0}".format(os.path.basename(out_dataset)))
        if not os.path.isfile(in_dataset):
            logger.info("Renaming '{}' to '{}'".format(out_dataset, in_dataset))
            os.rename(out_dataset, in_dataset)

    meta = get_meta(in_dataset)

    if not fmt:
        fmt = meta['driver'] or 'gpkg'

    band_type = ""

    # Overwrite is added to the commands in the event that the dataset is retried.  In general we want these to
    # act idempotently.
    if table:
        cmd_template = Template("ogr2ogr -overwrite -f $fmt -clipsrc $boundary $out_ds $in_ds $table")
    elif meta['is_raster']:
        cmd_template = Template("gdalwarp -overwrite -cutline $boundary -crop_to_cutline $dstalpha -of $fmt $type $in_ds $out_ds")
        # Geopackage raster only supports byte band type, so check for that
        if fmt.lower() == 'gpkg':
            band_type = "-ot byte"
    else:
        cmd_template = Template("ogr2ogr -overwrite -f $fmt -clipsrc $boundary $out_ds $in_ds")

    temp_boundfile = None
    if isinstance(boundary, list):
        boundary = " ".join(str(i) for i in boundary)  # ogr2ogr can handle bbox as params
        if not table:  # gdalwarp needs a file
            temp_boundfile = NamedTemporaryFile()
            bounds_template = Template('{"type":"MultiPolygon","coordinates":[[[[$xmin,$ymin],'
                                       '[$xmax,$ymin],[$xmax,$y'
                                       'max],[$xmin,$ymax],[$xmin,$ymin]]]]}')
            geojson = bounds_template.safe_substitute({
                'xmin': boundary[0],
                'ymin': boundary[1],
                'xmax': boundary[2],
                'ymax': boundary[3]
            })
            temp_boundfile.write(geojson.encode())
            temp_boundfile.flush()
            boundary = temp_boundfile.name

    try:
        if meta.get('nodata') is None and not is_envelope(in_dataset):
            dstalpha = "-dstalpha"
        else:
            dstalpha = ""

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


@retry
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

    meta = get_meta(dataset)
    driver, is_raster = meta['driver'], meta['is_raster']

    if not fmt or not driver or driver.lower() == fmt.lower():
        return dataset

    in_ds = os.path.join(os.path.dirname(dataset), "old_{0}".format(os.path.basename(dataset)))
    os.rename(dataset, in_ds)

    band_type = ""
    if is_raster:
        cmd_template = Template("gdalwarp -overwrite -of $fmt $type $in_ds $out_ds")
        # Geopackage raster only supports byte band type, so check for that
        if fmt.lower() == 'gpkg':
            band_type = "-ot byte"
    else:
        cmd_template = Template("ogr2ogr -overwrite -f $fmt $out_ds $in_ds")

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


def get_dimensions(bbox, scale):
    """

    :param bbox: A list [w, s, e, n].
    :param scale: A scale in meters per pixel.
    :return: A list [width, height] representing pixels
    """
    # Request at least one pixel
    width = get_distance([bbox[0], bbox[1]], [bbox[2], bbox[1]]) or 1
    height = get_distance([bbox[0], bbox[1]], [bbox[0], bbox[3]]) or 1
    return [int(width/scale), int(height/scale)]


def get_line(coordinates):
    """

    :param coordinates: A list representing a single coordinate in decimal degrees.
        Example: [[W/E, N/S], [W/E, N/S]]
    :return: AN OGR geometry point.
    """
    # This line will implicitly be in EPSG:4326 because that is what the geojson standard specifies.
    geojson = json.dumps({"type": "LineString", "coordinates": coordinates})
    return ogr.CreateGeometryFromJson(geojson)


def get_distance(point_a, point_b):
    """
    Takes two points, and converts them to a line, converts the geometry to mercator and returns length in meters.
    The geometry is converted to mercator because length is based on the SRS unit of measure (meters for mercator).
    :param point_a: A list representing a single point [W/E, N/S].
    :param point_b: A list representing a single point [W/E, N/S].
    :return: Distance in meters.
    """
    line = get_line([point_a, point_b])
    reproject_geometry(line, 4326, 3857)
    return line.Length()


def reproject_geometry(geometry, from_srs, to_srs):
    """

    :param geometry: Converts an ogr geometry from one spatial reference system to another
    :param from_srs:
    :param to_srs:
    :return:
    """
    return geometry.Transform(get_transform(from_srs, to_srs))


def get_transform(from_srs, to_srs):
    """

    :param from_srs: A spatial reference (EPSG) represented as an int (i.e. EPSG:4326 = 4326)
    :param to_srs: A spatial reference (EPSG) represented as an int (i.e. EPSG:4326 = 4326)
    :return: An osr coordinate transformation object.
    """
    source = osr.SpatialReference()
    source.ImportFromEPSG(from_srs)

    target = osr.SpatialReference()
    target.ImportFromEPSG(to_srs)

    return osr.CoordinateTransformation(source, target)


def merge_geotiffs(in_files, out_file, task_uid=None):
    """

    :param in_files: A list of geotiffs.
    :param out_file:  A location for the result of the merge.
    :param task_uid: A task uid to manage the subprocess.
    :return: The out_file path.
    """
    cmd_template = Template("gdalwarp $in_ds $out_ds")
    cmd = cmd_template.safe_substitute({'in_ds': ' '.join(in_files),
                                        'out_ds': out_file})

    logger.debug("GDAL merge cmd: {0}".format(cmd))

    task_process = TaskProcess(task_uid=task_uid)
    task_process.start_process(cmd, shell=True, executable="/bin/bash",
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if task_process.exitcode != 0:
        logger.error('{0}'.format(task_process.stderr))
        raise Exception("GeoTIFF merge process failed with return code {0}".format(task_process.exitcode))

    return out_file


def get_band_statistics(file_path, band=1):
    """
    Returns the band statistics for a specific raster file and band
    :param file_path: The path to the file.
    :param band: A specific raster band (defaults to 1).
    :return: A list [min, max, mean, std_dev]
    """
    try:
        gdal.UseExceptions()
        geotiff = gdal.Open(file_path)
        band = geotiff.GetRasterBand(1)
        return band.GetStatistics(True, True)
    except Exception as e:
        logger.error(e)
        logger.error("Could not get statistics for {0}:{1}".format(file_path, band))
        return None


def track_progress(proc, callback, *args, **kwargs):
    """
    Blocking call
    GDAL version 2.2.4 (tested)

    Converts the stdout of a gdal subprocess that has the -progress flag specified into a series of notifications
    supplied to the callback function.  This method assumes that the subprocess's stdout stream is using
    text mode (e.g. universal_newlines=True):
        https://docs.python.org/3/library/subprocess.html#frequently-used-arguments

    GDAL's stdout output is formatted as:
        0...10...20...30...40...50...60...70...80...90...100 - done.

    Issues:
        - Assumes gdal utility only prints the progress string to stdout
        - Will not handle non-integer based progress reporting from GDAL
        - Some issues may arise, including delayed reporting, due to buffering of the io channels

    :param proc: The subprocess where GDAL is running
    :param callback: Function with callback
    :param args: Additional parameters passed to callback
    :param kwargs: Additional parameters passed to callback
    :return:
    """
    buffer = [None] * 10
    write = 0

    def read_next(size):
        # Buffer numeric characters until we find a non-numeric character... then parse the number
        nonlocal buffer
        nonlocal write

        r = proc.stdout.read(size)
        # print(r)

        for c in r:
            if c.isdigit():
                buffer[write] = c
                write += 1
            else:
                if write > 0:
                    progress = float(''.join(buffer[0:write]))  # Take the first 'write' characters
                    reset()
                    callback(progress, *args, **kwargs)

        return r

    def reset():
        nonlocal write
        nonlocal buffer

        for i in range(0, write):
            buffer[i] = None
        write = 0

    # The number of characters we read here are based on the expected GDAL output
    if proc.poll() is None:
        read_next(2)  # 0.

    while proc.poll() is None:
        read_next(5)  # ..10. ..20. ..30.

    read_next(-1)  # Till EOF
