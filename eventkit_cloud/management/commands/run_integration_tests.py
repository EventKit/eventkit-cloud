from django.core.management import BaseCommand
from django.test import TestCase
import unittest
from eventkit_cloud.jobs.tests.integration_test_jobs import TestJob
from eventkit_cloud.jobs.models import ExportProvider, ExportProviderType


export_providers = [{
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
	}]


class Command(BaseCommand):
    help="Runs all integration tests"
    def handle(self, *args, **options):
        print('Loading test providers')
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
        suite = unittest.TestLoader().loadTestsFromTestCase(TestJob)
        unittest.TextTestRunner().run(suite)

        print('Removing test providers')
        for export_provider in export_providers:
            provider = ExportProvider.objects.using('default').get(name=export_provider.get('fields').get('name'))
            provider.delete(using='default')