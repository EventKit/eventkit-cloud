import os, re
from django.conf import settings


def get_run_staging_dir(run_uid):
    """
    The run staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param run_uid: The unique value to store the directory for the run data.
    :return: The path to the run directory.
    """
    return os.path.join(settings.EXPORT_STAGING_ROOT.rstrip('\/'), run_uid)


def get_run_download_url(run_uid):
    return os.path.join(settings.EXPORT_MEDIA_ROOT.rstrip('\/'), run_uid)


def get_provider_staging_dir(run_uid, provider_slug):
    """
    The provider staging dir is where all files are stored while they are being processed.
    It is a unique space to ensure that files aren't being improperly modified.
    :param provider_slug: The unique value to store the directory for the provider data.
    :return: The path to the provider directory.
    """
    run_staging_dir = get_run_staging_dir(run_uid)
    return os.path.join(run_staging_dir, provider_slug)


def get_download_filename(name, meta_name, time, ext):
    """
    This provides specific formatting for the names of the downloadable files.
    :param name: A name for the file, typically the job name.
    :param meta_name: An additional descriptor, typically the provider slug or project name.
    :param time:  A python datetime object.
    :param ext: The file extension (e.g. .gpkg)
    :return: The formatted file name (e.g. Boston-example-20180711.gpkg)
    """
    return '{0}-{1}-{2}{3}'.format(
        name,
        meta_name,
        time.strftime('%Y%m%d'),
        ext
    )


def get_archive_data_path(provider_slug=None, file_name=None):
    """
    Gets a datapath for the files to be placed in the zip file.
    :param provider_slug: An optional unique value to store files.
    :param file_name: The name of a file.
    :return:
    """

    file_path = 'data'
    if provider_slug:
        file_path = os.path.join(file_path, provider_slug)
    if file_name:
        file_path = os.path.join(file_path, file_name)
    return file_path


def normalize_name(name):
    # Remove all non-word characters
    s = re.sub(r"[^\w\s]", '', name)
    # Replace all whitespace with a single underscore
    s = re.sub(r"\s+", '_', s)
    return s.lower()
