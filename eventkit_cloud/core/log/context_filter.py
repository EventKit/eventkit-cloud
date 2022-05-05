import logging

from eventkit_cloud.core.log.logging_context import logging_context_handler


class ContextFilter(logging.Filter):
    def __init__(self):
        super(ContextFilter, self).__init__()

    def filter(self, record):
        # put all additional attributes in a dictionary on the log record
        print("in context filter")
        record.context = logging_context_handler.get_context()
        record.example_param = "something"
        print(logging_context_handler.get_context())
        return True