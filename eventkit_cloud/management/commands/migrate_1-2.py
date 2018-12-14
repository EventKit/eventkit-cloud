

from logging import getLogger

from django.core.management import BaseCommand, call_command
from shutil import copytree, rmtree, copy
import os


logger = getLogger(__name__)


class Command(BaseCommand):
    help = 'Updates version 1.1 to 1.2 in the database models.'

    app_migrations = {
        "admin": [
            "0001_initial",
            "0002_logentry_remove_auto_add"
        ],
        "audit_logging": [
            "0001_initial",
            "0002_auto_20171116_2048"
        ],
        "auth": [
            "0001_initial",
            "0002_alter_permission_name_max_length",
            "0003_alter_user_email_max_length",
            "0004_alter_user_username_opts",
            "0005_alter_user_last_login_null",
            "0006_require_contenttypes_0002",
            "0007_alter_validators_add_error_messages",
            "0008_alter_user_username_max_length",
            "0009_alter_user_last_name_max_length"
        ],
        "authtoken": [
            "0001_initial",
            "0002_auto_20160226_1747"
        ],
        "contenttypes": [
            "0001_initial",
            "0002_remove_content_type_name"
        ],
        "core": [
            "0001_initial",
            "0002_auto_20181213_1723"
        ],
        "django_celery_beat": [
            "0001_initial",
            "0002_auto_20161118_0346",
            "0003_auto_20161209_0049",
            "0004_auto_20170221_0000",
            "0005_add_solarschedule_events_choices",
            "0006_auto_20180210_1226"
        ],
        "django_celery_results": [
            "0001_initial"
        ],
        "eventkit_cloud.auth": [
            "0001_initial"
        ],
        "jobs": [
            "0001_initial",
            "create_hstore_extension",
            "insert_export_formats",
            "install_region_mask",
            "load_regions",
            "0002_auto_20181213_1723"
        ],
        "notifications": [
            "0001_initial",
            "0002_auto_20150224_1134",
            "0003_notification_data",
            "0004_auto_20150826_1508",
            "0005_auto_20160504_1520",
            "0006_indexes"
        ],
        "sessions": [
            "0001_initial"
        ],
        "sites": [
            "0001_initial",
            "0002_alter_domain_unique"
        ],
        "tasks": [
            "0001_initial"
        ]
    }

    def handle(self, *args, **options):
        # The migrations had issues in version <1.2.3, this cleans out all that garbage, and starts fresh
        # there could be a little pain upgrading to 1.2.4 but it had to happen sometime.
        print('Running migrations up to 1.2.3...')
        self.run_post_1_1_migrations()
        print('Clearing out old migrations...')
        self.delete_old_migrations()
        print('Faking new migrations..')
        self.fake_new_migrations()
        print('done')
        print('You should call migrate to ensure that the app is on the latest migrations.')

    @staticmethod
    def run_post_1_1_migrations():
        apps = ['jobs', 'tasks']
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

        call_command('migrate', '--no-input')

        for app in apps:
            root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            migration_dir = os.path.join(root, app, 'migrations')
            new_migration_backup_dir = "{}_backup".format(migration_dir)

            # remove old
            rmtree(migration_dir)
            # restore new (overwriting old)
            copytree(new_migration_backup_dir, migration_dir)

    def delete_old_migrations(self):
        # Remove the old migrations from the migration table.
        for app_name in self.app_migrations:
            call_command('migrate', '--fake', app_name, 'zero')

    def fake_new_migrations(self):
        for app_name, migrations in self.app_migrations.items():
            for migration in migrations:
                call_command('migrate', '--fake', app_name, migration)
