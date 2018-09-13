from django.core.management import BaseCommand

from eventkit_cloud.core.helpers import load_land_vectors


class Command(BaseCommand):
    help = "Loads land data required for the OSM pipeline."

    def handle(self, *args, **options):
        load_land_vectors()