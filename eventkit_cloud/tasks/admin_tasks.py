from eventkit_cloud.celery import app
from logging import getLogger


logger = getLogger(__name__)


@app.task(name="GracefullyShutDownWorkers")
def gracefully_shutdown_workers():
    queues = app.control.inspect().ping().keys()
    for q in queues:
        logger.info('celery queue cancel_consumer("{}")'.format(q))
        app.control.cancel_consumer(q)

    logger.info('celery app.shutdown()')

    while True:
        scheduled = app.control.inspect().scheduled()
        active = app.control.inspect().active()
        n_scheduled = 0
        n_active = 0
        for q, tasks in scheduled.items():
            n_scheduled += len(tasks)
        active_list = []
        for q, tasks in active.items():
            n_active += len(tasks)
            active_list.extend(tasks)

        logger.info('Waiting for {} scheduled and {} active tasks'.format(n_scheduled, n_active))
        if n_scheduled == 0 and n_active == 1:
            last_task = active_list[0]
            logger.info('Last task is "{}"'.format(last_task['name']))
            if last_task['name'] == 'GracefullyShutDownWorkers':
                logger.info('Only GracefullyShutDownWorkers task remains, exiting')
                break

        import time
        time.sleep(5)

    app.control.shutdown()
