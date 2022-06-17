from django.core.management import BaseCommand, call_command


class Command(BaseCommand):
    help = "Runs initial administrative tasks required to run the application. Optionally 'setup' loads data."

    def add_arguments(self, parser):
        parser.add_argument("setup", nargs="*")

    def handle(self, *args, **options):
        call_command("collectstatic", "--noinput")
        call_command("migrate")
        call_command("createcachetable")
        if options["setup"]:
            call_command("loaddata", "admin_user")
            call_command("loaddata", "osm_provider")
            call_command("loaddata", "datamodel_presets")
            call_command("load_land_data")
