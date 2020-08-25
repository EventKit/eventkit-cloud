# -*- coding: utf-8 -*-
import json
import logging
import math
import billiard
import os
import time
from tempfile import NamedTemporaryFile
from functools import wraps

from osgeo import gdal, ogr, osr

from eventkit_cloud.tasks.task_process import TaskProcess, update_progress
from eventkit_cloud.utils.generic import requires_zip, create_zip_file, get_zip_name
from eventkit_cloud.utils.geocoding.geocode import GeocodeAdapter, is_valid_bbox
from django.conf import settings


logger = logging.getLogger(__name__)

MAX_DB_CONNECTION_RETRIES = 8
TIME_DELAY_BASE = 2  # Used for exponential delays (i.e. 5^y) at 8 would be about 4 minutes 15 seconds max delay.


# The retry here is an attempt to mitigate any possible dropped connections. We chose to do a limited number of
# retries as retrying forever would cause the job to never finish in the event that the database is down. An
# improved method would perhaps be to see if there are connection options to create a more reliable connection.
# We have used this solution for now as I could not find options supporting this in the gdal documentation.


def retry(f):
    @wraps(f)
    def wrapper(*args, **kwds):

        attempts = MAX_DB_CONNECTION_RETRIES
        exc = None
        while attempts:
            try:
                return_value = f(*args, **kwds)
                if not return_value:
                    logger.error("The function {0} failed to return any values.".format(getattr(f, "__name__")))
                    raise Exception("The process failed to return any data, please contact an administrator.")
                return return_value
            except Exception as e:
                logger.error("The function {0} threw an error.".format(getattr(f, "__name__")))
                logger.error(str(e))
                exc = e

                if getattr(settings, "TESTING", False):
                    # Don't wait/retry when running tests.
                    break
                attempts -= 1
                if "canceled" in str(e).lower():
                    # If task was canceled (as opposed to fail) don't retry.
                    attempts = 0
                else:
                    if attempts:
                        delay = TIME_DELAY_BASE ** (MAX_DB_CONNECTION_RETRIES - attempts + 1)
                        logger.error(f"Retrying {str(attempts)} more times, sleeping for {delay}...")
                        time.sleep(delay)
        raise exc

    return wrapper


def progress_callback(pct, msg, user_data):
    update_progress(
        user_data.get("task_uid"),
        progress=round(pct * 100),
        subtask_percentage=user_data.get("subtask_percentage"),
        msg=msg,
    )


def open_dataset(file_path, is_raster):
    """
    Given a path to a raster or vector dataset, returns an opened GDAL or OGR dataset.
    The caller has the responsibility of closing/deleting the dataset when finished.
    :param file_path: Path to dataset
    :return: Handle to open dataset
    """

    # Attempt to open as gdal dataset (raster)
    gdal.DontUseExceptions()

    logger.info("Opening the dataset: {}".format(file_path))
    gdal_dataset = None
    ogr_dataset = None
    try:
        gdal_dataset = gdal.Open(file_path)
        if gdal_dataset and is_raster:
            logger.info(f"The dataset: {file_path} opened with gdal.")
            return gdal_dataset

        # Attempt to open as ogr dataset (vector)
        # ogr.UseExceptions doesn't seem to work reliably, so just check for Open returning None
        ogr_dataset = ogr.Open(file_path)

        if not ogr_dataset:
            logger.debug("Unknown file format: {0}".format(file_path))
        else:
            logger.info(f"The dataset: {file_path} opened with ogr.")
        return ogr_dataset or gdal_dataset
    except RuntimeError as ex:
        if ("not recognized as a supported file format" not in str(ex)) or (
            "Error browsing database for PostGIS Raster tables" in str(ex)
        ):
            raise ex
    finally:
        cleanup_dataset(gdal_dataset)
        cleanup_dataset(ogr_dataset)
        gdal.UseExceptions()


def cleanup_dataset(dataset):
    """
    Given an input gdal.Dataset or ogr.DataSource, destroy it.
    NB: referring to this object's members after destruction will crash the Python interpreter.
    :param resources: Dataset / DataSource to destroy
    """
    if dataset:
        logger.info("Closing the resources: {}.".format(dataset))
        # https://trac.osgeo.org/gdal/wiki/PythonGotchas#CertainobjectscontainaDestroymethodbutyoushouldneveruseit
        del dataset


