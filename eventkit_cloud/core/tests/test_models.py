import logging
from django.contrib.auth.models import User
from django.contrib.gis.geos import GEOSGeometry, Polygon

from eventkit_cloud.core.models import JobPermission, JobPermissionLevel
from eventkit_cloud.jobs.models import Job, DataProvider
from django.test import TestCase
from django.contrib.contenttypes.models import ContentType


logger = logging.getLogger(__name__)


class TestCoreModels(TestCase):

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
