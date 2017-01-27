#!/usr/bin/env python
import os
import subprocess
from django.conf import settings
import sys
import logging

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")

    from django.core.management import execute_from_command_line

    if 'test' in sys.argv:

        logging.disable(logging.CRITICAL)

        if os.getenv("COVERAGE"):
            import coverage

            cov = coverage.coverage(config_file=".coveragerc",
                                    source=["eventkit_cloud"])
            cov.erase()
            cov.start()

        execute_from_command_line(sys.argv)

        if os.getenv("COVERAGE"):
            cov.stop()
            cov.save()
            cov.report()
            cov.html_report(directory='./coverage')

        if os.getenv("TRAVIS"):
            coveralls = os.path.join(os.path.dirname(os.path.dirname(getattr(settings, "BASE_DIR", '/var/lib/eventkit'))), '.virtualenvs/eventkit/bin/coveralls')
            subprocess.call([coveralls])

        logging.disable(logging.NOTSET)

    else:
        execute_from_command_line(sys.argv)