# Generated by Django 3.0.8 on 2020-09-09 17:06

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0006_remove_job_provider_tasks'),
    ]

    operations = [
        migrations.CreateModel(
            name='RegionalPolicy',
            fields=[
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('id', models.AutoField(editable=False, primary_key=True, serialize=False)),
                ('uid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)),
                ('name', models.CharField(max_length=100)),
                ('policies', django.contrib.postgres.fields.jsonb.JSONField()),
                ('policy_title_text', models.CharField(max_length=100)),
                ('policy_header_text', models.TextField(blank=True, null=True)),
                ('policy_footer_text', models.TextField(blank=True, null=True)),
                ('policy_cancel_text', models.CharField(blank=True, max_length=100, null=True)),
                ('policy_cancel_button_text', models.CharField(max_length=100)),
                ('justification_options', django.contrib.postgres.fields.jsonb.JSONField()),
                ('providers', models.ManyToManyField(related_name='regional_policies', to='jobs.DataProvider')),
                ('region', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='policies', to='jobs.Region')),
            ],
            options={
                'abstract': False,
                'verbose_name_plural': 'Regional Policies'
            },
        ),
    ]