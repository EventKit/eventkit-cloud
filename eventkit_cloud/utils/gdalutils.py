# -*- coding: utf-8 -*-
import json
import logging
import math
import os
import subprocess
import time
from string import Template
from tempfile import NamedTemporaryFile

from osgeo import gdal, ogr, osr

from eventkit_cloud.tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)

MAX_DB_CONNECTION_RETRIES = 3


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


def get_meta(ds_path):
    """
    Given a path to a raster or vector dataset, return the appropriate driver type.
    :param ds_path: String: Path to dataset
    :return: Metadata dict
        driver: Short name of GDAL driver for dataset
        is_raster: True if dataset is a raster type
        nodata: NODATA value for all bands if all bands have the same one, otherwise None (raster sets only)
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

        return ret

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

    meta = get_meta(in_dataset)

    if not fmt:
        fmt = meta['driver'] or 'gpkg'

    band_type = ""
    if table:
        cmd_template = Template("ogr2ogr -update -f $fmt -clipsrc $boundary $out_ds $in_ds $table")
    elif meta['is_raster']:
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

        # The retry here is an attempt to mitigate any possible dropped connections. We chose to do a limited number of
        # retries as retrying forever would cause the job to never finish in the event that the database is down. An
        # improved method would perhaps be to see if there are connection options to create a more reliable connection.
        # We have used this solution for now as I could not find options supporting this in the ogr2ogr or gdalwarp
        # documentation.
        attempts = 0
        while True:
            try:
                task_process.start_process(cmd, shell=True, executable="/bin/bash",
                                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                break
            except Exception as e:
                logger.error(e)
                attempts += 1
                if attempts > MAX_DB_CONNECTION_RETRIES:
                    raise e
                time.sleep(2)

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

    meta = get_meta(dataset)
    driver, is_raster = meta['driver'], meta['is_raster']

    if not fmt or not driver or driver.lower() == fmt.lower():
        return dataset

    in_ds = os.path.join(os.path.dirname(dataset), "old_{0}".format(os.path.basename(dataset)))
    os.rename(dataset, in_ds)

    band_type = ""
    if is_raster:
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


def get_dimensions(bbox, scale):
    """

    :param bbox: A list [w, s, e, n].
    :param scale: A scale in meters per pixel.
    :return: A list [width, height] representing pixels
    """
    width = get_distance([bbox[0], bbox[1]], [bbox[2], bbox[1]])
    height = get_distance([bbox[0], bbox[1]], [bbox[0], bbox[3]])
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
