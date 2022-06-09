# -*- coding: utf-8 -*-
import logging
from unittest.mock import Mock, patch

from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import (
    GeometryCollection,
    GEOSGeometry,
    LineString,
    Point,
    Polygon,
)
from django.test import TestCase
from rest_framework.serializers import ValidationError

from eventkit_cloud.api.validators import (
    get_area_in_sqkm,
    get_bbox_area_in_sqkm,
    validate_bbox,
    validate_bbox_params,
    validate_original_selection,
    validate_selection,
)
from eventkit_cloud.jobs.models import bbox_to_geojson

logger = logging.getLogger(__name__)


class TestValidators(TestCase):
    def setUp(self):
        group, created = Group.objects.get_or_create(name="TestDefaultExportExtentGroup")
        with patch("eventkit_cloud.jobs.signals.Group") as mock_group:
            mock_group.objects.get.return_value = group
            self.user = User.objects.create_user(username="demo1", email="demo@demo.com", password="demo")
        self.extents = (13.473475, 7.441068, 24.002661, 23.450369)
        self.selection = bbox_to_geojson(self.extents)
        self.bbox_geom = GEOSGeometry(Polygon.from_bbox(self.extents).wkt, srid=4326)

    def test_validate_bbox(self):

        with self.settings(JOB_MAX_EXTENT=99999999):
            bbox = validate_bbox(self.extents, user=self.user)
            self.assertIsInstance(bbox, Polygon)

        with self.settings(JOB_MAX_EXTENT=1):
            with self.assertRaises(ValidationError):
                validate_bbox(self.extents)

        with self.assertRaises(ValidationError):
            broken_extents = (0, 0, 0, 0)
            validate_bbox(broken_extents, user=self.user)

        with patch("eventkit_cloud.api.validators.GEOSGeometry") as mock_geos:
            with self.assertRaises(ValidationError):
                mock_geos.return_value = Mock(valid=False)
                validate_bbox(self.extents, user=self.user)

    def test_validate_original_selection(self):
        geojson = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [1, 1]},
                },
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[5.625, 48.458], [0.878, 44.339]],
                    },
                },
            ],
        }
        data = {"original_selection": geojson}
        collection = validate_original_selection(data)
        self.assertIsInstance(collection, GeometryCollection)
        self.assertIsInstance(collection[0], Point)
        self.assertIsInstance(collection[1], LineString)

        data = {"original_selection": {}}
        collection = validate_original_selection(data)
        self.assertIsInstance(collection, GeometryCollection)
        self.assertEqual(collection.length, 0)

    def test_validate_selection(self):
        data = {"selection": self.selection}
        with self.settings(JOB_MAX_EXTENT=99999999):
            geom = validate_selection(data)
            self.assertIsInstance(geom, Polygon)

        with self.assertRaises(ValidationError):
            data = {"selection": []}
            validate_selection(data)

        with patch("eventkit_cloud.api.validators.GEOSGeometry") as mock_geos:
            with self.assertRaises(ValidationError):
                data = {"selection": self.selection}
                mock_geos.return_value = Mock(valid=False)
                validate_selection(data, user=self.user)

        broken_geojson = self.selection
        broken_geojson["geometry"]["coordinates"] = [[[[], [], [], []], []]]
        with self.assertRaises(ValidationError):
            data = {"selection": broken_geojson}
            validate_selection(data, user=self.user)

        broken_geojson = self.selection
        broken_geojson["geometry"] = None
        with self.assertRaises(ValidationError):
            data = {"selection": broken_geojson}
            validate_selection(data, user=self.user)

        with self.settings(JOB_MAX_EXTENT=1):
            data = {"selection": self.selection}
            with self.assertRaises(ValidationError):
                validate_selection(data, user=self.user)

    def test_validate_bbox_params(self):

        data = {
            "xmin": self.extents[0],
            "ymin": self.extents[1],
            "xmax": self.extents[2],
            "ymax": self.extents[3],
        }

        (xmin, ymin, xmax, ymax) = validate_bbox_params(data)
        self.assertEqual(xmin, data["xmin"])
        self.assertEqual(ymin, data["ymin"])
        self.assertEqual(xmax, data["xmax"])
        self.assertEqual(ymax, data["ymax"])

        data = {"xmin": 1, "ymin": -1, "xmax": -1, "ymax": 1}
        with self.assertRaises(ValidationError):
            validate_bbox_params(data)

        data = {"xmin": -1, "ymin": 1, "xmax": 1, "ymax": -1}
        with self.assertRaises(ValidationError):
            validate_bbox_params(data)

        data = {"xmin": -181, "ymin": -1, "xmax": 1, "ymax": 1}
        with self.assertRaises(ValidationError):
            validate_bbox_params(data)

        data = {"xmin": -1, "ymin": -91, "xmax": 1, "ymax": 1}
        with self.assertRaises(ValidationError):
            validate_bbox_params(data)

    # Test that area calculation is correct
    def test_area(self):
        self.assertEqual(get_area_in_sqkm(self.bbox_geom), 2175307.6863957904)

    # Test that bbox area calculation is correct and same as normal area function
    def test_bbox_area(self):
        self.assertEqual(get_bbox_area_in_sqkm(self.bbox_geom), 2175307.6863957904)

    # test that the area of a right triangle made from the bbox coords is
    # exactly half of the area of the original bbox
    def test_triangle_area(self):
        xmin, ymin, xmax, ymax = self.extents
        triangle_poly = Polygon(((xmin, ymin), (xmax, ymax), (xmax, ymin), (xmin, ymin)))
        triangle_geom = GEOSGeometry(triangle_poly.wkt, srid=4326)
        self.assertEqual(get_area_in_sqkm(triangle_geom), get_area_in_sqkm(self.bbox_geom) / 2)

    # test that the area of the bounding box of a right triangle made from the bbox
    # coords is exactly the same as the original bbox area
    def test_triangle_bbox_area(self):
        xmin, ymin, xmax, ymax = self.extents
        triangle_poly = Polygon(((xmin, ymin), (xmax, ymax), (xmax, ymin), (xmin, ymin)))
        triangle_geom = GEOSGeometry(triangle_poly.wkt, srid=4326)
        self.assertEqual(get_bbox_area_in_sqkm(triangle_geom), get_area_in_sqkm(self.bbox_geom))
