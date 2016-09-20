#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    if os.getenv("DEVELOPMENT"):
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.dev")
    else:
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventkit_cloud.settings.prod")

    from django.core.management import execute_from_command_line

    execute_from_command_line(sys.argv)
