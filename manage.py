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
            print("Yaba daba dooooo")
            if not os.path.exists('./coverage'):
                os.mkdir('./coverage')
            cov = coverage.coverage(config_file=".coveragerc",
                                    source=["eventkit_cloud"],
                                    directory='./coverage')
            cov.erase()
            os.chmod('./coverage', 0775)
            cov.start()

        execute_from_command_line(sys.argv)

        if is_testing:
            cov.stop()
            cov.save()
            cov.report()
            cov.html_report()

    else:
        execute_from_command_line(sys.argv)