from eventkit_cloud.celery import app
from logging import getLogger
import time


logger = getLogger(__name__)


@app.task(name="GracefullyShutDownWorkers")
def gracefully_shutdown_workers():
    queues = app.control.inspect().ping().keys()
    queues.append(app.conf.task_default_queue)

    # The worker queuename is of the form 'worker@<celery-container-name>'
    worker_queuename = [q for q in queues if 'worker' in q][0]

    for q in queues:
        # Stop workers from listening to all the queues except the 'worker' queue.
        if q != worker_queuename:
            logger.info('Stop worker from listening to queue (cancel_consumer) "{}"'.format(q))
            r = app.control.cancel_consumer(q, reply=True)
            logger.info('cancel_consumer({}): {}'.format(q, r))

    while True:
        # these return dicts of format {<queue_name>: <task_list>}
        scheduled = app.control.inspect().scheduled()
        active = app.control.inspect().active()

        # Get number of scheduled & active tasks from worker queue
        n_scheduled = len(scheduled[worker_queuename])
        n_active = len(active[worker_queuename])

        # Get list of active tasks from the worker queue
        active_list = active[worker_queuename]

        logger.info('Waiting for {} scheduled and {} active tasks'.format(n_scheduled, n_active))
        if n_scheduled == 0 and n_active == 0:
            break

        time.sleep(5)

    logger.info('celery app.control.shutdown()')
    app.control.shutdown()
