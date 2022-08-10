import unittest

from django.core.management import BaseCommand

from eventkit_cloud.jobs.tests.integration_test_jobs import TestJob, hide_providers, load_providers


class Command(BaseCommand):
    help = "Runs all integration tests"

    def add_arguments(self, parser):
        parser.add_argument("tests", nargs="*")

    def handle(self, *args, **options):
        try:
            hide_providers()
            load_providers()
            if options["tests"]:
                suite = unittest.TestLoader().loadTestsFromNames(options["tests"])
                result = unittest.TextTestRunner(verbosity=2).run(suite)
            else:
                print("Loading test providers")
                suite = unittest.TestLoader().loadTestsFromTestCase(TestJob)
                result = unittest.TextTestRunner(verbosity=2).run(suite)
                print("Removing test providers")
        finally:
            hide_providers()

        if result.errors or result.failures:
            exit(1)
