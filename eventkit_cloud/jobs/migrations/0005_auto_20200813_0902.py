# Generated by Django 2.2.5 on 2020-08-13 09:02

from django.db import migrations


def save_job_fk(apps, schema):
    Job = apps.get_model('jobs', 'Job')
    for job in Job.objects.all():
        for data_provider_task in job.provider_tasks.all():
            data_provider_task.job = job
            data_provider_task.save()


def save_job_m2m(apps, schema):
    # This should do the reverse
    Job = apps.get_model('jobs', 'Job')
    for job in Job.objects.all():
        job.provider_tasks.set(job.data_provider_tasks.all())
        job.save()


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0004_auto_20200813_0902'),
    ]

    operations = [
        migrations.RunPython(save_job_fk, save_job_m2m)
    ]
