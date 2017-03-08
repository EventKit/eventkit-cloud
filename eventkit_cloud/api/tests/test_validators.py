# -*- coding: utf-8 -*-
import logging

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.test import TestCase
from rest_framework import serializers


from eventkit_cloud.api.validators import get_geodesic_area, validate_bbox
import json

logger = logging.getLogger(__name__)


class TestValidators(TestCase):

    def setUp(self,):
        self.user = User.objects.create_user(
            username='demo1', email='demo@demo.com', password='demo'
        )
        self.extents = (13.473475, 7.441068, 24.002661, 23.450369)

    def test_validate_bbox(self,):
        validate_bbox(self.extents, user=self.user)

    def test_get_geodesic_area(self,):
        bbox = GEOSGeometry(Polygon.from_bbox(self.extents), srid=4326)
        area = get_geodesic_area(bbox)
        self.assertEquals(2006874.9259034647, area / 1000000)

