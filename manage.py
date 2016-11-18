#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    if os.getenv("PRODUCTION"):
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")
    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.dev")

    from django.core.management import execute_from_command_line

    if os.getenv("COVERAGE"):
        is_testing = 'test' in sys.argv

        if is_testing:
            import coverage

            # cov = coverage.coverage(source=['eventkit_cloud.api',
            #                                 'eventkit_cloud.jobs',
            #                                 'eventkit_cloud.tasks',
            #                                 'eventkit_cloud.ui'],
            #                         omit=['*/tests/*', '*/migrations/*'])
            cov = coverage.coverage(config_file=".coveragerc",
                                    source=["eventkit_cloud"])
            cov.erase()
            cov.start()

        execute_from_command_line(sys.argv)

        if is_testing:
            cov.stop()
            cov.save()
            cov.report()
            cov.html_report()

    else:
        execute_from_command_line(sys.argv)