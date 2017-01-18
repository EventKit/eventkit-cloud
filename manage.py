#!/usr/bin/env python
import os
import sys
import subprocess
import contextlib
import logging
from django.conf import settings

@contextlib.contextmanager
def nostderr():
    savestderr = sys.stderr
    sys.stderr = os.devnull
    try:
        yield
    finally:
        sys.stderr = savestderr


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")

    from django.core.management import execute_from_command_line

    if os.getenv("COVERAGE"):
        is_testing = 'test' in sys.argv

        if is_testing:
            logging.getLogger().setLevel(logging.ERROR)
            settings.configure()
            import coverage

            cov = coverage.coverage(config_file=".coveragerc",
                                    source=["eventkit_cloud"])
            cov.erase()
            cov.start()

        execute_from_command_line(sys.argv)

        if is_testing:
            cov.stop()
            cov.save()
            cov.report()
            cov.html_report(directory='./coverage')

            if os.getenv("TRAVIS"):
                coveralls = os.path.join(os.path.dirname(os.path.dirname(getattr(settings, "BASE_DIR", '/var/lib/eventkit'))), '.virtualenvs/eventkit/bin/coveralls')
                subprocess.call([coveralls])

    else:
        execute_from_command_line(sys.argv)
