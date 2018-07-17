import shlex
import subprocess

from django.core.management.base import BaseCommand
from django.utils import autoreload
import argparse


def restart_process(*cmd):
    kill_cmd = 'pkill -9 {0}'.format(cmd[0])
    print("Killing Process: {0}".format(kill_cmd))
    subprocess.call(shlex.split(kill_cmd))
    print("Starting Process: {0}".format(' '.join(cmd)))
    subprocess.call(cmd)


class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument('command', nargs=1, type=str)
        parser.add_argument('command_args', nargs=argparse.REMAINDER, type=str)

    def handle(self, *args, **options):
        cmd = options['command'] + options['command_args']
        print("Starting command with autoreload: {0}".format(' '.join(cmd)))
        autoreload.main(restart_process, tuple(cmd))