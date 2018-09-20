import os
import re

import codecs
from contextlib import contextmanager

from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from django.db.models import Q

from enum import Enum
from numpy import linspace
from eventkit_cloud.ui.helpers import logger
from eventkit_cloud.utils import auth_requests
from eventkit_cloud.utils.gdalutils import get_band_statistics
import pickle
import logging
from time import sleep
import signal


logger = logging.getLogger()


@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


class Directory(Enum):
    ARCGIS = 'arcgis'
    DATA = 'data'
    TEMPLATES = 'templates'


def get_run_staging_dir(run_uid):
    """
    The run staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), str(run_uid))


def get_run_download_dir(run_uid):
    """
    The run download dir is where all files are stored after they are processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_DOWNLOAD_ROOT.rstrip('\/'), str(run_uid))


def get_run_download_url(run_uid):
    """
    A URL path to the run data
    :param run_uid: The unique identifier for the run data.
    :return: The url context. (e.g. /downloads/123e4567-e89b-12d3-a456-426655440000)
    """
    return "{0}/{1}".format(settings.EXPORT_MEDIA_ROOT.rstrip('\/'), str(run_uid))


def get_provider_staging_dir(run_uid, provider_slug):
    """
    The provider staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param provider_slug: The unique value to store the directory for the provider data.
    :return: The path to the provider directory.
    """
    run_staging_dir = get_run_staging_dir(run_uid)
    return os.path.join(run_staging_dir, provider_slug)


def get_download_filename(name, time, ext, additional_descriptors=None):
    """
    This provides specific formatting for the names of the downloadable files.
    :param name: A name for the file, typically the job name.
    :param additional_descriptors: Additional descriptors, typically the provider slug or project name or any list of items.
    :param time:  A python datetime object.
    :param ext: The file extension (e.g. .gpkg)
    :return: The formatted file name (e.g. Boston-example-20180711.gpkg)
    """
    # Allow numbers or strings.
    if not isinstance(additional_descriptors, (list, tuple)):
        additional_descriptors = [str(additional_descriptors)]
    return '{0}-{1}-{2}{3}'.format(
        name,
        '-'.join(additional_descriptors),
        default_format_time(time),
        ext
    )


def get_archive_data_path(provider_slug=None, file_name=None):
    """
    Gets a datapath for the files to be placed in the zip file.
    :param provider_slug: An optional unique value to store files.
    :param file_name: The name of a file.
    :return:
    """
    file_path = Directory.DATA.value
    if provider_slug:
        file_path = os.path.join(file_path, provider_slug)
    if file_name:
        file_path = os.path.join(file_path, file_name)
    return file_path


def default_format_time(date_time):
    return date_time.strftime("%Y%m%d")


def normalize_name(name):
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", '', name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", '_', s)
    return s.lower()


def get_style_files():
    """

    :return: A list of all of the static files used for styles (e.g. icons)
    """
    style_dir = os.path.join(os.path.dirname(__file__), 'static', 'tasks', 'styles')
    files = get_file_paths(style_dir)
    arcgis_dir = os.path.join(os.path.dirname(__file__), 'arcgis')
    files = get_file_paths(arcgis_dir, files)
    return files


def create_license_file(provider_task):
    # checks a DataProviderTaskRecord's license file and adds it to the file list if it exists
    from eventkit_cloud.jobs.models import DataProvider
    from eventkit_cloud.tasks.helpers import normalize_name
    data_provider_license = DataProvider.objects.get(slug=provider_task.slug).license

    # DataProviders are not required to have a license
    if data_provider_license is None:
        return

    license_file_path = os.path.join(get_provider_staging_dir(provider_task.run.uid, provider_task.slug),
                                     '{0}.txt'.format(normalize_name(data_provider_license.name)))

    with open(license_file_path, 'wb') as license_file:
        license_file.write(data_provider_license.text.encode())

    return license_file_path


