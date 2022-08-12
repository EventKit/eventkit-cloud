# Generated by Django 4.0.4 on 2022-08-03 13:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('jobs', '0029_remove_dataprovider_config_json_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='mapimagesnapshot',
            name='directory',
            field=models.CharField(blank=True, help_text='An optional directory name to store the file in.', max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='mapimagesnapshot',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='', verbose_name='File'),
        ),
        migrations.AlterField(
            model_name='stylefile',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='', verbose_name='File'),
        ),
        migrations.AlterField(
            model_name='mapimagesnapshot',
            name='download_url',
            field=models.URLField(blank=True, null=True, max_length=508),
        )
    ]