@retry
def get_meta(ds_path, is_raster=True):
    """
    This function is a wrapper for the get_gdal metadata because if there is a database diconnection there is no obvious
    way to clean up and free those resources therefore it is put on a separate process and if it fails it can just be
    tried again.

    This is using GDAL 2.2.4 this should be checked again to see if it can be simplified in a later version.
    :param ds_path: String: Path to dataset
    :param is_raster Boolean: Do not try to do OGR lookup if a raster dataset can be opened, otherwise it will try both,
         and return the vector if that is an option.
    :return: Metadata dict
        driver: Short name of GDAL driver for dataset
        is_raster: True if dataset is a raster type
        nodata: NODATA value for all bands if all bands have the same one, otherwise None (raster sets only)
    """

    multiprocess_queue = billiard.Queue()
    proc = billiard.Process(target=get_gdal_metadata, daemon=True, args=(ds_path, is_raster, multiprocess_queue,))
    proc.start()
    proc.join()
    return multiprocess_queue.get()


def get_gdal_metadata(ds_path, is_raster, multiprocess_queue):
    """
    Don't call this directly use get_meta.

    Given a path to a raster or vector dataset, return the appropriate driver type.

    :param ds_path: String: Path to dataset
    :param A multiprocess queue.
    :return: None.
    """

    dataset = None
    ret = {"driver": None, "is_raster": None, "nodata": None}

    try:
        dataset = open_dataset(ds_path, is_raster)
        if isinstance(dataset, ogr.DataSource):
            ret["driver"] = dataset.GetDriver().GetName()
            ret["is_raster"] = False

        elif isinstance(dataset, gdal.Dataset):
            ret["driver"] = dataset.GetDriver().ShortName
            ret["is_raster"] = True
            if dataset.RasterCount:
                bands = list(set([dataset.GetRasterBand(i + 1).GetNoDataValue() for i in range(dataset.RasterCount)]))
                if len(bands) == 1:
                    ret["nodata"] = bands[0]

        if ret["driver"]:
            logger.debug("Identified dataset {0} as {1}".format(ds_path, ret["driver"]))
        else:
            logger.debug("Could not identify dataset {0}".format(ds_path))

        multiprocess_queue.put(ret)

    finally:
        cleanup_dataset(dataset)


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
        return math.pi * d / 180

    if isinstance(geojson, str):
        geojson = json.loads(geojson)

    if hasattr(geojson, "geometry"):
        geojson = geojson["geometry"]

    geom_type = geojson["type"].lower()
    if geom_type == "polygon":
        polys = [geojson["coordinates"]]
    elif geom_type == "multipolygon":
        polys = geojson["coordinates"]
    else:
        return RuntimeError("Invalid geometry type: %s" % geom_type)

    a = 0
    for poly in polys:
        ring = poly[0]
        if len(ring) < 4:
            continue
        ring.append(ring[-2])  # convenient for circular indexing
        for i in range(len(ring) - 2):
            a += (rad(ring[i + 1][0]) - rad(ring[i - 1][0])) * math.sin(rad(ring[i][1]))

    area = abs(a * (earth_r ** 2) / 2)
    return area