def generate_qgs_style(run_uid=None, data_provider_task_record=None):
    """
    Task to create QGIS project file with styles for osm.

    If a data_provider_task_record is provided a style file will be generated only for that, otherwise all of the
    data providers in the run will be added to the style file.
    :param run_uid: A uid representing the run.
    :param data_provider_task_record: A DataProviderTaskRecord model.
    :return: The path to the generated qgs file.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from eventkit_cloud.tasks.export_tasks import TaskStates
    from eventkit_cloud.tasks.helpers import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    job_name = run.job.name.lower()

    provider_tasks = run.provider_tasks.filter(~Q(name='run'))

    # A dict is used here to ensure that just one file per provider is added,
    # this should be updated when multiple formats are supported.
    provider_details = {}
    has_raster = False
    has_elevation = False
    # This collecting of metadata should be generalized and used for both QGS styles and arcmap styles.
    if data_provider_task_record:
        provider_tasks = [data_provider_task_record]

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
                # Exclude zip files created by prepare_file_for zip and the selection geojson
                # also within the QGIS style sheet it is currently assumed that GPKG files are Imagery and
                # GeoTIFF are elevation.  This will need to be updated in the future.
                file_ext = os.path.splitext(full_file_path)[1]
                if file_ext not in [".zip", ".geojson"]:
                    provider_details[provider_task.slug] = {'provider_slug': provider_task.slug, 'file_path': full_file_path,
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
                        steps = linspace(band_stats[0], band_stats[1], num=16)
                        provider_details[provider_task.slug]["ramp_shader_steps"] = list(map(int, steps))

    if data_provider_task_record:
        style_file_name =  '{0}-{1}-{2}.qgs'.format(normalize_name(job_name), normalize_name(data_provider_task_record.slug),
                                                         default_format_time(timezone.now()))
    else:
        style_file_name = '{0}-{1}.qgs'.format(normalize_name(job_name), default_format_time(timezone.now()))
    style_file = os.path.join(stage_dir, style_file_name)

    provider_details = [provider_detail for provider_slug, provider_detail in provider_details.items()]
    logger.error(provider_details)

    with open(style_file, 'wb') as open_file:
        open_file.write(render_to_string('styles/Style.qgs', context={'job_name': normalize_name(job_name),
                                                                      'job_date_time': '{0}'.format(
                                                                          timezone.now().strftime("%Y%m%d%H%M%S%f")[
                                                                          :-3]),
                                                                      'provider_details': provider_details,
                                                                      'bbox': run.job.extents,
                                                                      'has_raster': has_raster,
                                                                      'has_elevation': has_elevation}).encode())
    return style_file


def get_human_readable_metadata_document(run_uid):
    """

    :param run_uid: A UID for the export run.
    :return: A filepath to a txt document.
    """
    from eventkit_cloud.tasks.models import ExportRun
    from eventkit_cloud.jobs.models import DataProvider
    from eventkit_cloud.tasks.helpers import normalize_name
    run = ExportRun.objects.get(uid=run_uid)
    stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(run_uid))

    data_providers = []
    for provider_task in run.provider_tasks.filter(~Q(name='run')):
        data_provider = DataProvider.objects.get(slug=provider_task.slug)
        provider_type = data_provider.export_provider_type.type_name
        data_provider_metadata = {'name': data_provider.name,
                                  'description': str(data_provider.service_description).replace('\r\n', '\n').replace('\n', '\r\n\t'),
                                  # 'description': data_provider.service_description,
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

    with open(metadata_file, 'wb') as open_file:
        open_file.write(render_to_string('styles/metadata.txt', context={'metadata': metadata}).replace('\r\n', '\n').replace('\n', '\r\n').encode())

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


def progressive_kill(pid):
    """
    Tries to kill first with TERM and then with KILL.
    :param pid: The process ID to kill
    :return: None.
    """
    try:
        logger.info("Trying to kill pid {0} with SIGTERM.".format(pid))
        os.kill(pid, signal.SIGTERM)
        sleep(5)

        logger.info("Trying to kill pid {0} with SIGKILL.".format(pid))
        os.kill(pid, signal.SIGKILL)
        sleep(1)

    except OSError:
        logger.info("{0} PID no longer exists.".format(pid))


def pickle_exception(exception):
    return pickle.dumps(exception, 0).decode()
