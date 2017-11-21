"""Provides validation for API operatios."""

# -*- coding: utf-8 -*-
import logging
import math
import os
from collections import OrderedDict
from StringIO import StringIO
import json

import magic
from lxml import etree

from django.conf import settings
from django.contrib.gis.geos import GEOSException, GEOSGeometry, GeometryCollection, Polygon
from django.contrib.gis.gdal import GDALException
from django.utils.translation import ugettext as _

from rest_framework import serializers

# Get an instance of a logger
logger = logging.getLogger(__name__)


def validate_formats(data):
    """
    Validate the selected export formats.

    Args:
        data: the submitted form data.

    Raises:
        ValidationError: if there are no formats selected.
    """
    if data.get('formats') is None or len(data.get('formats')) == 0:
        raise serializers.ValidationError({'formats': [_('invalid export format.')]})


def validate_provider_tasks(data):
    """
    Validate the selected export formats.

    Args:
        data: the submitted form data.

    Raises:
        ValidationError: if there are no formats selected.
    """
    if data.get('formats') is None or len(data.get('formats')) == 0:
        raise serializers.ValidationError({'formats': [_('invalid export format.')]})


def validate_providers(data):
    """
    Validate the selected providers.

    Args:
        data: the submitted form data.

    Raises:
        ValidationError: if there are no providers selected.
    """
    for provider_task in data.get('provider_tasks', {"provider": None}):
        if provider_task.get('provider') is None or len(provider_task.get('provider')) == 0:
            raise serializers.ValidationError({'provider': [_('Select a provider.')]})


def validate_search_bbox(extents):
    """
    Validates the export extents.

    Args:
        extents: a tuple of export extents (xmin, ymin, xmax, ymax)

    Returns:
        a a valid GEOSGeometry.

    Raises:
        ValidationError:    if its not possible
            to create a GEOSGeometry from the provided extents or
            if the resulting GEOSGeometry is invalid.
    """
    detail = OrderedDict()
    detail['id'] = _('invalid_bounds')
    detail['message'] = _('Invalid bounding box.')
    try:
        bbox = Polygon.from_bbox(extents)
        if bbox.valid:
            return bbox
        else:
            raise serializers.ValidationError(detail)
    except GEOSException:
        raise serializers.ValidationError(detail)


def validate_bbox(extents, user=None):
    """
    Validates the extents by calculating the geodesic area of the extents,
    then checking the resulting area against the max_extent for the user.

    Args:
        extents: a tuple containing xmin,ymin,xmax,ymax export extents.
        user: the authenticated user.

    Returns:
        a valid GEOSGeometry.

    Raises:
        ValidationError: if the extents are greater than the allowed max_extent
            for the user, or if the GEOSGeometry cannot be created or
            are invalid.
    """
    max_extent = settings.JOB_MAX_EXTENT
    if user:
        for group in user.groups.all():
            if hasattr(group, 'export_profile'):
                max_extent = group.export_profile.max_extent if group.export_profile.max_extent > max_extent else max_extent
    detail = OrderedDict()
    detail['id'] = _('invalid_bounds')
    detail['message'] = _('Invalid bounding box.')
    try:
        bbox = GEOSGeometry(Polygon.from_bbox(extents), srid=4326)
        if bbox.valid:
            area = get_geodesic_area(bbox) / 1000000
            if area > max_extent:
                detail['id'] = _('invalid_extents')
                detail['message'] = _('Job extents too large: %(area)s') % {'area': area}
                raise serializers.ValidationError(detail)
            return bbox
        else:
            raise serializers.ValidationError(detail)
    except GEOSException:
        raise serializers.ValidationError(detail)

def validate_original_selection(data):
    """
    Checks for a feature collection with features and constructs a GEOS Geometry Collection if possible
    :param data: the request data
    :return: A GEOS Geometry Collection
    """
    original_selection = data.get('original_selection', {})
    geoms = []
    for feature in original_selection.get('features', []):
        try:
            geom = GEOSGeometry(json.dumps(feature.get('geometry')))
            geoms.append(geom)
        except GEOSException as geos_exception:
            logger.error(geos_exception)
    try:
        collection = GeometryCollection(geoms)
        return collection
    except GEOSException as geos_exception:
        logger.error(geos_exception)
        return GeometryCollection()