def is_envelope(geojson_path):
    """
    Given a path to a GeoJSON file, reads it and determines whether its coordinates correspond to a WGS84 bounding box,
    i.e. lat1=lat2, lon2=lon3, lat3=lat4, lon4=lon1, to tell whether there's need for an alpha layer in the output
    :param geojson_path: Path to GeoJSON selection file
    :return: True if the given geojson is an envelope/bounding box, with one polygon and one ring.
    """
    try:
        if not os.path.isfile(geojson_path) and isinstance(geojson_path, str):
            geojson = json.loads(geojson_path)
        else:
            with open(geojson_path, "r") as gf:
                geojson = json.load(gf)

        geom_type = geojson["type"].lower()
        if geom_type == "polygon":
            polys = [geojson["coordinates"]]
        elif geom_type == "multipolygon":
            polys = geojson["coordinates"]
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
def convert(
    boundary=None,
    input_file=None,
    output_file=None,
    fmt=None,
    layers=None,
    task_uid=None,
    projection: int = None,
    creation_options: list = None,
    is_raster: bool = True,
    warp_params: dict = None,
    translate_params: dict = None,
):
    """
    Uses gdal to convert and clip a supported dataset file to a mask if boundary is passed in.
    :param translate_params: A dict of params to pass into gdal translate.
    :param warp_params: A dict of params to pass into gdal warp.
    :param is_raster: A explicit declaration that dataset is raster (for disambiguating mixed mode files...gpkg)
    :param boundary: A geojson file or bbox (xmin, ymin, xmax, ymax) to serve as a cutline
    :param input_file: A raster or vector file to be clipped
    :param output_file: The dataset to put the clipped output in (if not specified will use in_dataset)
    :param fmt: Short name of output driver to use (defaults to input format)
    :param layers: Table name in database for in_dataset
    :param task_uid: A task uid to update
    :param projection: A projection as an int referencing an EPSG code (e.g. 4326 = EPSG:4326)
    :param creation_options: Additional options to pass to the convert method (e.g. "-co SOMETHING")
    :return: Filename of clipped dataset
    """

    input_file, output_file = get_dataset_names(input_file, output_file)
    meta = get_meta(input_file, is_raster)

    if projection is None:
        projection = 4326
    src_src = "EPSG:4326"
    dst_src = f"EPSG:{projection}"

    if not fmt:
        fmt = meta["driver"] or "gpkg"

    # Geopackage raster only supports byte band type, so check for that
    band_type = None
    dstalpha = None
    if fmt.lower() == "gpkg":
        band_type = gdal.GDT_Byte
    if meta.get("nodata") is None and not is_envelope(input_file):
        dstalpha = True

    # Clip the dataset if a boundary is passed in.
    temp_boundfile = None
    geojson = None
    bbox = None
    if boundary:
        # Strings are expected to be a file.
        if isinstance(boundary, str):
            if not os.path.isfile(boundary):
                raise Exception(f"Called convert using a boundary of {boundary} but no such path exists.")
        elif is_valid_bbox(boundary):
            geojson = GeocodeAdapter.bbox2polygon(boundary)
            bbox = boundary
        elif isinstance(boundary, dict):
            geojson = boundary
        if geojson:
            temp_boundfile = NamedTemporaryFile(suffix=".json")
            temp_boundfile.write(json.dumps(geojson).encode())
            temp_boundfile.flush()
            boundary = temp_boundfile.name

    if meta["is_raster"]:
        cmd = get_task_command(
            convert_raster,
            input_file,
            output_file,
            fmt=fmt,
            creation_options=creation_options,
            band_type=band_type,
            dst_alpha=dstalpha,
            boundary=boundary,
            src_srs=src_src,
            dst_srs=dst_src,
            task_uid=task_uid,
            warp_params=warp_params,
            translate_params=translate_params,
        )
    else:
        cmd = get_task_command(
            convert_vector,
            input_file,
            output_file,
            fmt=fmt,
            creation_options=creation_options,
            src_srs=src_src,
            dst_srs=dst_src,
            layers=layers,
            task_uid=task_uid,
            boundary=boundary,
            bbox=bbox,
        )
    try:
        task_process = TaskProcess(task_uid=task_uid)
        task_process.start_process(cmd)
    except Exception as e:
        logger.error(e)
        raise Exception("File conversion failed.  Please try again or contact support.")

    finally:
        if temp_boundfile:
            temp_boundfile.close()

    if requires_zip(fmt):
        logger.debug(f"Requires zip: {output_file}")
        output_file = create_zip_file(output_file, get_zip_name(output_file))

    return output_file


def get_task_command(function, *args, **kwargs):
    return lambda: function(*args, **kwargs)


