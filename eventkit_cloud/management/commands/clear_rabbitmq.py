from django.core.management import BaseCommand
from eventkit_cloud.tasks.helpers import delete_rabbit_objects


class Command(BaseCommand):
    help = "Deletes the queues (and optionally exchanges) in rabbitmq."

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Force delete the queues.")
        parser.add_argument("--all", action="store_true", help="Deletes queues and exchanges.")

    def handle(self, *args, **options):
        rabbit_classes = ["queues"]
        if options["all"]:
            rabbit_classes = ["queues", "exchanges"]
        delete_rabbit_objects(rabbit_classes=rabbit_classes, force=options["force"])
