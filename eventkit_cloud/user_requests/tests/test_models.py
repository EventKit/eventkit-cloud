from django.test import TestCase
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.user_requests.models import AoiIncreaseRequest, DataProviderRequest


class TestAoiIncreaseRequest(TestCase):
    fixtures = ('osm_provider.json',)

    def setUp(self):
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        provider = DataProvider.objects.get(slug="osm-generic")
        self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        self.aoi_request = AoiIncreaseRequest(
            provider=provider,
            the_geom=the_geom,
            requested_aoi_size=5000,
            estimated_data_size=1000,
            user=self.user
        )
        self.aoi_request.save()
        self.uid = self.aoi_request.uid

    def test_aoi_increase_request_creation(self):
        aoi_request = AoiIncreaseRequest.objects.all()[0]
        self.assertEqual(aoi_request, self.aoi_request)
        self.assertEqual(aoi_request.uid, self.uid)
        self.assertIsNotNone(aoi_request.created_at)
        self.assertIsNotNone(aoi_request.updated_at)

    def test_fields(self):
        aoi_request = AoiIncreaseRequest.objects.all()[0]
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = MultiPolygon(GEOSGeometry(bbox, srid=4326), srid=4326)
        self.assertEqual(aoi_request.the_geom, the_geom)
        self.assertEqual(aoi_request.requested_aoi_size, 5000)
        self.assertEqual(aoi_request.estimated_data_size, 1000)
        self.assertEqual(aoi_request.status, "pending")
        self.assertEqual(aoi_request.user, self.user)

class TestDataProviderRequest(TestCase):

    def setUp(self):
        self.user = User.objects.create(username="demo", email="demo@demo.com", password="demo")
        self.provider_request = DataProviderRequest(
            name="Test Data Provider Request",
            url="http://www.test.com",
            service_description="Test Service Description",
            layer_names="[Test1, Test2, Test3]",
            comment="Test Comment",
            user=self.user
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
        self.assertEqual(provider_request.status,"pending")
        self.assertEqual(provider_request.user, self.user)
