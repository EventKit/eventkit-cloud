import logging
import os
import re
import signal
from time import sleep

from django.conf import settings
from enum import Enum

logger = logging.getLogger()

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
