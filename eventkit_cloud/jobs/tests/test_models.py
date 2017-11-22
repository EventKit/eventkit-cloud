# -*- coding: utf-8 -*-
import logging
import os

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon
from django.contrib.gis.db.models.functions import Intersection
from django.contrib.gis.db.models.functions import Area
from django.core.files import File
from django.test import TestCase
from eventkit_cloud.jobs.models import (
    ExportFormat, ExportProfile, Job, Region, DataProvider, DataProviderTask
, DatamodelPreset)

logger = logging.getLogger(__name__)


class TestJob(TestCase):
    """
    Test cases for Job model
    """
    fixtures = ('insert_provider_types.json', 'osm_provider.json', 'datamodel_presets.json')

    def setUp(self):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        export_provider = DataProvider.objects.get(slug='osm-generic')
        provider_task = DataProviderTask.objects.create(provider=export_provider)
        self.tags = [
            {'key': 'building', 'value': 'yes'}, {'key': 'place', 'value': 'city'},
            {'key': 'highway', 'value': 'service'}, {'key': 'aeroway', 'value': 'helipad'}
        ]

        self.job = Job(name='TestJob',
                       description='Test description', event='Nepal activation',
                       user=self.user, the_geom=the_geom, json_tags=self.tags)
        self.job.save()
        self.uid = self.job.uid
        # add the formats to the job
        provider_task.formats.add(*self.formats)
        self.job.provider_tasks.add(provider_task)
        self.job.save()

    def test_job_creation(self,):
        saved_job = Job.objects.all()[0]
        self.assertEqual(self.job, saved_job)
        self.assertEquals(self.uid, saved_job.uid)
        self.assertIsNotNone(saved_job.created_at)
        self.assertIsNotNone(saved_job.updated_at)
        saved_provider_tasks = saved_job.provider_tasks.first()
        self.assertIsNotNone(saved_provider_tasks.formats.all())
        self.assertItemsEqual(saved_provider_tasks.formats.all(), self.formats)
        self.assertEquals('Test description', saved_job.description)
        self.assertEquals(4, len(saved_job.json_tags))
        self.assertEqual(False, saved_job.include_zipfile)  # default

    def test_job_creation_with_config(self,):
        saved_job = Job.objects.all()[0]
        self.assertEqual(self.job, saved_job)
        self.assertEquals(self.uid, saved_job.uid)
        self.assertIsNotNone(saved_job.created_at)
        self.assertIsNotNone(saved_job.updated_at)
        saved_provider_tasks = saved_job.provider_tasks.first()
        self.assertIsNotNone(saved_provider_tasks.formats.all())
        self.assertItemsEqual(saved_provider_tasks.formats.all(), self.formats)
        # attach a configuration to a job
        hdm_preset = DatamodelPreset.objects.get(name='hdm')
        saved_job.preset = hdm_preset
        self.assertEqual(hdm_preset.json_tags, saved_job.preset.json_tags)

    def test_spatial_fields(self,):
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))  # in africa
        the_geom = MultiPolygon(GEOSGeometry(bbox, srid=4326), srid=4326)
        the_geog = MultiPolygon(GEOSGeometry(bbox))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        job = Job.objects.all()[0]
        self.assertIsNotNone(job)
        geom = job.the_geom
        geog = job.the_geog
        geom_web = job.the_geom_webmercator
        self.assertEqual(the_geom, geom)
        self.assertEqual(the_geog, geog)
        self.assertEqual(the_geom_webmercator, geom_web)

    def test_fields(self,):
        job = Job.objects.all()[0]
        self.assertEquals('TestJob', job.name)
        self.assertEquals('Test description', job.description)
        self.assertEquals('Nepal activation', job.event)
        self.assertEqual(self.user, job.user)

    def test_str(self,):
        job = Job.objects.all()[0]
        self.assertEquals(str(job), 'TestJob')

    def test_job_region(self,):
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))  # africa
        region = Region.objects.filter(the_geom__contains=bbox)[0]
        self.assertIsNotNone(region)
        self.assertEquals('Africa', region.name)
        self.job.region = region
        self.job.save()
        saved_job = Job.objects.all()[0]
        self.assertEqual(saved_job.region, region)

    def test_overpass_extents(self,):
        job = Job.objects.all()[0]
        extents = job.overpass_extents
        self.assertIsNotNone(extents)
        self.assertEquals(4, len(extents.split(',')))

    def test_extents(self,):
        job = Job.objects.all()[0]
        extents = job.extents
        self.assertIsNotNone(extents)
        self.assertEquals(4, len(extents))

    def test_categorised_tags(self,):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertEquals(259, len(tags))

        # save all the tags from the preset
        job = Job.objects.first()
        job.json_tags = tags
        categories = job.categorised_tags

        self.assertIsNotNone(categories)
        self.assertEquals(29, len(categories['points']))
        self.assertEquals(16, len(categories['lines']))
        self.assertEquals(26, len(categories['polygons']))

    def test_tags(self,):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEquals(259, len(tags))
        # save all the tags from the preset
        self.job.json_tags = tags
        self.job.save()
        self.assertEquals(259, len(self.job.json_tags))


