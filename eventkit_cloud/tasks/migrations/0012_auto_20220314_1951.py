# Generated by Django 3.2.7 on 2022-03-14 19:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0011_auto_20211004_1622'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='dataprovidertaskrecord',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='dataprovidertaskrecord',
            constraint=models.UniqueConstraint(fields=('run', 'provider'), name='unique_data_provider'),
        ),
        migrations.AddConstraint(
            model_name='dataprovidertaskrecord',
            constraint=models.UniqueConstraint(condition=models.Q(('slug', 'run')), fields=('run', 'slug'), name='unique_run_data_provider_task_record'),
        ),
    ]
