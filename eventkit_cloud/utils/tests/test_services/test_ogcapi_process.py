from django.test import TestCase

from eventkit_cloud.utils.services.ogcapi_process import OGCAPIProcess


class TestOgcApiProcess(TestCase):
    def setUp(self):
        self.layer = "test_layer"
        self.url = "http://ogcapi-process.test"
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
        self.client = OGCAPIProcess(self.url, self.layer, aoi_geojson=None, slug=None, max_area=0, config=self.config)

    def test_get_format_field_from_config(self):
        input_config = self.client.process_config["inputs"]
        self.assertEqual(("products", self.format_field), OGCAPIProcess.get_format_field(input_config))
