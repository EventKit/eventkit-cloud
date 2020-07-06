# -*- coding: utf-8 -*-
import json
import logging
import os
import shutil
from datetime import timedelta, datetime
from time import sleep

import requests
from django.conf import settings
from django.urls import reverse
from django.test import TestCase, TransactionTestCase
from django.utils import timezone

from eventkit_cloud.jobs.models import DataProvider, DataProviderType, Job
from eventkit_cloud.tasks.enumerations import TaskStates
from eventkit_cloud.tasks.models import DataProviderTaskRecord
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
        username = 'admin'
        password = '@dm1n'
        self.base_url = os.getenv('BASE_URL', 'http://{0}'.format(getattr(settings, "SITE_NAME", "cloud.eventkit.test")))
        self.login_url = self.base_url + '/api/login/'
        self.create_export_url = self.base_url + '/status/create'
        self.jobs_url = self.base_url + reverse('api:jobs-list')
        self.runs_url = self.base_url + reverse('api:runs-list')
        self.download_dir = os.path.join(os.getenv('EXPORT_STAGING_ROOT', '.'), "test")
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir, mode=0o660)
        self.client = requests.session()
        response = self.client.get(self.login_url)
        if not (response.status_code == requests.codes.ok):
            raise Exception("FAILURE: The target server returned: {0}".format(str(response.status_code)))
        self.csrftoken = self.client.cookies['csrftoken']

        login_data = dict(username=username, password=password, csrfmiddlewaretoken=self.csrftoken, next='/exports', submit='Log in')
        self.client.post(self.login_url, data=login_data, headers=dict(Referer=self.login_url),
                         auth=(username, password))
        self.client.get(self.base_url)
        self.client.get(self.create_export_url)
        self.csrftoken = self.client.cookies['csrftoken']
        self.selection = {"type":"FeatureCollection",
                          "features":[
                              {"type":"Feature",
                               "bbox":[-71.04186,42.34308,-71.0281,42.35088],
                               "geometry":
                                   {"type":"Polygon","coordinates":
                                       [[[-71.04185643996556,42.34307891013324],
                                         [-71.02810402354902,42.34307891013324],
                                         [-71.02810402354902,42.350881699101784],
                                         [-71.04185643996556,42.350881699101784],
                                         [-71.04185643996556,42.34307891013324]]]}}]}

    def tearDown(self):
        if os.path.exists(self.download_dir):
            shutil.rmtree(self.download_dir)

    def test_cancel_job(self):
        # update provider to ensure it runs long enough to cancel...
        export_provider = DataProvider.objects.get(slug="eventkit-integration-test-wms")
        original_level_to = export_provider.level_to
        export_provider.level_to = 19
        export_provider.save()

        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "eventkit-integration-test-wms",
                    "description": "Test Description", "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wms", "formats": ["gpkg"]}]}

        job_json = self.run_job(job_data, wait_for_run=False)

        run_json = self.wait_for_task_pickup(job_uid=job_json.get('uid'))

        export_provider_task = DataProviderTaskRecord.objects.get(uid=run_json.get('provider_tasks')[0].get('uid'))

        self.client.get(self.create_export_url)
        self.csrftoken = self.client.cookies['csrftoken']

        provider_url = self.base_url + reverse('api:provider_tasks-list') + '/{0}'.format(export_provider_task.uid)
        response = self.client.patch(provider_url,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'referer': self.create_export_url})
        self.assertEqual(200, response.status_code)
        self.assertEqual({'success': True}, response.json())
        self.orm_job = Job.objects.get(uid=job_json.get('uid'))
        self.orm_run = self.orm_job.runs.last()

        pt = DataProviderTaskRecord.objects.get(uid=export_provider_task.uid)

        self.assertEqual(pt.status, TaskStates.CANCELED.value)

        self.wait_for_run(self.orm_job.uid)
        self.orm_run = self.orm_job.runs.last()
        self.orm_run.refresh_from_db()
        self.assertIn(self.orm_run.status, [TaskStates.CANCELED.value, TaskStates.INCOMPLETE.value])

        # update provider to original setting.
        export_provider = DataProvider.objects.get(slug="eventkit-integration-test-wms")
        export_provider.level_to = original_level_to
        export_provider.save()

        delete_response = self.client.delete(self.jobs_url + '/' + job_json.get('uid'),
                                             headers={'X-CSRFToken': self.csrftoken, 'Referer': self.create_export_url})
        self.assertTrue(delete_response)

    def test_osm_geopackage(self):
        """
        This test is to ensure that an OSM job will export a GeoPackage.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicGPKG",
                    "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_sqlite(self):
        """
        This test is to ensure that an OSM job will export a sqlite file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicSQLITE",
                    "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_osm_shp(self):
        """
        This test is to ensure that an OSM job will export a shp.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSHP", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_kml(self):
        """
        This test is to ensure that an OSM job will export a kml file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestKML", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))


    def test_osm_kml(self):
        """
        This test is to ensure that an OSM job will export a kml file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicKML", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "osm", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))


    def test_wms_gpkg(self):
        """
        This test is to ensure that an WMS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WMS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wms", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wmts_gpkg(self):
        """
        This test is to ensure that an WMTS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WMTS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wmts", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_arcgis_gpkg(self):
        """
        This test is to ensure that an ArcGIS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-Arc-Raster",
                    "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-arc-raster", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_gpkg(self):
        """
        This test is to ensure that an WFS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WFS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_shp(self):
        """
        This test is to ensure that an WFS job will export a shp file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSHP-WFS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_wfs_sqlite(self):
        """
        This test is to ensure that an WFS job will export a sqlite file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSQLITE-WFS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_kml(self):
        """
        This test is to ensure that an WFS job will export a kml file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestKML-WFS", "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wfs", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wcs_gpkg(self):
        """
        This test is to ensure that a WCS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WCS",
                    "description": "Test Description",
                    "event": "TestProject", "selection": self.selection, "tags": [],
                    "provider_tasks": [{"provider": "eventkit-integration-test-wcs", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    # def test_arcgis_feature_service(self):
    #     """
    #     This test is to ensure that an ArcGIS Feature Service job will export a gpkg file.
    #     :returns:
    #     """
    #     job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-Arcfs", "description": "Test Description",
    #                 "event": "TestProject", "selection": self.selection, "tags": [],
    #                 "provider_tasks": [{"provider": "eventkit-integration-test-arc-fs", "formats": ["gpkg"]}]}
    #     self.assertTrue(self.run_job(job_data))

    def test_all(self):
        """
        This test ensures that if all formats and all providers are selected that the test will finish.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "test", "description": "test",
                    "event": "eventkit-integration-test", "selection": self.selection,
                    "tags": [], "provider_tasks": [{"provider": "eventkit-integration-test-wms",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   # {"provider": "osm-generic",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   {"provider": "osm",
                                                    "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   {"provider": "eventkit-integration-test-wmts",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   {"provider": "eventkit-integration-test-arc-raster",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   {"provider": "eventkit-integration-test-wfs",
                                                    "formats": ["shp", "gpkg", "kml"]},
                                                   {"provider": "eventkit-integration-test-wcs",
                                                    "formats": ["gpkg", "gtiff"]}
                                                   # {"provider": "eventkit-integration-test-arc-fs",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]}
                                                   ]}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_loaded(self):
        """

        :return: This test will run all currently loaded providers.
        """
        provider_tasks = []
        for data_provider in get_all_displayed_providers():
            provider_tasks += [{"provider": data_provider,
                            "formats": ["gpkg"]}]
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "Integration Tests - Pavillion",
                    "description": "An Integration Test ", "event": "Integration Tests",
                    "include_zipfile": True,
                    "provider_tasks": provider_tasks,
                    "selection": self.selection,
                    "tags": []}
        self.assertTrue(self.run_job(job_data, run_timeout=DEFAULT_TIMEOUT))

    def test_rerun_all(self):
        """
        This test ensures that if all formats and all providers are selected
        that the test will finish then successfully rerun.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "test", "description": "test",
                    "event": "eventkit-integration-test", "selection": self.selection,
                    "tags": [], "provider_tasks": [{"provider": "eventkit-integration-test-wms",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   # {"provider": "osm-generic",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   {"provider": "osm",
                                                    "formats": ["shp", "gpkg", "kml", "sqlite"]},
                                                   {"provider": "eventkit-integration-test-wmts",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   {"provider": "eventkit-integration-test-arc-raster",
                                                    "formats": ["gpkg", "gtiff"]},
                                                   {"provider": "eventkit-integration-test-wfs",
                                                    "formats": ["shp", "gpkg", "kml"]},
                                                   {"provider": "eventkit-integration-test-wcs",
                                                    "formats": ["gpkg", "gtiff"]}
                                                   # {"provider": "eventkit-integration-test-arc-fs",
                                                   #  "formats": ["shp", "gpkg", "kml", "sqlite"]}
                                                   ]}
        response = self.client.post(self.jobs_url,
                                    json=job_data,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        print(response.content)
        self.assertEqual(response.status_code, 202)
        job = response.json()

        run = self.wait_for_run(job.get('uid'), run_timeout=DEFAULT_TIMEOUT)
        self.assertTrue(run.get('status') == "COMPLETED")
        for provider_task in run.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(run, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            os.remove(geopackage_file)

        rerun_response = self.client.get('{0}/{1}/run'.format(self.jobs_url, job.get('uid')),
                                         headers={'X-CSRFToken': self.csrftoken,
                                                  'Referer': self.create_export_url})

        self.assertEqual(rerun_response.status_code, 202)
        rerun = self.wait_for_run(job.get('uid'), run_timeout=DEFAULT_TIMEOUT)
        self.assertTrue(rerun.get('status') == "COMPLETED")
        for provider_task in rerun.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(rerun, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            os.remove(geopackage_file)

        delete_response = self.client.delete(self.jobs_url + '/' + job.get('uid'),
                                             headers={'X-CSRFToken': self.csrftoken, 'Referer': self.create_export_url})
        self.assertTrue(delete_response)

    def run_job(self, data, wait_for_run=True, run_timeout=DEFAULT_TIMEOUT):
        # include zipfile
        data['include_zipfile'] = True

        response = self.client.post(self.jobs_url,
                                    json=data,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        if response.status_code != 202:
            logger.error(response.content)
        self.assertEqual(response.status_code, 202)
        job = response.json()

        if not wait_for_run:
            return job

        run = self.wait_for_run(job.get('uid'), run_timeout=run_timeout)
        self.orm_job = orm_job = Job.objects.get(uid=job.get('uid'))
        self.orm_run = orm_job.runs.last()
        timezone.now().strftime('%Y%m%d')

        # Get the filename for the zip, to ensure that it exists.
        for provider_task in run['provider_tasks']:
            if provider_task['name'] == 'run':
                run_provider_task = provider_task

        for task in run_provider_task['tasks']:
            if 'zip' in task['name'].lower():
                zip_result = task['result']

        assert '.zip' in zip_result['filename']

        self.assertTrue(run.get('status') == "COMPLETED")
        for provider_task in run.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(run, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            self.assertTrue(check_zoom_levels(geopackage_file))
            os.remove(geopackage_file)
        delete_response = self.client.delete(self.jobs_url + '/' + job.get('uid'),
                                             headers={'X-CSRFToken': self.csrftoken, 'Referer': self.create_export_url})
        self.assertTrue(delete_response)
        for provider_task in run.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(run, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertNotTrue(os.path.isfile(geopackage_file))
            if os.path.isfile(geopackage_file):
                os.remove(geopackage_file)
        return True

    def wait_for_task_pickup(self, job_uid):
        picked_up = False
        response = None
        while not picked_up:
            sleep(1)
            response = self.client.get(
                self.runs_url,
                params={"job_uid": job_uid},
                headers={'X-CSRFToken': self.csrftoken}).json()
            if response[0].get('provider_tasks'):
                picked_up = True
        return response[0]

    def wait_for_run(self, job_uid, run_timeout=DEFAULT_TIMEOUT):
        finished = False
        response = None
        first_check = datetime.now()
        while not finished:
            sleep(1)
            response = self.client.get(
                self.runs_url,
                params={"job_uid": job_uid},
                headers={'X-CSRFToken': self.csrftoken
                         }).json()
            status = response[0].get('status')
            if status in [TaskStates.COMPLETED.value, TaskStates.INCOMPLETE.value, TaskStates.CANCELED.value]:
                finished = True
            last_check = datetime.now()
            for run_details in response:
                for provider_task in run_details['provider_tasks']:
                    for task in provider_task['tasks']:
                        if task['status'] == 'FAILED':
                            errors_as_list = [
                                '{}: {}'.format(k, v) for error_dict in task['errors'] for k, v in list(error_dict.items())
                            ]
                            errors_text = ', '.join(errors_as_list)
                            msg = 'Task "{}" failed: {}'.format(task['name'], errors_text)
                            raise Exception(msg)
            if last_check - first_check > timedelta(seconds=run_timeout):
                raise Exception('Run timeout ({}s) exceeded'.format(run_timeout))

        return response[0]

    @staticmethod
    def get_gpkg_url(run, provider_task_name):
        for provider_task in run.get("provider_tasks"):
            if provider_task.get('name') == provider_task_name:
                for task in provider_task.get('tasks'):
                    if task.get('name') == "Geopackage":
                        return task.get('result').get("url")
        return None


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


def get_all_displayed_providers():
    return [provider.slug for provider in DataProvider.objects.filter(display=True)]
