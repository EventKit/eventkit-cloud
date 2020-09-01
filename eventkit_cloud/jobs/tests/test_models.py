# -*- coding: utf-8 -*-
import logging
import os
import yaml
from django.contrib.auth.models import Group, User
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models.functions import Area
from django.contrib.gis.db.models.functions import Intersection
from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon
from django.test import TestCase
from mock import call, patch

from eventkit_cloud.jobs.models import (
    ExportFormat, ExportProfile, Job,
    DataProvider, DataProviderTask, DatamodelPreset, JobPermission, JobPermissionLevel)

logger = logging.getLogger(__name__)


class TestJob(TestCase):
    """
    Test cases for Job model
    """
    fixtures = ('osm_provider.json', 'datamodel_presets.json')

    def setUp(self):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        self.group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = self.group
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
        provider_task.min_zoom = 3
        provider_task.max_zoom = 6
        provider_task.save()
        self.job.data_provider_tasks.add(provider_task)
        self.job.save()

    def test_job_creation(self, ):
        saved_job = Job.objects.all()[0]
        self.assertEqual(self.job, saved_job)
        self.assertEqual(self.uid, saved_job.uid)
        self.assertIsNotNone(saved_job.created_at)
        self.assertIsNotNone(saved_job.updated_at)
        saved_provider_tasks = saved_job.data_provider_tasks.first()
        self.assertIsNotNone(saved_provider_tasks.formats.all())
        self.assertCountEqual(saved_provider_tasks.formats.all(), self.formats)
        self.assertEqual(saved_provider_tasks.min_zoom, 3)
        self.assertEqual(saved_provider_tasks.max_zoom, 6)
        self.assertEqual('Test description', saved_job.description)
        self.assertEqual(4, len(saved_job.json_tags))
        self.assertEqual(False, saved_job.include_zipfile)  # default

    def test_job_creation_with_config(self, ):
        saved_job = Job.objects.all()[0]
        self.assertEqual(self.job, saved_job)
        self.assertEqual(self.uid, saved_job.uid)
        self.assertIsNotNone(saved_job.created_at)
        self.assertIsNotNone(saved_job.updated_at)
        saved_provider_tasks = saved_job.data_provider_tasks.first()
        self.assertIsNotNone(saved_provider_tasks.formats.all())
        self.assertCountEqual(saved_provider_tasks.formats.all(), self.formats)
        # attach a configuration to a job
        hdm_preset = DatamodelPreset.objects.get(name='hdm')
        saved_job.preset = hdm_preset
        self.assertEqual(hdm_preset.json_tags, saved_job.preset.json_tags)

    def test_spatial_fields(self, ):
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))  # in africa
        the_geom = MultiPolygon(GEOSGeometry(bbox, srid=4326), srid=4326)
        the_geog = MultiPolygon(GEOSGeometry(bbox), srid=4326)
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        job = Job.objects.all()[0]
        self.assertIsNotNone(job)
        geom = job.the_geom
        geog = job.the_geog
        geom_web = job.the_geom_webmercator
        self.assertEqual(the_geom, geom)
        self.assertEqual(the_geog, geog)
        self.assertEqual(the_geom_webmercator, geom_web)

    def test_fields(self, ):
        job = Job.objects.all()[0]
        self.assertEqual('TestJob', job.name)
        self.assertEqual('Test description', job.description)
        self.assertEqual('Nepal activation', job.event)
        self.assertEqual(self.user, job.user)

    def test_str(self, ):
        job = Job.objects.all()[0]
        self.assertEqual(str(job), 'TestJob')

    def test_overpass_extents(self, ):
        job = Job.objects.all()[0]
        extents = job.overpass_extents
        self.assertIsNotNone(extents)
        self.assertEqual(4, len(extents.split(',')))

    def test_extents(self, ):
        job = Job.objects.all()[0]
        extents = job.extents
        self.assertIsNotNone(extents)
        self.assertEqual(4, len(extents))

    def test_categorised_tags(self, ):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertEqual(259, len(tags))

        # save all the tags from the preset
        job = Job.objects.first()
        job.json_tags = tags
        categories = job.categorised_tags

        self.assertIsNotNone(categories)
        self.assertEqual(29, len(categories['points']))
        self.assertEqual(16, len(categories['lines']))
        self.assertEqual(26, len(categories['polygons']))

    def test_tags(self, ):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEqual(259, len(tags))
        # save all the tags from the preset
        self.job.json_tags = tags
        self.job.save()
        self.assertEqual(259, len(self.job.json_tags))


class TestExportFormat(TestCase):
    def test_str(self, ):
        kml = ExportFormat.objects.get(slug='kml')
        self.assertEqual(str(kml), 'KML Format')


class TestTag(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self, ):
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        self.group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')
        with patch('eventkit_cloud.jobs.signals.Group') as mock_group:
            mock_group.objects.get.return_value = self.group
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

    def test_create_tags(self, ):
        tags = [
            {
                'key': 'aeroway',
                'value': 'aerodrome',
                'geom': ['node', 'area'],
            },
        ]
        self.job.json_tags = tags
        self.job.save()

        self.assertEqual(self.job.json_tags[0]['key'], 'aeroway')
        geom_types = self.job.json_tags[0]['geom']
        self.assertEqual(1, len(self.job.json_tags))
        self.assertEqual(['node', 'area'], geom_types)

    def test_save_tags_from_preset(self, ):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEqual(259, len(tags))
        self.job.json_tags = tags
        self.job.save()

        self.assertEqual(259, len(self.job.json_tags))

    def test_get_categorised_tags(self, ):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEqual(259, len(tags))
        self.job.json_tags = tags
        self.job.save()
        self.assertEqual(259, len(self.job.json_tags))


