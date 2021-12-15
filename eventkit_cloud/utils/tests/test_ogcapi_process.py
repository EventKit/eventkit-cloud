# -*- coding: utf-8 -*-
import logging

import requests_mock
from django.test import TestCase

from eventkit_cloud.utils.ogcapi_process import get_format_field_from_config

logger = logging.getLogger(__name__)


class TestOgcApiProcess(TestCase):
    def setUp(self):
        self.mock_requests = requests_mock.Mocker()
        self.mock_requests.start()
        self.addCleanup(self.mock_requests.stop)

        self.format_field = "file_format"
        self.config = {
            "ogcapi_process": {
                "id": "export-eventkit-bundle",
                "inputs": {"products": {self.format_field: "gpkg"}},
                "outputs": {"output_name": {"format": {"mediaType": "application/zip"}}},
                "area": {"name": "geojson", "type": "geojson"},
                "output_file_ext": ".gpkg",
                "download_credentials": {"cred_var": "user:pass"},
            }
        }

    def test_get_format_field_from_config(self):
        self.assertEqual(
            ("products", self.format_field), get_format_field_from_config(self.config.get("ogcapi_process"))
        )