def validate_selection(data, user=None):
    """
    Validates the extents by calculating the geodesic area of the extents,
    then checking the resulting area against the max_extent for the user.

    Args:
        selection: a valid geojson.
        user: the authenticated user.

    Returns:
        a valid GEOSGeometry.

    Raises:
        ValidationError: if the extents are greater than the allowed max_extent
            for the user, or if the GEOSGeometry cannot be created or
            are invalid.
    """

    max_extent = settings.JOB_MAX_EXTENT
    if user:
        for group in user.groups.all():
            if hasattr(group, 'export_profile'):
                max_extent = group.export_profile.max_extent if group.export_profile.max_extent > max_extent else max_extent
    detail = OrderedDict()
    detail['id'] = _('invalid_selection')
    detail['message'] = _('Invalid Selection.')
    try:
        if not isinstance(data.get("selection"), dict):
            detail['id'] = _('no selection')
            detail['message'] = _('Jobs must have a geojson provided via a selection attribute.\n {0}'.format(data))
            raise serializers.ValidationError(detail)
        geometry = data['selection'].get('geometry') or data['selection'].get('features', [{}])[0].get('geometry')
        if not geometry:
            detail['id'] = _('no geometry')
            detail['message'] = _('The geojson did not have a geometry object or bbox.\n {0}'.format(data.get("selection")))
            raise serializers.ValidationError(detail)
        geom = GEOSGeometry(json.dumps(geometry), srid=4326)
        if geom.valid:
            area = get_geodesic_area(geom) / 1000000
            if area > max_extent:
                detail['id'] = _('invalid_extents')
                detail['message'] = _('Job extents too large: %(area)s') % {'area': area}
                raise serializers.ValidationError(detail)
            return geom
        else:
            raise serializers.ValidationError(detail)
    except GEOSException as geos_exception:
        logger.error(geos_exception.message)
        raise serializers.ValidationError(detail)
    except GDALException as gdal_exception:
        detail['id'] = _('GDAL Error')
        detail['message'] = _('GDAL produced a an error:\n{0} \nUsing the geometry:\n{1}'.format(gdal_exception.message, geometry))
        raise serializers.ValidationError(detail)


def validate_bbox_params(data):
    """
    Validates the bounding box parameters supplied during form sumission.

    Args:
        the data supplied during form submission.

    Returns:
        a tuple containing the validated extents in the form (xmin,ymin,xmax,ymax).

    Raises:
        ValidationError: if the extents are invalid.
    """
    detail = OrderedDict()

    # test for number
    lon_coords = [float(data['xmin']), float(data['xmax'])]
    lat_coords = [float(data['ymin']), float(data['ymax'])]
    # test lat long value order
    if ((lon_coords[0] >= 0 and lon_coords[0] > lon_coords[1]) or
            (0 > lon_coords[0] > lon_coords[1])):
        detail['id'] = _('inverted_coordinates')
        detail['message'] = _('xmin greater than xmax.')
        raise serializers.ValidationError(detail)

    if ((lat_coords[0] >= 0 and lat_coords[0] > lat_coords[1]) or
            (0 > lat_coords[0] > lat_coords[1])):
        detail['id'] = _('inverted_coordinates')
        detail['message'] = _('ymin greater than ymax.')
        raise serializers.ValidationError(detail)

    # test lat long extents
    for lon in lon_coords:
        if lon < -180 or lon > 180:
            detail['id'] = _('invalid_longitude')
            detail['message'] = _('Invalid longitude coordinate: %(lon)s') % {'lon': lon}
            raise serializers.ValidationError(detail)
    for lat in lat_coords:
        if lat < -90 or lat > 90:
            detail['id'] = _('invalid_latitude')
            detail['message'] = _('Invalid latitude coordinate: %(lat)s') % {'lat': lat}
            raise serializers.ValidationError(detail)

    return data['xmin'], data['ymin'], data['xmax'], data['ymax']


def validate_content_type(upload, config_type):
    """
    Validates the uploaded configuration file against its declared configuration type.

    Args:
        upload: the uploaded file.
        config_type: the configuration type of the uploaded file.

    Returns:
        the content_type of the validated uploaded file.

    Raises:
        ValidationError: if the uploaded file has invalid content for the provided config_type.
    """
    ACCEPT_MIME_TYPES = {'PRESET': ('application/xml',),
                         'TRANSFORM': ('application/x-sql', 'text/plain'),
                         'TRANSLATION': ('text/plain',)}
    content_type = magic.from_buffer(upload.read(1024), mime=True)
    if content_type not in ACCEPT_MIME_TYPES[config_type]:
        detail = OrderedDict()
        detail['id'] = _('invalid_content')
        detail['message'] = _('Uploaded config file has invalid content: %(content_type)s') % {
            'content_type': content_type}
        raise serializers.ValidationError(detail)
    return content_type


def get_geodesic_area(geom):
    """
    Returns the geodesic area of the provided geometry.

    Uses the algorithm to calculate geodesic area of a polygon from OpenLayers 2.
    See http://bit.ly/1Mite1X.

    Args:
        geom (GEOSGeometry): the export extent as a GEOSGeometry.

    Returns
        area (float): the geodesic area of the provided geometry.
    """
    area = 0.0
    coords = geom.coords[0]
    length = len(coords)
    if length > 2:
        for x in range(length - 1):
            p1 = coords[x]
            p2 = coords[x + 1]
            area += math.radians(p2[0] - p1[0]) * (2 + math.sin(math.radians(p1[1]))
                                                   + math.sin(math.radians(p2[1])))
        area = area * 6378137 * 6378137 / 2.0
    return area


