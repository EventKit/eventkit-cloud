from __future__ import absolute_import

from contextlib import contextmanager
import os
import subprocess
import zipfile
import shutil
import json
import re
import math

from django.conf import settings
from django.utils import timezone
from django.template.loader import render_to_string
from celery.utils.log import get_task_logger
from ..utils.gdalutils import get_meta, get_band_statistics
from ..utils import auth_requests
from uuid import uuid4
from string import Template
from datetime import datetime
import pytz
from numpy import linspace

logger = get_task_logger(__name__)


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), 'static', 'ui', 'styles')
    files = get_file_paths(style_dir)
    arcgis_dir = os.path.join(os.path.dirname(__file__), 'arcgis')
    files = get_file_paths(arcgis_dir, files)
    return files


def create_license_file(provider_task):
    # checks a DataProviderTaskRecord's license file and adds it to the file list if it exists
    from eventkit_cloud.jobs.models import DataProvider
    from eventkit_cloud.tasks.task_runners import normalize_name
    data_provider_license = DataProvider.objects.get(slug=provider_task.slug).license

    # DataProviders are not required to have a license
    if data_provider_license is None:
        return

    license_file_path = os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(provider_task.run.uid),
                                     provider_task.slug, '{0}.txt'.format(normalize_name(data_provider_license.name)))
    try:
        os.makedirs(os.path.dirname(license_file_path))
    except OSError:
        if not os.path.isdir(os.path.dirname(license_file_path)):
            raise

    with open(license_file_path, 'w') as license_file:
        license_file.write(data_provider_license.text.encode('utf-8'))

    return license_file_path


def generate_qgs_style(run_uid=None, export_provider_task=None):
    """
    Task to create QGIS project file with styles for osm.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from ..tasks.export_tasks import TaskStates
    from ..tasks.task_runners import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    job_name = run.job.name.lower()

    provider_tasks = run.provider_tasks.all()

    # A dict is used here to ensure that just one file per provider is added,
    # this should be updated when multiple formats are supported.
    provider_details = {}
    has_raster = False
    has_elevation = False
    # This collecting of metadata should be generalized and used for both QGS styles and arcmap styles.
    if export_provider_task:
        provider_details[export_provider_task.slug] = {'provider_slug': export_provider_task.slug, 'file_path': '', 'provider_name': export_provider_task.name}
    else:
        for provider_task in provider_tasks:
            if TaskStates[provider_task.status] not in TaskStates.get_incomplete_states():
                for export_task in provider_task.tasks.all():
                    try:
                        filename = export_task.result.filename
                    except Exception:
                        continue
                    full_file_path = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid),
                                                  provider_task.slug, filename)
                    if not os.path.isfile(full_file_path):
                        logger.error("Could not find file {0} for export {1}.".format(full_file_path,
                                                                                      export_task.name))
                        continue
                    # Exclude zip files created by zip_export_provider and the selection geojson
                    # also within the QGIS style sheet it is currently assumed that GPKG files are Imagery and
                    # GeoTIFF are elevation.  This will need to be updated in the future.
                    file_ext = os.path.splitext(full_file_path)[1]
                    if file_ext not in [".zip", ".geojson"]:
                        provider_details[provider_task.slug] = {'provider_slug': provider_task.slug,
                                                                'file_path': full_file_path,
                                                                'provider_name': provider_task.name,
                                                                'file_type': file_ext}
                        if provider_task.slug not in ['osm', 'nome']:
                            if file_ext == '.gpkg':
                                has_raster = True
                            if file_ext == '.tif':
                                has_elevation = True
                        if os.path.splitext(full_file_path)[1] == '.tif':
                            # Get statistics to update ranges in template.
                            band_stats = get_band_statistics(full_file_path)
                            logger.info("Band Stats {0}: {1}".format(full_file_path, band_stats))
                            provider_details[provider_task.slug]["band_stats"] = band_stats
                            # Calculate the value for each elevation step (of 16)
                            try:
                                steps = linspace(band_stats[0], band_stats[1], num=16)
                                provider_details[provider_task.slug]["ramp_shader_steps"] = list(map(int, steps))
                            except TypeError:
                                provider_details[provider_task.slug]["ramp_shader_steps"] = None

    style_file = os.path.join(stage_dir, '{0}-{1}.qgs'.format(normalize_name(job_name),
                                                              timezone.now().strftime("%Y%m%d")))

    provider_details = [provider_detail for provider_slug, provider_detail in provider_details.iteritems()]

    with open(style_file, 'w') as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'job_name': normalize_name(job_name),
                                                                      'job_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'provider_details': provider_details,
                                                                      'bbox': run.job.extents,
                                                                      'has_raster': has_raster,
                                                                      'has_elevation': has_elevation}))
    return style_file


def get_human_readable_metadata_document(run_uid):
    """

    :param run_uid: A UID for the export run.
    :return: A filepath to a txt document.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from eventkit_cloud.jobs.models import DataProvider
    from ..tasks.task_runners import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    data_providers = []
    for provider_task in run.provider_tasks.all():
        data_provider = DataProvider.objects.get(slug=provider_task.slug)
        provider_type = data_provider.export_provider_type.type_name
        data_provider_metadata = {'name': data_provider.name,
                                  'description': data_provider.service_description.encode('utf-8').replace('\r\n', '\n').replace('\n', '\r\n\t'),
                                  'last_update': get_last_update(data_provider.url,
                                                                 provider_type,
                                                                 slug=data_provider.slug),
                                  'metadata': get_metadata_url(data_provider.url, provider_type),
                                  'copyright': data_provider.service_copyright}
        data_providers += [data_provider_metadata]

    metadata = {'name': run.job.name,
                'url': "{0}/status/{1}".format(getattr(settings, "SITE_URL"), run.job.uid),
                'description': run.job.description,
                'project': run.job.event,
                'date': timezone.now().strftime("%Y%m%d"),
                'run_uid': run.uid,
                'data_providers': data_providers,
                'aoi': run.job.bounds_geojson}

    metadata_file = os.path.join(stage_dir, '{0}_ReadMe.txt'.format(normalize_name(run.job.name)))

    with open(metadata_file, 'w') as open_file:
        open_file.write(render_to_string('styles/metadata.txt', context={'metadata': metadata}).encode('utf-8').replace('\r\n', '\n').replace('\n', '\r\n'))

    return metadata_file


