# Generated by Django 3.2.7 on 2021-10-04 16:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0010_alter_exportrunfile_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='exportrun',
            name='is_cloning',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='exportrun',
            name='parent_run',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='child_runs', to='tasks.exportrun'),
        ),
    ]
