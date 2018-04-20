# https://docs.djangoproject.com/en/dev/howto/writing-migrations/#migrations-that-add-unique-fields

from django.db import migrations
from django.contrib.auth.models import Group, User

from ..models import Job




def add_permissions(apps, schema_editor):
    JobPermission = apps.get_model("core", "JobPermission")
    for job in Job.objects.all():
        jp = JobPermission.objects.create(job=job, content_object=job.user,
                                      permission=JobPermission.Permissions.ADMIN.value)
        jp.save()


class Migration(migrations.Migration):
    dependencies = [
        ('jobs', '0027_merge_20180417_1210'),
    ]

    operations = [
        # Existing jobs are assigned  visibility=PRIVATE. Add admin permission for the owner
        migrations.RunPython(add_permissions,reverse_code=migrations.RunPython.noop),
    ]
