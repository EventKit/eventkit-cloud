from django.core.management import BaseCommand
from django.core.management import call_command
from ...core.helpers import load_land_vectors

class Command(BaseCommand):
    help = "Runs all integration tests"

    def add_arguments(self, parser):
        parser.add_argument('setup', nargs='*')

    def handle(self, *args, **options):
        call_command('collectstatic', '--noinput')
        call_command('migrate')
        call_command('createcachetable')
        if options['setup']:
            call_command('loaddata', 'admin_user')
            call_command('loaddata', 'insert_provider_types')
            call_command('loaddata', 'osm_provider')
            call_command('loaddata', 'datamodel_presets')
            load_land_vectors()
