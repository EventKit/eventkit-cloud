# -*- coding: utf-8 -*-
import logging
import os
import shutil
from time import sleep
from typing import Union

from django.conf import settings
from django.db import transaction
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from eventkit_cloud.jobs.models import DataProvider, DataProviderType
from eventkit_cloud.tasks.enumerations import TaskState
from eventkit_cloud.utils.client import EventKitClient
from eventkit_cloud.utils.geopackage import check_content_exists, check_zoom_levels

logger = logging.getLogger(__name__)

# Default length of time to let a single test case run.
DEFAULT_TIMEOUT = 600


# TODO: Add arcgis-feature-service back when that is working correctly.
# These test are designed to test a couple critical features such as the ability to run all of the various
# provider types.  Run one provider for raster, osm, and elevation and convert it successfully.  Cancel runs.
# Download data. Ensure there is data in downloaded file.
# The various tests are commented out because running all of them takes a long time and the tests are fairly
# redundant.  They are left here to provide a quick utility for a dev to test when adding a feature or debugging.

EVENT_NAME = "EVENTKIT-INTEGRATION-TEST"  # Use a suffix which is unique and can be filtered against.


class TestJob(TestCase):
    """
    Test cases for Job model
    """

    def setUp(self):
        certificate = os.getenv("EVENTKIT_CERT")
        if not certificate:
            user = os.getenv("EVENTKIT_USER", "admin")
            password = os.getenv("EVENTKIT_PASS", "@dm1n")
        verify = getattr(settings, "SSL_VERIFICATION", True)
        self.base_url = os.getenv(
            "BASE_URL", "http://{0}".format(getattr(settings, "SITE_NAME", "host.docker.internal"))
        )
        self.login_url = self.base_url + "/api/login/"
        self.create_export_url = self.base_url + "/status/create"
        self.jobs_url = self.base_url + reverse("api:jobs-list")
        self.runs_url = self.base_url + reverse("api:runs-list")
        self.download_dir = os.path.join(getattr(settings, "EXPORT_STAGING_ROOT"), "test")
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir)
        self.client: EventKitClient = self.get_client(
            self.base_url, user=user, password=password, certificate=certificate, verify=verify
        )
        self.client.session.headers["Accept"] = "application/json, text/plain, */*"
        self.selection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "bbox": [-71.04186, 42.34308, -71.0281, 42.35088],
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [-71.04859415183688, 42.34438197542646],
                                [-71.03884066043621, 42.34438197542646],
                                [-71.03884066043621, 42.35148251665268],
                                [-71.04859415183688, 42.35148251665268],
                                [-71.04859415183688, 42.34438197542646],
                            ]
                        ],
                    },
                }
            ],
        }

    def tearDown(self):
        if os.path.exists(self.download_dir):
            shutil.rmtree(self.download_dir)

    def get_client(
        self, url: str, user: str = None, password: str = None, certificate: str = None, verify: Union[str, bool] = True
    ) -> EventKitClient:
        tries = 3
        client = None
        while tries:
            try:
                client = EventKitClient(
                    url.rstrip("/"), username=user, password=password, certificate=certificate, verify=verify
                )
                break
            except Exception as e:
                tries -= 1
                logger.info("Failed to login.")
                logger.info(e)
                logger.info("{} attempts remaining.".format(tries))
                sleep(1)
        if not client:
            raise Exception(f"Could not login to the url: {url} using username:{user} or certificate:{certificate}")
        return client

    # TODO: add test_cancel_mapproxy_job
    def test_cancel_osm_run(self):
        test_service_slug = "osm"

        # update provider to ensure it runs long enough to cancel...
        # The code here is to temporarily increase the zoom level it is commented out to be implemented in
        # test_cancel_mapproxy_job when that is added.
        # export_provider = DataProvider.objects.get(slug=test_service_slug)
        # original_level_to = export_provider.level_to
        # increased_zoom_level = 19
        # export_provider.level_to = increased_zoom_level
        # export_provider.save()

        job_data = {
            "name": "Test Cancel OSM",
            "description": "Test Description",
            "include_zipfile": True,
            "project": EVENT_NAME,
            "selection": self.selection,
            "tags": [],
            "provider_tasks": [{"provider": test_service_slug, "formats": ["gpkg"]}],
            # "max_zoom": increased_zoom_level,
        }
        run = self.run_job(job_data, wait_for_run=False)

        job_uid = run["job"]["uid"]
        run = self.client.wait_for_task_pickup(job_uid=job_uid)

        export_provider_task = run["provider_tasks"][0]
        self.client.cancel_provider(export_provider_task["uid"])

        export_provider_task = self.client.get_provider_task(uid=export_provider_task["uid"])
        self.assertEqual(export_provider_task["status"], TaskState.CANCELED.value)

        try:
            run = self.client.wait_for_run(run["uid"], ignore_errors=True)
        except Exception:
            self.assertIn(run["status"], [TaskState.CANCELED.value, TaskState.INCOMPLETE.value])
            self.assertIn(
                TaskState.CANCELED.value, (provider_task["status"] for provider_task in run["provider_tasks"])
            )
        # The code here is to temporarily increase the zoom level it is commented out to be implemented in
        # test_cancel_mapproxy_job when that is added.
        # update provider to original setting.
        # export_provider = DataProvider.objects.get(slug=test_service_slug)
        # export_provider.level_to = original_level_to
        # export_provider.save()

    # def test_osm_geopackage(self):
    #     """
    #     This test is to ensure that an OSM job will export a GeoPackage.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestThematicGPKG",
    #         "include_zipfile": True,
    #         "description": "Test Description",
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "osm", "formats": ["gpkg"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))
    #
    # def test_osm_sqlite(self):
    #     """
    #     This test is to ensure that an OSM job will export a sqlite file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestThematicSQLITE",
    #         "include_zipfile": True,
    #         "description": "Test Description",
    #         "selection": self.selection,
    #         "project": EVENT_NAME,
    #         "provider_tasks": [{"provider": "osm", "formats": ["sqlite"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))
    #
    # def test_osm_shp(self):
    #     """
    #     This test is to ensure that an OSM job will export a shp.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestSHP",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "selection": self.selection,
    #         "project": EVENT_NAME,
    #         "provider_tasks": [{"provider": "osm", "formats": ["shp"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))
    #
    # def test_osm_kml(self):
    #     """
    #     This test is to ensure that an OSM job will export a kml file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestKML",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "osm", "formats": ["kml"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))
    #
    # def test_wms_gpkg(self):
    #     """
    #     This test is to ensure that an WMS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestGPKG-WMS",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "eventkit-integration-test-wms", "formats": ["gpkg"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))
    #
    # def test_wmts_gpkg(self):
    #     """
    #     This test is to ensure that an WMTS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestGPKG-WMTS",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "eventkit-integration-test-wmts", "formats": ["gpkg"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data, run_timeout=120))
    #
    # #
    # def test_wmts_gtiff(self):
    #     """
    #     This test is to ensure that an WMTS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "Test-gtiff-WMTS",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "eventkit-integration-test-wmts", "formats": ["gtiff"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))
    #
    # def test_arcgis_gpkg(self):
    #     """
    #     This test is to ensure that an ArcGIS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestGPKG-Arc-Raster",
    #         "description": "Test Description",
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "include_zipfile": True,
    #         "provider_tasks": [{"provider": "eventkit-integration-test-arc-raster", "formats": ["gpkg"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))

    # def test_wfs_gpkg(self):
    #     """
    #     This test is to ensure that an WFS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestGPKG-WFS", "description": "Test Description",
    #                 "project": EVENT_NAME,
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["gpkg"]}]}
    #     self.assertTrue(self.run_job(job_data))

    # def test_wfs_shp(self):
    #     """
    #     This test is to ensure that an WFS job will export a shp file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestSHP-WFS", "description": "Test Description", "include_zipfile": True,
    #                 "project": EVENT_NAME,
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["shp"]}]}
    #     self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    # def test_wfs_sqlite(self):
    #     """
    #     This test is to ensure that an WFS job will export a sqlite file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestSQLITE-WFS", "description": "Test Description", "include_zipfile": True,
    #                 "project": EVENT_NAME,
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["sqlite"]}]}
    #     self.assertTrue(self.run_job(job_data))

    # def test_wfs_kml(self):
    #     """
    #     This test is to ensure that an WFS job will export a kml file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestKML-WFS", "description": "Test Description", "include_zipfile": True,
    #                 "project": EVENT_NAME,
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["kml"]}]}
    #     self.assertTrue(self.run_job(job_data))

    # def test_wcs_hfa(self):
    #     """
    #     This test is to ensure that a WCS job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {
    #         "name": "TestGPKG-WCS",
    #         "description": "Test Description",
    #         "include_zipfile": True,
    #         "project": EVENT_NAME,
    #         "selection": self.selection,
    #         "tags": [],
    #         "provider_tasks": [{"provider": "eventkit-integration-test-wcs", "formats": ["hfa"]}],
    #     }
    #     self.assertTrue(self.run_job(job_data))

    # def test_arcgis_feature_service(self):
    #     """
    #     This test is to ensure that an ArcGIS Feature Service job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestGPKG-Arcfs", "description": "Test Description",
    #                 "project": EVENT_NAME,
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-arc-fs", "formats": ["gpkg"]}]}
    #     self.assertTrue(self.run_job(job_data))

    # def test_loaded(self):
    #     """
    #
    #     :return: This test will run all currently loaded providers.
    #     """
    #     provider_tasks = []
    #     for data_provider in self.get_all_displayed_provider_slugs():
    #         provider_tasks += [{"provider": data_provider, "formats": ["gpkg"]}]
    #     job_data = {
    #         "name": "Integration Tests - Test Loaded",
    #         "description": "An Integration Test ",
    #         "project": EVENT_NAME,
    #         "include_zipfile": True,
    #         "provider_tasks": provider_tasks,
    #         "selection": self.selection,
    #         "tags": [],
    #     }
    #     self.assertTrue(self.run_job(job_data, run_timeout=1800))  # This needs more time to complete
    #
    def test_all(self):
        """
        This test ensures that if all formats and all providers are selected
        that the test will finish then successfully rerun.
        :return:
        """
        job_data = {
            "name": "Integration Test - Test All Test Fixtures",
            "description": "test",
            "include_zipfile": True,
            "project": EVENT_NAME,
            "selection": self.selection,
            "tags": [],
            "provider_tasks": [
                # {"provider": "eventkit-integration-test-wms", "formats": ["gpkg"]},
                # {"provider": "osm-generic",
                #  "formats": ["shp", "gpkg", "kml", "sqlite"]},
                # {"provider": "osm", "formats": ["gpkg", "sqlite"]},
                # {"provider": "eventkit-integration-test-wmts", "formats": ["gpkg"]},
                # {"provider": "eventkit-integration-test-arc-raster", "formats": ["gpkg"]},
                # Commented out because the service is down.
                # {"provider": "eventkit-integration-test-wfs",
                #  "formats": ["shp", "gpkg", "kml"]},
                {"provider": "eventkit-integration-test-wcs", "formats": ["hfa"]}
                # {"provider": "eventkit-integration-test-arc-fs",
                #  "formats": ["shp", "gpkg", "kml", "sqlite"]}
            ],
        }
        # This is to test creating an initial job.
        run = self.run_job(job_data, keep_job=True, run_timeout=1800)  # This needs more time to complete
        # This is to test rerunning that job.
        self.run_job(job_uid=run["job"]["uid"], run_timeout=1800)  # This needs more time to complete

    def run_job(self, data=None, wait_for_run=True, run_timeout=DEFAULT_TIMEOUT, job_uid=None, keep_job=False):
        try:
            if job_uid:
                run = self.client.rerun_job(job_uid=job_uid)
            else:
                job = self.client.create_job(**data)
                run = self.client.get_runs(params={"job_uid": job["uid"]})[0]
                job_uid = job["uid"]

            if not wait_for_run:
                return run

            run = self.client.wait_for_run(run["uid"], run_timeout=run_timeout)
            timezone.now().strftime("%Y%m%d")

            # Get the filename for the zip, to ensure that it exists.
            for provider_task in run["provider_tasks"]:
                if provider_task["name"] == "run":
                    run_provider_task = provider_task

            for task in run_provider_task["tasks"]:
                if "zip" in task["name"].lower():
                    zip_result = task["result"]

            assert ".zip" in zip_result["filename"]

            self.assertTrue(run["status"] == "COMPLETED")
            # TODO: Debug download and check files in ci pipeline.
            # for provider_task in run["provider_tasks"]:
            #     check_zoom = True if provider_task.get("provider", {}).get("data_type") == "raster" else False
            #     for task in provider_task["tasks"]:
            #         if "geopackage" in task["name"].lower() or "gpkg" in task["name"].lower():
            #             self.check_geopackage(task["result"]["uid"], check_zoom=check_zoom)
        finally:
            if job_uid and not (keep_job or not wait_for_run):
                self.client.delete_job(job_uid=job_uid)
        return run

    def check_geopackage(self, result_uid, check_zoom=False):
        file_path = os.path.join(self.download_dir, f"{result_uid}.gpkg")
        geopackage_file = self.client.download_file(result_uid, file_path)
        self.assertTrue(os.path.isfile(geopackage_file))
        self.assertTrue(check_content_exists(geopackage_file))
        if check_zoom:
            self.assertTrue(check_zoom_levels(geopackage_file))
        os.remove(geopackage_file)

    def get_all_displayed_provider_slugs(self):
        provider_slugs = []
        for provider in self.client.get_providers():
            if provider["display"]:
                provider_slugs.append(provider["slug"])
        return provider_slugs


