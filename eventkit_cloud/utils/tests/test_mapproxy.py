# -*- coding: utf-8 -*-
import logging
from unittest.mock import MagicMock, Mock, patch
from uuid import uuid4

from django.conf import settings
from django.test import TransactionTestCase
from mapproxy.config.config import load_default_config

from eventkit_cloud.jobs.models import DataProvider
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.utils.mapproxy import (
    CustomLogger,
    MapproxyGeopackage,
    check_zoom_levels,
    clear_mapproxy_config_cache,
    get_cache_template,
    get_conf_dict,
    get_custom_exp_backoff,
    get_footprint_layer_name,
    get_height,
    get_mapproxy_footprint_url,
    get_mapproxy_metadata_url,
    get_resolution_for_extent,
    get_width,
    mapproxy_config_keys_index,
)

logger = logging.getLogger(__name__)


class TestGeopackage(TransactionTestCase):
    def setUp(self):
        self.path = settings.ABS_PATH()
        self.task_process_patcher = patch("eventkit_cloud.tasks.task_process.TaskProcess")
        self.task_process = self.task_process_patcher.start()
        self.addCleanup(self.task_process_patcher.stop)
        self.task_uid = uuid4()

    @patch("eventkit_cloud.utils.mapproxy.auth_requests.patch_https")
    @patch("eventkit_cloud.utils.mapproxy.set_gpkg_contents_bounds")
    @patch("eventkit_cloud.utils.mapproxy.check_zoom_levels")
    @patch("eventkit_cloud.utils.mapproxy.remove_empty_zoom_levels")
    @patch("eventkit_cloud.utils.mapproxy.connections")
    @patch("eventkit_cloud.utils.mapproxy.SeedingConfiguration")
    @patch("eventkit_cloud.utils.mapproxy.seeder")
    @patch("eventkit_cloud.utils.mapproxy.load_config")
    @patch("eventkit_cloud.utils.mapproxy.get_cache_template")
    @patch("eventkit_cloud.utils.mapproxy.get_seed_template")
    def test_convert(
        self,
        seed_template,
        cache_template,
        load_config,
        seeder,
        seeding_config,
        connections,
        remove_zoom_levels,
        mock_check_zoom_levels,
        mock_set_gpkg_contents_bounds,
        patch_https,
    ):
        with self.settings(SSL_VERIFICATION=True):
            gpkgfile = "/var/lib/eventkit/test.gpkg"
            config = {
                "layers": [{"name": "default", "title": "imagery", "sources": ["default"]}],
                "sources": {
                    "default": {
                        "type": "tile",
                        "grid": "default",
                        "url": "http://a.tile.openstreetmap.fr/hot/%(z)s/%(x)s/%(y)s.png",
                    }
                },
                "grids": {"default": {"srs": "WGS84:3857", "tile_size": [256, 256], "origin": "nw"}},
            }
            json_config = config
            mapproxy_config = load_default_config()
            bbox = [-2, -2, 2, 2]
            cache_template.return_value = {
                "sources": ["default"],
                "cache": {"type": "geopackage", "filename": "/var/lib/eventkit/test.gpkg"},
                "grids": ["default"],
            }
            seed_template.return_value = {
                "coverages": {"geom": {"srs": "EPSG:4326", "bbox": [-2, -2, 2, 2]}},
                "seeds": {
                    "seed": {
                        "coverages": ["geom"],
                        "refresh_before": {"minutes": 0},
                        "levels": {"to": 10, "from": 0},
                        "caches": ["default"],
                    }
                },
            }
            self.task_process.return_value = Mock(exitcode=0)
            w2g = MapproxyGeopackage(
                config=config,
                gpkgfile=gpkgfile,
                bbox=bbox,
                service_url="http://generic.server/WMTS?SERVICE=WMTS&REQUEST=GetTile&TILEMATRIXSET=default028mm&"
                "TILEMATRIX=%(z)s&TILEROW=%(y)s&TILECOL=%(x)s&FORMAT=image%%2Fpng",
                layer="imagery",
                debug=True,
                name="imagery",
                level_from=0,
                level_to=10,
                service_type="wmts",
                task_uid=self.task_uid,
            )
            result = w2g.convert()
            mock_check_zoom_levels.assert_called_once()
            connections.close_all.assert_called_once()
            self.assertEqual(result, gpkgfile)

            cache_template.assert_called_once_with(
                ["imagery"], [grids for grids in json_config.get("grids")], gpkgfile, table_name="imagery"
            )
            json_config["caches"] = {
                "default": {
                    "sources": ["default"],
                    "cache": {"type": "geopackage", "filename": "/var/lib/eventkit/test.gpkg"},
                    "grids": ["default"],
                }
            }
            json_config["services"] = ["demo"]

            patch_https.assert_called_once_with(cert_info=None)
            load_config.assert_called_once_with(mapproxy_config, config_dict=json_config)
            remove_zoom_levels.assert_called_once_with(gpkgfile)
            mock_set_gpkg_contents_bounds.assert_called_once_with(gpkgfile, "imagery", bbox)
            seed_template.assert_called_once_with(
                bbox=bbox, coverage_file=None, level_from=0, level_to=10, projection=None
            )
            self.task_process.side_effect = Exception()
            with self.assertRaises(Exception):
                w2g.convert()


