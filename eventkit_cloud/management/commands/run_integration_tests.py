import unittest

from django.core.management import BaseCommand

from eventkit_cloud.jobs.tests.integration_test_jobs import TestJob, load_providers, delete_providers


class Command(BaseCommand):
    help = "Runs all integration tests"

    def add_arguments(self, parser):
        parser.add_argument('tests', nargs='*')

    def handle(self, *args, **options):
        if options['tests']:
            suite = unittest.TestLoader().loadTestsFromNames(options['tests'])
        else:
            print('Loading test providers')
            delete_providers()
            load_providers()
            suite = unittest.TestLoader().loadTestsFromTestCase(TestJob)
            print('Removing test providers')
            delete_providers()
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        if result.errors or result.failures:
            exit(1)

