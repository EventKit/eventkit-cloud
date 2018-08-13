from __future__ import print_function

from django.core.management import BaseCommand

from eventkit_cloud.celery import app


class Command(BaseCommand):
    help = 'Shuts down celery worker processes which will cause docker celery container to exit.'

    def handle(self, *args, **options):
        print('Shutting down celery workers...', end='')
        self.gracefully_shutdown_workers()
        print('done')

    @staticmethod
    def gracefully_shutdown_workers():
        app.control.shutdown()
