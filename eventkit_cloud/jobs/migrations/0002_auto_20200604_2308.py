# Generated by Django 2.2.5 on 2020-06-04 23:08

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('core', '0004_auto_20200604_2308'),
        ('jobs', '0001_dataprovider_label'),
    ]

    operations = [
        migrations.AddField(
            model_name='dataprovider',
            name='attribute_class',
            field=models.ForeignKey(blank=True, help_text='The attribute class is used to limit users access to resources using this data provider.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='data_providers', to='core.AttributeClass'),
        ),
        migrations.CreateModel(
            name='JobPermission',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('updated_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('object_id', models.PositiveIntegerField(db_index=True)),
                ('permission', models.CharField(choices=[('NONE', 'None'), ('READ', 'Read'), ('ADMIN', 'Admin')], max_length=10)),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType')),
                ('job', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='permissions', to='jobs.Job')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]