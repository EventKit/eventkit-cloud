# https://docs.djangoproject.com/en/dev/howto/writing-migrations/#migrations-that-add-unique-fields

from django.db import migrations
import uuid


def gen_uuid(apps, schema_editor):
    FinalizeRunHookTaskRecord = apps.get_model('tasks', 'finalizerunhooktaskrecord')
    for row in FinalizeRunHookTaskRecord.objects.all():
        row.uid = uuid.uuid4()
        row.save(update_fields=['uid'])


class Migration(migrations.Migration):
    dependencies = [
        ('tasks', '0020_auto_20170802_1230'),
    ]

    operations = [
        # omit reverse_code=... if you don't want the migration to be reversible.
        migrations.RunPython(gen_uuid, reverse_code=migrations.RunPython.noop),
    ]
