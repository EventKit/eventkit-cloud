from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.user_requests.models import DataProviderRequest, SizeIncreaseRequest


class TestDataProviderRequest(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        self.provider_request = DataProviderRequest(
            name="Test Data Provider Request",
            url="http://www.test.com",
            service_description="Test Service Description",
            layer_names="[Test1, Test2, Test3]",
            comment="Test Comment",
            user=self.user,
        )
        self.provider_request.save()
        self.uid = self.provider_request.uid

    def test_data_provider_request_creation(self):
        provider_request = DataProviderRequest.objects.all()[0]
        self.assertEqual(provider_request, self.provider_request)
        self.assertEqual(provider_request.uid, self.uid)
        self.assertIsNotNone(provider_request.created_at)
        self.assertIsNotNone(provider_request.updated_at)

    def test_fields(self):
        provider_request = DataProviderRequest.objects.all()[0]
        self.assertEqual(provider_request.name, "Test Data Provider Request")
        self.assertEqual(provider_request.url, "http://www.test.com")
        self.assertEqual(provider_request.service_description, "Test Service Description")
        self.assertEqual(provider_request.layer_names, "[Test1, Test2, Test3]")
        self.assertEqual(provider_request.comment, "Test Comment")
        self.assertEqual(provider_request.status, "pending")
        self.assertEqual(provider_request.user, self.user)


class TestSizeIncreaseRequest(TestCase):
    fixtures = ("osm_provider.json",)

    def setUp(self):
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        provider = DataProvider.objects.get(slug="osm-generic")
        self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        self.size_request = SizeIncreaseRequest(
            provider=provider, the_geom=the_geom, requested_aoi_size=5000, requested_data_size=1000, user=self.user
        )
        self.size_request.save()
        self.uid = self.size_request.uid

    def test_size_increase_request_creation(self):
        size_request = SizeIncreaseRequest.objects.all()[0]
        self.assertEqual(size_request, self.size_request)
        self.assertEqual(size_request.uid, self.uid)
        self.assertIsNotNone(size_request.created_at)
        self.assertIsNotNone(size_request.updated_at)

    def test_fields(self):
        size_request = SizeIncreaseRequest.objects.all()[0]
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = MultiPolygon(GEOSGeometry(bbox, srid=4326), srid=4326)
        self.assertEqual(size_request.the_geom, the_geom)
        self.assertEqual(size_request.requested_aoi_size, 5000)
        self.assertEqual(size_request.requested_data_size, 1000)
        self.assertEqual(size_request.status, "pending")
        self.assertEqual(size_request.user, self.user)
