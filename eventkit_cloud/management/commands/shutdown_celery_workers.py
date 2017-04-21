from django.core.management import BaseCommand
from eventkit_cloud.tasks.admin_tasks import gracefully_shutdown_workers


class Command(BaseCommand):
    help = 'Updates celery workers to accept no more tasks, waits for active & scheduled tasks to complete, '\
           'then shuts down celery worker processes which will cause docker celery container to exit.'

    def handle(self, *args, **options):
        print('Waiting for workers to finish up...')
        t = gracefully_shutdown_workers.run()
        print('Celery workers shut down')
