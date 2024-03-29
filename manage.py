#!/usr/bin/env python
import os

if os.getenv("COVERAGE"):
    import coverage

    cov = coverage.coverage(config_file=".coveragerc", source=["eventkit_cloud"])
    cov.erase()
    cov.start()

import logging
import subprocess
import sys

import django
from django.conf import settings
from django.core.cache import cache

if __name__ == "__main__":

    from django.core.management import execute_from_command_line

    if "test" in sys.argv:

        import time

        start_time = time.time()
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.tests")
        django.setup()
        cache.clear()

        logging.disable(logging.CRITICAL)

        execute_from_command_line(sys.argv)

        if os.getenv("TRAVIS"):
            coveralls = os.path.join(
                os.path.dirname(os.path.dirname(getattr(settings, "BASE_DIR", "/var/lib/eventkit"))),
                ".virtualenvs/eventkit/bin/coveralls",
            )
            subprocess.call(
                [coveralls, "--merge={0}".format(os.path.join(".", "coverage", "coveralls", "coveralls.json"))]
            )

        if os.getenv("COVERAGE") and not os.getenv("TRAVIS"):
            cov.html_report(directory=os.path.join(".", "coverage"))

        end_time = time.time()

        logging.disable(logging.NOTSET)
        cache.clear()
        print(("Testing completed in {0} seconds".format(round(end_time - start_time, 2))))

    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
        execute_from_command_line(sys.argv)


if os.getenv("COVERAGE"):
    cov.stop()
    cov.save()
    coverage = cov.report()
    assert coverage >= float(os.getenv("COVERAGE_THRESHOLD", 0))