class TestExportProfile(TestCase):
    def setUp(self, ):
        self.group, created = Group.objects.get_or_create(name='TestDefaultExportExtentGroup')

    def test_export_profile(self, ):
        profile = ExportProfile.objects.create(name='DefaultExportProfile', max_extent=2500000,
                                               group=self.group)
        self.assertEqual(self.group.export_profile, profile)
        self.assertEqual('DefaultExportProfile', profile.name)
        self.assertEqual(2500000, profile.max_extent)


class TestJobPermission(TestCase):
    def setUp(self, ):
        self.user1 = User.objects.create_user(
            username='demo1', email='demo@demo.com', password='demo'
        )
        self.user2 = User.objects.create_user(
            username='demo2', email='demo@demo.com', password='demo'
        )
        self.user3 = User.objects.create_user(
            username='demo3', email='demo@demo.com', password='demo'
        )
        extents = (-3.9, 16.1, 7.0, 27.6)
        bbox = Polygon.from_bbox(extents)
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.data_provider = DataProvider.objects.create(name="test1", slug="test1")
        self.data_providers = DataProvider.objects.all()
        self.job = Job.objects.create(
            name="test1",
            description='Test description',
            the_geom=the_geom,
            user=self.user1,
            json_tags={}
        )

    def test_get_orderable_queryset_for_job(self):
        JobPermission.objects.create(job=self.job,
                                     content_type=ContentType.objects.get_for_model(User),
                                     object_id=self.user2.id,
                                     permission=JobPermissionLevel.READ.value)
        JobPermission.objects.create(job=self.job,
                                     content_type=ContentType.objects.get_for_model(User),
                                     object_id=self.user3.id,
                                     permission=JobPermissionLevel.ADMIN.value)

        users = JobPermission.get_orderable_queryset_for_job(job=self.job, model=User)
        users.order_by('username')
        self.assertEqual([users[0], users[1], users[2]], [self.user1, self.user2, self.user3])
        users = users.order_by('shared')
        self.assertEqual([users[1], users[2], users[0]], [self.user2, self.user3, self.user1])
        users.order_by('admin_shared')
        self.assertEqual([users[2], users[1], users[0]], [self.user3, self.user2, self.user1])


class TestDataProvider(TestCase):
    """
    Test cases for DataProvider model
    """
    fixtures = ('osm_provider.json', 'datamodel_presets.json')

    def setUp(self):
        self.export_provider = DataProvider.objects.get(slug='osm-generic')

    @patch('os.makedirs')
    @patch('eventkit_cloud.jobs.signals.make_thumbnail_downloadable')
    @patch('eventkit_cloud.jobs.signals.save_thumbnail')
    def test_snapshot_signal(self, mock_save_thumbnail, mock_make_thumbnail_downloadable, makedirs):
        """Test that triggering a save on a provider with a preview_url will attach a MapImageSnapshot."""
        mock_save_thumbnail.return_value = '/var/lib/downloads/images/test_thumb.jpg'
        # An instance of MapImageSnapshot
        mock_make_thumbnail_downloadable.return_value = 1
        stat = os.stat

        # We don't want to interfere with any other os.stat functions
        # This is a simple way of doing that without setting up a property mock.
        class StatMock:
            def __init__(self):
                self.st_size = 64

            def __getattr__(self, item):
                if item.lower() != 'st_size':
                    return getattr(stat, item)
                return self.st_size

        with patch('os.stat') as mock_stat:
            mock_stat.return_value = StatMock()
            self.export_provider.preview_url = 'http://url.com'
            self.export_provider.save()
            makedirs.assert_called()
            mock_make_thumbnail_downloadable.assert_called()

    @patch('eventkit_cloud.core.models.cache')
    def test_cached_model_on_save(self, mocked_cache):
        """Test that triggers a save on a provider and updates the database cache with a generic key name"""
        self.export_provider.save()

        cache_calls = [
            call(f"DataProvider-slug-{self.export_provider.slug}", self.export_provider),
            call(f"DataProvider-uid-{self.export_provider.uid}", self.export_provider),
        ]

        mocked_cache.set.assert_has_calls(cache_calls, any_order=True)

    @patch('eventkit_cloud.jobs.models.cache')
    def test_deleted_mapproxy_cache_on_save(self, mocked_cache):
        """Test that triggers a save on a provider and clears the associated mapproxy cache"""
        self.export_provider.save()

        cache_call = [
            call(f"base-config-{self.export_provider.slug}")
        ]
        mocked_cache.delete.assert_has_calls(cache_call)

    @patch("eventkit_cloud.jobs.models.get_mapproxy_metadata_url")
    def test_metadata(self, mock_get_mapproxy_metadata_url):
        example_url = "http://test.test"
        expected_url = "http://ek.test/metadata/"
        expected_metadata = {"url": expected_url,
                             "type": "arcgis"}
        mock_get_mapproxy_metadata_url.return_value = expected_url
        config = {'sources': {
            "info": {
                "type": "arcgis",
                "req": {
                    "url": example_url
                }
            }
        }}
        self.export_provider.config = yaml.dump(config)
        self.assertEqual(expected_metadata, self.export_provider.metadata)

        @patch("eventkit_cloud.jobs.models.get_mapproxy_footprint_url")
        def test_footprint_url(self, mock_get_mapproxy_footprint_url):
            example_url = "http://test.test"
            expected_url = "http://ek.test/footprint/"
            mock_get_mapproxy_footprint_url.return_value = expected_url
            config = {'sources': {
                "footprint": {
                    "req": {
                        "url": example_url
                    }
                }
            }}
            self.export_provider.config = yaml.dump(config)
            self.assertEqual(expected_url, self.export_provider.footprint_url)
