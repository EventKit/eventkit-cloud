from contextlib import contextmanager

from eventkit_cloud.core.log.logging_context_handler import LoggingContextHandler

logging_context_handler = LoggingContextHandler()

@contextmanager
def logging_context(**kwargs):
    logging_context_handler.add(**kwargs)

    yield

    logging_context_handler.remove()