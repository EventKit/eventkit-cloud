# https://docs.djangoproject.com/en/dev/howto/writing-migrations/#migrations-that-add-unique-fields

from django.db import migrations

from eventkit_cloud.jobs.models import VisibilityState


def update_permissions(apps, schema_editor):
    from eventkit_cloud.core.models import JobPermissionLevel
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Job = apps.get_model('jobs', 'Job')
    JobPermission = apps.get_model('core', 'JobPermission')
    for job in Job.objects.all():
        # Give current "creator" admin permissions
        user = job.user
        JobPermission.objects.create(job=job,
                                     content_type=ContentType.objects.get_for_model(user),
                                     object_id=user.id,
                                     permission=JobPermissionLevel.ADMIN.value)
        # Update published to new settings
        if job.published:
            job.visibility = VisibilityState.PUBLIC.value
            job.save()


def rollback_permissions(apps, schema_editor):
    # if jobs were made public then they should be set to published.
    Job = apps.get_model('jobs', 'Job')
    for job in Job.objects.all():
        if job.visibility == VisibilityState.PUBLIC.value:
            job.published = True
            job.save()


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),
        ('jobs', '0028_merge_20180417_1723'),
    ]

    operations = [
        # Existing jobs are assigned  visibility=PRIVATE. Add admin permission for the owner
        migrations.RunPython(update_permissions, reverse_code=rollback_permissions),
    ]
