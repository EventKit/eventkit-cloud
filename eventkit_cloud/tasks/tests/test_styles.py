# -*- coding: utf-8 -*-
import datetime
import os

from django.conf import settings

from django.test import TestCase
from mock import patch, MagicMock

from eventkit_cloud.tasks import TaskStates
from eventkit_cloud.tasks.helpers import generate_qgs_style, get_metadata


class TestStyles(TestCase):

    @patch('eventkit_cloud.tasks.helpers.render_to_string')
    @patch('builtins.open')
    def test_generate_qgs_style(self, mock_open, mock_render_to_string):

        metadata = {
            "aoi": "{}",
            "bbox": [-1, -1, 1, 1], "data_sources": {
                "osm": {"copyright": None,
                        "description": "OpenStreetMap vector data provided in a custom thematic schema. \r\n\t\r\n\tData is grouped into separate tables (e.g. water, roads...).",
                        "file_path": "data/osm/test-osm-20181101.gpkg", "file_type": ".gpkg",
                        "full_file_path": "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/test.gpkg",
                        "last_update": "2018-10-29T04:35:02Z\n",
                        "metadata": "https://overpass-server.com/overpass/interpreter",
                        "name": "OpenStreetMap Data (Themes)", "slug": "osm", "type": "osm",
                        "uid": "0d08ddf6-35c1-464f-b271-75f6911c3f78"}}, "date": "20181101", "description": "Test",
            "has_elevation": False, "has_raster": True, "include_files": [
                "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/test.gpkg",
                "/var/lib/eventkit/exports_stage/7fadf34e-58f9-4bb8-ab57-adc1015c4269/osm/osm_selection.geojson"],
            "name": "test", "project": "Test", "run_uid": "7fadf34e-58f9-4bb8-ab57-adc1015c4269",
            "url": "http://cloud.eventkit.test/status/2010025c-6d61-4a0b-8d5d-ff9c657259eb"}

        returnvalue = generate_qgs_style(metadata)
        now = datetime.datetime.now()
        datestamp = "%s%02d%02d" % (now.year, now.month, now.day)

        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT, str(metadata['run_uid']))
        style_file = os.path.join(stage_dir,
                                  metadata['name'] + "-osm-" + datestamp + ".qgs")
        mock_open.assert_called_once_with(style_file, 'wb')
        mock_render_to_string.assert_called_once()
        self.assertEqual(returnvalue, style_file)
