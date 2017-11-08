# -*- coding: utf-8 -*-
import requests
import os
from django.conf import settings
import subprocess
import dj_database_url
import zipfile
import shutil
import logging

logger = logging.getLogger(__name__)


def get_id(user):
    if hasattr(user, "oauth"):
        return user.oauth.identification
    else:
        return user.username


def download_file(url, download_dir=None):
    download_dir = download_dir or settings.EXPORT_STAGING_ROOT
    file_location = os.path.join(download_dir, os.path.basename(url))
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(file_location, 'wb') as f:
            for chunk in r:
                f.write(chunk)
        return file_location
    else:
        logger.error("Failed to download file, STATUS_CODE: {0}".format(r.status_code))
    return None


def extract_zip(zipfile_path, extract_dir=None):
    extract_dir = extract_dir or settings.EXPORT_STAGING_ROOT

    logger.info("Extracting {0} to {1}...".format(zipfile_path, extract_dir))

    zip_ref = zipfile.ZipFile(zipfile_path, 'r')
    zip_ref.extractall(extract_dir)
    logger.info("Finished Extracting.")
    zip_ref.close()
    return extract_dir


def get_vector_file(directory):
    for file in os.listdir(directory):
        if file.endswith((".shp", ".geojson", ".gpkg")):
            logger.info("Found: {0}".format(file))
            return os.path.join(directory, file)


def load_land_vectors(db_conn=None, url=None):

    if not url:
        url = settings.LAND_DATA_URL

    if db_conn:
        database = dj_database_url.config(default=db_conn)
    else:
        database = settings.DATABASES['feature_data']

    logger.info("Downloading land data: {0}".format(url))
    download_filename = download_file(url)
    logger.info("Finished downloading land data: {0}".format(url))

    file_dir = None
    if os.path.splitext(download_filename)[1] == ".zip":
        extract_zip(download_filename)
        file_dir = os.path.splitext(download_filename)[0]
        file_name = get_vector_file(file_dir)
    else:
        file_name = download_filename

    cmd = 'ogr2ogr -s_srs EPSG:3857 -t_srs EPSG:4326 -f "PostgreSQL" ' \
          'PG:"host={host} user={user} password={password} dbname={name} port={port}" ' \
          '{file} land_polygons'.format(host=database['HOST'],
                                        user=database['USER'],
                                        password=database['PASSWORD'].replace('$', '\$'),
                                        name=database['NAME'],
                                        port=database['PORT'],
                                        file=file_name)
    logger.info("Loading land data...")
    exit_code = subprocess.call(cmd, shell=True)

    if exit_code:
        logger.error("There was an error importing the land data.")

    if file_dir:
        shutil.rmtree(file_dir)
    os.remove(download_filename)
    try:
        os.remove(file_name)
    except OSError:
        pass
    finally:
        logger.info("Finished loading land data.")



