# -*- coding: utf-8 -*-


from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', 'create_hstore_extension'),
    ]

    operations = [
        migrations.RunSQL('CREATE INDEX geom_types_gin_idx ON tags USING gin(geom_types);')
    ]
