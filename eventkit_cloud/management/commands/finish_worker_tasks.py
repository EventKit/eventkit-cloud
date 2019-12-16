from logging import getLogger

from django.core.management import BaseCommand

from eventkit_cloud.celery import app

logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Updates celery workers to accept no more tasks and waits for tasks to complete."

    def handle(self, *args, **options):
        print("Waiting for workers to finish up...", end="")
        self.finish_worker_tasks()
        print("done")

    @staticmethod
    def finish_worker_tasks():
        # Stop workers from listening to the default queue so new tasks won't be created
        # Leave worker & cancel queues alone so workers will finish up those tasks
        default_q = app.conf.task_default_queue
        # Get the worker node name from the list of nodes
        worker_nodename = [
            node_name for node_name in list(app.control.inspect().ping().keys()) if "worker" in node_name
        ][0]

        r = app.control.cancel_consumer(default_q, reply=True)
        logger.info("cancel_consumer({}): {}".format(default_q, r))

        while True:
            # these return dicts of format {<queue_name>: <task_list>}
            scheduled = app.control.inspect().scheduled()
            active = app.control.inspect().active()

            # Get number of scheduled & active tasks from worker queue
            n_scheduled = len(scheduled[worker_nodename])
            n_active = len(active[worker_nodename])

            msg = "Waiting for {} scheduled and {} active tasks".format(n_scheduled, n_active)
            logger.info(msg)
            if n_scheduled == 0 and n_active == 0:
                break
