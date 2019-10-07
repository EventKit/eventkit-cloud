from django.core.management import BaseCommand
from django.core.cache import cache


class Command(BaseCommand):
    help = "Clears the django cache."

    def handle(self, *args, **options):
        cache.clear()