def get_file_paths(directory, paths=None):
    paths = paths or dict()
    with cd(directory):
        for dirpath, _, filenames in os.walk('./'):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths


def get_last_update(url, type, slug=None):
    """
    A wrapper to get different timestamps.
    :param url: The url to get the timestamp
    :param type: The type of services (e.g. osm)
    :param slug: Optionally a slug if the service requires credentials.
    :return: The timestamp as a string.
    """
    if type == 'osm':
        return get_osm_last_update(url, slug=slug)


def get_metadata_url(url, type):
    """
    A wrapper to get different timestamps.
    :param url: The url to get the timestamp
    :param type: The type of services (e.g. osm)
    :param slug: Optionally a slug if the service requires credentials.
    :return: The timestamp as a string.
    """
    if type in ['wcs', 'wms', 'wmts']:
        return "{0}?request=GetCapabilities".format(url.split('?')[0])
    else:
        return url


def get_osm_last_update(url, slug=None):
    """

    :param url: A path to the overpass api.
    :param slug: Optionally a slug if credentials are needed
    :return: The default timestamp as a string (2018-06-18T13:09:59Z)
    """

    timestamp_url = "{0}timestamp".format(url.rstrip('/').rstrip('interpreter'))
    try:
        response = auth_requests.get(timestamp_url, slug=slug)
        if response:
            return response.content
        raise Exception("Get OSM last update failed with {0}: {1}".format(response.status_code, response.content))
    except Exception as e:
        logger.warning(e)
        logger.warning("Could not get the timestamp from the overpass url.")
        return None


def file_to_geojson(in_memory_file):
    """
    :param in_memory_file: A WSGI In memory file
    :return: A geojson object if available
    """
    stage_dir = settings.EXPORT_STAGING_ROOT.rstrip('\/')
    uid = str(uuid4())
    dir = os.path.join(stage_dir, uid)

    try:
        os.mkdir(dir)
        file_name = in_memory_file.name

        file_name, file_extension = os.path.splitext(file_name)
        if not file_name or not file_extension:
            raise Exception('No file type detected')

        # Remove all non-word characters
        file_name = re.sub(r"[^\w\s]", '', file_name)
        # Replace all whitespace with a single underscore
        file_name = re.sub(r"\s+", '_', file_name).lower()

        in_path = os.path.join(dir, 'in_{0}{1}'.format(file_name, file_extension))
        out_path = os.path.join(dir, 'out_{0}.geojson'.format(file_name))
        write_uploaded_file(in_memory_file, in_path)

        if file_extension == '.zip':
            if unzip_file(in_path, dir):
                has_shp = False
                for unzipped_file in os.listdir(dir):
                    if unzipped_file.endswith('.shp'):
                        in_path = os.path.join(dir, unzipped_file)
                        has_shp = True
                        break
                if not has_shp:
                    raise Exception('Zip file does not contain a shp')

        meta = get_meta(in_path)

        if not meta['driver'] or meta['is_raster']:
            raise Exception("Could not find the proper driver to handle this file")

        cmd_template = Template("ogr2ogr -f $fmt $out_ds $in_ds")

        cmd = cmd_template.safe_substitute({
            'fmt': 'geojson',
            'out_ds': out_path,
            'in_ds': in_path
        })

        try:
            proc = subprocess.Popen(cmd, shell=True, executable='/bin/bash')
            proc.wait()
        except Exception as e:
            logger.debug(e)
            raise Exception('Failed to convert file')

        if os.path.exists(out_path):
            geojson = read_json_file(out_path)
            return geojson

        raise Exception('An unknown error occurred while processing the file')

    except Exception as e:
        logger.error(e)
        raise e

    finally:
        if os.path.exists(dir):
            shutil.rmtree(dir)


