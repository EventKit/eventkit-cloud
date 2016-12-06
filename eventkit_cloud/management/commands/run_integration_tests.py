import unittest
from django.core.management import BaseCommand
from eventkit_cloud.jobs.tests.integration_test_jobs import TestJob, load_providers, delete_providers


class Command(BaseCommand):
    help="Runs all integration tests"

    def add_arguments(self, parser):
        parser.add_argument('tests', nargs='*')

    def handle(self, *args, **options):
        print('Loading test providers')
        # load_providers()
        if options['tests']:
            suite = unittest.TestLoader().loadTestsFromNames(options['tests'])
        else:
            suite = unittest.TestLoader().loadTestsFromTestCase(TestJob)
        unittest.TextTestRunner().run(suite)
        print('Removing test providers')
        # delete_providers()
