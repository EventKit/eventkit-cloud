# -*- coding: utf-8 -*-
import logging
import os
import shutil
import subprocess
import zipfile
from enum import Enum
from django.db import models

import dj_database_url
import requests
from django.conf import settings
from django.core.cache import cache
from notifications.signals import notify
from django.contrib.auth.models import User

logger = logging.getLogger(__name__)


def get_id(user):
    if hasattr(user, "oauth"):
        return user.oauth.identification
    else:
        return user.username


def get_model_by_params(model_class: models.Model, **kwargs):
    return model_class.objects.get(**kwargs)


def get_cached_model(model: models.Model, prop: str, value: str) -> models.Model:
    return cache.get_or_set(f"{model.__name__}-{prop}-{value}", get_model_by_params(model, **{prop: value}), 360)


def download_file(url, download_dir=None):
    download_dir = download_dir or settings.EXPORT_STAGING_ROOT
    file_location = os.path.join(download_dir, os.path.basename(url))
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(file_location, "wb") as f:
            for chunk in r:
                f.write(chunk)
        return file_location
    else:
        logger.error("Failed to download file, STATUS_CODE: {0}".format(r.status_code))
    return None


def extract_zip(zipfile_path, extract_dir=None):
    extract_dir = extract_dir or settings.EXPORT_STAGING_ROOT

    logger.info("Extracting {0} to {1}...".format(zipfile_path, extract_dir))

    zip_ref = zipfile.ZipFile(zipfile_path, "r")
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
        database = settings.DATABASES["feature_data"]

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

    cmd = (
        'ogr2ogr -s_srs EPSG:3857 -t_srs EPSG:4326 -f "PostgreSQL" '
        'PG:"host={host} user={user} password={password} dbname={name} port={port}" '
        "{file} land_polygons".format(
            host=database["HOST"],
            user=database["USER"],
            password=database["PASSWORD"].replace("$", "\$"),
            name=database["NAME"],
            port=database["PORT"],
            file=file_name,
        )
    )
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


class NotificationLevel(Enum):
    SUCCESS = "success"
    INFO = "info"
    WARNING = "warning"
    ERROR = "ERROR"


class NotificationVerb(Enum):
    RUN_STARTED = "run_started"
    RUN_COMPLETED = "run_completed"
    RUN_FAILED = "run_failed"
    RUN_DELETED = "run_deleted"
    RUN_CANCELED = "run_canceled"
    REMOVED_FROM_GROUP = "removed_from_group"
    ADDED_TO_GROUP = "added_to_group"
    SET_AS_GROUP_ADMIN = "set_as_group_admin"
    REMOVED_AS_GROUP_ADMIN = "removed_as_group_admin"
    RUN_EXPIRING = "run_expiring"


def sendnotification(actor, recipient, verb, action_object, target, level, description):
    try:
        notify.send(
            actor,
            recipient=recipient,
            verb=verb,
            action_object=action_object,
            target=target,
            level=level,
            description=description,
        )
    except Exception as err:
        logger.debug("notify send error ignored: %s" % err)