def get_dataset_names(input_file, output_file):
    """
    This is a helper that will get us the name of the output_dataset.
    :param input_file: The name of the dataset to convert.
    :param output_file: (Optional) The path to convert the file.
    :return: An output dataset name.
    """
    if not input_file:
        raise Exception("No provided 'in' dataset")

    # Strip optional file prefixes
    file_prefix, in_dataset_file = strip_prefixes(input_file)
    if not output_file:
        output_file = in_dataset_file

    # don't operate on the original file.  If the renamed file already exists,
    # then don't try to rename, since that file may not exist if this is a retry.
    if output_file == in_dataset_file:
        in_dataset_file = rename_duplicate(in_dataset_file)
        input_file = f"{file_prefix}{in_dataset_file}"
    return input_file, output_file


def clean_options(options):
    return {option: value for option, value in options.items() if value is not None}


def convert_raster(
    input_files,
    output_file,
    fmt=None,
    creation_options=None,
    band_type=None,
    dst_alpha=None,
    boundary=None,
    src_srs=None,
    dst_srs=None,
    task_uid=None,
    warp_params: dict = None,
    translate_params: dict = None,
):
    """
    :param warp_params: A dict of options to pass to gdal warp (done first in conversion), overrides other settings.
    :param translate_params: A dict of options to pass to gdal translate (done second in conversion),
        overrides other settings.
    :param input_files: A file or list of files to convert.
    :param output_file: The file to convert.
    :param fmt: The file format to convert.
    :param creation_options: Special GDAL options for conversion.
        Search for "gdal driver <format> creation options" creation options for driver specific implementation.
    :param band_type: The GDAL data type (e.g. gdal.GDT_BYTE).
    :param dst_alpha: If including an alpha band in the destination file.
    :param boundary: The boundary to be used for clipping, this must be a file.
    :param src_srs: The srs of the source (e.g. "EPSG:4326")
    :param dst_srs: The srs of the destination (e.g. "EPSG:3857")
    :param task_uid: The eventkit task uid used for tracking the work.
    :return: The output file.
    """
    if isinstance(input_files, str):
        input_files = [input_files]
    gdal.UseExceptions()
    subtask_percentage = 50 if fmt.lower() == "gtiff" else 100
    options = clean_options(
        {
            "callback": progress_callback,
            "callback_data": {"task_uid": task_uid, "subtask_percentage": subtask_percentage},
            "creationOptions": creation_options,
            "format": fmt,
        }
    )
    if not warp_params:
        warp_params = clean_options(
            {"outputType": band_type, "dstAlpha": dst_alpha, "srcSRS": src_srs, "dstSRS": dst_srs}
        )
    if boundary:
        warp_params.update({"cutlineDSName": boundary, "cropToCutline": True})
    # Keep the name imagery which is used when seeding the geopackages.
    # Needed because arcpy can't change table names.
    if fmt.lower() == "gpkg":
        options["creationOptions"] = options.get("creationOptions", []) + ["RASTER_TABLE=imagery"]
    logger.info(
        f"calling gdal.Warp('{output_file}', [{', '.join(input_files)}],"
        f"{stringify_params(options)}, {stringify_params(warp_params)},)"
    )
    gdal.Warp(output_file, input_files, **options, **warp_params)

    if fmt.lower() == "gtiff" or translate_params:
        input_file, output_file = get_dataset_names(output_file, output_file)
        if translate_params:
            options.update(translate_params)
        else:
            options.update({"creationOptions": ["COMPRESS=LZW", "TILED=YES", "BIGTIFF=YES"]})

        logger.info(f"calling gdal.Translate('{output_file}', '{input_file}', " f"{stringify_params(options)},)")
        gdal.Translate(output_file, input_file, **options)
    return output_file


