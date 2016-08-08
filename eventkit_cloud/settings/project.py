# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .celery import *  # NOQA

# Project apps
INSTALLED_APPS += (
    'oet2.jobs',
    'oet2.tasks',
    'oet2.api',
    'oet2.ui',
    'oet2.utils',
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
    'garmin': 'oet2.tasks.export_tasks.GarminExportTask',
    'thematic': 'oet2.tasks.export_tasks.ThematicLayersExportTask'
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
GARMIN_CONFIG = '/var/lib/eventkit/hotosm/eventkit-cloud/utils/conf/garmin_config.xml'

# url to overpass api endpoint
#OVERPASS_API_URL = 'http://localhost/overpass-api/interpreter'
OVERPASS_API_URL = 'http://api.openstreetmap.fr/oapi/interpreter'

"""
Maximum extent of a Job
max of (latmax-latmin) * (lonmax-lonmin)
"""
JOB_MAX_EXTENT = 2500000  # default export max extent in sq km

# maximum number of runs to hold for each export
EXPORT_MAX_RUNS = 5

HOSTNAME = 'cloud.eventkit.dev'
SITE_NAME = 'cloud.eventkit.dev'
SITE_URL = 'http://cloud.eventkit.dev'
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
