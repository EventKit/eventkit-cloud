import io
import logging
import traceback

from django.conf import settings


class Formatter(logging.Formatter):
    def formatMessage(self, record):
        try:
            # would use getattr but it still raises attribute error because it is overwritten in LogRecord
            record.context
        except AttributeError:
            record.context = None
        print(record.context)
        print(record.args)
        if settings.LOGGING_SINGLE_LINE_OUTPUT:
            return super().formatMessage(record).encode("unicode_escape").decode("utf-8")
        return super().formatMessage(record)

    def formatException(self, ei):
        """
        Format and return the specified exception information as a string.

        This default implementation just uses
        traceback.print_exception()
        """
        sio = io.StringIO()
        tb = ei[2]
        # See issues #9427, #1553375. Commented out for now.
        # if getattr(self, 'fullstack', False):
        value = ei[1]
        traceback_output = []
        if settings.LOGGING_SINGLE_LINE_OUTPUT:
            for line in traceback.TracebackException(type(value), value, tb, limit=None).format(chain=True):
                traceback_output.append(line)
            output = " ".join(traceback_output).encode("unicode_escape").decode("utf-8")
            print(output, file=sio, end="")
        else:
            traceback.print_exception(ei[0], ei[1], tb, None, sio)
        s = sio.getvalue()
        sio.close()
        if s[-1:] == "\n":
            s = s[:-1]
        return s