def convert_vector(
    input_file,
    output_file,
    fmt=None,
    creation_options=None,
    access_mode="overwrite",
    src_srs=None,
    dst_srs=None,
    task_uid=None,
    layers=None,
    boundary=None,
    bbox=None,
):
    """
    :param input_files: A file or list of files to convert.
    :param output_file: The file to convert.
    :param fmt: The file format to convert.
    :param creation_options: Special GDAL options for conversion.
        Search for "gdal driver <format> creation options" creation options for driver specific implementation.
    :param access_mode: The access mode for the file (e.g. "append" or "overwrite")
    :param bbox: A bounding box as a list (w,s,e,n) to be used for limiting the AOI that is used during conversion.
    :param boundary: The boundary to be used for clipping.
        This must be a file (i.e. a path as a string) and cannot be used with bbox.
    :param src_srs: The srs of the source (e.g. "EPSG:4326")
    :param dst_srs: The srs of the destination (e.g. "EPSG:3857")
    :param task_uid: The eventkit task uid used for tracking the work.
    :param layers: A list of layers to include for translation.
    :return: The output file.
    """
    gdal.UseExceptions()
    options = clean_options(
        {
            "callback": progress_callback,
            "callback_data": {"task_uid": task_uid},
            "creationOptions": creation_options,
            "format": fmt,
            "geometryType": "PROMOTE_TO_MULTI",
            "layers": layers,
            "srcSRS": src_srs,
            "dstSRS": dst_srs,
            "accessMode": access_mode,
            "reproject": src_srs != dst_srs,
            "skipFailures": True,
            "spatFilter": bbox,
            "options": ["-clipSrc", boundary] if boundary and not bbox else None,
        }
    )
    logger.info(f"calling gdal.VectorTranslate('{output_file}', '{input_file}', {stringify_params(options)})")
    gdal.VectorTranslate(output_file, input_file, **options)
    return output_file


def stringify_params(params):
    return ", ".join([f"{k}='{v}'" for k, v in params.items()])


def get_dimensions(bbox, scale):
    """

    :param bbox: A list [w, s, e, n].
    :param scale: A scale in meters per pixel.
    :return: A list [width, height] representing pixels
    """
    # Request at least one pixel
    width = get_distance([bbox[0], bbox[1]], [bbox[2], bbox[1]]) or 1
    height = get_distance([bbox[0], bbox[1]], [bbox[0], bbox[3]]) or 1
    return [int(width / scale), int(height / scale)]


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
    :param task_uid: A task uid to track the conversion.
    :return: The out_file path.
    """
    cmd = get_task_command(convert_raster, in_files, out_file, task_uid=task_uid)

    try:
        task_process = TaskProcess(task_uid=task_uid)
        task_process.start_process(cmd)
    except Exception as e:
        logger.error(e)
        raise Exception("GeoTIFF merge process failed.")

    return out_file


def get_band_statistics(file_path, band=1):
    """
    Returns the band statistics for a specific raster file and band
    :param file_path: The path to the file.
    :param band: A specific raster band (defaults to 1).
    :return: A list [min, max, mean, std_dev]
    """
    image_file = None
    try:
        gdal.UseExceptions()
        image_file = gdal.Open(file_path)
        raster_band = image_file.GetRasterBand(band)
        return raster_band.GetStatistics(False, True)
    except Exception as e:
        logger.error(e)
        logger.error("Could not get statistics for {0}:{1}".format(file_path, raster_band))
        return None
    finally:
        # Need to close the dataset.
        cleanup_dataset(image_file)  # NOQA


def rename_duplicate(original_file: str) -> str:
    returned_file = os.path.join(os.path.dirname(original_file), "old_{0}".format(os.path.basename(original_file)),)
    # if the original and renamed files both exist, we can remove the renamed version, and then rename the file.
    if os.path.isfile(returned_file) and os.path.isfile(original_file):
        os.remove(returned_file)
    # If the original file doesn't exist but the renamed version does, then something failed after a rename, and
    # this is now retrying the operation.
    if not os.path.isfile(returned_file):
        logger.info("Renaming '{}' to '{}'".format(original_file, returned_file))
        os.rename(original_file, returned_file)
    return returned_file


def strip_prefixes(dataset: str) -> (str, str):
    prefixes = ["GTIFF_RAW:"]
    removed_prefix = ""
    output_dataset = dataset
    for prefix in prefixes:
        cleaned_dataset = output_dataset.lstrip(prefix)
        if cleaned_dataset != output_dataset:
            removed_prefix = prefix
        output_dataset = cleaned_dataset
    return removed_prefix, output_dataset