class TestExportFormat(TestCase):
    def test_str(self,):
        kml = ExportFormat.objects.get(slug='kml')
        self.assertEquals(unicode(kml), 'kml')
        self.assertEquals(str(kml), 'KML Format')


class TestRegion(TestCase):
    def test_load_region(self,):
        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/../migrations/africa.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = GEOSGeometry(geom.wkt, srid=4326)
        the_geog = GEOSGeometry(geom.wkt)
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        region = Region.objects.create(name="Africa", description="African export region", the_geom=the_geom,
                                       the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)
        saved_region = Region.objects.get(uid=region.uid)
        self.assertEqual(region, saved_region)

    def test_africa_region(self,):
        africa = Region.objects.get(name='Africa')
        self.assertIsNotNone(africa)
        self.assertEquals('Africa', africa.name)
        self.assertIsNotNone(africa.the_geom)

    def test_bbox_intersects_region(self,):
        bbox = Polygon.from_bbox((-3.9, 16.6, 7.0, 27.6))
        self.assertIsNotNone(bbox)
        africa = Region.objects.get(name='Africa')
        self.assertIsNotNone(africa)
        self.assertTrue(africa.the_geom.intersects(bbox))

    def test_get_region_for_bbox(self,):
        bbox = Polygon.from_bbox((-3.9, 16.6, 7.0, 27.6))
        regions = Region.objects.all()
        found = []
        for region in regions:
            if region.the_geom.intersects(bbox):
                found.append(region)
                break
        self.assertTrue(len(found) == 1)
        self.assertEquals('Africa', found[0].name)


class TestJobRegionIntersection(TestCase):
    def setUp(self,):
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((36.90, 13.54, 48.52, 20.24))  # overlaps africa / central asia
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom )
        self.uid = self.job.uid
        # add the formats to the job
        self.job.formats = self.formats
        self.job.save()

    def test_job_region_intersection(self,):
        job = Job.objects.all()[0]
        # use the_geog
        regions = Region.objects.filter(the_geog__intersects=job.the_geog).annotate(
            intersection=Area(Intersection('the_geog', job.the_geog))).order_by('-intersection')
        self.assertEquals(2, len(regions))
        asia = regions[0]
        africa = regions[1]
        self.assertIsNotNone(asia)
        self.assertIsNotNone(africa)
        self.assertEquals('Central Asia/Middle East', asia.name)
        self.assertEquals('Africa', africa.name)
        self.assertTrue(asia.intersection > africa.intersection)

        # use the_geom
        regions = Region.objects.filter(the_geom__intersects=job.the_geom).intersection(job.the_geom,
                                                                                        field_name='the_geom').order_by(
            '-intersection')
        # logger.debug('Geometry lookup took: %s' % geom_time)
        self.assertEquals(2, len(regions))
        asia = regions[0]
        africa = regions[1]
        self.assertIsNotNone(asia)
        self.assertIsNotNone(africa)
        self.assertEquals('Central Asia/Middle East', asia.name)
        self.assertEquals('Africa', africa.name)
        self.assertTrue(asia.intersection.area > africa.intersection.area)

    def test_job_outside_region(self,):
        job = Job.objects.all()[0]
        bbox = Polygon.from_bbox((2.74, 47.66, 21.61, 60.24))  # outside any region
        the_geom = MultiPolygon(GEOSGeometry(bbox, srid=4326))
        job.the_geom = the_geom
        job.save()
        regions = Region.objects.filter(the_geom__intersects=job.the_geom).intersection(job.the_geom,
                                                                                        field_name='the_geom').order_by(
            '-intersection')
        self.assertEquals(0, len(regions))


class TestTag(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.job = Job.objects.create(name='TestJob', description='Test description', user=self.user,
                                      the_geom=the_geom, json_tags=tags)
        self.uid = self.job.uid
        # add the formats to the job
        self.job.formats = self.formats
        self.job.save()
        self.path = os.path.dirname(os.path.realpath(__file__))

    def test_create_tags(self,):
        tags = [
            {
                'key': 'aeroway',
                'value': 'aerodrome',
                'geom': ['node', 'area'],
            },
        ]
        self.job.json_tags = tags
        self.job.save()

        self.assertEquals(self.job.json_tags[0]['key'], 'aeroway')
        geom_types = self.job.json_tags[0]['geom']
        self.assertEquals(1, len(self.job.json_tags))
        self.assertEqual(['node', 'area'], geom_types)

    def test_save_tags_from_preset(self,):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEquals(259, len(tags))
        self.job.json_tags = tags
        self.job.save()

        self.assertEquals(259, len(self.job.json_tags))

    def test_get_categorised_tags(self,):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEquals(259, len(tags))
        self.job.json_tags = tags
        self.job.save()
        self.assertEquals(259, len(self.job.json_tags))


class TestExportProfile(TestCase):
    def setUp(self,):
        self.group = Group.objects.create(name='TestDefaultExportExtentGroup')

    def test_export_profile(self,):
        profile = ExportProfile.objects.create(name='DefaultExportProfile', max_extent=2500000,
                                               group=self.group)
        self.assertEqual(self.group.export_profile, profile)
        self.assertEquals('DefaultExportProfile', profile.name)
        self.assertEquals(2500000, profile.max_extent)
