from django.core.management import BaseCommand
from django.conf import settings
import shutil

class Command(BaseCommand):
    help = "Deletes the directory where tiles are cached."

    def handle(self, *args, **options):
        tile_cache_dir = getattr(settings, "TILE_CACHE_DIR")
        if tile_cache_dir:
            shutil.rmtree(tile_cache_dir)
