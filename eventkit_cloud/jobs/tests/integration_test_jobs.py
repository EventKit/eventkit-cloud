# -*- coding: utf-8 -*-
import logging
import os
import shutil
from time import sleep

from django.conf import settings
from django.urls import reverse
from django.test import TestCase
from django.utils import timezone
from typing import Union

from eventkit_cloud.jobs.models import DataProvider, DataProviderType, Job
from eventkit_cloud.tasks.enumerations import TaskStates
from eventkit_cloud.utils.client import EventKitClient
from eventkit_cloud.utils.geopackage import check_content_exists, check_zoom_levels

logger = logging.getLogger(__name__)

# Default length of time to let a single test case run.
DEFAULT_TIMEOUT = 300


# TODO: Add arcgis-feature-service back when that is working correctly.
class TestJob(TestCase):
    """
    Test cases for Job model
    """

    def setUp(self):
        certificate = os.getenv('EVENTKIT_CERT')
        if not certificate:
            user = os.getenv('EVENTKIT_USER', 'admin')
            password = os.getenv('EVENTKIT_PASS', '@dm1n')
        verify = getattr(settings, 'SSL_VERIFICATION', True)
        self.base_url = os.getenv('BASE_URL',
                                  'http://{0}'.format(getattr(settings, "SITE_NAME", "cloud.eventkit.test")))
        self.login_url = self.base_url + '/api/login/'
        self.create_export_url = self.base_url + '/status/create'
        self.jobs_url = self.base_url + reverse('api:jobs-list')
        self.runs_url = self.base_url + reverse('api:runs-list')
        self.download_dir = os.path.join(os.getenv('EXPORT_STAGING_ROOT', '.'), "test")
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir, mode=0o660)
        self.client = self.get_client(self.base_url, user=user, password=password, certificate=certificate,
                                      verify=verify)
        self.selection = {"type": "FeatureCollection",
                          "features": [
                              {"type": "Feature",
                               "bbox": [-71.04186, 42.34308, -71.0281, 42.35088],
                               "geometry":
                                   {"type": "Polygon", "coordinates":
                                       [[[-71.04185643996556, 42.34307891013324],
                                         [-71.02810402354902, 42.34307891013324],
                                         [-71.02810402354902, 42.380881699101784],
                                         [-71.04185643996556, 42.380881699101784],
                                         [-71.04185643996556, 42.34307891013324]]]}}]}

    def tearDown(self):
        if os.path.exists(self.download_dir):
            shutil.rmtree(self.download_dir)

    def get_client(self, url: str, user: str = None, password: str = None, certificate: str = None,
                   verify: Union[str, bool] = True) -> EventKitClient:
        tries = 3
        client = None
        while tries:
            try:
                client = EventKitClient(url.rstrip('/'), username=user, password=password, certificate=certificate,
                                        verify=verify)
                break
            except Exception as e:
                tries -= 1
                logger.info("Failed to login.")
                logger.info(e)
                logger.info("{} attempts remaining.".format(tries))
                sleep(1)
        if not client:
            raise Exception(
                "Could not login to the url: {} using username:{} or certificate:{}".format(args.url, user,
                                                                                            certificate))
        return client

    # TODO: add test_cancel_mapproxy_job
    def test_cancel_osm_run(self):
        test_service_slug = "osm"

        # update provider to ensure it runs long enough to cancel...
        # The code here is to temporarily increase the zoom level it is commented out to be implemented in
        # test_cancel_mapproxy_job when that is added.
        increased_zoom_level = 19
        # export_provider = DataProvider.objects.get(slug=test_service_slug)
        # original_level_to = export_provider.level_to
        # increased_zoom_level = 19
        # export_provider.level_to = increased_zoom_level
        # export_provider.save()

        job_data = {"name": "eventkit-integration-test-wmts",
                    "description": "Test Description", "project": "TestProject", "selection": self.selection,
                    "tags": [], "provider_tasks": [{"provider": test_service_slug,
                                                    "formats": ["gpkg"], "max_zoom": increased_zoom_level}]}

        run = self.run_job(job_data, wait_for_run=False)

        run = self.client.wait_for_task_pickup(job_uid=run['job']['uid'])

        export_provider_task = run['provider_tasks'][0]
        self.client.cancel_provider(export_provider_task['uid'])

        export_provider_task = self.client.get_provider_task(uid=export_provider_task['uid'])
        self.assertEqual(export_provider_task['status'], TaskStates.CANCELED.value)

        run = self.client.wait_for_run(run['uid'])
        self.assertIn(run['status'], [TaskStates.CANCELED.value, TaskStates.INCOMPLETE.value])

        # The code here is to temporarily increase the zoom level it is commented out to be implemented in
        # test_cancel_mapproxy_job when that is added.
        # update provider to original setting.
        # export_provider = DataProvider.objects.get(slug=test_service_slug)
        # export_provider.level_to = original_level_to
        # export_provider.save()


    def test_osm_geopackage(self):
        """
        This test is to ensure that an OSM job will export a GeoPackage.
        :returns:
        """
        job_data = {"name": "TestThematicGPKG", "include_zipfile": True,
                    "description": "Test Description",
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_sqlite(self):
        """
        This test is to ensure that an OSM job will export a sqlite file.
        :returns:
        """
        job_data = {"name": "TestThematicSQLITE", "include_zipfile": True,
                    "description": "Test Description",
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_osm_shp(self):
        """
        This test is to ensure that an OSM job will export a shp.
        :returns:
        """
        job_data = {"name": "TestSHP", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_kml(self):
        """
        This test is to ensure that an OSM job will export a kml file.
        :returns:
        """
        job_data = {"name": "TestKML", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_kml(self):
        """
        This test is to ensure that an OSM job will export a kml file.
        :returns:
        """
        job_data = {"name": "TestThematicKML", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wms_gpkg(self):
        """
        This test is to ensure that an WMS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-WMS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wms", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wmts_gpkg(self):
        """
        This test is to ensure that an WMTS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-WMTS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wmts", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wmts_gtiff(self):
        """
        This test is to ensure that an WMTS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-WMTS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wmts", "formats": ["gtiff"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_arcgis_gpkg(self):
        """
        This test is to ensure that an ArcGIS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-Arc-Raster",
                    "description": "Test Description",
                    "project": "TestProject", "selection": self.selection, "tags": [], "include_zipfile": True,
                    "provider_tasks": [{"provider": "eventkit-integration-test-arc-raster", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_gpkg(self):
        """
        This test is to ensure that an WFS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-WFS", "description": "Test Description",
                    "project": "TestProject", "selection": self.selection, "tags": [], "include_zipfile": True,
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_shp(self):
        """
        This test is to ensure that an WFS job will export a shp file.
        :returns:
        """
        job_data = {"name": "TestSHP-WFS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_wfs_sqlite(self):
        """
        This test is to ensure that an WFS job will export a sqlite file.
        :returns:
        """
        job_data = {"name": "TestSQLITE-WFS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_kml(self):
        """
        This test is to ensure that an WFS job will export a kml file.
        :returns:
        """
        job_data = {"name": "TestKML-WFS", "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wcs_gpkg(self):
        """
        This test is to ensure that a WCS job will export a gpkg file.
        :returns:
        """
        job_data = {"name": "TestGPKG-WCS",
                    "description": "Test Description", "include_zipfile": True,
                    "project": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wcs", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    # def test_arcgis_feature_service(self):
    #     """
    #     This test is to ensure that an ArcGIS Feature Service job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {"name": "TestGPKG-Arcfs", "description": "Test Description",
    #                 "project": "TestProject", "selection": self.selection, "tags": [],
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-arc-fs", "formats": ["gpkg"]}]}
    #     self.assertTrue(self.run_job(job_data))

    def test_loaded(self):
        """

        :return: This test will run all currently loaded providers.
        """
        provider_tasks = []
        for data_provider in self.get_all_displayed_provider_slugs():
            provider_tasks += [{"provider": data_provider,
                                "formats": ["gpkg"]}]
        job_data = {"name": "Integration Tests - Test Loaded",
                    "description": "An Integration Test ", "project": "Integration Tests",
                    "include_zipfile": True,
                    "provider_tasks": provider_tasks,
                    "selection": self.selection,
                    "tags": []}
        self.assertTrue(self.run_job(job_data, run_timeout=600))  # This needs more time to complete

    def test_all(self):
        """
        This test ensures that if all formats and all providers are selected
        that the test will finish then successfully rerun.
        :return:
        """
        job_data = {"name": "Integration Test - Test All Test Fixtures", "description": "test", "include_zipfile": True,
                    "project": "eventkit-integration-test", "selection": self.selection,
                    "tags": [], "provider_tasks": [
                                                   # {"provider": "eventkit-integration-test-wms",
                                                   #  "formats": ["gpkg", "gtiff"]},
                                                   # # {"provider": "osm-generic",
                                                   # #  "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   # {"provider": "osm",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   # {"provider": "eventkit-integration-test-wmts",
                                                   #  "formats": ["gpkg", "gtiff"]},
                                                   # {"provider": "eventkit-integration-test-arc-raster",
                                                   #  "formats": ["gpkg", "gtiff"]},
                                                   # {"provider": "eventkit-integration-test-wfs",
                                                   #  "formats": ["shp", "gpkg", "kml"]},
                                                   {"provider": "eventkit-integration-test-wcs",
                                                    "formats": ["gtiff"]}
                                                   # {"provider": "eventkit-integration-test-arc-fs",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]}
                                                   ]}
        # This is to test creating an initial job.
        run = self.run_job(job_data, keep_job=True, run_timeout=600)  # This needs more time to complete
        # This is to test rerunning that job.
        run = self.run_job(job_uid=run['job']['uid'], run_timeout=600)  # This needs more time to complete

    def run_job(self, data=None, wait_for_run=True, run_timeout=DEFAULT_TIMEOUT, job_uid=None, keep_job=False):

        if job_uid:
            run = self.client.rerun_job(job_uid=job_uid)
        else:
            job = self.client.create_job(**data)
            run = self.client.get_runs(params={'job_uid': job['uid']})[0]
            job_uid = job['uid']

        if not wait_for_run:
            return run

        run = self.client.wait_for_run(run['uid'], run_timeout=run_timeout)
        timezone.now().strftime('%Y%m%d')

        # Get the filename for the zip, to ensure that it exists.
        for provider_task in run['provider_tasks']:
            if provider_task['name'] == 'run':
                run_provider_task = provider_task

        for task in run_provider_task['tasks']:
            if 'zip' in task['name'].lower():
                zip_result = task['result']

        assert '.zip' in zip_result['filename']

        self.assertTrue(run['status'] == "COMPLETED")
        for provider_task in run['provider_tasks']:
            geopackage_url = self.get_gpkg_url(run, provider_task["name"])
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            self.assertTrue(check_zoom_levels(geopackage_file))
            os.remove(geopackage_file)
        for provider_task in run['provider_tasks']:
            geopackage_url = self.get_gpkg_url(run, provider_task["name"])
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertNotTrue(os.path.isfile(geopackage_file))
            if os.path.isfile(geopackage_file):
                os.remove(geopackage_file)
        if not keep_job:
            self.client.delete_job(job_uid=job_uid)
        return run

    @staticmethod
    def get_gpkg_url(run, provider_task_name):
        for provider_task in run.get("provider_tasks"):
            if provider_task.get('name') == provider_task_name:
                for task in provider_task.get('tasks'):
                    if task.get('name') == "Geopackage":
                        return task.get('result').get("url")
        return None

    def get_all_displayed_provider_slugs(self):
        provider_slugs = []
        for provider in self.client.get_providers():
            if provider['display']:
                provider_slugs.append(provider['slug'])
        return provider_slugs


def get_providers_list():
    return [{
        "created_at": "2016-10-06T17:44:54.837Z",
        "updated_at": "2016-10-06T17:44:54.837Z",
        "name": "eventkit-integration-test-wms",
        "slug": "eventkit-integration-test-wms",
        "url": "https://basemap.nationalmap.gov:443/arcgis/services/USGSImageryOnly/MapServer/WmsServer",
        "layer": "default",
        "export_provider_type": DataProviderType.objects.using('default').get(type_name='wms'),
        "level_from": 5,
        "level_to": 6,
        "max_selection": "2000.000",
        "config": "layers:\r\n - name: default\r\n   title: imagery\r\n   sources: [default]\r\n\r\n"
                  "sources:\r\n"
                  "  default:\r\n"
                  "    type: wms\r\n"
                  "    grid: default\r\n"
                  "    req:\r\n"
                  "      url: https://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WMSServer\r\n"
                  "      layers: 0\r\n"
                  "grids:\r\n"
                  "  default:\r\n"
                  "    srs: EPSG:4326\r\n"
                  "    tile_size: [256, 256]\r\n"
                  "    origin: nw\r\n"
                  "    res: [0.7031249999999999, 0.35156249999999994, 0.17578124999999997, 0.08789062499999999,\r\n"
                  "      0.04394531249999999, 0.021972656249999997, 0.010986328124999998, 0.005493164062499999,\r\n"
                  "      0.0027465820312499996, 0.0013732910156249998, 0.0006866455078124999, 0.00034332275390624995,\r\n"
                  "      0.00017166137695312497, 8.583068847656249e-05, 4.291534423828124e-05, 2.145767211914062e-05,\r\n"
                  "      1.072883605957031e-05, 5.364418029785155e-06, 2.6822090148925777e-06, 1.3411045074462889e-06,\r\n"
                  "      6.705522537231444e-07]",
    }, {
        "created_at": "2016-10-06T17:45:46.213Z",
        "updated_at": "2016-10-06T17:45:46.213Z",
        "name": "eventkit-integration-test-wmts",
        "slug": "eventkit-integration-test-wmts",
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/WMTS/tile/1.0.0/USGSImageryOnly/default/default028mm/%(z)s/%(y)s/%(x)s",
        "layer": "default",
        "export_provider_type": DataProviderType.objects.using('default').get(type_name='wmts'),
        "level_from": 5,
        "level_to": 6,
        "config": "layers:\r\n - name: default\r\n   title: imagery\r\n   sources: [default]\r\n\r\n"
                  "sources:\r\n"
                  "  default:\r\n"
                  "    type: tile\r\n"
                  "    url: https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/WMTS/tile/1.0.0/USGSImageryOnly/default/default028mm/%(z)s/%(y)s/%(x)s\r\n"
                  "    grid: default\r\n\r\n"
                  "grids:\r\n  default:\r\n    srs: EPSG:4326\r\n    tile_size: [256, 256]\r\n    origin: nw\r\n"
                  "    res: [0.7031249999999999, 0.35156249999999994, 0.17578124999999997, 0.08789062499999999,\r\n"
                  "      0.04394531249999999, 0.021972656249999997, 0.010986328124999998, 0.005493164062499999,\r\n"
                  "      0.0027465820312499996, 0.0013732910156249998, 0.0006866455078124999, 0.00034332275390624995,\r\n"
                  "      0.00017166137695312497, 8.583068847656249e-05, 4.291534423828124e-05, 2.145767211914062e-05,\r\n"
                  "      1.072883605957031e-05, 5.364418029785155e-06, 2.6822090148925777e-06, 1.3411045074462889e-06,\r\n"
                  "      6.705522537231444e-07]"
    }, {
        "created_at": "2016-10-06T19:17:28.770Z",
        "updated_at": "2016-10-06T19:17:28.770Z",
        "name": "eventkit-integration-test-arc-raster",
        "slug": "eventkit-integration-test-arc-raster",
        "url": "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer",
        "layer": "default",
        "export_provider_type": DataProviderType.objects.using('default').get(type_name='arcgis-raster'),
        "level_from": 5,
        "level_to": 6,
        "config": "layers:\r\n  - name: default\r\n    title: default\r\n    sources: [default]\r\n\r\n"
                  "sources:\r\n"
                  "  default:\r\n"
                  "    type: arcgis\r\n"
                  "    grid: default\r\n"
                  "    req:\r\n"
                  "      url: https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer\r\n"
                  "      layers: \r\n"
                  "        show: 0\r\n\r\n"

                  "grids:\r\n  default:\r\n    srs: EPSG:4326\r\n    tile_size: [256, 256]\r\n    origin: nw\r\n"
                  "    res: [0.7031249999999999, 0.35156249999999994, 0.17578124999999997, 0.08789062499999999,\r\n"
                  "      0.04394531249999999, 0.021972656249999997, 0.010986328124999998, 0.005493164062499999,\r\n"
                  "      0.0027465820312499996, 0.0013732910156249998, 0.0006866455078124999, 0.00034332275390624995,\r\n"
                  "      0.00017166137695312497, 8.583068847656249e-05, 4.291534423828124e-05, 2.145767211914062e-05,\r\n"
                  "      1.072883605957031e-05, 5.364418029785155e-06, 2.6822090148925777e-06, 1.3411045074462889e-06,\r\n"
                  "      6.705522537231444e-07]\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"

    }, {
        "created_at": "2016-10-13T17:23:26.890Z",
        "updated_at": "2016-10-13T17:23:26.890Z",
        "name": "eventkit-integration-test-wfs",
        "slug": "eventkit-integration-test-wfs",
        "url": "https://cartowfs.nationalmap.gov/arcgis/services/structures/MapServer/WFSServer?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=structures:USGS_TNM_Structures&SRSNAME=EPSG:4326",
        "layer": "structures:USGS_TNM_Structures",
        "export_provider_type": DataProviderType.objects.using('default').get(type_name='wfs'),
        "level_from": 0,
        "level_to": 8,
        "config": ""

    }, {
        "created_at": "2016-10-13T17:23:26.890Z",
        "updated_at": "2016-10-13T17:23:26.890Z",
        "name": "eventkit-integration-test-wcs",
        "slug": "eventkit-integration-test-wcs",
        "url": "https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WCSServer",
        "layer": "DEP3Elevation",
        "export_provider_type": DataProviderType.objects.using('default').get(type_name='wcs'),
        "level_from": 0,
        "level_to": 2,
        "config": "service:\r\n  scale: \"15\"\r\n  coverages: \"DEP3Elevation\"\r\nparams:\r\n  TRANSPARENT: true\r\n  FORMAT: geotiff\r\n  VERSION: '1.0.0'\r\n  CRS: 'EPSG:4326'\r\n  REQUEST: 'GetCoverage'",
    }
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
        #     "config": ""
        # }
    ]


def load_providers():
    export_providers = get_providers_list()
    providers = [DataProvider(**export_provider) for export_provider in export_providers]
    DataProvider.objects.bulk_create(providers)


def delete_providers():
    export_providers = get_providers_list()
    for export_provider in export_providers:
        provider = DataProvider.objects.using('default').filter(
            slug=export_provider.get('slug')
        ).first()
        if provider:
            provider.delete(using='default')
