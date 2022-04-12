# Generated by Django 3.2.7 on 2022-03-22 16:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_alter_grouppermission_id'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='attributeclass',
            unique_together=set(),
        ),
        migrations.AlterUniqueTogether(
            name='grouppermission',
            unique_together=set(),
        ),
        migrations.AddConstraint(
            model_name='attributeclass',
            constraint=models.UniqueConstraint(fields=('filter', 'exclude'), name='unique_filter_exclude'),
        ),
        migrations.AddConstraint(
            model_name='grouppermission',
            constraint=models.UniqueConstraint(fields=('user', 'group', 'permission'), name='unique_user_permission_per_group'),
        ),
    ]