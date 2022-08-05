# Generated by Django 4.0.4 on 2022-08-03 13:04
from django.core.files import File
from django.db import migrations
import os

class Migration(migrations.Migration):

    def move_file_to_s3(apps, schema_editor):
        FileProducingTaskResult = apps.get_model('tasks', 'FileProducingTaskResult')
        ExportRunFile = apps.get_model('tasks', 'ExportRunFile')
        for Model in (FileProducingTaskResult, ExportRunFile):
            for model in Model.objects.all():
                if os.path.exists(model.download_url):
                    with open(model.download_url, 'rb') as doc_file:
                        model.file.save(model.filename, File(doc_file), save=True)
                else:
                    model.file = model.filename
                    model.save()

    dependencies = [
        ('tasks', '0013_fileproducingtaskresult_directory_and_more'),
    ]

    operations = [
        migrations.RunPython(move_file_to_s3),
    ]
