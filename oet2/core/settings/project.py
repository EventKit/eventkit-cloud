# -*- coding: utf-8 -*-
from __future__ import absolute_import

from .celery import *  # NOQA

from .secret import *

# Project apps
INSTALLED_APPS += (
    'oet2.jobs',
    'oet2.tasks',
    'oet2.api',
    'oet2.ui',
    'oet2.utils',
)

INSTALLED_APPS += ("osgeo_importer", "djmp", "guardian", "djcelery",)

LOGIN_URL = '/login/'

EXPORT_TASKS = {
    'shp': 'oet2.tasks.export_tasks.ShpExportTask',
    'obf': 'oet2.tasks.export_tasks.ObfExportTask',
    'sqlite': 'oet2.tasks.export_tasks.SqliteExportTask',
    'kml': 'oet2.tasks.export_tasks.KmlExportTask',
    'thematic': 'oet2.tasks.export_tasks.ThematicLayersExportTask',
    'geopackage': 'oet2.tasks.export_tasks.GeopackageExportTask'
}

# where exports are staged for processing
EXPORT_STAGING_ROOT = '/home/ubuntu/export_staging/'

# where exports are stored for public download
EXPORT_DOWNLOAD_ROOT = '/home/ubuntu/export_downloads/'

# the root url for export downloads
EXPORT_MEDIA_ROOT = '/downloads/'

# url to overpass api endpoint
OVERPASS_API_URL = 'http://overpass-api.de/api/interpreter'

"""
Maximum extent of a Job
max of (latmax-latmin) * (lonmax-lonmin)
"""
JOB_MAX_EXTENT = 2500000  # default export max extent in sq km

# maximum number of runs to hold for each export
EXPORT_MAX_RUNS = 5

HOSTNAME = 'localhost'

"""
Admin email address
which receives task error notifications.
"""
TASK_ERROR_EMAIL = 'export-tool@hotosm.org'

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
