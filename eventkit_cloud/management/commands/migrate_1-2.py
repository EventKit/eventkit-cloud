from logging import getLogger

from django.core.management import BaseCommand, call_command
from shutil import copytree, rmtree, copy
import os

logger = getLogger(__name__)


class Command(BaseCommand):
    help = 'Updates version 1.1 to 1.2 in the database models.'

    def add_arguments(self, parser):
        parser.add_argument('fake', nargs='*')

    def handle(self, *args, **options):
        # The migrations had issues in version <1.2.3, this cleans out all that garbage, and starts fresh
        # there could be a little pain upgrading to 1.2.4 but it had to happen sometime.
        if options['fake']:
            fake_new_migrations()
            print('After this new migrations should be applied "python manage.py migrate"')
        else:
            print('Running migrations up to 1.2.3...')
            self.run_post_1_1_migrations()
            print('done')
            print('Next call "python manage.py migrate_1-2 fake')

    def run_post_1_1_migrations(self):
        apps = ['jobs', 'tasks', 'core', 'auth']
        for app in apps:
            root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            migration_dir = os.path.join(root, app, 'migrations')
            new_migration_backup_dir = "{}_backup".format(migration_dir)
            old_migrations_path = os.path.join(migration_dir, 'migrations_pre_1_2_4')

            # backup new
            copytree(migration_dir, new_migration_backup_dir)

            # clean out migration directory
            for file_name in os.listdir(migration_dir):
                file_path = os.path.join(migration_dir, file_name)
                if os.path.isfile(file_path):
                    os.remove(file_path)

            # clean out migration directory
            for file_name in os.listdir(old_migrations_path):
                file_path = os.path.join(old_migrations_path, file_name)
                if os.path.isfile(file_path):
                    copy(file_path, migration_dir)

        call_command('showmigrations')
        call_command('migrate', interactive=False)
        call_command('showmigrations')
        print('Clearing out old migrations...')
        delete_old_migrations()
        call_command('showmigrations')


        for app in apps:
            root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            migration_dir = os.path.join(root, app, 'migrations')
            new_migration_backup_dir = "{}_backup".format(migration_dir)

            # remove old
            print("REMOVING " + migration_dir)
            rmtree(migration_dir)
            # restore new (overwriting old)
            print("COPYING  " + new_migration_backup_dir + " -> " + migration_dir)

            copytree(new_migration_backup_dir, migration_dir)
            for file_name in os.listdir(migration_dir):
                file_path = os.path.join(migration_dir, file_name)
                if os.path.isfile(file_path):
                    print(file_path)

            # remove backup
            print("REMOVING " + new_migration_backup_dir)

            rmtree(new_migration_backup_dir)


app_migrations = {
    "contenttypes": [
            "0002_remove_content_type_name"
    ],
    "admin": [
        "0002_logentry_remove_auto_add"
    ],
    "audit_logging": [
        "0002_auto_20171116_2048"
    ],
    "auth": [
        "0009_alter_user_last_name_max_length"
    ],
    "authtoken": [
        "0002_auto_20160226_1747"
    ],
    "core": [
        "0002_auto_20181213_1723"
    ],
    "django_celery_beat": [
        "0006_auto_20180210_1226"
    ],
    "django_celery_results": [
        "0001_initial"
    ],
    "eventkit_cloud.auth": [
        "0001_initial"
    ],
    "jobs": [
        "install_default_group"
    ],
    "notifications": [
        "0006_indexes"
    ],
    "sessions": [
        "0001_initial"
    ],
    "sites": [
        "0002_alter_domain_unique"
    ],
    "tasks": [
        "0001_initial"
    ]
}


def delete_old_migrations():
    # Remove the old migrations from the migration table.
    for app_name in app_migrations:
        call_command('migrate', '--fake', app_name, 'zero')


def fake_new_migrations():
    for app_name, migrations in app_migrations.items():
        for migration in migrations:
            try:
                call_command('migrate', '--fake', app_name, migration)
            except Exception:
                pass
