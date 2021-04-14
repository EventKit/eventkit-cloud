from logging import getLogger

from django.core.management import BaseCommand

from eventkit_cloud.utils.stats.generator import update_all_statistics_caches

logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Deletes the directory where tiles are cached."

    def handle(self, *args, **options):
        update_all_statistics_caches()
