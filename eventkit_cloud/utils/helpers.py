from contextlib import contextmanager
from functools import wraps
import logging
import os
import time

from django.conf import settings
from django.core.cache import cache

from eventkit_cloud.utils.mapproxy import mapproxy_config_keys_index

logger = logging.getLogger()

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
                logger.info(e)
                if "canceled" in str(e).lower():
                    # If task was canceled (as opposed to fail) don't retry.
                    logger.info("The task was canceled ")
                    attempts = 0
                else:
                    if attempts:
                        delay = TIME_DELAY_BASE ** (MAX_DB_CONNECTION_RETRIES - attempts + 1)
                        logger.error(f"Retrying {str(attempts)} more times, sleeping for {delay}...")
                        time.sleep(delay)
        raise exc

    return wrapper


def get_relative_path_from_staging(staging_path):
    """
    Tries to return a relative path from staging

    :param staging_path: Full file path positioned within the staging dir.
    :return: relative path or empty
    """
    staging_dir = settings.EXPORT_STAGING_ROOT.lstrip(os.path.sep).rstrip(os.path.sep)
    staging_path = staging_path.lstrip(os.path.sep)
    if staging_dir in staging_path:
        return staging_path.replace(staging_dir, "")
    return staging_path


def get_download_paths(relative_path):
    downloads_filepath = os.path.join(
        settings.EXPORT_DOWNLOAD_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep)
    )
    download_url = os.path.join(settings.EXPORT_MEDIA_ROOT.rstrip(os.path.sep), relative_path.lstrip(os.path.sep))
    return downloads_filepath, download_url


def clear_mapproxy_config_cache():
    mapproxy_config_keys = cache.get_or_set(mapproxy_config_keys_index, set())
    cache.delete_many(list(mapproxy_config_keys))

@contextmanager
def cd(newdir):
    prevdir = os.getcwd()
    os.chdir(newdir)
    try:
        yield
    finally:
        os.chdir(prevdir)


def get_file_paths(directory):
    """
    Gets file paths with absolute file paths for copying the files and a relative file path for
    where the file should be located in the datapack relative to the directory.
    """
    paths = {}
    with cd(directory):
        for dirpath, _, filenames in os.walk("./"):
            for f in filenames:
                paths[os.path.abspath(os.path.join(dirpath, f))] = os.path.join(dirpath, f)
    return paths
