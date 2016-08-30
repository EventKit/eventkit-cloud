# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .celery import *  # NOQA
import os

# Project apps
INSTALLED_APPS += (
    'oet2.jobs',
    'oet2.tasks',
    'oet2.api',
    'oet2.ui',
    'oet2.utils',
    'eventkit_cloud'
)

INSTALLED_APPS += ("osgeo_importer", "djmp", "guardian")

INSTALLED_APPS += ("djcelery", )
import djcelery
djcelery.setup_loader()

LOGIN_URL = '/login/'

EXPORT_TASKS = {
    'shp': 'oet2.tasks.export_tasks.ShpExportTask',
    'obf': 'oet2.tasks.export_tasks.ObfExportTask',
    'sqlite': 'oet2.tasks.export_tasks.SqliteExportTask',
    'kml': 'oet2.tasks.export_tasks.KmlExportTask',
    'thematic': 'oet2.tasks.export_tasks.ThematicLayersExportTask',
    'gpkg': 'oet2.tasks.export_tasks.GeopackageExportTask'
}

# where exports are staged for processing
EXPORT_STAGING_ROOT = '/var/lib/eventkit/exports_stage/'

# where exports are stored for public download
EXPORT_DOWNLOAD_ROOT = '/var/lib/eventkit/exports_download/'

# the root url for export downloads
EXPORT_MEDIA_ROOT = '/downloads/'

# home dir of the OSMAnd Map Creator
OSMAND_MAP_CREATOR_DIR = '/var/lib/eventkit/OsmAndMapCreator'

# location of the garmin config file
GARMIN_CONFIG = '/var/lib/eventkit/conf/garmin_config.xml'

# url to overpass api endpoint
# OVERPASS_API_URL = 'http://cloud.eventkit.dev/overpass-api/interpreter'
OVERPASS_API_URL = os.environ.get('OVERPASS_API_URL', 'http://overpass-api.de/api/interpreter')

"""
Maximum extent of a Job
max of (latmax-latmin) * (lonmax-lonmin)
"""
JOB_MAX_EXTENT = 2500000  # default export max extent in sq km

# maximum number of runs to hold for each export
EXPORT_MAX_RUNS = 5

if os.environ.get('VCAP_APPLICATION'):
    environ = os.environ.get('VCAP_APPLICATION')
    HOSTNAME = environ['application_uris'][0]
    SITE_NAME = HOSTNAME
    SITE_URL = "https://{0}".format(SITE_NAME)
else:
    HOSTNAME = os.environ.get('HOSTNAME', 'cloud.eventkit.dev')
    SITE_NAME = os.environ.get('SITE_NAME', 'cloud.eventkit.dev')
    SITE_URL = os.environ.get('SITE_URL', 'http://cloud.eventkit.dev')
SITE_ID = 1

"""
Admin email address
which receives task error notifications.
"""
TASK_ERROR_EMAIL = 'joseph.svrcek@rgi-corp.com'

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
