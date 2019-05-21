# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('jobs', 'insert_export_formats'),
    ]

    operations = [
        migrations.RunSQL('DROP VIEW IF EXISTS region_mask;'),
        migrations.RunSQL("""CREATE OR REPLACE VIEW region_mask AS
                          select 1 as id,
                          st_multi(st_symdifference(st_polyfromtext('POLYGON((-180 90, -180 -90, 180 -90, 180 90, -180 90))', 4326), st_union(the_geom)))
                          AS the_geom
                          FROM regions;""")
    ]
