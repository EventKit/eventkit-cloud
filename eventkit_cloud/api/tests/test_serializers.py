import json
from unittest.mock import Mock

from django.test import TestCase
from rest_framework.renderers import JSONRenderer

from eventkit_cloud.api.serializers import (
    DataProviderSerializer,
    basic_data_provider_list_serializer,
    basic_field_serializer,
    filtered_basic_data_provider_serializer,
)
from eventkit_cloud.jobs.models import DataProvider


class TestSerializers(TestCase):
    """
    Test cases for serializers not otherwise covered in view testing.
    """

    fixtures = ("osm_provider.json", "datamodel_presets.json")
    maxDiff = None

    def setUp(self):
        self.data_provider = DataProvider.objects.get(slug="osm")

    def test_basic_field_serializer(self):
        example_model = {"prop1": "value1", "prop2": "value2", "prop3": "value3"}
        model = Mock(**example_model)
        fields = ["prop1", "prop3"]
        expected_result = {"prop1": "value1", "prop3": "value3"}
        self.assertEqual(basic_field_serializer(model, fields), expected_result)

    def test_filtered_basic_data_provider_serializer(self):
        expected_result = [
            {"id": self.data_provider.id, "uid": self.data_provider.uid, "hidden": True, "display": False}
        ]
        self.assertEqual(filtered_basic_data_provider_serializer(self.data_provider, many=True), expected_result)
        self.assertEqual(filtered_basic_data_provider_serializer(self.data_provider), expected_result[0])
        self.assertEqual(filtered_basic_data_provider_serializer([]), [])
        with self.assertRaises(Exception):
            filtered_basic_data_provider_serializer([Mock(), Mock()])

    def test_basic_data_provider_list_serializer(self):
        queryset = DataProvider.objects.all()[:1]
        readonly_serializer = json.loads(
            JSONRenderer().render(basic_data_provider_list_serializer(queryset, many=True))
        )
        drf_serializer = json.loads(
            JSONRenderer().render(DataProviderSerializer(queryset, many=True, context={"request": None}).data)
        )

        self.assertCountEqual(readonly_serializer[0], drf_serializer[0])
        data_provider = DataProvider.objects.first()
        readonly_serializer = json.loads(JSONRenderer().render(basic_data_provider_list_serializer(data_provider)))
        drf_serializer = json.loads(
            JSONRenderer().render(DataProviderSerializer(data_provider, context={"request": None}).data)
        )
        self.assertCountEqual(readonly_serializer, drf_serializer)
        with self.assertRaises(Exception):
            basic_data_provider_list_serializer(DataProvider.objects.all())
