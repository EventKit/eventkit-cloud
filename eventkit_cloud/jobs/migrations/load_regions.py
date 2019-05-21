# -*- coding: utf-8 -*-


import os

from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon
from django.db import migrations


def convert_polygon(geom):
    if geom and isinstance(geom, Polygon):
        return MultiPolygon(geom, srid=geom.srid)


class Migration(migrations.Migration):
    def insert_regions(apps, schema_editor):  # NOQA
        Region = apps.get_model('jobs', 'Region')  # noqa

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/africa.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="Africa", description="African export region", the_geom=the_geom,
                              the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/burma.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="Burma", description="Burmese export region", the_geom=the_geom,
                                       the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/central_asia.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="Central Asia/Middle East",
                                       description="Central Asia/Middle East export region", the_geom=the_geom,
                                       the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/indonesia.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="Indonesia, Sri Lanka, and Bangladesh",
                                       description="Indonesia, Sri Lanka, and Bangladesh export region",
                                       the_geom=the_geom, the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/philippines.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="Philippines", description="Philippines export region",
                                       the_geom=the_geom, the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)

        ds = DataSource(os.path.dirname(os.path.realpath(__file__)) + '/south_america.geojson')
        layer = ds[0]
        geom = layer.get_geoms(geos=True)[0]
        the_geom = convert_polygon(GEOSGeometry(geom.wkt, srid=4326))
        the_geog = convert_polygon(GEOSGeometry(geom.wkt))
        the_geom_webmercator = the_geom.transform(ct=3857, clone=True)
        Region.objects.create(name="South and Central America",
                                       description="South and Central America export region", the_geom=the_geom,
                                       the_geog=the_geog, the_geom_webmercator=the_geom_webmercator)
        del ds

    dependencies = [
        ('jobs', 'install_region_mask'),
    ]

    operations = [
        migrations.RunPython(insert_regions),
    ]
