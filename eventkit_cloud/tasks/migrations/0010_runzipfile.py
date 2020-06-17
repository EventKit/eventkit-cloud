# Generated by Django 2.2.5 on 2020-06-16 20:41

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0009_exportrunfile'),
    ]

    operations = [
        migrations.CreateModel(
            name='RunZipFile',
            fields=[
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('finished_at', models.DateTimeField(editable=False, null=True)),
                ('id', models.AutoField(editable=False, primary_key=True, serialize=False)),
                ('uid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('data_provider_task_records', models.ManyToManyField(to='tasks.DataProviderTaskRecord')),
                ('downloadable_file', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='tasks.FileProducingTaskResult')),
                ('run', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='zip_files', to='tasks.ExportRun')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