class TestHelpers(TransactionTestCase):
    def get_cache_template(self):
        example_geopackage = "/test/example.gpkg"
        example_sources = ["raster_source"]
        example_grids = ["raster_grid"]

        cache_template = get_cache_template(example_sources, example_grids, example_geopackage)

        expected_template = {
            "cache": {
                "sources": example_sources,
                "meta_size": [1, 1],
                "cache": {"type": "geopackage", "filename": str(example_geopackage)},
                "grids": example_grids,
                "format": "mixed",
                "request_format": "image/png",
            }
        }

        self.assertEqual(cache_template, expected_template)

    @patch("eventkit_cloud.utils.mapproxy.sqlite3")
    @patch("eventkit_cloud.utils.mapproxy.get_table_tile_matrix_information")
    @patch("eventkit_cloud.utils.mapproxy.get_zoom_levels_table")
    @patch("eventkit_cloud.utils.mapproxy.get_tile_table_names")
    def test_check_zoom_levels(self, mock_get_tables, mock_get_zoom_levels, mock_tile_matrix, mock_sql):
        from mapproxy.config.loader import ProxyConfiguration

        example_geopackage = "/test/example.gpkg"
        grid_name = "default"
        tile_size = (256, 256)
        table_name = "tiles"
        zoom_levels_table = [0, 1, 2]
        # tile_matrix is abbreviated, for clarity.
        tile_matrix = [{"table_name": table_name, "zoom_level": 0}, {"table_name": table_name, "zoom_level": 1}]
        configuration = {
            "caches": {
                "default": {"cache": {"type": "geopackage", "filename": example_geopackage}, "grids": [grid_name]}
            },
            "grids": {"default": {"srs": "EPSG:4326", "tile_size": tile_size, "origin": "nw"}},
        }

        mapproxy_configuration = ProxyConfiguration(configuration)
        mock_get_tables.return_value = (table_name,)
        mock_get_zoom_levels.return_value = zoom_levels_table
        mock_tile_matrix.return_value = tile_matrix
        check_zoom_levels(example_geopackage, mapproxy_configuration)
        mock_get_tables.assert_called_once_with(example_geopackage)
        mock_get_zoom_levels.assert_called_once_with(example_geopackage, table_name)
        mock_tile_matrix.assert_called_once_with(example_geopackage, table_name)
        mock_sql.connect().__enter__().execute.assert_called_once_with(
            "\nINSERT OR REPLACE INTO gpkg_tile_matrix (table_name, zoom_level, matrix_width, matrix_height, "
            "tile_width, tile_height,\npixel_x_size, pixel_y_size)\nVALUES(?, ?, ?, ?, ?, ?, ?, ?)",
            ("tiles", 2, 4, 2, 256, 256, 0.3515625, 0.3515625),
        )

    @patch("eventkit_cloud.utils.mapproxy.get_cached_model")
    def test_conf_dict(self, mock_get_cached_model: MagicMock):
        slug: str = "slug"
        config_yaml: dict = {"services": ["stuff"]}
        expected_config: dict = {
            "services": ["stuff"],
            "globals": {"cache": {"lock_dir": "./locks", "tile_lock_dir": "./locks"}, "tiles": {"expires_hours": 0}},
        }
        mock_data_provider = Mock(config=config_yaml)
        mock_data_provider.config = config_yaml

        mock_get_cached_model.return_value = mock_data_provider
        returned_conf = get_conf_dict(slug)
        mock_get_cached_model.assert_called_once_with(model=DataProvider, prop="slug", value=slug)
        self.assertEquals(returned_conf, expected_config)

    def test_get_footprint_layer_name(self):
        example_slug = "test"
        expected_value = f"{example_slug}-footprint"
        returned_value = get_footprint_layer_name(example_slug)
        self.assertEqual(expected_value, returned_value)

    def test_get_mapproxy_metadata_url(self):
        example_slug = "test"
        url = "http://test.test"
        with self.settings(SITE_URL=url):
            expected_value = f"{url}/map/{example_slug}/service"
            returned_value = get_mapproxy_metadata_url(example_slug)
            self.assertEqual(expected_value, returned_value)

    def test_get_mapproxy_footprint_url(self):
        example_slug = "test"
        url = "http://test.test"
        with self.settings(SITE_URL=url):
            expected_value = (
                f"{url}/map/{example_slug}/wmts/{get_footprint_layer_name(example_slug)}/default/"
                f"{{z}}/{{x}}/{{y}}.png"
            )
            returned_value = get_mapproxy_footprint_url(example_slug)
            self.assertEqual(expected_value, returned_value)

    @patch("eventkit_cloud.utils.mapproxy.get_cache_value")
    @patch("eventkit_cloud.utils.mapproxy.exp_backoff")
    def test_get_custom_exp_backoff(self, mock_exp_backoff, mock_get_cache_value):
        example_repeat = 3
        example_task_uid = "1234"
        random_arg = 10
        custom_backoff = get_custom_exp_backoff(max_repeat=example_repeat, task_uid=example_task_uid)
        custom_backoff(random_arg=random_arg)
        mock_exp_backoff.assert_called_once_with(random_arg=random_arg, max_repeat=example_repeat)

        with self.assertRaises(Exception):
            mock_get_cache_value.return_value = TaskState.CANCELED.value
            custom_backoff()

    @patch("eventkit_cloud.utils.mapproxy.cache")
    def test_clear_mapproxy_config_cache(self, cache_mock):
        mapproxy_config_keys = cache_mock.get_or_set.return_value = {"key-a", "key-b"}
        clear_mapproxy_config_cache()
        cache_mock.get_or_set.assert_called_with(mapproxy_config_keys_index, set())
        cache_mock.delete_many.assert_called_with(list(mapproxy_config_keys))

    @patch("eventkit_cloud.utils.mapproxy.get_height")
    @patch("eventkit_cloud.utils.mapproxy.get_width")
    def test_get_resolution_for_extent(self, mock_get_width, mock_get_height):
        extent = (-180, -90, 180, 90)
        mock_get_width.return_value = 360
        mock_get_height.return_value = 180
        resolution = get_resolution_for_extent(extent)
        self.assertEqual(resolution, 0.3515625)

    def test_get_width(self):
        extent = (-180, -90, 180, 90)
        width = get_width(extent)
        self.assertEqual(width, 360)

    def test_get_height(self):
        extent = (-180, -90, 180, 90)
        height = get_height(extent)
        self.assertEqual(height, 180)


class TestLogger(TransactionTestCase):
    @patch("eventkit_cloud.utils.mapproxy.get_cache_value")
    @patch("eventkit_cloud.tasks.helpers.update_progress")
    def test_log_step(self, mock_update_progress, mock_get_cache_value):
        test_task_uid = "1234"
        test_progress = 0.42
        custom_logger = CustomLogger(task_uid=test_task_uid)
        custom_logger.log_step_counter = 0
        self.assertIsNotNone(custom_logger)
        mock_progress = MagicMock()
        mock_progress.progress = test_progress
        custom_logger.log_step(mock_progress)
        mock_update_progress.assert_called_with(test_task_uid, progress=test_progress * 100, eta=custom_logger.eta)

        with self.assertRaises(Exception):
            mock_get_cache_value.return_value = TaskState.CANCELED.value
            custom_logger.log_step(mock_progress)
