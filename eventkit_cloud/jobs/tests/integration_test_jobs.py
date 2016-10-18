# -*- coding: utf-8 -*-
import logging
import requests
from django.test import TestCase
from time import sleep
import os
import shutil
import sqlite3
from ..models import ExportProvider, ExportProviderType

logger = logging.getLogger(__name__)


class TestJob(TestCase):
    """
    Test cases for Job model
    """

    def setUp(self):
        username = 'admin'
        password = '@dm1n'
        self.base_url = os.getenv('BASE_URL', 'http://cloud.eventkit.dev')
        self.login_url = self.base_url + '/en/login'
        self.create_export_url = self.base_url + '/en/exports/create'
        self.jobs_url = self.base_url + '/api/jobs'
        self.runs_url = self.base_url + '/api/runs'
        self.rerun_url = self.base_url + '/api/rerun'
        self.download_dir = os.path.join(os.getenv('EXPORT_STAGING_ROOT', '.'), "test")
        if not os.path.exists(self.download_dir):
            os.makedirs(self.download_dir, mode=0660)
        self.client = requests.session()
        self.client.get(self.login_url)
        self.csrftoken = self.client.cookies['csrftoken']

        login_data = dict(username=username, password=password, csrfmiddlewaretoken=self.csrftoken, next='/')
        self.client.post(self.login_url, data=login_data, headers=dict(Referer=self.login_url),
                         auth=(username, password))
        self.client.get(self.base_url)
        self.client.get(self.create_export_url)
        self.csrftoken = self.client.cookies['csrftoken']
        self.bbox = ["-54.607823", "-25.515430", "-54.591687", "-25.504276"]

    def tearDown(self):
        if os.path.exists(self.download_dir):
            shutil.rmtree(self.download_dir)

    def test_osm_geopackage(self):
        """
        This test is to ensure that an OSM file by itself only exporting GeoPackage returns data.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_geopackage_thematic(self):
        """
        This test is to ensure that an OSM job will export a thematic GeoPackage.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicGPKG", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["thematic-gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_sqlite(self):
        """
        This test is to ensure that an OSM will export a sqlite file.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSQLITE", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_sqlite_thematic(self):
        """
        This test is to ensure that an OSM job will export a thematic sqlite file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicSQLITE", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["thematic-sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_shp(self):
        """
        This test is to ensure that an OSM job will export a shp.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSHP", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_shp_thematic(self):
        """
        This test is to ensure that an OSM job will export a thematic shp.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestThematicSHP", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["thematic-shp"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_osm_kml(self):
        """
        This test is to ensure that an OSM job will export a kml file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestKML", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "OpenStreetMap Data", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wms_gpkg(self):
        """
        This test is to ensure that an WMS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WMS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wms-source", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wmts_gpkg(self):
        """
        This test is to ensure that an WMTS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WMTS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wmts-source", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_arcgis_gpkg(self):
        """
        This test is to ensure that an ArcGIS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-ArcGIS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "arcgis-source", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_gpkg(self):
        """
        This test is to ensure that an WFS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestGPKG-WFS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wfs-source", "formats": ["gpkg"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_shp(self):
        """
        This test is to ensure that an WFS job will export a shp file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSHP-WFS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wfs-source", "formats": ["shp"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_sqlite(self):
        """
        This test is to ensure that an WFS job will export a sqlite file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestSQLITE-WFS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wfs-source", "formats": ["sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_wfs_kml(self):
        """
        This test is to ensure that an WFS job will export a gpkg file.
        :returns:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "TestKML-WFS", "description": "Test Description",
                    "event": "TestProject", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3], "tags": [],
                    "provider_tasks": [{"provider": "wfs-source", "formats": ["kml"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_all(self):
        """
        This test ensures that if all formats and all providers are selected that the test will finish.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "test", "description": "test",
                    "event": "test", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3],
                    "tags": [], "provider_tasks": [{"provider": "wms-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "OpenStreetMap Data",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "wmts-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "arcgis-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "wfs-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]}]}
        self.assertTrue(self.run_job(job_data))

    def test_rerun_all(self):
        """
        This test ensures that if all formats and all providers are selected that the test will finish then successfully rerun.
        :return:
        """
        job_data = {"csrfmiddlewaretoken": self.csrftoken, "name": "test", "description": "test",
                    "event": "test", "xmin": self.bbox[0], "ymin": self.bbox[1], "xmax": self.bbox[2], "ymax": self.bbox[3],
                    "tags": [], "provider_tasks": [{"provider": "wms-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "OpenStreetMap Data",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "wmts-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "arcgis-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]},
                                                                        {"provider": "wfs-source",
                                                                         "formats": ["shp", "thematic-shp", "gpkg",
                                                                                     "thematic-gpkg", "kml", "sqlite",
                                                                                     "thematic-sqlite"]}]}
        response = self.client.post(self.jobs_url,
                                    json=job_data,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        self.assertEquals(response.status_code, 202)
        job = response.json()
        run = self.wait_for_run(job.get('uid'))
        self.assertTrue(run.get('status') == "COMPLETED")
        for provider_task in run.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(run, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            os.remove(geopackage_file)

        rerun_response = self.client.get(self.rerun_url,
                                          params={'job_uid':job.get('uid')},
                                          headers={'X-CSRFToken': self.csrftoken,
                                                   'Referer': self.create_export_url})

        self.assertEquals(rerun_response.status_code, 202)
        rerun_job = rerun_response.json()
        rerun = self.wait_for_run(job.get('uid'))
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

    def run_job(self, data):

        response = self.client.post(self.jobs_url,
                                    json=data,
                                    headers={'X-CSRFToken': self.csrftoken,
                                             'Referer': self.create_export_url})
        self.assertEquals(response.status_code, 202)
        job = response.json()
        run = self.wait_for_run(job.get('uid'))
        self.assertTrue(run.get('status') == "COMPLETED")
        for provider_task in run.get('provider_tasks'):
            geopackage_url = self.get_gpkg_url(run, provider_task.get("name"))
            if not geopackage_url:
                continue
            geopackage_file = self.download_file(geopackage_url)
            self.assertTrue(os.path.isfile(geopackage_file))
            self.assertTrue(check_content_exists(geopackage_file))
            os.remove(geopackage_file)
        delete_response = self.client.delete(self.jobs_url + '/' + job.get('uid'),
                                             headers={'X-CSRFToken': self.csrftoken, 'Referer': self.create_export_url})
        self.assertTrue(delete_response)
        return True

    def wait_for_run(self, job_uid):
        finished = False
        response = None
        while not finished:
            sleep(5)
            response = self.client.get(self.runs_url,
                                       params={"job_uid": job_uid},
                                       headers={'X-CSRFToken': self.csrftoken}).json()
            status = response[0].get('status')
            if status == "COMPLETED" or status == "INCOMPLETE":
                finished = True
        return response[0]

    def download_file(self, url, download_dir=None):
        download_dir = download_dir or self.download_dir
        file_location = os.path.join(download_dir, os.path.basename(url))
        r = requests.get(url, stream=True)
        if r.status_code == 200:
            with open(file_location, 'wb') as f:
                for chunk in r:
                    f.write(chunk)
            return file_location
        return None

    def get_gpkg_url(self, run, provider_task_name):
        for provider_task in run.get("provider_tasks"):
            if provider_task.get('name') == provider_task_name:
                for task in provider_task.get('tasks'):
                    if task.get('name') == "Geopackage":
                        return task.get('result').get("url")
        return None


def get_table_count(gpkg, table):
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    if is_alnum(table):
        cur.execute("SELECT COUNT(*) FROM '{0}';".format(table))
        result = cur.fetchone()
        conn.close()
        return result[0]
    conn.close()
    return False


def get_table_names(gpkg):
    conn = sqlite3.connect(gpkg)
    cur = conn.cursor()
    result = cur.execute("SELECT TABLE_NAME FROM gpkg_contents;")
    table_names = [table for (table,) in result]
    conn.close()
    return table_names


def check_content_exists(gpkg):
    """
    :param gpkg: A geopackage file with data.
    :return: True if there is a single raster tile or feature is found.
    """
    for table in get_table_names(gpkg):
        if get_table_count(gpkg, table) > 0:
            return True
    return False


def is_alnum(data):
    """
    Used to ensure that only 'safe' data can be used to query or create data.
    >>> is_alnum("test")
    True
    >>> is_alnum("test_2")
    True
    >>> is_alnum(";")
    False
    >>> is_alnum("test 4")
    False
    @param: String of data to be tested.
    @return: if data is only alphanumeric or '_' chars.
    """
    import re
    if re.match(r'[\w:]+$', data):
        return True
    return False


def get_providers_list():
    return [{
        "model" : "jobs.exportprovider",
        "pk" : 2,
        "fields" : {
            "created_at" : "2016-10-06T17:44:54.837Z",
            "updated_at" : "2016-10-06T17:44:54.837Z",
            "uid" : "8977892f-e057-4723-8fe5-7a9b0080bc66",
            "name" : "wms-source",
            "slug" : "wms-source",
            "url" : "http://basemap.nationalmap.gov/arcgis/services/USGSImageryOnly/MapServer/WmsServer?",
            "layer" : "0",
            "export_provider_type" : ExportProviderType.objects.using('default').get(type_name='wms'),
            "level_from" : 0,
            "level_to" : 2,
            "config" : ""
        }
    }, {
        "model" : "jobs.exportprovider",
        "pk" : 3,
        "fields" : {
            "created_at" : "2016-10-06T17:45:46.213Z",
            "updated_at" : "2016-10-06T17:45:46.213Z",
            "uid" : "5e3d76cb-09aa-42ac-96f3-2663e06ac81a",
            "name" : "wmts-source",
            "slug" : "wmts-source",
            "url" : "http://a.tile.openstreetmap.fr/hot/",
            "layer" : "imagery",
            "export_provider_type" : ExportProviderType.objects.using('default').get(type_name='wmts'),
            "level_from" : 0,
            "level_to" : 2,
            "config" : "layers:\r\n - name: imagery\r\n   title: imagery\r\n   sources: [cache]\r\n\r\nsources:\r\n  imagery_wmts:\r\n    type: tile\r\n    grid: webmercator\r\n    url: http://a.tile.openstreetmap.fr/hot/%(z)s/%(x)s/%(y)s.png\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        }
    }, {
        "model" : "jobs.exportprovider",
        "pk" : 4,
        "fields" : {
            "created_at" : "2016-10-06T19:17:28.770Z",
            "updated_at" : "2016-10-06T19:17:28.770Z",
            "uid" : "3c497618-5a50-4c93-a310-e439a99549ce",
            "name" : "arcgis-source",
            "slug" : "arcgis-source",
            "url" : "http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer",
            "layer" : "imagery",
            "export_provider_type" : ExportProviderType.objects.using('default').get(type_name='arcgis'),
            "level_from" : 0,
            "level_to" : 2,
            "config" : "layer:\r\n  - name: imagery\r\n    title: imagery\r\n    sources: [cache]\r\n\r\nsources:\r\n  imagery_arcgis:\r\n    type: arcgis\r\n    grid: webmercator\r\n    req:\r\n      url: http://server.arcgisonline.com/arcgis/rest/services/ESRI_Imagery_World_2D/MapServer\r\n      layers: \r\n        show: 0\r\n\r\ngrids:\r\n  webmercator:\r\n    srs: EPSG:3857\r\n    tile_size: [256, 256]\r\n    origin: nw"
        }
    }, {
        "model" : "jobs.exportprovider",
        "pk" : 5,
        "fields" : {
            "created_at" : "2016-10-13T17:23:26.890Z",
            "updated_at" : "2016-10-13T17:23:26.890Z",
            "uid" : "b47ecf0c-98bd-4b5c-89d1-856fd8c402a3",
            "name" : "wfs-source",
            "slug" : "wfs-source",
            "url" : "http://geonode.state.gov/geoserver/wfs?request=GetCapabilities&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=geonode:Global_LSIB_Lines_Simplified_2015Jan23_USG&SRSNAME=EPSG:4326",
            "layer" : "geonode:Global_LSIB_Lines_Simplified_2015Jan23_USG",
            "export_provider_type" : ExportProviderType.objects.using('default').get(type_name='wfs'),
            "level_from" : 0,
            "level_to" : 2,
            "config" : ""
        }
    }]


def load_providers():
    export_providers = get_providers_list()
    for export_provider in export_providers:
            provider = ExportProvider.objects.using('default').create(
                                      name=export_provider.get('fields').get('name'),
                                      slug=export_provider.get('fields').get('slug'),
                                      url=export_provider.get('fields').get('url'),
                                      layer=export_provider.get('fields').get('layer'),
                                      export_provider_type=export_provider.get('fields').get('export_provider_type'),
                                      level_from=export_provider.get('fields').get('level_from'),
                                      level_to=export_provider.get('fields').get('level_to'),
                                      config=export_provider.get('fields').get('config'))
            provider.save(using='default')


def delete_providers():
    export_providers = get_providers_list()
    for export_provider in export_providers:
            provider = ExportProvider.objects.using('default').get(name=export_provider.get('fields').get('name'))
            provider.delete(using='default')
