

from logging import getLogger

from django.core.management import BaseCommand, call_command
from shutil import copytree, rmtree, copy
import os


from eventkit_cloud.celery import app

logger = getLogger(__name__)


class Command(BaseCommand):
    help = 'Updates version 1.1 to 1.2 in the database models.'

    def handle(self, *args, **options):
        # The migrations had issues in version <1.2.3, this cleans out all that garbage, and starts fresh
        # there could be a little pain upgrading to 1.2.4 but it had to happen sometime.
        print('Running migrations up to 1.2.3...')
        self.run_post_1_1_migrations()
        # print('Clearing out old migrations...')
        # self.delete_old_migrations()
        print('done')

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

    @staticmethod
    def delete_old_migrations():
        # Remove the old migrations from the migration table.
        call_command('migrate', '--fake', 'zero')

    @staticmethod
    def fake_new_migratrions():
        migrations = {}