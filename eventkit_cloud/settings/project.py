# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .celery import *  # NOQA
import os
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Project apps
INSTALLED_APPS += (
    'eventkit_cloud.jobs',
    'eventkit_cloud.tasks',
    'eventkit_cloud.api',
    'eventkit_cloud.ui',
    'eventkit_cloud.utils',
    'eventkit_cloud',
    'django_classification_banner',
)

INSTALLED_APPS += ("django_celery_results", )

LOGIN_URL = '/login/'

EXPORT_TASKS = {
    'shp': 'eventkit_cloud.tasks.export_tasks.ShpExportTask',
    'obf': 'eventkit_cloud.tasks.export_tasks.ObfExportTask',
    'sqlite': 'eventkit_cloud.tasks.export_tasks.SqliteExportTask',
    'kml': 'eventkit_cloud.tasks.export_tasks.KmlExportTask',
    'thematic': 'eventkit_cloud.tasks.export_tasks.ThematicLayersExportTask',
    'gpkg': 'eventkit_cloud.tasks.export_tasks.GeopackageExportTask'
}



CLASSIFICATION_TEXT = os.getenv('CLASSIFICATION_TEXT', 'Unclassified//FOUO')
CLASSIFICATION_TEXT_COLOR = os.getenv('CLASSIFICATION_TEXT_COLOR', 'black')
CLASSIFICATION_BACKGROUND_COLOR = os.getenv('CLASSIFICATION_BACKGROUND_COLOR', 'green')
# CLASSIFICATION_LINK = os.getenv('CLASSIFICATION_LINK', '/security')

# where exports are staged for processing
EXPORT_STAGING_ROOT = os.getenv('EXPORT_STAGING_ROOT', '/var/lib/eventkit/exports_stage/')

# where exports are stored for public download
EXPORT_DOWNLOAD_ROOT = os.getenv('EXPORT_DOWNLOAD_ROOT', '/var/lib/eventkit/exports_download/')

# the root url for export downloads
EXPORT_MEDIA_ROOT = os.getenv('EXPORT_MEDIA_ROOT', '/downloads/')

# home dir of the OSMAnd Map Creator
OSMAND_MAP_CREATOR_DIR = os.getenv('OSMAND_MAP_CREATOR_DIR', '/var/lib/eventkit/OsmAndMapCreator')

# location of the garmin config file
GARMIN_CONFIG = os.getenv('GARMIN_CONFIG', '/var/lib/eventkit/conf/garmin_config.xml')

# url to overpass api endpoint
# OVERPASS_API_URL = 'http://cloud.eventkit.dev/overpass-api/interpreter'
OVERPASS_API_URL = os.getenv('OVERPASS_API_URL', 'http://overpass-api.de/api/interpreter')

"""
Maximum extent of a Job
max of (latmax-latmin) * (lonmax-lonmin)
"""
JOB_MAX_EXTENT = 2500000  # default export max extent in sq km

# maximum number of runs to hold for each export
EXPORT_MAX_RUNS = 1

if os.environ.get('VCAP_APPLICATION'):
    env = json.loads(os.environ.get('VCAP_APPLICATION'))
    HOSTNAME = os.getenv('HOSTNAME', env['application_uris'][0])
    SITE_NAME = os.getenv('SITE_NAME', HOSTNAME)
    SITE_URL = os.getenv('SITE_URL', "https://{0}".format(SITE_NAME))
else:
    import socket
    HOSTNAME = os.getenv('HOSTNAME', socket.gethostname())
    SITE_NAME = os.getenv('SITE_NAME', HOSTNAME)
    if SITE_NAME == '':
        SITE_NAME = 'localhost'
    SITE_URL = os.getenv('SITE_URL', 'http://{0}'.format(SITE_NAME))
SITE_ID = 1

"""
Admin email address
which receives task error notifications.
"""
TASK_ERROR_EMAIL = 'eventkit.team@gmail.com'
DEFAULT_FROM_EMAIL = 'Eventkit Team <eventkit.team@gmail.com>'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'eventkit.team@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', None)
EMAIL_USE_TLS = True

"""
Overpass Element limit

Sets the max ram allowed for overpass query

http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#Element_limit_.28maxsize.29
"""

OVERPASS_MAX_SIZE = 2147483648  # 2GB

"""
Overpass timeout setting

Sets request timeout for overpass queries.

http://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL#timeout
"""

OVERPASS_TIMEOUT = 1600  # query timeout in seconds

USE_DISK_CACHE = True
