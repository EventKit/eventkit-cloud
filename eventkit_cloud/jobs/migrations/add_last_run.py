# https://docs.djangoproject.com/en/dev/howto/writing-migrations/#migrations-that-add-unique-fields

from django.db import migrations


def add_last_run(apps, schema_editor):
    Job = apps.get_model('jobs', 'Job')

    # Get each job's latest export run and save a reference to it in the job.
    for job in Job.objects.all().prefetch_related('runs'):
        job.last_export_run = job.runs.last()
        job.save()


def remove_last_run(apps, schema_editor):
    Job = apps.get_model('jobs', 'Job')
    for job in Job.objects.all():
        job.last_export_run = None
        job.save()


class Migration(migrations.Migration):
    dependencies = [
        ('jobs', '0029_auto_20180507_1832'),
    ]

    operations = [
        migrations.RunPython(add_last_run, remove_last_run),
    ]
