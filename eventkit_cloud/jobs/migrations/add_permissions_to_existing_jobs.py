# https://docs.djangoproject.com/en/dev/howto/writing-migrations/#migrations-that-add-unique-fields

from django.db import migrations
from django.contrib.auth.models import Group, User

from ..models import Job, VisibilityState
from ...core.models import JobPermission


def update_permissions(apps, schema_editor):
    for job in Job.objects.all():
        job_permissions = JobPermission.jobpermissions(job)
        # first check that the job wasn't already modified with the new permissions
        if not (job_permissions.get('users') or job_permissions.get('groups')):
            # Then make the job creator an administrator
            jp = JobPermission.objects.create(job=job, content_object=job.user,
                                              permission=JobPermission.Permissions.ADMIN.value)
            if job.published:
                job.visibility = VisibilityState.PUBLIC.value
                job.save()
            jp.save()


def rollback_permissions(apps, schema_editor):
    # if jobs were made public then they should be set to published.
    for job in Job.objects.all():
        if job.visibility == VisibilityState.PUBLIC.value:
            job.published = True
            job.save()


class Migration(migrations.Migration):
    dependencies = [
        ('jobs', '0027_merge_20180417_1210'),
    ]

    operations = [
        # Existing jobs are assigned  visibility=PRIVATE. Add admin permission for the owner
        migrations.RunPython(update_permissions, reverse_code=rollback_permissions),
    ]