def read_json_file(fp):
    """
    :param fp: Path to a geojson file
    :return: A geojson object
    """
    try:
        with open(fp) as file_geojson:
            geojson = json.load(file_geojson)
            return geojson
    except:
        raise Exception('Unable to read the file')


def unzip_file(fp, dir):
    """
    :param fp: Path to a zip file 
    :param dir: Directory where the files should be unzipped to
    :return: True if successful
    """
    if not fp or not dir:
        return False
    try:
        zip = zipfile.ZipFile(fp, 'r')
        zip.extractall(dir)
        zip.close()
        return True
    except Exception as e:
        logger.debug(e)
        raise Exception('Could not unzip file')


def write_uploaded_file(in_memory_file, write_path):
    """
    :param in_memory_file: An WSGI in memory file
    :param write_path: The path which the file should be written to on disk
    :return: True if successful
    """
    try:
        with open(write_path, 'w+') as temp_file:
            for chunk in in_memory_file.chunks():
                temp_file.write(chunk)
        return True
    except Exception as e:
        logger.debug(e)
        raise Exception('Could not write file to disk')


def set_session_user_last_active_at(request):
    # Set last active time, which is used for auto logout.
    last_active_at = datetime.utcnow().replace(tzinfo=pytz.utc)
    request.session[settings.SESSION_USER_LAST_ACTIVE_AT] = last_active_at.isoformat()

    # Return the last active datetime for convenience.
    return last_active_at


def is_mgrs(query):
    """
    :param query: A string to test against MGRS format
    :return: True if the string matches MGSR, False if not
    """
    query = re.sub(r"\s+", '', query)
    pattern = re.compile(r"^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$", re.I)
    if pattern.match(query):
        return True
    return False


def is_lat_lon(query):
    """
    :param query: A string to test against lat/lon format
    :return: A parsed coordinate array if it matches, False if not
    """
    # regex for matching to lat and lon
    # ?P<name> creates a named group so that we can access the value later
    lat_lon = re.compile(r"""
        # group to match latitude
        (?:
            ^                       # latitude MUST start at the beginning of the string
            (?P<lat_sign>[\+-]?)    # latitude may begin with + or -
            (?:
                (?P<lat>90(?:(?:\.0{1,20})?) | (?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?)) # match valid latitude values
                [\s]?               # there may or may not be a space following the digits when N or S are included
                (?P<lat_dir>[NS]?)  # N or S may be used instead of + or -
            )
            \b                      # there should be a word boundary after the latitude
        )

        # match common, space, or comma and space
        (?:[\,\s]{1,2})             

        # group to match longitude
        (?:
            (?P<lon_sign>[\+-]?)    # longitude may begin with + or -
            (?:
                (?P<lon>180(?:(?:\.0{1,20})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?)) # match valid longitude values
                [\s]?               # there may or may not be a space following the digits when E or W are included
                (?P<lon_dir>[EW]?)  # E or W may be used instead of + or -
            )
            $                       # after longitude should be the end of the string
        )
    """, re.VERBOSE)

    r = lat_lon.match(query)
    if not r:
        return False

    parsed_lat = None
    parsed_lon = None
    try:
        parsed_lat = float(r.group('lat'))
        parsed_lon = float(r.group('lon'))
    except ValueError as e:
        return False

    if math.isnan(parsed_lat) or math.isnan(parsed_lon):
        return False

    if r.group('lat_sign') == '-' or r.group('lat_dir') == 'S':
        parsed_lat = parsed_lat * -1
    if r.group('lon_sign') == '-' or r.group('lon_dir') == 'W':
        parsed_lon = parsed_lon * -1

    parsed_coord_array = [
        parsed_lat,
        parsed_lon
    ]

    return parsed_coord_array
