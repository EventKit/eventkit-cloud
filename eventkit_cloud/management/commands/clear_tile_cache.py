from django.core.management import BaseCommand
from django.conf import settings
from logging import getLogger
import os
import shutil

logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Deletes the directory where tiles are cached."

    def handle(self, *args, **options):
        tile_cache_dir = getattr(settings, "TILE_CACHE_DIR")
        if os.path.isdir(tile_cache_dir):
            logger.info(f"Clearing tile cache directory: {tile_cache_dir}")
            shutil.rmtree(tile_cache_dir)
        else:
            logger.info(
                f"The tile cache at {tile_cache_dir} does not exist or has already been removed."
            )
