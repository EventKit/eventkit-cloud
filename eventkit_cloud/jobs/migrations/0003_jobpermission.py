# Generated by Django 2.2.5 on 2020-08-03 10:42

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('jobs', '0002_dataprovider_attribute_class'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='JobPermission',
                    fields=[
                        ('id',
                         models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                        ('updated_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                        ('object_id', models.PositiveIntegerField(db_index=True)),
                        ('permission', models.CharField(choices=[('READ', 'Read'), ('ADMIN', 'Admin')], max_length=10)),
                        ('content_type',
                         models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
                        ('job',
                         models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permissions',
                                           to='jobs.Job')),
                    ],
                    options={
                        'db_table': 'jobpermission',
                        'unique_together': {('job', 'content_type', 'object_id', 'permission')},
                    },
                ),
            ],
            database_operations=[],
        )
    ]