def get_providers_list():
    return [
        {
            "created_at": "2016-10-06T17:44:54.837Z",
            "updated_at": "2016-10-06T17:44:54.837Z",
            "name": "eventkit-integration-test-wms",
            "slug": "eventkit-integration-test-wms",
            "url": "https://basemap.nationalmap.gov:443/arcgis/services/USGSImageryOnly/MapServer/WmsServer",
            "layer": "default",
            "export_provider_type": DataProviderType.objects.using("default").get(type_name="wms"),
            "level_from": 10,
            "level_to": 10,
            "max_selection": "2000.000",
            "config": {
                "layers": [{"name": "default", "title": "imagery", "sources": ["default"]}],
                "sources": {
                    "default": {
                        "type": "wms",
                        "grid": "default",
                        "req": {
                            "url": "https://basemap.nationalmap.gov/arcgis/"
                            "services/USGSImageryOnly/MapServer/WMSServer",
                            "layers": 0,
                        },
                    }
                },
                "grids": {
                    "default": {
                        "srs": "EPSG:4326",
                        "tile_size": [256, 256],
                        "origin": "nw",
                        "res": [
                            0.7031249999999999,
                            0.35156249999999994,
                            0.17578124999999997,
                            0.08789062499999999,
                            0.04394531249999999,
                            0.021972656249999997,
                            0.010986328124999998,
                            0.005493164062499999,
                            0.0027465820312499996,
                            0.0013732910156249998,
                            0.0006866455078124999,
                            0.00034332275390624995,
                            0.00017166137695312497,
                            8.583068847656249e-05,
                            4.291534423828124e-05,
                            2.145767211914062e-05,
                            1.072883605957031e-05,
                            5.364418029785155e-06,
                            2.6822090148925777e-06,
                            1.3411045074462889e-06,
                            6.705522537231444e-07,
                        ],
                    }
                },
            },
        },
        {
            "created_at": "2016-10-06T17:45:46.213Z",
            "updated_at": "2016-10-06T17:45:46.213Z",
            "name": "eventkit-integration-test-wmts",
            "slug": "eventkit-integration-test-wmts",
            "url": "https://basemap.nationalmap.gov/arcgis/"
            "rest/services/USGSImageryOnly/MapServer/WMTS/"
            "tile/1.0.0/USGSImageryOnly/default/default028mm/%(z)s/%(y)s/%(x)s",
            "layer": "default",
            "export_provider_type": DataProviderType.objects.using("default").get(type_name="wmts"),
            "level_from": 10,
            "level_to": 10,
            "config": {
                "layers": [{"name": "default", "title": "imagery", "sources": ["default"]}],
                "sources": {
                    "default": {
                        "type": "tile",
                        "url": "https://basemap.nationalmap.gov/arcgis/"
                        "rest/services/USGSImageryOnly/MapServer/WMTS/"
                        "tile/1.0.0/USGSImageryOnly/default/default028mm/%(z)s/%(y)s/%(x)s",
                        "grid": "default",
                    }
                },
                "grids": {
                    "default": {
                        "srs": "EPSG:4326",
                        "tile_size": [256, 256],
                        "origin": "nw",
                        "res": [
                            0.7031249999999999,
                            0.35156249999999994,
                            0.17578124999999997,
                            0.08789062499999999,
                            0.04394531249999999,
                            0.021972656249999997,
                            0.010986328124999998,
                            0.005493164062499999,
                            0.0027465820312499996,
                            0.0013732910156249998,
                            0.0006866455078124999,
                            0.00034332275390624995,
                            0.00017166137695312497,
                            8.583068847656249e-05,
                            4.291534423828124e-05,
                            2.145767211914062e-05,
                            1.072883605957031e-05,
                            5.364418029785155e-06,
                            2.6822090148925777e-06,
                            1.3411045074462889e-06,
                            6.705522537231444e-07,
                        ],
                    }
                },
            },
        },
        {
            "created_at": "2016-10-06T19:17:28.770Z",
            "updated_at": "2016-10-06T19:17:28.770Z",
            "name": "eventkit-integration-test-arc-raster",
            "slug": "eventkit-integration-test-arc-raster",
            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
            "layer": "default",
            "export_provider_type": DataProviderType.objects.using("default").get(type_name="arcgis-raster"),
            "level_from": 10,
            "level_to": 10,
            "config": {
                "layers": [{"name": "default", "title": "default", "sources": ["default"]}],
                "sources": {
                    "default": {
                        "type": "arcgis",
                        "grid": "default",
                        "req": {
                            "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
                            "layers": {"show": 0},
                        },
                    }
                },
                "grids": {
                    "default": {
                        "srs": "EPSG:4326",
                        "tile_size": [256, 256],
                        "origin": "nw",
                        "res": [
                            0.7031249999999999,
                            0.35156249999999994,
                            0.17578124999999997,
                            0.08789062499999999,
                            0.04394531249999999,
                            0.021972656249999997,
                            0.010986328124999998,
                            0.005493164062499999,
                            0.0027465820312499996,
                            0.0013732910156249998,
                            0.0006866455078124999,
                            0.00034332275390624995,
                            0.00017166137695312497,
                            8.583068847656249e-05,
                            4.291534423828124e-05,
                            2.145767211914062e-05,
                            1.072883605957031e-05,
                            5.364418029785155e-06,
                            2.6822090148925777e-06,
                            1.3411045074462889e-06,
                            6.705522537231444e-07,
                        ],
                    },
                    "webmercator": {"srs": "EPSG:3857", "tile_size": [256, 256], "origin": "nw"},
                },
            },
        },
        {
            "created_at": "2016-10-13T17:23:26.890Z",
            "updated_at": "2016-10-13T17:23:26.890Z",
            "name": "eventkit-integration-test-wfs",
            "slug": "eventkit-integration-test-wfs",
            "url": "https://cartowfs.nationalmap.gov/arcgis/"
            "services/structures/MapServer/WFSServer"
            "?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature"
            "&TYPENAME=structures:USGS_TNM_Structures&SRSNAME=EPSG:4326",
            "layer": "structures:USGS_TNM_Structures",
            "export_provider_type": DataProviderType.objects.using("default").get(type_name="wfs"),
            "level_from": 0,
            "level_to": 8,
        },
        {
            "created_at": "2016-10-13T17:23:26.890Z",
            "updated_at": "2016-10-13T17:23:26.890Z",
            "name": "eventkit-integration-test-wcs",
            "slug": "eventkit-integration-test-wcs",
            "url": "https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WCSServer",
            "layer": "DEP3Elevation",
            "export_provider_type": DataProviderType.objects.using("default").get(type_name="wcs"),
            "level_from": 10,
            "level_to": 10,
            "config": {
                "service": {"scale": "15", "coverages": "DEP3Elevation"},
                "params": {
                    "TRANSPARENT": True,
                    "FORMAT": "geotiff",
                    "VERSION": "1.0.0",
                    "CRS": "EPSG:4326",
                    "REQUEST": "GetCoverage",
                },
            },
        },
        #     , {
        #     "created_at": "2016-10-21T14:30:27.066Z",
        #     "updated_at": "2016-10-21T14:30:27.066Z",
        #     "name": "eventkit-integration-test-arc-fs",
        #     "slug": "eventkit-integration-test-arc-fs",
        #     "url": "https://cartowfs.nationalmap.gov/arcgis/services/structures/MapServer",
        #     "layer": "2",
        #     "export_provider_type": DataProviderType.objects.using('default').get(type_name='arcgis-feature'),
        #     "level_from": 0,
        #     "level_to": 2,
        #     "config": {}}
        # }
    ]


@transaction.atomic
def load_providers():
    export_providers = get_providers_list()
    updated_providers = []
    updated_fields = []
    for provider_data in export_providers:
        provider, created = DataProvider.objects.get_or_create(slug=provider_data["slug"], defaults=provider_data)
        if not created:
            for field, value in provider_data.items():
                setattr(provider, field, value)
            updated_providers.append(provider)
            updated_fields.extend(list(provider_data.keys()))
    if updated_providers:
        # Bulk update faster and won't trigger post save things which we don't (?) care about.
        DataProvider.objects.bulk_update(updated_providers, list(set(updated_fields)))


def hide_providers():
    """Ensure that test providers are hidden."""
    export_providers = get_providers_list()
    for export_provider in export_providers:
        provider = DataProvider.objects.using("default").filter(slug=export_provider.get("slug")).first()
        if provider:
            provider.hidden = True
            provider.display = False
